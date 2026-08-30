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
import { identificar, revisarPuerta, SinAcceso } from './acceso';

/**
 * Qué le falta a la puerta. Vacío cuando está bien puesta.
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
 *
 * NO BASTA CON QUE ESTÉN ESCRITOS, Y ESO COSTÓ UNA TARDE: un valor con la
 * forma equivocada —el identificador de la cuenta pegado donde va la etiqueta
 * AUD, que están a un clic el uno del otro en el mismo panel— dejaba el hub en
 * pie, servía la portada, y contestaba «la sesión caducó» a cada llamada. Sin
 * sesión que caducar: el token estaba perfecto y era la comparación la que no
 * podía cuadrar nunca. Por eso se mira la FORMA y no la presencia; ver
 * `revisarPuerta` en `acceso.ts`.
 */
function faltaEnLaPuerta(env: Env): string[] {
  return revisarPuerta({ dominio: env.ACCESO_DOMINIO, aud: env.ACCESO_AUD });
}

/** Lo que se ve mientras falte la puerta. Dice qué falta y dónde se pone. */
function sinPuerta(problemas: string[]): Response {
  return new Response(
    `<!doctype html><meta charset="utf-8">` +
      `<title>El hub todavía no está protegido</title>` +
      `<p>Este hub no se sirve todavía porque le falta la puerta.</p>` +
      `<ul>${problemas.map((p) => `<li>${p}</li>`).join('')}</ul>` +
      `<p>En el panel de Cloudflare: Zero Trust &rarr; Access &rarr; Applications, ` +
      `sobre este Worker. Al crearla, copie el dominio del equipo y la etiqueta ` +
      `AUD en <code>ACCESO_DOMINIO</code> y <code>ACCESO_AUD</code> de ` +
      `<code>wrangler.jsonc</code>, y vuelva a desplegar.</p>` +
      `<p>La etiqueta AUD est&aacute; en la propia aplicaci&oacute;n de Access, ` +
      `pesta&ntilde;a <em>Overview</em>, como &laquo;Application Audience (AUD) Tag&raquo;: ` +
      `son 64 caracteres. El identificador que sale en la barra lateral del panel ` +
      `de Workers es el de la CUENTA, tiene 32 y no sirve aqu&iacute;.</p>`,
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
    if (env.MODO !== 'desarrollo') {
      const falta = faltaEnLaPuerta(env);
      if (falta.length) return sinPuerta(falta);
    }

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
        // 401 y no 403: quien llega con un token que ya no sirve tiene que
        // volver a pasar por Access, y eso es lo que el navegador hace al
        // recargar. Solo se contesta esto cuando recargar PUEDE arreglarlo.
        if (error.motivo === 'sesion') {
          return fallo(
            401,
            'sin-acceso',
            'La sesión caducó. Recarga la página para volver a entrar.',
          );
        }

        // La otra mitad: la puerta está mal puesta, o no está delante de esta
        // dirección. Mandar a recargar aquí es mandar a repetir lo único que
        // no puede funcionar, y quien vende se queda dándole a F5 sin saber
        // que el fallo no es suyo. 503 y no 401 porque el que falla es el
        // servidor: no hay nada que quien llama pueda presentar para entrar.
        console.error('Puerta mal puesta:', error.message);
        return fallo(
          503,
          'puerta-mal-puesta',
          'El hub no puede comprobar quién entra: la puerta está mal puesta. ' +
            'Recargar no lo arregla. Hay que revisar la aplicación de Cloudflare ' +
            'Access y los valores de ACCESO_DOMINIO y ACCESO_AUD.' +
            (error.decible ? ` Lo que no cuadra: ${error.message}` : ''),
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
