/**
 * La contabilidad ligera: el libro de gastos, el resumen del periodo y las
 * cuentas por cobrar.
 *
 * Todo sale de los libros —cobros y gastos— sumando asientos. No hay cifras
 * guardadas aparte, y por eso el resumen no puede discrepar de los asientos que
 * lo componen. Las cuentas puras (`resumirPeriodo`, `antiguedadDe`) viven en
 * `compartido/` y las usa también la pantalla.
 *
 * El libro de gastos se rige como el de cobros: lo escrito no se edita ni se
 * elimina (la base lo impide) y un error se corrige con un asiento contrario.
 */

import {
  antiguedadDe,
  esCategoria,
  mesDe,
  resumirPeriodo,
  type ContabilidadDelPeriodo,
  type Gasto,
  type NuevoGasto,
} from '../compartido/contabilidad';
import { ITBMS } from '../cotizador/src/dominio/catalogo';
import { debidoCentavos } from '../cotizador/src/dominio/propuesta';
import type { Propuesta } from '../cotizador/src/dominio/tipos';
import { cuerpoJson, ErrorPeticion, texto } from './http';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
/** Un gasto de más de diez millones de dólares es un cero de más, no un gasto. */
const MAXIMO_CENTAVOS = 1_000_000_000;

const fechaValida = (valor: string): boolean => FECHA.test(valor) && !Number.isNaN(Date.parse(valor));

/** La fecha de hoy en Panamá (UTC−5, sin horario de verano). */
export function hoyEnPanama(ahora = new Date()): string {
  return new Date(ahora.getTime() - 5 * 3_600_000).toISOString().slice(0, 10);
}

function aGasto(fila: Record<string, unknown>): Gasto {
  return {
    id: Number(fila.id),
    fecha: String(fila.fecha),
    centavos: Number(fila.centavos),
    itbmsCentavos: Number(fila.itbms_centavos),
    categoria: String(fila.categoria) as Gasto['categoria'],
    proveedor: String(fila.proveedor),
    referencia: String(fila.referencia ?? ''),
    nota: String(fila.nota ?? ''),
    corrigeA: fila.corrige_a === null || fila.corrige_a === undefined ? null : Number(fila.corrige_a),
    motivo: String(fila.motivo ?? ''),
    registradoPor: String(fila.registrado_por),
    registradoEn: String(fila.registrado_en),
  };
}

/** El periodo pedido en la dirección, o el mes en curso. Rechaza fechas que no lo son. */
export function periodoDeUrl(url: URL, hoy: string): { desde: string; hasta: string } {
  const mes = mesDe(hoy);
  const desde = url.searchParams.get('desde') || mes.desde;
  const hasta = url.searchParams.get('hasta') || mes.hasta;
  if (!fechaValida(desde) || !fechaValida(hasta)) {
    throw new ErrorPeticion(400, 'invalida', 'Las fechas del periodo no son válidas.');
  }
  if (desde > hasta) {
    throw new ErrorPeticion(400, 'invalida', 'La fecha «desde» no puede ser posterior a «hasta».');
  }
  return { desde, hasta };
}

async function gastosDelPeriodo(base: D1Database, desde: string, hasta: string): Promise<Gasto[]> {
  const { results } = await base
    .prepare('SELECT * FROM gastos WHERE fecha BETWEEN ? AND ? ORDER BY fecha DESC, id DESC')
    .bind(desde, hasta)
    .all<Record<string, unknown>>();
  return results.map(aGasto);
}

/** El resumen, las cuentas por cobrar y los gastos de un periodo. */
export async function contabilidad(base: D1Database, desde: string, hasta: string, hoy: string): Promise<ContabilidadDelPeriodo> {
  const gastos = await gastosDelPeriodo(base, desde, hasta);

  const { results: cobros } = await base
    .prepare('SELECT centavos, metodo FROM cobros WHERE fecha BETWEEN ? AND ?')
    .bind(desde, hasta)
    .all<{ centavos: number; metodo: string }>();

  const resumen = resumirPeriodo(desde, hasta, cobros, gastos, ITBMS.tasa);

  // Las cuentas por cobrar son lo aceptado que todavía no se ha cobrado entero,
  // sin importar el periodo: una deuda de hace tres meses sigue siéndolo.
  const { results: aceptadas } = await base
    .prepare(
      `SELECT numero, negocio, estado_en, emitida_en, documento
         FROM propuestas
        WHERE estado = 'aceptada' AND eliminada_en IS NULL`,
    )
    .all<{ numero: string; negocio: string; estado_en: string | null; emitida_en: string; documento: string }>();

  const { results: sumas } = await base
    .prepare('SELECT propuesta, SUM(centavos) AS cobrado FROM cobros GROUP BY propuesta')
    .all<{ propuesta: string; cobrado: number }>();
  const cobrado = new Map(sumas.map((s) => [s.propuesta, Number(s.cobrado)]));

  const entradas = aceptadas.flatMap((p) => {
    const debido = debidoCentavos((JSON.parse(p.documento) as Propuesta).lineas);
    // Sin cifra debida (un rango abierto) no hay cuenta por cobrar que medir.
    if (debido === null) return [];
    return [
      {
        numero: p.numero,
        negocio: p.negocio,
        desde: (p.estado_en ?? p.emitida_en).slice(0, 10),
        debidoCentavos: debido,
        cobradoCentavos: cobrado.get(p.numero) ?? 0,
      },
    ];
  });

  return { resumen, antiguedad: antiguedadDe(entradas, hoy), gastos, hoy };
}

export async function registrarGasto(base: D1Database, peticion: Request, correo: string): Promise<Gasto[]> {
  const cuerpo = await cuerpoJson<Partial<NuevoGasto>>(peticion);

  const centavos = cuerpo.centavos;
  if (typeof centavos !== 'number' || !Number.isInteger(centavos) || centavos <= 0 || centavos > MAXIMO_CENTAVOS) {
    throw new ErrorPeticion(400, 'invalida', 'El importe del gasto tiene que ser mayor que cero.');
  }
  const itbms = cuerpo.itbmsCentavos ?? 0;
  if (typeof itbms !== 'number' || !Number.isInteger(itbms) || itbms < 0 || itbms > centavos) {
    throw new ErrorPeticion(400, 'invalida', 'El ITBMS del gasto no es válido.');
  }
  if (!esCategoria(cuerpo.categoria)) {
    throw new ErrorPeticion(400, 'invalida', 'Esa categoría no existe.');
  }
  const fecha = texto(cuerpo.fecha, 10);
  if (!fechaValida(fecha)) {
    throw new ErrorPeticion(400, 'invalida', 'La fecha del gasto no es válida.');
  }
  const proveedor = texto(cuerpo.proveedor, 120);
  if (!proveedor) {
    throw new ErrorPeticion(400, 'invalida', 'Escribe a quién se le pagó.');
  }

  await base
    .prepare(
      `INSERT INTO gastos
         (fecha, centavos, itbms_centavos, categoria, proveedor, referencia, nota, registrado_por, registrado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      fecha,
      centavos,
      itbms,
      cuerpo.categoria,
      proveedor,
      texto(cuerpo.referencia, 120),
      texto(cuerpo.nota, 500),
      correo,
      new Date().toISOString(),
    )
    .run();

  return gastosDelPeriodo(base, fecha, fecha);
}

/** Corrige un gasto con un asiento contrario. El original no se toca. */
export async function corregirGasto(base: D1Database, id: number, peticion: Request, correo: string): Promise<{ hecho: true }> {
  const cuerpo = await cuerpoJson<{ motivo?: unknown }>(peticion);
  const motivo = texto(cuerpo.motivo, 500);
  if (!motivo) {
    throw new ErrorPeticion(400, 'invalida', 'Escribe el motivo de la corrección.');
  }

  const fila = await base.prepare('SELECT * FROM gastos WHERE id = ?').bind(id).first<Record<string, unknown>>();
  if (!fila) {
    throw new ErrorPeticion(404, 'no-encontrada', 'Ese gasto no existe.');
  }
  const gasto = aGasto(fila);
  if (gasto.corrigeA !== null || gasto.centavos < 0) {
    throw new ErrorPeticion(400, 'invalida', 'Una corrección no se corrige: registra el gasto de nuevo.');
  }

  try {
    await base
      .prepare(
        `INSERT INTO gastos
           (fecha, centavos, itbms_centavos, categoria, proveedor, referencia, nota, corrige_a, motivo, registrado_por, registrado_en)
         VALUES (?, ?, ?, ?, ?, ?, '', ?, ?, ?, ?)`,
      )
      .bind(
        gasto.fecha,
        -gasto.centavos,
        -gasto.itbmsCentavos,
        gasto.categoria,
        gasto.proveedor,
        gasto.referencia,
        gasto.id,
        motivo,
        correo,
        new Date().toISOString(),
      )
      .run();
  } catch {
    // El índice único: ese gasto ya tiene su corrección.
    throw new ErrorPeticion(400, 'invalida', 'Ese gasto ya fue corregido.');
  }

  return { hecho: true };
}
