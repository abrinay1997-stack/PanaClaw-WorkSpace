/**
 * La propuesta, en PDF.
 *
 * El orden de las secciones no es una decisión de maquetación: es el que
 * publica `skills/propuesta-comercial/SKILL.md` §7, y lo más llamativo de él es
 * que **«qué NO incluye» va ANTES del precio**. Es deliberado y es la firma de
 * la marca — el argumento entero de PanaClaw es la ausencia de trampa, y una
 * lista de exclusiones puesta antes de la cifra es la única forma de
 * demostrarla en vez de afirmarla. Bajarla a una nota al pie desmonta la pieza.
 *
 *   QUÉ NECESITAS · QUÉ INCLUYE · QUÉ NO INCLUYE · PAGO ÚNICO ·
 *   CADA MES · A TERCEROS · PLAZO · CAMBIOS
 */

import { jsPDF } from 'jspdf';

import { EMPRESA, type FormaDePago } from '../datos/empresa';
import { catalogo, ITBMS, itemDe } from '../dominio/catalogo';
import { conImpuesto, esCero, formato, formatoExacto, formatoMensual, type Dinero } from '../dominio/dinero';
import { fechaLarga, sumarDias } from '../dominio/formato';
import {
  fronterasDe,
  importeDeLinea,
  noIncluyeDe,
  plazosDe,
  rondasDe,
  totalesDe,
} from '../dominio/propuesta';
import { definicion, textoDe } from '../dominio/textos';
import type { Propuesta } from '../dominio/tipos';
import { altoDe, anchoDe, escribir, Hoja, panel, regla, tinta } from './documento';
import { anchoDeLogo, dibujarLogo } from './logo';
import { ANCHO_UTIL, COLOR, FUENTE, HOJA, TIPO } from './marca';

export function generarPdf(
  propuesta: Propuesta,
  opciones: { formasDePago?: readonly FormaDePago[] } = {},
): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  doc.setProperties({
    title: `Propuesta ${propuesta.numero} · ${EMPRESA.nombre}`,
    author: EMPRESA.nombre,
    subject: propuesta.cliente.negocio,
  });

  const hoja = new Hoja(doc);
  const totales = totalesDe(propuesta.lineas, catalogo.costosDeEbot);

  cabecera(hoja, propuesta);
  panelCliente(hoja, propuesta);
  queNecesitas(hoja, propuesta);
  queIncluye(hoja, propuesta);
  queNoIncluye(hoja, propuesta);
  lasCifras(hoja, propuesta, totales);
  comoPagar(hoja, opciones.formasDePago ?? EMPRESA.formasDePago);
  plazoYCambios(hoja, propuesta);
  lasFronteras(hoja, propuesta);
  condiciones(hoja, propuesta);
  aceptacion(hoja, propuesta);
  pies(doc, propuesta);

  return doc;
}

/* ------------------------------------------------------------------ *
 * Cabecera
 * ------------------------------------------------------------------ */

function cabecera(hoja: Hoja, propuesta: Propuesta): void {
  const { doc } = hoja;
  const izquierda = HOJA.margen;
  const derecha = HOJA.ancho - HOJA.margen;
  const arriba = HOJA.margen;

  // Papel blanco y el logo en su color: un documento que se imprime, se firma y
  // se archiva no lleva una banda de tinta negra a sangre. La marca la sostienen
  // el símbolo, el nombre y un único filete naranja.
  const altoLogo = 11;
  dibujarLogo(doc, izquierda, arriba, altoLogo, COLOR.naranja);

  const x = izquierda + anchoDeLogo(altoLogo) + 4;
  const nombre = EMPRESA.nombre.toUpperCase();
  escribir(doc, nombre, x, arriba + 6.6, {
    tamano: 15,
    color: COLOR.negro,
    negrita: true,
    entreLetras: 2,
  });
  const anchoNombre = anchoDe(doc, nombre, 15, true) + 2 * nombre.length;
  escribir(doc, '.', x + anchoNombre, arriba + 6.6, { tamano: 15, color: COLOR.naranja, negrita: true });
  escribir(doc, EMPRESA.tagline, x, arriba + 11.4, { tamano: 8, color: COLOR.tintaSuave });

  // El título del documento, a la derecha y sobrio: lo que es, no cómo suena.
  escribir(doc, 'COTIZACIÓN', derecha, arriba + 6.2, {
    tamano: 20,
    color: COLOR.negro,
    negrita: true,
    alineacion: 'right',
  });
  escribir(doc, propuesta.numero || 'Sin emitir', derecha, arriba + 12, {
    tamano: 10,
    color: COLOR.tintaSuave,
    alineacion: 'right',
  });

  // Un filete grueso y corto en naranja sobre el filete fino de todo el ancho.
  const yFilete = arriba + 17;
  regla(doc, izquierda, yFilete, ANCHO_UTIL, COLOR.borde, 0.3);
  regla(doc, izquierda, yFilete, 22, COLOR.naranja, 0.9);

  // Las tres fechas y el asesor en una franja: lo primero que se busca al
  // reabrir un documento archivado.
  const columnas = [
    { rotulo: 'Fecha de emisión', valor: fechaLarga(propuesta.fecha) },
    { rotulo: 'Válida hasta', valor: fechaLarga(sumarDias(propuesta.fecha, propuesta.condiciones.validezDias)) },
    { rotulo: 'Moneda', valor: `Dólares (${catalogo.moneda})` },
  ];
  const anchoColumna = ANCHO_UTIL / columnas.length;
  columnas.forEach((columna, i) => {
    const xc = izquierda + anchoColumna * i;
    escribir(doc, columna.rotulo.toUpperCase(), xc, yFilete + 6, {
      tamano: 6.5,
      color: COLOR.tintaTenue,
      negrita: true,
      entreLetras: 0.7,
    });
    escribir(doc, columna.valor, xc, yFilete + 11, {
      tamano: 9,
      color: COLOR.negro,
      negrita: true,
      ancho: anchoColumna - 4,
    });
  });
  regla(doc, izquierda, yFilete + 14, ANCHO_UTIL, COLOR.borde, 0.3);

  hoja.y = yFilete + 14;
}

/* ------------------------------------------------------------------ *
 * Las dos partes
 * ------------------------------------------------------------------ */

function panelCliente(hoja: Hoja, propuesta: Propuesta): void {
  const { doc } = hoja;
  const { cliente } = propuesta;
  const documento = cliente.documento?.trim();
  const mitad = hoja.ancho / 2;
  const arriba = hoja.y + 6.5;

  const bloque = (x: number, rotulo: string, titulo: string, lineas: string[]): number => {
    escribir(doc, rotulo, x, arriba, {
      tamano: 6.5,
      color: COLOR.tintaTenue,
      negrita: true,
      entreLetras: 0.7,
    });
    let y = escribir(doc, titulo, x, arriba + 6, {
      tamano: 11,
      color: COLOR.negro,
      negrita: true,
      ancho: mitad - 8,
    });
    for (const linea of lineas.filter(Boolean)) {
      y = escribir(doc, linea, x, y + 0.6, { tamano: 8.5, color: COLOR.tintaSuave, ancho: mitad - 8 });
    }
    return y;
  };

  const yCliente = bloque(hoja.x, 'PREPARADA PARA', cliente.negocio || '—', [
    cliente.contacto,
    documento ? `RUC / Cédula ${documento}` : '',
    [cliente.whatsapp, cliente.correo].filter(Boolean).join(' · '),
    cliente.ciudad || EMPRESA.mercado,
  ]);
  const yEmisor = bloque(hoja.x + mitad, 'PREPARADA POR', EMPRESA.nombre, [
    propuesta.asesor,
    `WhatsApp ${EMPRESA.whatsapp}`,
    EMPRESA.sitio.replace('https://', ''),
    EMPRESA.horario,
  ]);

  hoja.y = Math.max(yCliente, yEmisor) + 3;
  regla(doc, hoja.x, hoja.y, hoja.ancho, COLOR.borde, 0.3);
  hoja.avanzar(3);
}

/* ------------------------------------------------------------------ *
 * Las secciones, en el orden del procedimiento
 * ------------------------------------------------------------------ */

function queNecesitas(hoja: Hoja, propuesta: Propuesta): void {
  if (!propuesta.necesita.trim()) return;
  hoja.rotulo('Qué necesitas');
  hoja.parrafo(propuesta.necesita.trim(), { tamano: 10, color: COLOR.negro, interlineado: 1.45 });
  hoja.avanzar(2);
}

function queIncluye(hoja: Hoja, propuesta: Propuesta): void {
  const { doc } = hoja;
  hoja.rotulo('Qué incluye');

  // Cuatro columnas: lo que se compra, cuántas, a cuánto cada una y el importe.
  // La cabecera oscura es lo que convierte la lista en un documento que se
  // puede revisar renglón por renglón antes de firmar.
  const derecha = hoja.x + hoja.ancho;
  const xImporte = derecha;
  const xPrecio = derecha - 36;
  const xCantidad = derecha - 64;
  const anchoTexto = xCantidad - hoja.x - 14;

  const cabeceraTabla = (): void => {
    hoja.espacio(14);
    hoja.y += 1;
    const base = hoja.y + 5;
    // Sin espaciado entre letras en las columnas de la derecha: jsPDF cuenta el
    // espacio también tras la última letra y el texto se corre contra el borde.
    const estilo = { tamano: 6.5, color: COLOR.tintaSuave, negrita: true } as const;
    escribir(doc, 'DESCRIPCIÓN', hoja.x, base, { ...estilo, entreLetras: 0.8 });
    escribir(doc, 'CANT.', xCantidad, base, { ...estilo, alineacion: 'right' });
    escribir(doc, 'PRECIO', xPrecio, base, { ...estilo, alineacion: 'right' });
    escribir(doc, 'IMPORTE', xImporte, base, { ...estilo, alineacion: 'right' });
    hoja.y += 7.5;
    regla(doc, hoja.x, hoja.y - 1, hoja.ancho, COLOR.negro, 0.4);
  };
  cabeceraTabla();

  propuesta.lineas.forEach((linea) => {
    const item = itemDe(linea.itemId);
    // Una nota escrita en la propia línea manda; si no, la descripción del
    // producto, que también se puede editar (`item.<id>`).
    const descripcion = item && definicion(`item.${item.id}`) ? textoDe(`item.${item.id}`, propuesta.textos) : '';
    const nota = [linea.nota.trim(), descripcion].find(Boolean) ?? '';
    const titulo = linea.descripcion;

    const altoTitulo = altoDe(doc, titulo, { tamano: TIPO.tabla, negrita: true, ancho: anchoTexto });
    const altoNota = nota ? altoDe(doc, nota, { tamano: 8, ancho: anchoTexto }) : 0;
    const alto = Math.max(altoTitulo + altoNota + 6.5, 11.5);

    if (hoja.y + alto > hoja.fondo) {
      hoja.nuevaPagina();
      cabeceraTabla();
    }

    const yFila = hoja.y + 5.5;
    const y = escribir(doc, titulo, hoja.x, yFila, {
      tamano: TIPO.tabla,
      color: COLOR.negro,
      negrita: true,
      ancho: anchoTexto,
    });
    if (nota) {
      escribir(doc, nota, hoja.x, y + 0.4, { tamano: 8, color: COLOR.tintaSuave, ancho: anchoTexto });
    }

    const mensual = item?.recurrencia === 'mensual' && !linea.incluida;
    // Un precio por unidad solo dice algo cuando hay más de una unidad.
    escribir(doc, String(linea.cantidad), xCantidad, yFila, {
      tamano: TIPO.tabla,
      color: COLOR.tintaSuave,
      alineacion: 'right',
    });
    escribir(doc, linea.incluida ? '—' : formato(linea.precio), xPrecio, yFila, {
      tamano: TIPO.tabla,
      color: COLOR.tintaSuave,
      alineacion: 'right',
    });

    // Una línea incluida enseña «Incluido» en vez de $0: un cero se lee como un
    // error de cálculo, «Incluido» se lee como lo que es.
    escribir(doc, linea.incluida ? 'Incluido' : formato(importeDeLinea(linea)), xImporte, yFila, {
      tamano: TIPO.tabla,
      color: linea.incluida ? COLOR.tintaTenue : COLOR.negro,
      negrita: !linea.incluida,
      alineacion: 'right',
    });

    // El sufijo mensual va debajo del importe, no pegado a él: es lo que
    // distingue esta línea de las que se pagan una sola vez.
    if (mensual) {
      escribir(doc, 'cada mes', xImporte, yFila + 4, {
        tamano: 7,
        color: COLOR.naranja,
        alineacion: 'right',
        negrita: true,
      });
    }

    hoja.y += alto;
    regla(doc, hoja.x, hoja.y, hoja.ancho, COLOR.borde, 0.15);
  });

  hoja.avanzar(3);
}

function queNoIncluye(hoja: Hoja, propuesta: Propuesta): void {
  const lista = noIncluyeDe(propuesta.lineas, propuesta.condiciones.noIncluyeExtra, propuesta.textos);
  if (!lista.length) return;

  hoja.rotulo('Qué NO incluye');
  hoja.parrafo(
    textoDe('noIncluyeIntro', propuesta.textos),
    { tamano: 8.5, color: COLOR.tintaTenue },
  );
  for (const punto of lista) hoja.punto(punto);
  hoja.avanzar(2);
}

/* ------------------------------------------------------------------ *
 * Las cifras — dos totales que nunca se tocan
 * ------------------------------------------------------------------ */

function lasCifras(hoja: Hoja, propuesta: Propuesta, totales: ReturnType<typeof totalesDe>): void {
  const { doc } = hoja;
  const hayMensual = !esCero(totales.mensual);

  /**
   * Dos paneles separados por un hueco, y nunca uno con dos cifras dentro.
   *
   * La separación física ES el mensaje: son dos compromisos con dos
   * duraciones. Un solo panel con las dos cifras invita a leerlas como partes
   * de un mismo número, y ese número no existe. El ITBMS se calcula dentro de
   * cada panel, sobre su propio bloque, por la misma razón.
   */
  const hueco = 6;
  const ancho = hayMensual ? (hoja.ancho - hueco) / 2 : hoja.ancho;

  const unico = {
    x: hoja.x,
    ancho,
    rotulo: 'Pago único',
    base: totales.unico,
    cifra: formato(totales.unico),
    pie: cobroDe(propuesta),
  };
  const mensual = {
    x: hoja.x + ancho + hueco,
    ancho,
    rotulo: 'Cada mes',
    base: totales.mensual,
    cifra: formatoMensual(totales.mensual),
    pie: 'Opcional y sin permanencia. Se cancela cuando quieras.',
  };

  // Los dos paneles miden lo mismo: el más alto manda, y así ningún pie se sale.
  const bloques = hayMensual ? [unico, mensual] : [unico];
  const alto = Math.max(...bloques.map((b) => altoDeBloque(doc, b)));

  hoja.espacio(alto + 3);
  hoja.avanzar(2);
  for (const bloque of bloques) bloqueCifra(hoja, { ...bloque, alto });
  hoja.avanzar(alto + 6);

  if (totales.terceros.length) {
    hoja.rotulo('A terceros');
    hoja.parrafo(textoDe('aTerceros', propuesta.textos), { tamano: 8.5 });
    for (const costo of totales.terceros) {
      hoja.punto(`${costo.concepto}: ${costo.precioTexto} a ${costo.aQuien}`);
    }
    hoja.avanzar(3);
  }
}

interface BloqueCifra {
  x: number;
  ancho: number;
  rotulo: string;
  base: Dinero;
  cifra: string;
  pie: string;
}

/** Lo que ocupa todo lo que va encima del pie: rótulo, dos renglones y el total. */
const ALTO_CUERPO = 38;

/** Lo que mide una tarjeta: el cuerpo y el pie, completo. */
function altoDeBloque(doc: jsPDF, bloque: BloqueCifra): number {
  const alto = altoDe(doc, bloque.pie, { tamano: 7.5, ancho: bloque.ancho - 14 });
  return ALTO_CUERPO + alto + 4;
}

/**
 * Una tarjeta clara con tres renglones: lo publicado, el impuesto y lo que de
 * verdad se paga. Cada total lleva el mismo sufijo que su cifra, para que el
 * mensual no se lea como un pago único.
 */
function bloqueCifra(hoja: Hoja, bloque: BloqueCifra & { alto: number }): void {
  const { doc } = hoja;
  const { impuesto, total } = conImpuesto(bloque.base, ITBMS.tasa);
  const sufijo = bloque.rotulo === 'Cada mes' ? '/mes' : '';
  const izquierda = bloque.x + 7;
  const derecha = bloque.x + bloque.ancho - 7;
  const y = hoja.y;

  panel(doc, { x: bloque.x, y, ancho: bloque.ancho, alto: bloque.alto }, { fondo: COLOR.papelTenue, borde: COLOR.borde, radio: 1.5 });
  // El único toque de color: un filete corto en lo alto de la tarjeta.
  regla(doc, izquierda, y, 12, COLOR.naranja, 1);

  escribir(doc, bloque.rotulo.toUpperCase(), izquierda, y + 8, {
    tamano: 7,
    color: COLOR.tintaSuave,
    negrita: true,
    entreLetras: 0.8,
  });

  const renglon = (rotulo: string, valor: string, yy: number): void => {
    escribir(doc, rotulo, izquierda, yy, { tamano: 9, color: COLOR.tintaSuave });
    escribir(doc, valor, derecha, yy, { tamano: 9, color: COLOR.negro, alineacion: 'right' });
  };
  renglon('Subtotal', bloque.cifra, y + 16);
  renglon(ITBMS.texto, `+ ${formatoExacto(impuesto)}${sufijo}`, y + 22);

  regla(doc, izquierda, y + 25, bloque.ancho - 14, COLOR.negro, 0.35);
  escribir(doc, 'Total con ITBMS', izquierda, y + 32, { tamano: 9.5, color: COLOR.negro, negrita: true });

  // La cifra se encoge sola si el rango es largo: '$235.40–$395.90/mes' no cabe
  // al mismo cuerpo que '$909.50', y dejarlo desbordar rompería la tarjeta.
  const cifraTotal = `${formatoExacto(total)}${sufijo}`;
  const reservado = anchoDe(doc, 'Total con ITBMS', 9.5, true) + 6;
  let tamano = 15;
  while (anchoDe(doc, cifraTotal, tamano, true) > bloque.ancho - 14 - reservado && tamano > 8) tamano -= 1;
  escribir(doc, cifraTotal, derecha, y + 32.5, {
    tamano,
    color: COLOR.negro,
    negrita: true,
    alineacion: 'right',
  });

  escribir(doc, bloque.pie, izquierda, y + ALTO_CUERPO - 1, {
    tamano: 7.5,
    color: COLOR.tintaSuave,
    ancho: bloque.ancho - 14,
  });
}

/**
 * Cómo pagar. Solo sale si el dueño cargó cuentas reales en `datos/marca.json`:
 * una cotización que dice «paga a este número» con un número inventado es peor
 * que una que no lo dice.
 */
function comoPagar(hoja: Hoja, formas: readonly FormaDePago[]): void {
  if (!formas.length) return;
  const { doc } = hoja;

  hoja.rotulo('Cómo pagar');
  const xDato = hoja.x + 70;
  for (const forma of formas) {
    hoja.espacio(9);
    hoja.y += 5;
    escribir(doc, forma.metodo, hoja.x, hoja.y, { tamano: 9, color: COLOR.negro, negrita: true });
    escribir(doc, forma.dato, xDato, hoja.y, { tamano: 9, color: COLOR.negro });
    if (forma.titular) {
      escribir(doc, forma.titular, hoja.x + 28, hoja.y, { tamano: 8.5, color: COLOR.tintaSuave, ancho: 38 });
    }
    regla(doc, hoja.x, hoja.y + 2.6, hoja.ancho, COLOR.borde, 0.2);
    hoja.y += 2.6;
  }
  hoja.avanzar(5);
}

/** Cómo se cobra el pago único, según lo que lleve la propuesta. */
function cobroDe(propuesta: Propuesta): string {
  const unicos = propuesta.lineas
    .map((l) => itemDe(l.itemId))
    .filter((i) => i && i.recurrencia === 'unico');
  const cobros = [...new Set(unicos.map((i) => i!.cobro))];
  return cobros.length === 1 ? cobros[0]! : cobros.join(' · ');
}

/* ------------------------------------------------------------------ *
 * Plazo y cambios
 * ------------------------------------------------------------------ */

function plazoYCambios(hoja: Hoja, propuesta: Propuesta): void {
  const plazos = plazosDe(propuesta.lineas, propuesta.textos);

  if (plazos.length) {
    hoja.rotulo('Plazo');
    for (const plazo of plazos) hoja.punto(plazo.linea);
    // Va donde se anuncia el plazo, no en una nota al pie: la causa número uno
    // de retraso, con diferencia, es esperar los textos del cliente.
    hoja.parrafo(textoDe('plazoDesde', propuesta.textos), { tamano: 9, color: COLOR.negro, negrita: true });
    hoja.avanzar(3);
  }

  const rondas = rondasDe(propuesta.lineas);
  if (rondas) {
    hoja.rotulo('Cambios');
    hoja.parrafo(
      textoDe(rondas.incluidas === 0 ? 'cambiosSinRondas' : 'cambiosConRondas', propuesta.textos, {
        plan: rondas.plan,
        rondas: rondas.incluidas,
        rondasPalabra: rondas.incluidas === 1 ? 'ronda' : 'rondas',
        extra: rondas.extra,
      }),
      { tamano: 9, color: COLOR.negro },
    );
    hoja.avanzar(3);
  }
}

/* ------------------------------------------------------------------ *
 * Fronteras y condiciones
 * ------------------------------------------------------------------ */

function lasFronteras(hoja: Hoja, propuesta: Propuesta): void {
  const frases = fronterasDe(propuesta.lineas, propuesta.textos);
  if (!frases.length) return;

  hoja.rotulo('Qué es cada cosa');
  for (const frase of frases) hoja.punto(frase);
  hoja.avanzar(3);
}

function condiciones(hoja: Hoja, propuesta: Propuesta): void {
  hoja.rotulo('Condiciones');
  const t = (clave: string) => textoDe(clave, propuesta.textos, { itbms: ITBMS.texto });
  hoja.punto(t('condArranque'));
  hoja.punto(t('condCodigo'));
  hoja.punto(t('condCancelacion'));
  if (propuesta.lineas.some((l) => itemDe(l.itemId)?.recurrencia === 'mensual')) {
    hoja.punto(t('condCancelacionMensual'));
  }
  hoja.punto(t('condRemoto'));
  hoja.punto(t('condItbms'));

  if (propuesta.condiciones.observaciones.trim()) {
    hoja.avanzar(2);
    hoja.rotulo('Notas');
    hoja.parrafo(propuesta.condiciones.observaciones.trim(), { tamano: 9, color: COLOR.negro });
  }
}

/* ------------------------------------------------------------------ *
 * Aceptación
 * ------------------------------------------------------------------ */

/**
 * El cierre: un espacio para firmar. Una propuesta que se acepta con un
 * «dale» por WhatsApp y se discute meses después necesita una línea con fecha
 * y nombre; este bloque la pone sin añadir una sola promesa.
 */
function aceptacion(hoja: Hoja, propuesta: Propuesta): void {
  const { doc } = hoja;
  hoja.avanzar(4);
  hoja.espacio(48);
  hoja.rotulo('Aceptación');
  hoja.parrafo(textoDe('aceptacion', propuesta.textos), {
    tamano: 9,
    color: COLOR.negro,
  });
  hoja.avanzar(12);

  const anchoFecha = 50;
  const anchoFirma = hoja.ancho - anchoFecha - 12;
  const campos = [
    { rotulo: 'Nombre y firma', x: hoja.x, ancho: anchoFirma },
    { rotulo: 'Fecha', x: hoja.x + anchoFirma + 12, ancho: anchoFecha },
  ];
  for (const campo of campos) {
    regla(doc, campo.x, hoja.y, campo.ancho, COLOR.negro, 0.3);
    escribir(doc, campo.rotulo.toUpperCase(), campo.x, hoja.y + 4, {
      tamano: 6.5,
      color: COLOR.tintaTenue,
      negrita: true,
      entreLetras: 0.7,
    });
  }
  hoja.avanzar(8);
}

/* ------------------------------------------------------------------ *
 * Pie, en todas las páginas
 * ------------------------------------------------------------------ */

function pies(doc: jsPDF, propuesta: Propuesta): void {
  const paginas = doc.getNumberOfPages();

  for (let pagina = 1; pagina <= paginas; pagina += 1) {
    doc.setPage(pagina);
    const y = HOJA.alto - 12;

    regla(doc, HOJA.margen, y - 5, ANCHO_UTIL, COLOR.borde, 0.3);

    doc.setFont(FUENTE, 'normal');
    doc.setFontSize(TIPO.pie);
    tinta(doc, COLOR.tintaTenue);
    doc.text(
      `${EMPRESA.nombre} · ${EMPRESA.sitio.replace('https://', '')} · WhatsApp ${EMPRESA.whatsapp} · ${EMPRESA.horario}`,
      HOJA.margen,
      y,
    );
    doc.text(
      `${propuesta.numero || 'Sin emitir'} · Página ${pagina}/${paginas}`,
      HOJA.ancho - HOJA.margen,
      y,
      { align: 'right' },
    );
  }
}

/** El nombre con el que se descarga. */
export function nombreDeArchivo(propuesta: Propuesta): string {
  const negocio = propuesta.cliente.negocio
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const base = `Propuesta-${propuesta.numero || propuesta.fecha}`;
  return `${[base, negocio].filter(Boolean).join('-')}.pdf`;
}
