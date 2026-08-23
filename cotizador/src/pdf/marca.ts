/**
 * Tokens visuales del PDF.
 *
 * Los cuatro primeros son los de `datos/marca.json`, en RGB porque jsPDF no
 * entiende hex. Se leen del archivo en vez de copiarse: un cambio de paleta
 * llega al documento sin que nadie tenga que acordarse.
 */

import marca from '../../../datos/marca.json';

export type RGB = readonly [number, number, number];

const token = (nombre: keyof typeof marca.color.tokens): RGB => {
  const [r, v, a] = marca.color.tokens[nombre].rgb;
  // Se comprueba en vez de forzarse con un `as`: un token al que le falte una
  // componente tiene que romper al arrancar, no pintar un negro por defecto en
  // mitad de un documento que va camino del cliente.
  if (r === undefined || v === undefined || a === undefined) {
    throw new Error(`El token ${nombre} de datos/marca.json no trae sus tres componentes RGB.`);
  }
  return [r, v, a];
};

export const COLOR = {
  /** #100101 — fondo de la banda de cabecera y tinta del cuerpo. */
  negro: token('deep-black'),
  /** #FF5100 — acento único: cifras, rótulos, viñetas, el punto de la marca. */
  naranja: token('flash-orange'),
  /** #FFF7F7 — texto sobre la banda negra. */
  blancoCalido: token('soft-white'),
  /** #BABABA — texto secundario sobre la banda negra. */
  grisMarca: token('studio-gray'),

  /**
   * Los dos grises del papel, que NO son de la paleta de marca y es a
   * propósito.
   *
   * `studio-gray` (#BABABA) está pensado para texto secundario sobre el negro
   * de la marca, donde tiene contraste de sobra. Sobre papel blanco da 2.1:1 y
   * un párrafo escrito así no se lee ni en pantalla ni impreso. Una propuesta
   * es un documento que alguien va a leer entero antes de mandar dinero, así
   * que aquí manda la legibilidad: estos dos grises son una extensión
   * declarada, no un descuido. Uno da 7.0:1 y sirve para cuerpo; el otro 3.5:1
   * y solo se usa en rótulos en versalita.
   *
   * No aparecen en ninguna otra parte del hub: la pantalla usa la paleta de
   * marca entera, sobre negro, donde no hace falta ninguna extensión.
   */
  tintaSuave: [90, 90, 90] as RGB,
  tintaTenue: [138, 138, 138] as RGB,

  /** Filetes y bordes sobre papel. */
  borde: [214, 214, 214] as RGB,
  /** Fondo de los paneles de cifras. */
  papelTenue: [246, 244, 244] as RGB,
  papel: [255, 255, 255] as RGB,
} as const;

/**
 * Helvetica, y no Archivo.
 *
 * `datos/marca.json` declara Archivo como única familia de la marca, y este es
 * el único sitio del hub donde no se usa. Empotrar una fuente en un PDF suma
 * unos 200 KB a cada documento y obliga a versionar el binario dentro del
 * repositorio del cerebro de la marca, que es justo lo que este repositorio no
 * es. Helvetica va incorporada en todo lector de PDF, cubre los acentos y la
 * eñe, y a este cuerpo de letra la diferencia la nota un diseñador y nadie más.
 * La marca la sostienen aquí el color, la retícula y el símbolo.
 */
export const FUENTE = 'helvetica';

export const TIPO = {
  wordmark: 22,
  titulo: 15,
  cifra: 26,
  subtitulo: 11,
  rotulo: 7.5,
  cuerpo: 9,
  tabla: 9,
  pie: 7.5,
} as const;

/** Medidas de página en milímetros. */
export const HOJA = {
  ancho: 210,
  alto: 297,
  margen: 15,
  /** Alto de la banda negra de la primera página. */
  cabecera: 30,
  /** Alto reservado abajo para el pie. */
  pie: 17,
} as const;

export const ANCHO_UTIL = HOJA.ancho - HOJA.margen * 2;
