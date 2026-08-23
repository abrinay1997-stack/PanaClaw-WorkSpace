/**
 * Primitivas de dibujo sobre jsPDF.
 *
 * jsPDF trabaja con estado global —color de relleno, fuente, tamaño— y con
 * coordenadas absolutas. Escribir la propuesta directamente contra esa API hace
 * que un cambio de márgenes obligue a recalcular decenas de números. Estas
 * funciones envuelven lo que se repite, y `Hoja` lleva la cuenta de por dónde
 * va el documento para que ningún bloque tenga que saber en qué página cae.
 */

import type jsPDF from 'jspdf';

import { ANCHO_UTIL, COLOR, FUENTE, HOJA, type RGB } from './marca';

export function relleno(doc: jsPDF, color: RGB): void {
  doc.setFillColor(color[0], color[1], color[2]);
}

export function trazo(doc: jsPDF, color: RGB): void {
  doc.setDrawColor(color[0], color[1], color[2]);
}

export function tinta(doc: jsPDF, color: RGB): void {
  doc.setTextColor(color[0], color[1], color[2]);
}

export interface EstiloTexto {
  tamano?: number;
  color?: RGB;
  negrita?: boolean;
  /** Ancho máximo en mm; el texto se parte en varias líneas si lo excede. */
  ancho?: number;
  alineacion?: 'left' | 'center' | 'right';
  /** Separación entre líneas, como múltiplo del tamaño de fuente. */
  interlineado?: number;
  /** Espaciado entre letras, en puntos. Para las versalitas de los rótulos. */
  entreLetras?: number;
}

/** pt → mm. */
const aMilimetros = (puntos: number): number => puntos / 2.835;

function aplicar(doc: jsPDF, estilo: EstiloTexto): void {
  doc.setFont(FUENTE, estilo.negrita ? 'bold' : 'normal');
  doc.setFontSize(estilo.tamano ?? 9);
  doc.setCharSpace(estilo.entreLetras ?? 0);
  tinta(doc, estilo.color ?? COLOR.negro);
}

/**
 * Escribe texto y devuelve la Y siguiente, para poder encadenar bloques sin
 * llevar la cuenta de altos a mano.
 */
export function escribir(
  doc: jsPDF,
  texto: string,
  x: number,
  y: number,
  estilo: EstiloTexto = {},
): number {
  aplicar(doc, estilo);
  const lineas = estilo.ancho ? (doc.splitTextToSize(texto, estilo.ancho) as string[]) : [texto];
  doc.text(lineas, x, y, { align: estilo.alineacion ?? 'left' });
  doc.setCharSpace(0);
  return y + lineas.length * aMilimetros((estilo.tamano ?? 9) * (estilo.interlineado ?? 1.3));
}

/** Lo que ocuparía `escribir` sin escribir nada. Para decidir saltos de página. */
export function altoDe(doc: jsPDF, texto: string, estilo: EstiloTexto = {}): number {
  aplicar(doc, estilo);
  const lineas = estilo.ancho ? (doc.splitTextToSize(texto, estilo.ancho) as string[]) : [texto];
  doc.setCharSpace(0);
  return lineas.length * aMilimetros((estilo.tamano ?? 9) * (estilo.interlineado ?? 1.3));
}

/** Ancho que ocuparía un texto, para alinear a la derecha o medir columnas. */
export function anchoDe(doc: jsPDF, texto: string, tamano: number, negrita = false): number {
  doc.setFont(FUENTE, negrita ? 'bold' : 'normal');
  doc.setFontSize(tamano);
  return doc.getTextWidth(texto);
}

export interface Caja {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

export function panel(
  doc: jsPDF,
  caja: Caja,
  opciones: { fondo?: RGB; borde?: RGB; radio?: number } = {},
): void {
  const { fondo, borde, radio = 2.5 } = opciones;
  if (fondo) relleno(doc, fondo);
  if (borde) trazo(doc, borde);
  doc.setLineWidth(0.25);
  doc.roundedRect(caja.x, caja.y, caja.ancho, caja.alto, radio, radio, fondo && borde ? 'FD' : fondo ? 'F' : 'S');
}

/** Filete horizontal. */
export function regla(
  doc: jsPDF,
  x: number,
  y: number,
  ancho: number,
  color: RGB = COLOR.borde,
  grosor = 0.25,
): void {
  trazo(doc, color);
  doc.setLineWidth(grosor);
  doc.line(x, y, x + ancho, y);
}

/** El punto naranja de 8 px que la marca usa como viñeta. Nunca un check. */
export function vineta(doc: jsPDF, x: number, y: number): void {
  relleno(doc, COLOR.naranja);
  doc.circle(x, y, 0.75, 'F');
}

/* ------------------------------------------------------------------ *
 * El flujo del documento
 * ------------------------------------------------------------------ */

/**
 * Por dónde va el documento.
 *
 * Existe para que ningún bloque de la propuesta tenga que saber en qué página
 * cae. Se pide sitio (`espacio`) antes de dibujar y, si no cabe, la página
 * cambia sola. Sin esto, el «qué no incluye» de una propuesta larga se parte
 * por la mitad entre dos páginas, que es justo la sección que no puede
 * quedarse a medias.
 */
/**
 * Lo que tiene que caber para que un rótulo de sección pueda empezar: él mismo
 * más unas dos líneas de lo que venga debajo.
 */
const RESERVA_DE_SECCION = 26;

export class Hoja {
  y: number;

  constructor(readonly doc: jsPDF) {
    this.y = HOJA.margen;
  }

  get x(): number {
    return HOJA.margen;
  }

  get ancho(): number {
    return ANCHO_UTIL;
  }

  /** El borde inferior a partir del cual ya no se dibuja. */
  get fondo(): number {
    return HOJA.alto - HOJA.pie;
  }

  /** Asegura `alto` milímetros de sitio; si no los hay, abre página nueva. */
  espacio(alto: number): void {
    if (this.y + alto > this.fondo) this.nuevaPagina();
  }

  nuevaPagina(): void {
    this.doc.addPage();
    this.y = HOJA.margen;
  }

  avanzar(milimetros: number): void {
    this.y += milimetros;
  }

  /**
   * Rótulo de sección: versalitas naranjas con un filete debajo. Es lo que
   * estructura el documento sin recurrir a un segundo color.
   *
   * Pide sitio para el rótulo Y para lo primero que va debajo. Sin eso, un
   * rótulo que cabe justo al final de la página se queda solo ahí y su
   * contenido empieza en la siguiente: el lector pasa la hoja para encontrar
   * unas viñetas sin encabezado y una página anterior que termina en un título
   * huérfano. Es el defecto de maquetación que más barato sale evitar y peor se
   * ve cuando no se evita.
   */
  rotulo(texto: string): void {
    this.espacio(RESERVA_DE_SECCION);
    this.y = escribir(this.doc, texto.toUpperCase(), this.x, this.y + 3.6, {
      tamano: 7.5,
      color: COLOR.naranja,
      negrita: true,
      entreLetras: 1.1,
    });
    regla(this.doc, this.x, this.y - 1.5, this.ancho, COLOR.borde, 0.35);
    this.avanzar(2.6);
  }

  /** Un párrafo de cuerpo, con salto de página si no cabe entero. */
  parrafo(texto: string, estilo: EstiloTexto = {}): void {
    const completo = { tamano: 9, color: COLOR.tintaSuave, ancho: this.ancho, ...estilo };
    this.espacio(altoDe(this.doc, texto, completo));
    this.y = escribir(this.doc, texto, this.x, this.y + 2.6, completo);
  }

  /** Una viñeta de la marca: punto naranja y texto al lado. */
  punto(texto: string): void {
    const ancho = this.ancho - 5;
    const estilo: EstiloTexto = { tamano: 9, color: COLOR.tintaSuave, ancho };
    this.espacio(altoDe(this.doc, texto, estilo) + 1.5);
    this.y += 2.8;
    vineta(this.doc, this.x + 1.2, this.y - 1.1);
    this.y = escribir(this.doc, texto, this.x + 5, this.y, estilo);
  }
}
