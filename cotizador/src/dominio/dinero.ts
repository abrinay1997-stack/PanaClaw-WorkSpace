/**
 * Dinero, con rangos de primera clase.
 *
 * PanaClaw publica precios cerrados ($295) y precios con rango ($80–$150,
 * $30–$60/mes). La regla `rangosSeRespetan` de `datos/precios.json` dice que un
 * precio con rango se cita con su rango COMPLETO: citar solo el mínimo sin la
 * palabra «desde» es publicidad engañosa. La única forma de que una herramienta
 * no pueda romper esa regla por descuido es que el rango no se pueda perder por
 * el camino, y para eso todo importe de aquí adentro es un par min/max.
 *
 * Un precio cerrado es simplemente el rango donde min y max coinciden, así que
 * no hay dos caminos ni dos formatos: hay uno.
 */

export interface Dinero {
  readonly min: number;
  readonly max: number;
}

export const CERO: Dinero = { min: 0, max: 0 };

/** Un importe cerrado. */
export const fijo = (valor: number): Dinero => ({ min: valor, max: valor });

/**
 * Lee un importe declarado en `datos/precios.json`.
 *
 *   '$295'        → { min: 295,  max: 295 }
 *   '$1,200'      → { min: 1200, max: 1200 }
 *   '$80–$150'    → { min: 80,   max: 150 }
 *   '$1–2 al mes' → { min: 1,    max: 2 }
 *
 * Lanza si el texto no trae ninguna cifra. Es deliberado: el catálogo se
 * construye al arrancar, así que un `precioTexto` que deje de tener forma de
 * precio rompe la aplicación entera en el primer segundo, en vez de producir
 * un $0 silencioso dentro de una propuesta que ya va camino del cliente.
 */
export function leer(texto: string): Dinero {
  const cifras = texto.replace(/,/g, '').match(/\d+(\.\d+)?/g)?.map(Number);
  if (!cifras?.length) {
    throw new Error(`Importe sin cifras: ${JSON.stringify(texto)}`);
  }
  return { min: cifras[0]!, max: cifras[cifras.length - 1]! };
}

export const esCero = ({ min, max }: Dinero): boolean => min === 0 && max === 0;

export const esRango = ({ min, max }: Dinero): boolean => min !== max;

export function sumar(a: Dinero, b: Dinero): Dinero {
  return { min: a.min + b.min, max: a.max + b.max };
}

export function multiplicar({ min, max }: Dinero, veces: number): Dinero {
  return { min: min * veces, max: max * veces };
}

export const sumarTodos = (importes: readonly Dinero[]): Dinero =>
  importes.reduce(sumar, CERO);

const unaCifra = (valor: number): string => `$${valor.toLocaleString('en-US')}`;

/**
 * El importe, escrito como lo escribe la marca.
 *
 * El guion es el largo (–) y va SIN espacios alrededor, igual que en
 * `datos/precios.json`: '$80–$150'. Que el texto salga carácter a carácter
 * idéntico al declarado no es estética, es lo que permite que
 * `herramientas/verificar.mjs` reconozca el importe como válido en vez de
 * verlo como una cifra inventada.
 */
export function formato(importe: Dinero): string {
  return esRango(importe)
    ? `${unaCifra(importe.min)}–${unaCifra(importe.max)}`
    : unaCifra(importe.min);
}

/**
 * El sufijo mensual se decide aquí y en ningún otro sitio.
 *
 * Es lo que distingue «$35» de «$35 cada mes hasta que lo pares», y escribirlo
 * a mano en cada plantilla es exactamente cómo se acaba enseñando una
 * mensualidad sin decir que lo es.
 */
export const formatoMensual = (importe: Dinero): string => `${formato(importe)}/mes`;

/**
 * `formato` para un importe que la marca acorta con «desde».
 *
 * Solo para titulares y resúmenes, nunca para el desglose ni para un total: en
 * una propuesta concreta el cliente tiene derecho al rango entero.
 */
export const desde = (importe: Dinero): string =>
  esRango(importe) ? `desde ${unaCifra(importe.min)}` : unaCifra(importe.min);
