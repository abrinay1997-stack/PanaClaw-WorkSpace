/**
 * Todo lo que ha pasado con un cliente, en una sola pregunta.
 *
 * Es la pantalla que justifica que exista el panel: abrir una ficha y ver qué
 * se le propuso, en qué acabó y cuánto hay comprometido, sin buscarlo por
 * nombre en el historial y confiar en que siempre se escribió igual.
 */

import type { Importe, ResumenPropuesta } from './propuestas';

/**
 * Las cifras de un cliente. **Siempre en pares.**
 *
 * Aquí es donde más barato salía romper la regla 2 de la marca: «este cliente
 * vale $1,085» es una frase que se escribe sola sumando $850 de web y $35 al
 * mes de Care, y es falsa de las dos maneras —ni son $1,085, ni son de la misma
 * clase de dinero—. Por eso cada cifra de esta ficha es un par, y `Cifra` no
 * tiene dónde guardar la suma.
 *
 * `unico` es lo que se cobra una vez. `mensual` es lo que se cobra cada mes
 * mientras el cliente no lo pare. Nunca se juntan.
 */
export interface Cifra {
  unico: Importe;
  mensual: Importe;
}

export interface TotalesCliente {
  /** Todo lo que se le ha propuesto, esté en el estado que esté. */
  propuesto: Cifra;
  /** Lo aceptado. Es lo que en este hub significa «lo que compró». */
  ganado: Cifra;
  /** Lo emitido que todavía no se sabe en qué acabó. */
  pendiente: Cifra;
  perdido: Cifra;
  /** Cuántas propuestas hay detrás de esas cifras. */
  cuantas: number;
}

export interface ActividadCliente {
  totales: TotalesCliente;
  /**
   * Las últimas propuestas, de la más reciente hacia atrás.
   *
   * Son las que llevan el enlace a esta ficha (`clienteCodigo`), y solo ésas.
   * No se buscan además por nombre parecido: «Distribuidora Central» hay
   * varias, y una ficha que se atribuye propuestas ajenas es peor que una ficha
   * incompleta —la segunda se nota y la primera no—.
   */
  propuestas: ResumenPropuesta[];
}

/** Cuántas filas trae la ficha. Es una ficha, no un listado. */
export const ACTIVIDAD_POR_FICHA = 20;
