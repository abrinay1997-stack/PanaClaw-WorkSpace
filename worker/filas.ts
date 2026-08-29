/**
 * Cómo se lee una fila de la base.
 *
 * En su propio archivo porque la leen los dos módulos: el historial para pintar
 * su listado y la ficha del cliente para pintar sus propuestas. Con una copia
 * en cada uno, el día que se añada una columna solo se enteraría una de las dos
 * pantallas —y sería la otra la que empezaría a enseñar ceros—.
 *
 * Nada de lo que sale de la base se trata como texto sin pasar por `String(…
 * ?? '')`: una columna añadida con `DEFAULT` puede traer nulos en las filas
 * escritas entre la migración y el despliegue, y un `null` pintado en una tabla
 * es un «null» literal delante de un cliente.
 */

import { deCentavos, esEstado, type Importe, type ResumenPropuesta } from '../compartido/propuestas';

/** Dos columnas de centavos, vueltas el importe con su rango. */
function importe(min: unknown, max: unknown): Importe {
  return { min: deCentavos(Number(min ?? 0)), max: deCentavos(Number(max ?? 0)) };
}

export function aResumen(fila: Record<string, unknown>): ResumenPropuesta {
  return {
    numero: String(fila.numero),
    fecha: String(fila.fecha ?? ''),
    emitidaEn: String(fila.emitida_en ?? ''),
    autor: String(fila.autor ?? ''),
    asesor: String(fila.asesor ?? ''),
    negocio: String(fila.negocio ?? ''),
    contacto: String(fila.contacto ?? ''),
    correo: String(fila.correo ?? ''),
    whatsapp: String(fila.whatsapp ?? ''),
    clienteCodigo: fila.cliente_codigo ? String(fila.cliente_codigo) : null,
    unico: importe(fila.unico_min, fila.unico_max),
    mensual: importe(fila.mensual_min, fila.mensual_max),
    lineas: Number(fila.lineas ?? 0),
    estado: esEstado(fila.estado) ? fila.estado : 'emitida',
    estadoNota: String(fila.estado_nota ?? ''),
    estadoEn: fila.estado_en ? String(fila.estado_en) : null,
    estadoPor: fila.estado_por ? String(fila.estado_por) : null,
    eliminadaEn: fila.eliminada_en ? String(fila.eliminada_en) : null,
    eliminadaPor: fila.eliminada_por ? String(fila.eliminada_por) : null,
  };
}

/** Las columnas del listado. Sin `documento`: pesa megas y no se pinta. */
export const COLUMNAS_RESUMEN = `numero, fecha, emitida_en, autor, asesor,
         cliente_codigo, negocio, contacto, correo, whatsapp,
         unico_min, unico_max, mensual_min, mensual_max, lineas,
         estado, estado_nota, estado_en, estado_por,
         eliminada_en, eliminada_por`;
