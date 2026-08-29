/**
 * Modelo de datos del cotizador.
 *
 * `Item` y `Catalogo` se derivan de `datos/precios.json` y son de solo lectura:
 * no se editan aquí, se editan allí. El resto —`Cliente`, `Linea`,
 * `Propuesta`— es lo que arma el asesor en pantalla.
 */

import type { Dinero } from './dinero';

/** Los cuatro planes web, de menor a mayor. El orden importa: se compara. */
export const PLANES = ['start', 'launch', 'corporate', 'commerce'] as const;
export type PlanSlug = (typeof PLANES)[number];

/**
 * A qué producto del catálogo pertenece un item.
 *
 * `auditoria`, `seguridad`, `care` y `diagnostico` van separadas a propósito y
 * no bajo una sola familia «servicios»: son las cuatro que `catalogo/08-fronteras.md`
 * declara confundibles, y tenerlas distinguidas en el tipo es lo que permite
 * comprobar mecánicamente que la propuesta las distingue.
 */
export type Familia =
  | 'web'
  | 'capacidad'
  | 'ebot'
  | 'auditoria'
  | 'seguridad'
  | 'care'
  | 'diagnostico'
  | 'ronda';

/** Pago único o cada mes. Nunca se suman: son dos totales distintos. */
export type Recurrencia = 'unico' | 'mensual';

export interface Item {
  readonly id: string;
  readonly familia: Familia;
  /** Nombre oficial, literal de `datos/precios.json`. No se acorta. */
  readonly nombre: string;
  readonly precio: Dinero;
  /** El importe tal como lo declara `precios.json`, para poder compararlos. */
  readonly precioTexto: string;
  readonly recurrencia: Recurrencia;
  /** Cómo se cobra este producto, de `catalogo/07-condiciones.md`. */
  readonly cobro: string;
  /** Plazo publicado. Sin plazo, el item no lo tiene (los mensuales). */
  readonly entrega?: string;
  /** Qué consigue el cliente, en su idioma. Sale en el PDF y en el mensaje. */
  readonly queConsigue?: string;
  /**
   * A quién se le vende. Posicionamiento INTERNO: se ve al elegir del catálogo
   * y no sale en ningún documento que lea el cliente. «Sustituye al WordPress
   * de $1,200 de las agencias» ayuda a decidir el plan y quedaría fatal
   * impreso bajo el nombre del negocio al que se le está cotizando.
   */
  readonly paraQuien?: string;
  /** Rondas de cambios incluidas. Solo los planes web. */
  readonly rondas?: number;
  /** Plan web mínimo que exige este item. */
  readonly planMinimo?: PlanSlug;
  /** Plan web a partir del cual el item ya viene dentro y no se cobra. */
  readonly incluidoDesde?: PlanSlug;
  /** Si el plan deja al cliente editar su contenido sin llamar a nadie. */
  readonly editablePorCliente?: boolean;
  /** Lo que este item hace obligatorio. Hoy solo los mensuales de seguridad. */
  readonly requiere?: { readonly familia: Familia; readonly porQue: string };
  /** Se puede pedir más de una vez. Hoy solo la ronda extra. */
  readonly repetible?: boolean;
  readonly notas?: readonly string[];
}

/** Un costo recurrente que el cliente paga a otra empresa, no a PanaClaw. */
export interface CostoTercero {
  readonly concepto: string;
  readonly precio: Dinero;
  readonly precioTexto: string;
  readonly aQuien: string;
}

export interface Catalogo {
  /** Versión de `datos/precios.json`. Viaja dentro de cada propuesta. */
  readonly version: string;
  readonly moneda: string;
  readonly items: readonly Item[];
  readonly rondaExtra: Item;
  readonly costosDeEbot: readonly CostoTercero[];
  /** «Pago anual adelantado: dos meses gratis», literal. Único descuento. */
  readonly descuentoAnualCare: string;
}

/** A quién va dirigida la propuesta. */
export interface Cliente {
  negocio: string;
  contacto: string;
  whatsapp: string;
  correo: string;
  ciudad: string;
}

/** Una línea de la propuesta en construcción. */
export interface Linea {
  /** Identificador de la línea, no del item: la ronda extra puede ir dos veces. */
  readonly id: string;
  readonly itemId: string;
  /** Lo que se imprime; arranca con el nombre oficial y es editable. */
  descripcion: string;
  cantidad: number;
  /**
   * El importe aplicado. Arranca en el del catálogo y solo se puede mover
   * DENTRO de su rango: fuera de él sería una cifra que la marca no publica.
   */
  precio: Dinero;
  /** `true` cuando el asesor cerró el rango a una cifra concreta. */
  precioAjustado: boolean;
  /** Una línea que el plan ya trae: se enseña, no se cobra. */
  incluida: boolean;
  nota: string;
}

export interface Condiciones {
  validezDias: number;
  /** Viñetas de «qué NO incluye» que añade el asesor sobre las automáticas. */
  noIncluyeExtra: string[];
  observaciones: string;
}

export interface Propuesta {
  numero: string;
  /** ISO `yyyy-mm-dd`. */
  fecha: string;
  asesor: string;
  /**
   * La ficha del cliente a la que pertenece, cuando quien cotiza la eligió.
   *
   * **No se imprime.** Es un enlace, no un dato del documento: lo que sale en
   * el PDF son los datos de `cliente`, congelados como estaban al emitir,
   * porque el PDF que el cliente tiene en la mano dice lo que decía ese día.
   * Esto solo sirve para la pregunta contraria —«¿qué le hemos propuesto a
   * éste?»— y para que corregir un nombre en la ficha no desconecte su
   * historia.
   *
   * Opcional porque el cotizador funciona sin panel de clientes delante: sin
   * servidor, o con la ficha sin elegir, la propuesta se arma igual.
   */
  clienteCodigo?: string;
  /** La situación del cliente, en sus palabras. Encabeza el documento. */
  necesita: string;
  /**
   * Versión del catálogo con la que se calculó. Sirve para avisar, al reabrir
   * un borrador, de que `datos/precios.json` cambió entre medias.
   */
  catalogoVersion: string;
  cliente: Cliente;
  lineas: Linea[];
  condiciones: Condiciones;
}

/**
 * Las cifras de la propuesta.
 *
 * **No hay campo `total`, y su ausencia es la regla 2 de la marca escrita en el
 * sistema de tipos.** Un importe de pago único y uno mensual nunca se suman:
 * sumarlos da un número creíble y falso. Mientras este tipo no tenga dónde
 * guardar esa suma, ninguna pantalla, ningún PDF y ningún mensaje de WhatsApp
 * puede enseñarla por descuido.
 *
 * `terceros` va aparte por lo mismo: es dinero que el cliente paga, pero no a
 * PanaClaw, y meterlo en cualquiera de los otros dos lo convertiría en un cobro
 * nuestro.
 */
export interface Totales {
  readonly unico: Dinero;
  readonly mensual: Dinero;
  readonly terceros: readonly CostoTercero[];
}
