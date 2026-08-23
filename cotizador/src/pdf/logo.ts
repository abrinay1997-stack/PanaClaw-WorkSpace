/**
 * El símbolo de la marca, dibujado como vector dentro del PDF.
 *
 * No es una imagen: es el mismo trazado que declara `datos/marca.json` →
 * `logo.pathSVG`, convertido a las primitivas de jsPDF. Así el logo del
 * documento no puede desincronizarse del de la marca, no pesa nada y sale
 * nítido a cualquier tamaño y en cualquier impresora.
 *
 * El trazado son seis figuras de líneas rectas —el corchete izquierdo, el
 * derecho, el punto romboidal y los tres zarpazos—, cada una cerrada. Al no
 * haber ninguna dentro de otra, rellenarlas por separado da el mismo resultado
 * que la regla par-impar que declara el SVG.
 */

import type jsPDF from 'jspdf';

import { LOGO } from '../datos/empresa';
import { relleno } from './documento';
import type { RGB } from './marca';

/** Un punto del trazado, en unidades del `viewBox`. */
type Punto = readonly [number, number];

/**
 * `M73.43 28.64L54.69 50.19L…Z M81.03 …` → una lista de polígonos.
 *
 * El trazado de la marca solo usa `M`, `L` y `Z` con coordenadas absolutas, así
 * que no hace falta un intérprete de SVG: basta partir por las órdenes. Si
 * algún día el símbolo se redibuja con curvas, esto deja de servir y hay que
 * saberlo — por eso descarta en silencio lo que no entiende en vez de dibujar
 * una aproximación equivocada.
 */
function figuras(path: string): Punto[][] {
  const poligonos: Punto[][] = [];
  let actual: Punto[] = [];

  for (const [, orden, coordenadas] of path.matchAll(/([MLZ])([^MLZ]*)/gi)) {
    const letra = orden!.toUpperCase();

    if (letra === 'Z') {
      if (actual.length > 2) poligonos.push(actual);
      actual = [];
      continue;
    }

    const cifras = coordenadas!.trim().split(/[\s,]+/).filter(Boolean).map(Number);
    for (let i = 0; i + 1 < cifras.length; i += 2) {
      actual.push([cifras[i]!, cifras[i + 1]!] as Punto);
    }
    if (letra === 'M' && actual.length > 1) {
      // Un `M` en medio abre figura nueva sin cerrar la anterior.
      const arranque = actual.pop()!;
      if (actual.length > 2) poligonos.push(actual);
      actual = [arranque];
    }
  }

  if (actual.length > 2) poligonos.push(actual);
  return poligonos;
}

const FIGURAS = figuras(LOGO.path);

const [, , ANCHO_VB, ALTO_VB] = LOGO.viewBox.split(/\s+/).map(Number) as [number, number, number, number];

/** La proporción real del símbolo. NO es cuadrado: deformarlo está prohibido. */
export const PROPORCION = ANCHO_VB / ALTO_VB;

export const anchoDeLogo = (alto: number): number => alto * PROPORCION;

/**
 * Dibuja el símbolo con su esquina superior izquierda en (x, y) y el alto
 * pedido, en milímetros. El ancho sale de la proporción, nunca al revés.
 */
export function dibujarLogo(doc: jsPDF, x: number, y: number, alto: number, color: RGB): void {
  const escala = alto / ALTO_VB;
  relleno(doc, color);

  for (const figura of FIGURAS) {
    const [inicio, ...resto] = figura;
    if (!inicio) continue;

    // jsPDF dibuja por incrementos desde el punto de partida.
    const saltos: [number, number][] = [];
    let previo = inicio;
    for (const punto of resto) {
      saltos.push([punto[0] - previo[0], punto[1] - previo[1]]);
      previo = punto;
    }

    doc.lines(saltos, x + inicio[0] * escala, y + inicio[1] * escala, [escala, escala], 'F', true);
  }
}
