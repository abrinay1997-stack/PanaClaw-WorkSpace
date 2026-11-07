/**
 * El libro de cobros: lo que cada cliente va pagando de una propuesta aceptada.
 *
 * El saldo no está en ninguna columna: se suma el libro cada vez, con la misma
 * función (`resumenDeCobros`) que usa la pantalla. Y lo debido lo calcula este
 * servidor desde el documento guardado —con `debidoCentavos`, la misma cuenta
 * del PDF—, nunca una cifra que mande el navegador.
 *
 * Lo escrito no se edita ni se elimina (la base lo impide con disparadores). Un
 * error se corrige con un asiento contrario.
 */

import {
  esMetodo,
  resumenDeCobros,
  type Cobro,
  type LibroDeCobros,
  type NuevoCobro,
} from '../compartido/cobros';
import { debidoCentavos, hitosDe } from '../cotizador/src/dominio/propuesta';
import type { Propuesta } from '../cotizador/src/dominio/tipos';
import { exigirMesAbierto } from './contabilidad';
import { cuerpoJson, ErrorPeticion, texto } from './http';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

function aCobro(fila: Record<string, unknown>): Cobro {
  return {
    id: Number(fila.id),
    propuesta: String(fila.propuesta),
    fecha: String(fila.fecha),
    centavos: Number(fila.centavos),
    metodo: String(fila.metodo) as Cobro['metodo'],
    referencia: String(fila.referencia ?? ''),
    nota: String(fila.nota ?? ''),
    corrigeA: fila.corrige_a === null || fila.corrige_a === undefined ? null : Number(fila.corrige_a),
    motivo: String(fila.motivo ?? ''),
    registradoPor: String(fila.registrado_por),
    registradoEn: String(fila.registrado_en),
  };
}

/** La propuesta, o un 404. Trae el estado y el documento para saber qué se debe. */
async function propuestaDe(base: D1Database, numero: string) {
  const fila = await base
    .prepare('SELECT estado, documento, eliminada_en FROM propuestas WHERE numero = ?')
    .bind(numero)
    .first<{ estado: string; documento: string; eliminada_en: string | null }>();

  if (!fila) {
    throw new ErrorPeticion(404, 'no-encontrada', `No hay ninguna propuesta ${numero}.`);
  }
  const lineas = (JSON.parse(fila.documento) as Propuesta).lineas;
  return {
    estado: fila.estado,
    enPapelera: fila.eliminada_en !== null,
    debido: debidoCentavos(lineas),
    lineas,
  };
}

async function librosDe(
  base: D1Database,
  numero: string,
  debido: number | null,
  lineas: Propuesta['lineas'],
): Promise<LibroDeCobros> {
  const { results } = await base
    .prepare('SELECT * FROM cobros WHERE propuesta = ? ORDER BY fecha, id')
    .bind(numero)
    .all<Record<string, unknown>>();
  const cobros = results.map(aCobro);
  const resumen = resumenDeCobros(debido, cobros);
  return { cobros, resumen, hitos: hitosDe(lineas, debido, resumen.cobradoCentavos) };
}

export async function listar(base: D1Database, numero: string): Promise<LibroDeCobros> {
  const propuesta = await propuestaDe(base, numero);
  return librosDe(base, numero, propuesta.debido, propuesta.lineas);
}

export async function registrar(
  base: D1Database,
  numero: string,
  peticion: Request,
  correo: string,
): Promise<LibroDeCobros> {
  const cuerpo = await cuerpoJson<Partial<NuevoCobro>>(peticion);
  const propuesta = await propuestaDe(base, numero);

  if (propuesta.enPapelera) {
    throw new ErrorPeticion(400, 'invalida', 'Esa propuesta está en la papelera: restáurala antes de cobrar.');
  }
  // Solo se cobra lo que el cliente aceptó. Cobrar una propuesta «emitida»
  // sería registrar dinero de algo que nadie ha firmado.
  if (propuesta.estado !== 'aceptada') {
    throw new ErrorPeticion(400, 'invalida', 'Solo se registran cobros de propuestas aceptadas. Márcala como aceptada primero.');
  }
  if (propuesta.debido === null) {
    throw new ErrorPeticion(
      400,
      'invalida',
      'Esta propuesta tiene un rango sin cerrar, así que no hay una cifra que cobrar. Cierra el rango y emite la versión definitiva.',
    );
  }

  const centavos = cuerpo.centavos;
  if (typeof centavos !== 'number' || !Number.isInteger(centavos) || centavos <= 0) {
    throw new ErrorPeticion(400, 'invalida', 'El importe del cobro tiene que ser mayor que cero.');
  }
  if (!esMetodo(cuerpo.metodo)) {
    throw new ErrorPeticion(400, 'invalida', 'Ese método de pago no existe.');
  }
  const fecha = texto(cuerpo.fecha, 10);
  if (!FECHA.test(fecha) || Number.isNaN(Date.parse(fecha))) {
    throw new ErrorPeticion(400, 'invalida', 'La fecha del cobro no es válida.');
  }

  await exigirMesAbierto(base, fecha);

  const libro = await librosDe(base, numero, propuesta.debido, propuesta.lineas);
  // Cobrar de más es un error de tecleo casi siempre. Un saldo a favor es una
  // decisión que se toma a propósito y que este libro todavía no sabe llevar.
  if (centavos > (libro.resumen.pendienteCentavos ?? 0)) {
    throw new ErrorPeticion(400, 'invalida', 'Ese cobro es mayor que lo que falta por cobrar.');
  }

  await base
    .prepare(
      `INSERT INTO cobros
         (propuesta, fecha, centavos, metodo, referencia, nota, registrado_por, registrado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      numero,
      fecha,
      centavos,
      cuerpo.metodo,
      texto(cuerpo.referencia, 120),
      texto(cuerpo.nota, 500),
      correo,
      new Date().toISOString(),
    )
    .run();

  return librosDe(base, numero, propuesta.debido, propuesta.lineas);
}

/** Corrige un cobro con un asiento contrario. El original no se toca. */
export async function corregir(
  base: D1Database,
  numero: string,
  id: number,
  peticion: Request,
  correo: string,
): Promise<LibroDeCobros> {
  const cuerpo = await cuerpoJson<{ motivo?: unknown }>(peticion);
  const motivo = texto(cuerpo.motivo, 500);
  if (!motivo) {
    throw new ErrorPeticion(400, 'invalida', 'Escribe el motivo de la corrección.');
  }

  const propuesta = await propuestaDe(base, numero);
  const original = await base
    .prepare('SELECT * FROM cobros WHERE id = ? AND propuesta = ?')
    .bind(id, numero)
    .first<Record<string, unknown>>();
  if (!original) {
    throw new ErrorPeticion(404, 'no-encontrada', 'Ese cobro no existe en esta propuesta.');
  }
  const cobro = aCobro(original);
  if (cobro.corrigeA !== null || cobro.centavos < 0) {
    throw new ErrorPeticion(400, 'invalida', 'Una corrección no se corrige: registra el cobro de nuevo.');
  }

  await exigirMesAbierto(base, cobro.fecha);

  try {
    await base
      .prepare(
        `INSERT INTO cobros
           (propuesta, fecha, centavos, metodo, referencia, nota, corrige_a, motivo, registrado_por, registrado_en)
         VALUES (?, ?, ?, ?, ?, '', ?, ?, ?, ?)`,
      )
      .bind(
        numero,
        cobro.fecha,
        -cobro.centavos,
        cobro.metodo,
        cobro.referencia,
        cobro.id,
        motivo,
        correo,
        new Date().toISOString(),
      )
      .run();
  } catch {
    // El índice único: ese cobro ya tiene su corrección.
    throw new ErrorPeticion(400, 'invalida', 'Ese cobro ya fue corregido.');
  }

  return librosDe(base, numero, propuesta.debido, propuesta.lineas);
}
