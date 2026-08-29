/**
 * La puerta del hub: quién entra, y a qué módulo va cada dirección.
 *
 * Es la única parte del hub que necesita servidor. El resto —la portada, el
 * catálogo, el PDF, el mensaje de WhatsApp— sigue ocurriendo entero en el
 * navegador, y este Worker sirve además esos archivos.
 *
 * De aquí no cuelga ninguna regla de negocio: el historial vive en
 * `propuestas.ts` y las fichas en `clientes.ts`. Este archivo solo sabe de
 * direcciones y de quién llama.
 */

import * as clientes from './clientes';
import * as propuestas from './propuestas';
import { ErrorPeticion, cuerpoJson, fallo, json } from './http';
import type { Env } from './entorno';
import { identificar, SinAcceso } from './acceso';

/**
 * Si la puerta está puesta.
 *
 * `wrangler.jsonc` nace con `ACCESO_DOMINIO` y `ACCESO_AUD` en `PENDIENTE`
 * porque esos dos datos solo existen después de crear la aplicación en
 * Cloudflare Access, y eso se hace a mano en el panel.
 *
 * Mientras no estén, el hub NO se sirve. Es la diferencia entre fallar cerrado
 * y fallar a medias: la API ya rechazaría igual —sin Access no hay forma de
 * saber quién entra— pero la portada y el cotizador son archivos y se
 * servirían tan campantes a cualquiera que diera con la dirección. Ese hueco
 * dura desde que se despliega hasta que alguien se acuerda de configurar
 * Access, y es justo la clase de plazo que no se cierra nunca.
 */
function puertaPuesta(env: Env): boolean {
  const sinPoner = (valor: string | undefined) => !valor || valor === 'PENDIENTE';
  return !sinPoner(env.ACCESO_DOMINIO) && !sinPoner(env.ACCESO_AUD);
}

/** Lo que se ve mientras falte la puerta. Dice qué falta y dónde se pone. */
function sinPuerta(): Response {
  return new Response(
    `<!doctype html><meta charset="utf-8">` +
      `<title>El hub todavía no está protegido</title>` +
      `<p>Este hub no se sirve todavía porque le falta la puerta.</p>` +
      `<p>En el panel de Cloudflare: Zero Trust &rarr; Access &rarr; Applications, ` +
      `sobre este Worker. Al crearla, copie el dominio del equipo y la etiqueta ` +
      `AUD en <code>ACCESO_DOMINIO</code> y <code>ACCESO_AUD</code> de ` +
      `<code>wrangler.jsonc</code>, y vuelva a desplegar.</p>`,
    {
      status: 503,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        // Que no lo indexe nadie mientras está en este estado.
        'X-Robots-Tag': 'noindex, nofollow',
      },
    },
  );
}

export default {
  async fetch(peticion: Request, env: Env): Promise<Response> {
    const url = new URL(peticion.url);

    // Antes que nada, y para todo: sin Access configurado no se sirve ni la
    // portada. En desarrollo no aplica, que ahí no hay Access que valga.
    if (env.MODO !== 'desarrollo' && !puertaPuesta(env)) return sinPuerta();

    if (!url.pathname.startsWith('/api/')) {
      // La portada y el cotizador. `assets` los sirve directamente desde el
      // borde; esto solo se ejecuta si la petición llegó igualmente al Worker.
      return env.ASSETS.fetch(peticion);
    }

    try {
      const correo = await quienEs(peticion, env);
      return await enrutar(peticion, url, env, correo);
    } catch (error) {
      if (error instanceof SinAcceso) {
        // 401 y no 403: quien llega sin token válido tiene que volver a pasar
        // por Access, y eso es lo que el navegador hace al recargar.
        return fallo(
          401,
          'sin-acceso',
          'La sesión caducó. Recarga la página para volver a entrar.',
        );
      }
      if (error instanceof ErrorPeticion) {
        return fallo(error.http, error.codigo, error.message, error.detalle);
      }
      console.error(error);
      return fallo(500, 'fallo', 'La operación falló. Vuelve a intentarlo.');
    }
  },
} satisfies ExportedHandler<Env>;

/**
 * Quién hace la petición.
 *
 * En producción, el correo del token firmado de Access. En `npm run dev` no hay
 * Access delante —no existe en local— y se usa el de `.dev.vars`. Ese archivo
 * no se versiona y `MODO=desarrollo` **nunca** va en producción: sin la
 * comprobación, el historial queda abierto a quien dé con la dirección.
 */
async function quienEs(peticion: Request, env: Env): Promise<string> {
  if (env.MODO === 'desarrollo') return env.CORREO_DESARROLLO ?? 'desarrollo@local';
  return identificar(peticion, { dominio: env.ACCESO_DOMINIO, aud: env.ACCESO_AUD });
}

async function enrutar(
  peticion: Request,
  url: URL,
  env: Env,
  correo: string,
): Promise<Response> {
  const ruta = url.pathname.slice('/api/'.length).replace(/\/$/, '');
  const metodo = peticion.method.toUpperCase();
  const base = env.BASE;

  if (ruta === 'yo' && metodo === 'GET') return json({ correo });

  return (
    (await enrutarPropuestas(peticion, url, base, correo, ruta, metodo)) ??
    (await enrutarClientes(peticion, url, base, correo, ruta, metodo)) ??
    (() => {
      throw new ErrorPeticion(404, 'no-encontrada', 'Esa dirección no existe.');
    })()
  );
}

/** El historial. Devuelve `null` cuando la dirección no es suya. */
async function enrutarPropuestas(
  peticion: Request,
  url: URL,
  base: D1Database,
  correo: string,
  ruta: string,
  metodo: string,
): Promise<Response | null> {
  if (ruta === 'propuestas') {
    if (metodo === 'GET') return json(await propuestas.listar(base, propuestas.filtroDeUrl(url)));
    if (metodo === 'POST') return json(await propuestas.registrar(base, peticion, correo, null));
  }

  // Las operaciones en bloque van antes que la ruta de detalle: son POST y
  // aquélla solo atiende GET y PUT, pero tenerlas juntas evita que mañana
  // alguien añada un POST al detalle y se pisen sin que nadie lo note.
  if (metodo === 'POST' && ruta === 'propuestas/eliminar') {
    return json(await propuestas.eliminar(base, await propuestas.leerSeleccion(peticion), correo));
  }
  if (metodo === 'POST' && ruta === 'propuestas/restaurar') {
    return json(await propuestas.restaurar(base, await propuestas.leerSeleccion(peticion)));
  }
  if (metodo === 'POST' && ruta === 'propuestas/purgar') {
    return json(await propuestas.purgar(base, await propuestas.leerSeleccion(peticion)));
  }

  const estado = /^propuestas\/([^/]+)\/estado$/.exec(ruta);
  if (estado && metodo === 'PATCH') {
    return json(await propuestas.marcar(base, decodeURIComponent(estado[1]!), peticion, correo));
  }

  const detalle = /^propuestas\/([^/]+)$/.exec(ruta);
  if (detalle) {
    const numero = decodeURIComponent(detalle[1]!);
    if (metodo === 'GET') return json(await propuestas.abrir(base, numero));
    if (metodo === 'PUT') return json(await propuestas.registrar(base, peticion, correo, numero));
  }

  return null;
}

/** El panel de clientes. Devuelve `null` cuando la dirección no es suya. */
async function enrutarClientes(
  peticion: Request,
  url: URL,
  base: D1Database,
  correo: string,
  ruta: string,
  metodo: string,
): Promise<Response | null> {
  if (ruta === 'clientes') {
    if (metodo === 'GET') return json(await clientes.listar(base, clientes.filtroDeUrl(url)));
    if (metodo === 'POST') return json(await clientes.crear(base, peticion), 201);
  }

  // `coincidencia` va antes que la ruta de detalle: las dos son GET bajo
  // `clientes/…`, y sin este orden «¿a éste ya lo tengo?» se leería como
  // «ábreme el cliente que se llama coincidencia».
  if (ruta === 'clientes/coincidencia' && metodo === 'GET') {
    return json(
      await clientes.coincidencia(base, {
        documento: url.searchParams.get('documento') ?? '',
        whatsapp: url.searchParams.get('whatsapp') ?? '',
        correo: url.searchParams.get('correo') ?? '',
        negocio: url.searchParams.get('negocio') ?? '',
      }),
    );
  }

  if (metodo === 'POST' && ruta === 'clientes/eliminar') {
    return json(await clientes.eliminar(base, await clientes.leerSeleccion(peticion), correo));
  }
  if (metodo === 'POST' && ruta === 'clientes/restaurar') {
    return json(await clientes.restaurar(base, await clientes.leerSeleccion(peticion)));
  }
  if (metodo === 'POST' && ruta === 'clientes/purgar') {
    return json(await clientes.purgar(base, await clientes.leerSeleccion(peticion)));
  }

  // Va antes que el detalle por lo mismo que `coincidencia`.
  const actividad = /^clientes\/([^/]+)\/actividad$/.exec(ruta);
  if (actividad && metodo === 'GET') {
    return json(await clientes.actividad(base, decodeURIComponent(actividad[1]!)));
  }

  // Enlazar a mano una propuesta que quedó suelta: es la salida que ofrece el
  // panel cuando el servidor no quiso adivinar de quién era.
  const enlazar = /^clientes\/([^/]+)\/propuestas$/.exec(ruta);
  if (enlazar && metodo === 'POST') {
    const cuerpo = await cuerpoJson<{ numero?: string }>(peticion);
    if (!cuerpo.numero) {
      throw new ErrorPeticion(400, 'invalida', 'Falta el número de la propuesta.');
    }
    return json(await clientes.enlazar(base, decodeURIComponent(enlazar[1]!), cuerpo.numero));
  }

  const detalle = /^clientes\/([^/]+)$/.exec(ruta);
  if (detalle) {
    const codigo = decodeURIComponent(detalle[1]!);
    if (metodo === 'GET') return json(await clientes.abrir(base, codigo));
    if (metodo === 'PUT') return json(await clientes.actualizar(base, codigo, peticion));
  }

  return null;
}
