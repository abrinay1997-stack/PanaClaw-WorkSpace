/**
 * El historial de propuestas por dentro.
 *
 * Dos reglas explican casi todo lo de este archivo:
 *
 * 1. **El documento manda.** De cada propuesta se guarda el JSON completo, y
 *    las columnas del listado se calculan AQUÍ a partir de él, con las mismas
 *    funciones puras que usa la pantalla (`cotizador/src/dominio/propuesta.ts`).
 *    Ninguna cifra que llegue ya calculada desde el navegador entra en la base:
 *    el total del historial no puede discrepar del total del PDF que tiene el
 *    cliente delante.
 *
 * 2. **La identidad no se pide, se comprueba.** Quién emitió sale del token
 *    firmado de Cloudflare Access, nunca de un campo del cuerpo.
 */

import {
  MAXIMO_SELECCION,
  POR_PAGINA,
  aCentavos,
  deCentavos,
  esEstado,
  formatoNumero,
  mismoCliente,
  type Cuantas,
  type Emitida,
  type Estado,
  type FiltroHistorial,
  type PaginaHistorial,
  type PropuestaGuardada,
  type Seleccion,
} from '../compartido/propuestas';
import { catalogo } from '../cotizador/src/dominio/catalogo';
import { totalesDe } from '../cotizador/src/dominio/propuesta';
import type { Propuesta } from '../cotizador/src/dominio/tipos';
import { correoNormal, whatsappNormal } from '../compartido/texto';
import { resolverFicha } from './clientes';
import { COLUMNAS_RESUMEN, aResumen } from './filas';
import { cuerpoJson, ErrorPeticion } from './http';

/** Un documento más grande que esto no es una propuesta, es un error. */
const MAXIMO_DOCUMENTO = 512 * 1024;

// --- Registrar --------------------------------------------------------------

/**
 * Guarda una propuesta emitida.
 *
 * Sin número (POST) el consecutivo lo asigna la base. Con número (PUT) se
 * respeta el que viene, que cubre dos casos: reemitir una propuesta que ya
 * tiene número —quien vende baja el PDF y luego manda el WhatsApp, y lo segundo
 * debe actualizar lo guardado, no crear otra— y el número escrito a mano cuando
 * alguien pasa al historial una propuesta vieja.
 */
export async function registrar(
  base: D1Database,
  peticion: Request,
  correo: string,
  numeroDado: string | null,
): Promise<Emitida> {
  const documento = await leerDocumento(peticion);
  const emitidaEn = new Date().toISOString();

  // Con número dado hay que mirar antes si ese número ya es de alguien: el
  // `ON CONFLICT` de abajo actualiza en silencio, y en silencio es justo como
  // no se puede perder una propuesta emitida.
  if (numeroDado) await comprobarNumeroLibre(base, numeroDado, documento);

  const numero = numeroDado ?? (await siguienteNumero(base, documento.fecha));

  // Los dos totales, calculados aquí con la misma función que la pantalla. En
  // centavos y con su rango: cuatro columnas, y ninguna es la suma de otras dos.
  const totales = totalesDe(documento.lineas, catalogo.costosDeEbot);

  const enlace = await resolverFicha(base, documento);

  // `INSERT OR REPLACE` no vale: se llevaría por delante el estado y la nota de
  // una propuesta ya marcada como aceptada. Solo se refresca lo que depende del
  // documento; el seguimiento comercial se queda como estaba.
  await base
    .prepare(
      `INSERT INTO propuestas (
         numero, fecha, emitida_en, autor, asesor, cliente_codigo,
         negocio, contacto, correo, correo_normal, whatsapp, whatsapp_normal,
         unico_min, unico_max, mensual_min, mensual_max, lineas,
         catalogo_version, documento
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(numero) DO UPDATE SET
         fecha            = excluded.fecha,
         asesor           = excluded.asesor,
         cliente_codigo   = excluded.cliente_codigo,
         negocio          = excluded.negocio,
         contacto         = excluded.contacto,
         correo           = excluded.correo,
         correo_normal    = excluded.correo_normal,
         whatsapp         = excluded.whatsapp,
         whatsapp_normal  = excluded.whatsapp_normal,
         unico_min        = excluded.unico_min,
         unico_max        = excluded.unico_max,
         mensual_min      = excluded.mensual_min,
         mensual_max      = excluded.mensual_max,
         lineas           = excluded.lineas,
         catalogo_version = excluded.catalogo_version,
         documento        = excluded.documento,
         -- Volver a emitir una propuesta que estaba en la papelera la saca de
         -- ella: lo que acaba de salir hacia un cliente no puede quedarse
         -- escondido en el historial.
         eliminada_en     = NULL,
         eliminada_por    = NULL`,
    )
    .bind(
      numero,
      documento.fecha,
      emitidaEn,
      correo,
      documento.asesor ?? '',
      enlace.codigo,
      documento.cliente?.negocio ?? '',
      documento.cliente?.contacto ?? '',
      documento.cliente?.correo ?? '',
      correoNormal(documento.cliente?.correo),
      documento.cliente?.whatsapp ?? '',
      whatsappNormal(documento.cliente?.whatsapp),
      aCentavos(totales.unico.min),
      aCentavos(totales.unico.max),
      aCentavos(totales.mensual.min),
      aCentavos(totales.mensual.max),
      documento.lineas.length,
      documento.catalogoVersion ?? '',
      JSON.stringify({ ...documento, numero, clienteCodigo: enlace.codigo ?? undefined }),
    )
    .run();

  return { numero, emitidaEn, enlace };
}

/**
 * Deja pasar el PUT solo si ese número no es de otra propuesta.
 *
 * El PUT cubre dos cosas que se parecen y no son la misma: reemitir la propia
 * —bajar el PDF y luego mandar el WhatsApp son una propuesta, no dos— y
 * escribir un número a mano. Lo segundo es lo que se puede equivocar: basta
 * teclear `PROP-2026-0007` cuando esa propuesta ya existe para que el documento
 * de otro cliente quede reemplazado por éste, sin aviso y sin forma de
 * recuperarlo.
 *
 * La propuesta se reconoce por su cliente (`mismoCliente`): mismo correo —o
 * mismo WhatsApp, o mismo nombre cuando no hay ninguno de los dos— es la misma,
 * y reemitirla sigue funcionando. Cliente distinto es un choque, y se rechaza
 * diciendo de quién es el número.
 */
async function comprobarNumeroLibre(
  base: D1Database,
  numero: string,
  documento: Propuesta,
): Promise<void> {
  const fila = await base
    .prepare('SELECT negocio, correo, whatsapp, eliminada_en FROM propuestas WHERE numero = ?')
    .bind(numero)
    .first<Record<string, unknown>>();

  // Libre. Es el caso de la propuesta vieja que se pasa al historial, que es
  // legítimo.
  if (!fila) return;

  const negocio = String(fila.negocio ?? '');

  if (
    mismoCliente(
      { negocio, correo: String(fila.correo ?? ''), whatsapp: String(fila.whatsapp ?? '') },
      {
        negocio: documento.cliente?.negocio ?? '',
        correo: documento.cliente?.correo ?? '',
        whatsapp: documento.cliente?.whatsapp ?? '',
      },
    )
  ) {
    return;
  }

  // Que esté en la papelera no libera el número, pero callarlo dejaría a quien
  // lo escribió buscando en el historial una propuesta que no sale.
  const donde = fila.eliminada_en ? ' (está en la papelera)' : '';
  throw new ErrorPeticion(
    409,
    'numero-ocupado',
    `El número ${numero} ya es de una propuesta${negocio.trim() ? ` de ${negocio.trim()}` : ''}${donde}. ` +
      'Revisa el número, o deja el campo vacío para que se asigne el siguiente.',
  );
}

/**
 * Gasta un número del consecutivo del año y lo devuelve.
 *
 * `ON CONFLICT … RETURNING` es una sola sentencia, así que dos personas que
 * emitan a la vez no pueden llevarse el mismo número: SQLite serializa la
 * escritura y cada una ve el contador ya incrementado por la otra.
 *
 * Si el guardado posterior falla, el número queda gastado y la numeración salta
 * uno. Es el error correcto de los dos posibles: un hueco se explica, dos
 * propuestas distintas con el mismo número no.
 */
async function siguienteNumero(base: D1Database, fecha: string): Promise<string> {
  // El año sale de la fecha del documento —la que se imprime— y no del reloj
  // del servidor, que está en UTC y a las siete de la tarde en Panamá ya va por
  // el día siguiente.
  const anio = /^\d{4}/.exec(fecha)?.[0] ?? String(new Date().getFullYear());

  const fila = await base
    .prepare(
      `INSERT INTO consecutivos (anio, valor) VALUES (?, 1)
       ON CONFLICT(anio) DO UPDATE SET valor = valor + 1
       RETURNING valor`,
    )
    .bind(anio)
    .first<{ valor: number }>();

  if (!fila) throw new Error('El consecutivo no devolvió valor.');
  return formatoNumero(anio, fila.valor);
}

async function leerDocumento(peticion: Request): Promise<Propuesta> {
  const crudo = await peticion.text();

  if (crudo.length > MAXIMO_DOCUMENTO) {
    throw new ErrorPeticion(413, 'invalida', 'La propuesta es demasiado grande.');
  }

  let documento: Propuesta;
  try {
    documento = JSON.parse(crudo) as Propuesta;
  } catch {
    throw new ErrorPeticion(400, 'invalida', 'El cuerpo no es JSON válido.');
  }

  if (!documento || typeof documento !== 'object' || !Array.isArray(documento.lineas)) {
    throw new ErrorPeticion(400, 'invalida', 'Eso no es una propuesta.');
  }
  if (documento.lineas.length === 0) {
    throw new ErrorPeticion(400, 'invalida', 'Una propuesta sin líneas no se emite.');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(documento.fecha ?? '')) {
    throw new ErrorPeticion(400, 'invalida', 'La fecha de la propuesta no es válida.');
  }

  return documento;
}

// --- Consultar --------------------------------------------------------------

export function filtroDeUrl(url: URL): FiltroHistorial {
  const p = url.searchParams;
  return filtroSeguro({
    texto: p.get('texto') ?? undefined,
    estado: (p.get('estado') ?? undefined) as FiltroHistorial['estado'],
    desde: p.get('desde') ?? undefined,
    hasta: p.get('hasta') ?? undefined,
    pagina: Number(p.get('pagina')) || 1,
    papelera: p.get('papelera') === '1',
  });
}

/**
 * Deja un filtro en algo que se pueda meter en una consulta.
 *
 * Lo usan los dos caminos por los que llega un filtro: la dirección del listado
 * y el cuerpo de una operación en bloque. El segundo es el que obliga a que
 * esto exista aparte —ahí el filtro viene de un JSON, y de un JSON puede venir
 * cualquier cosa—.
 */
function filtroSeguro(crudo: Partial<FiltroHistorial> | null | undefined): FiltroHistorial {
  return {
    texto: typeof crudo?.texto === 'string' ? crudo.texto.trim().slice(0, 120) || undefined : undefined,
    estado: esEstado(crudo?.estado) ? crudo.estado : undefined,
    desde: fechaValida(crudo?.desde),
    hasta: fechaValida(crudo?.hasta),
    pagina: Math.max(1, Number(crudo?.pagina) || 1),
    papelera: crudo?.papelera === true,
  };
}

function fechaValida(valor: string | null | undefined): string | undefined {
  return valor && /^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor : undefined;
}

/**
 * El `WHERE` que corresponde a un filtro, con sus valores enlazados.
 *
 * Está aparte porque lo comparten el listado y las operaciones en bloque:
 * «eliminar todas las que cumplen el filtro» tiene que alcanzar exactamente las
 * filas que la persona está viendo, y la única forma de garantizarlo es que las
 * dos consultas se armen con el mismo código.
 */
function dondeDe(filtro: FiltroHistorial): { donde: string; valores: unknown[] } {
  // La papelera nunca es opcional: o se listan las que están a la vista o las
  // que están en ella, pero jamás las dos mezcladas.
  const condiciones: string[] = [
    filtro.papelera ? 'eliminada_en IS NOT NULL' : 'eliminada_en IS NULL',
  ];
  const valores: unknown[] = [];

  if (filtro.texto) {
    const patron = `%${filtro.texto}%`;
    condiciones.push(
      '(numero LIKE ? OR negocio LIKE ? OR contacto LIKE ? OR correo LIKE ? OR whatsapp LIKE ?)',
    );
    valores.push(patron, patron, patron, patron, patron);
  }
  if (filtro.estado) {
    condiciones.push('estado = ?');
    valores.push(filtro.estado);
  }
  // Se filtra por `emitida_en`, que es cuando salió de verdad. Como es un
  // instante ISO completo, el día `hasta` se cierra con la hora más alta para
  // que ese mismo día entre entero.
  if (filtro.desde) {
    condiciones.push('emitida_en >= ?');
    valores.push(`${filtro.desde}T00:00:00.000Z`);
  }
  if (filtro.hasta) {
    condiciones.push('emitida_en <= ?');
    valores.push(`${filtro.hasta}T23:59:59.999Z`);
  }

  return { donde: `WHERE ${condiciones.join(' AND ')}`, valores };
}

export async function listar(base: D1Database, filtro: FiltroHistorial): Promise<PaginaHistorial> {
  const { donde, valores } = dondeDe(filtro);
  const pagina = Math.max(1, filtro.pagina ?? 1);

  const [resumen, filas] = await base.batch<Record<string, unknown>>([
    base
      .prepare(
        // Dos sumas y no una. Sumar el pago único con la mensualidad daría una
        // cifra que no es dinero de ninguna clase, y sería la que alguien
        // acabaría leyendo en voz alta en una reunión.
        `SELECT COUNT(*) AS cuantas,
                COALESCE(SUM(unico_min), 0)   AS unico_min,
                COALESCE(SUM(unico_max), 0)   AS unico_max,
                COALESCE(SUM(mensual_min), 0) AS mensual_min,
                COALESCE(SUM(mensual_max), 0) AS mensual_max
           FROM propuestas ${donde}`,
      )
      .bind(...valores),
    base
      .prepare(
        `SELECT ${COLUMNAS_RESUMEN} FROM propuestas ${donde}
          ORDER BY emitida_en DESC
          LIMIT ? OFFSET ?`,
      )
      .bind(...valores, POR_PAGINA, (pagina - 1) * POR_PAGINA),
  ]);

  const cuentas = resumen?.results[0] ?? {};

  return {
    propuestas: (filas?.results ?? []).map(aResumen),
    cuantas: Number(cuentas.cuantas ?? 0),
    pagina,
    porPagina: POR_PAGINA,
    sumas: {
      unico: {
        min: deCentavos(Number(cuentas.unico_min ?? 0)),
        max: deCentavos(Number(cuentas.unico_max ?? 0)),
      },
      mensual: {
        min: deCentavos(Number(cuentas.mensual_min ?? 0)),
        max: deCentavos(Number(cuentas.mensual_max ?? 0)),
      },
    },
  };
}

export async function abrir(
  base: D1Database,
  numero: string,
): Promise<PropuestaGuardada<Propuesta>> {
  const fila = await base
    .prepare('SELECT * FROM propuestas WHERE numero = ?')
    .bind(numero)
    .first<Record<string, unknown>>();

  if (!fila) {
    throw new ErrorPeticion(404, 'no-encontrada', `No hay ninguna propuesta ${numero}.`);
  }

  return {
    ...aResumen(fila),
    documento: JSON.parse(String(fila.documento)) as Propuesta,
  };
}

export async function marcar(
  base: D1Database,
  numero: string,
  peticion: Request,
  correo: string,
): Promise<{ hecho: true }> {
  const cuerpo = await cuerpoJson<{ estado?: Estado; nota?: string }>(peticion);

  if (!esEstado(cuerpo.estado)) {
    throw new ErrorPeticion(400, 'invalida', 'Ese estado no existe.');
  }

  const resultado = await base
    .prepare(
      `UPDATE propuestas
          SET estado = ?, estado_nota = ?, estado_en = ?, estado_por = ?
        WHERE numero = ?`,
    )
    .bind(cuerpo.estado, (cuerpo.nota ?? '').slice(0, 500), new Date().toISOString(), correo, numero)
    .run();

  if (!resultado.meta.changes) {
    throw new ErrorPeticion(404, 'no-encontrada', `No hay ninguna propuesta ${numero}.`);
  }

  return { hecho: true };
}

// --- Papelera ---------------------------------------------------------------

/**
 * Lee del cuerpo qué propuestas alcanza la operación.
 *
 * Dos formas, y la segunda existe por el caso real: con cientos de propuestas
 * guardadas, mandar cientos de números por el cable para borrarlas no es una
 * forma de borrar. `{ todas: true, filtro }` deja que la condición la resuelva
 * la base con el mismo `WHERE` del listado.
 */
export async function leerSeleccion(peticion: Request): Promise<Seleccion> {
  const cuerpo = await cuerpoJson<{ numeros?: unknown; todas?: unknown; filtro?: unknown }>(
    peticion,
  );

  if (cuerpo.todas === true) {
    return { todas: true, filtro: filtroSeguro(cuerpo.filtro as Partial<FiltroHistorial>) };
  }

  const numeros = Array.isArray(cuerpo.numeros)
    ? cuerpo.numeros.filter((n): n is string => typeof n === 'string' && n.trim() !== '')
    : [];

  if (numeros.length === 0) {
    throw new ErrorPeticion(400, 'invalida', 'No se indicó ninguna propuesta.');
  }
  if (numeros.length > MAXIMO_SELECCION) {
    throw new ErrorPeticion(
      400,
      'invalida',
      `No se pueden tocar más de ${MAXIMO_SELECCION} propuestas de una vez por número. ` +
        'Usa el filtro y «seleccionar todas».',
    );
  }

  return { numeros };
}

/**
 * A qué filas llega la operación, según de dónde vengan.
 *
 * `papelera` no lo decide quien llama: lo decide la operación. Eliminar solo
 * puede tocar lo que está a la vista y restaurar o purgar solo lo que ya está
 * en la papelera, y así una selección hecha en una pantalla no puede acabar
 * aplicándose sobre la otra.
 */
function alcanceDe(seleccion: Seleccion, papelera: boolean): { donde: string; valores: unknown[] } {
  if ('todas' in seleccion) return dondeDe({ ...seleccion.filtro, papelera });

  const huecos = seleccion.numeros.map(() => '?').join(', ');
  return {
    donde: `WHERE ${
      papelera ? 'eliminada_en IS NOT NULL' : 'eliminada_en IS NULL'
    } AND numero IN (${huecos})`,
    valores: [...seleccion.numeros],
  };
}

/**
 * Manda propuestas a la papelera.
 *
 * No borra nada: pone fecha y autor de retirada, y desde ese momento dejan de
 * salir en el historial. El número sigue ocupado —el consecutivo no retrocede
 * nunca— y el documento sigue entero, que es lo que permite deshacerlo.
 */
export async function eliminar(
  base: D1Database,
  seleccion: Seleccion,
  correo: string,
): Promise<Cuantas> {
  const { donde, valores } = alcanceDe(seleccion, false);

  const resultado = await base
    .prepare(`UPDATE propuestas SET eliminada_en = ?, eliminada_por = ? ${donde}`)
    .bind(new Date().toISOString(), correo, ...valores)
    .run();

  return { cuantas: resultado.meta.changes ?? 0 };
}

/** Las saca de la papelera. Vuelven al historial tal como estaban. */
export async function restaurar(base: D1Database, seleccion: Seleccion): Promise<Cuantas> {
  const { donde, valores } = alcanceDe(seleccion, true);

  const resultado = await base
    .prepare(`UPDATE propuestas SET eliminada_en = NULL, eliminada_por = NULL ${donde}`)
    .bind(...valores)
    .run();

  return { cuantas: resultado.meta.changes ?? 0 };
}

/**
 * Borra de verdad, y solo lo que ya está en la papelera.
 *
 * El paso previo por la papelera no es una molestia inventada: es lo que
 * convierte «seleccioné treinta sin querer» en algo que se deshace. Aquí ya no
 * —de esto no se vuelve, y con el documento se va la posibilidad de regenerar
 * el PDF que recibió el cliente—.
 */
export async function purgar(base: D1Database, seleccion: Seleccion): Promise<Cuantas> {
  const { donde, valores } = alcanceDe(seleccion, true);

  const resultado = await base.prepare(`DELETE FROM propuestas ${donde}`).bind(...valores).run();

  return { cuantas: resultado.meta.changes ?? 0 };
}
