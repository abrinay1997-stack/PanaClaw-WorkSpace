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

import { EMPRESA } from '../datos/empresa';
import {
  CANCELACION,
  CANCELACION_MENSUAL,
  CODIGO_TUYO,
  PLAZO_DESDE,
  QUE_NECESITAS_PARA_ARRANCAR,
  TRABAJO_REMOTO,
} from '../datos/textos';
import { catalogo, ITBMS, itemDe } from '../dominio/catalogo';
import { conImpuesto, esCero, formato, formatoExacto, formatoMensual, type Dinero } from '../dominio/dinero';
import { fechaLarga, MONEDA_DECLARADA, sumarDias } from '../dominio/formato';
import {
  fronterasDe,
  importeDeLinea,
  noIncluyeDe,
  plazosDe,
  rondasDe,
  totalesDe,
} from '../dominio/propuesta';
import type { Propuesta } from '../dominio/tipos';
import { altoDe, anchoDe, escribir, Hoja, panel, regla, relleno, tinta } from './documento';
import { anchoDeLogo, dibujarLogo } from './logo';
import { ANCHO_UTIL, COLOR, FUENTE, HOJA, TIPO } from './marca';

export function generarPdf(propuesta: Propuesta): jsPDF {
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
  plazoYCambios(hoja, propuesta);
  lasFronteras(hoja, propuesta);
  condiciones(hoja, propuesta);
  aceptacion(hoja);
  pies(doc, propuesta);

  return doc;
}

/* ------------------------------------------------------------------ *
 * Cabecera
 * ------------------------------------------------------------------ */

function cabecera(hoja: Hoja, propuesta: Propuesta): void {
  const { doc } = hoja;

  // La banda va a sangre: el negro de la marca es fondo maestro, y dejarle
  // márgenes blancos alrededor lo convertiría en una caja.
  relleno(doc, COLOR.negro);
  doc.rect(0, 0, HOJA.ancho, HOJA.cabecera, 'F');

  const altoLogo = 9;
  dibujarLogo(doc, HOJA.margen, 9.5, altoLogo, COLOR.naranja);

  // PANACLAW en versalitas muy espaciadas seguido de un punto naranja, tal
  // como lo declara `datos/marca.json` → `logo.wordmark`.
  const x = HOJA.margen + anchoDeLogo(altoLogo) + 5;
  escribir(doc, EMPRESA.nombre.toUpperCase(), x, 17, {
    tamano: TIPO.wordmark,
    color: COLOR.blancoCalido,
    negrita: true,
    entreLetras: 2.4,
  });
  const anchoWordmark = anchoDe(doc, EMPRESA.nombre.toUpperCase(), TIPO.wordmark, true) + 2.4 * EMPRESA.nombre.length;
  escribir(doc, '.', x + anchoWordmark, 17, {
    tamano: TIPO.wordmark,
    color: COLOR.naranja,
    negrita: true,
  });

  escribir(doc, EMPRESA.tagline, x, 22.5, { tamano: 8.5, color: COLOR.grisMarca });

  // Número y fecha, a la derecha y en la misma banda: es lo primero que se
  // busca al reabrir un documento archivado.
  const derecha = HOJA.ancho - HOJA.margen;
  escribir(doc, 'PROPUESTA', derecha, 12, {
    tamano: 7,
    color: COLOR.grisMarca,
    negrita: true,
    alineacion: 'right',
    entreLetras: 1,
  });
  escribir(doc, propuesta.numero || 'Sin emitir', derecha, 18, {
    tamano: 12,
    color: COLOR.blancoCalido,
    negrita: true,
    alineacion: 'right',
  });
  escribir(doc, fechaLarga(propuesta.fecha), derecha, 22.5, {
    tamano: 8.5,
    color: COLOR.grisMarca,
    alineacion: 'right',
  });

  hoja.y = HOJA.cabecera + 7;
}

/* ------------------------------------------------------------------ *
 * A quién va
 * ------------------------------------------------------------------ */

function panelCliente(hoja: Hoja, propuesta: Propuesta): void {
  const { doc } = hoja;
  const { cliente } = propuesta;
  const documento = cliente.documento?.trim();
  const alto = documento ? 22 : 18;

  panel(doc, { x: hoja.x, y: hoja.y, ancho: hoja.ancho, alto }, { fondo: COLOR.papelTenue });

  const columnas = [
    { rotulo: 'Para', valor: cliente.negocio || '—', detalle: documento ? `RUC / Cédula ${documento}` : '' },
    { rotulo: 'Contacto', valor: [cliente.contacto, cliente.whatsapp].filter(Boolean).join(' · ') || '—' },
    { rotulo: 'Ciudad', valor: cliente.ciudad || EMPRESA.mercado },
    { rotulo: 'Válida hasta', valor: fechaLarga(sumarDias(propuesta.fecha, propuesta.condiciones.validezDias)) },
  ];

  const anchoColumna = (hoja.ancho - 12) / columnas.length;
  columnas.forEach((columna, i) => {
    const x = hoja.x + 6 + anchoColumna * i;
    escribir(doc, columna.rotulo.toUpperCase(), x, hoja.y + 7, {
      tamano: 6.5,
      color: COLOR.tintaTenue,
      negrita: true,
      entreLetras: 0.7,
    });
    escribir(doc, columna.valor, x, hoja.y + 11.8, {
      tamano: 9,
      color: COLOR.negro,
      negrita: true,
      ancho: anchoColumna - 4,
    });
    if (columna.detalle) {
      escribir(doc, columna.detalle, x, hoja.y + 17, { tamano: 7.5, color: COLOR.tintaSuave, ancho: anchoColumna - 4 });
    }
  });

  hoja.avanzar(alto + 3);
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
  const xImporte = derecha - 3;
  const xPrecio = derecha - 38;
  const xCantidad = derecha - 66;
  const anchoTexto = xCantidad - hoja.x - 14;

  const cabeceraTabla = (): void => {
    hoja.espacio(14);
    hoja.y += 1.5;
    panel(doc, { x: hoja.x, y: hoja.y, ancho: hoja.ancho, alto: 7 }, { fondo: COLOR.negro, radio: 1.2 });
    const base = hoja.y + 4.7;
    // Sin espaciado entre letras en las columnas de la derecha: jsPDF cuenta el
    // espacio también tras la última letra y el texto se corre contra el borde.
    const estilo = { tamano: 6.5, color: COLOR.blancoCalido, negrita: true } as const;
    escribir(doc, 'DESCRIPCIÓN', hoja.x + 3, base, { ...estilo, entreLetras: 0.8 });
    escribir(doc, 'CANT.', xCantidad, base, { ...estilo, alineacion: 'right' });
    escribir(doc, 'PRECIO', xPrecio, base, { ...estilo, alineacion: 'right' });
    escribir(doc, 'IMPORTE', xImporte, base, { ...estilo, alineacion: 'right' });
    hoja.y += 7;
  };
  cabeceraTabla();

  propuesta.lineas.forEach((linea, i) => {
    const item = itemDe(linea.itemId);
    const nota = [linea.nota.trim(), item?.queConsigue].find(Boolean) ?? '';
    const titulo = linea.descripcion;

    const altoTitulo = altoDe(doc, titulo, { tamano: TIPO.tabla, negrita: true, ancho: anchoTexto });
    const altoNota = nota ? altoDe(doc, nota, { tamano: 8, ancho: anchoTexto }) : 0;
    const alto = Math.max(altoTitulo + altoNota + 5.5, 11);

    if (hoja.y + alto > hoja.fondo) {
      hoja.nuevaPagina();
      cabeceraTabla();
    }

    // Renglones alternos: en una tabla de doce filas, lo único que impide
    // saltar de línea al leer un importe es un fondo que cambie.
    if (i % 2 === 1) {
      relleno(doc, COLOR.papelTenue);
      doc.rect(hoja.x, hoja.y, hoja.ancho, alto, 'F');
    }

    const yFila = hoja.y + 5;
    const y = escribir(doc, titulo, hoja.x + 3, yFila, {
      tamano: TIPO.tabla,
      color: COLOR.negro,
      negrita: true,
      ancho: anchoTexto,
    });
    if (nota) {
      escribir(doc, nota, hoja.x + 3, y + 0.2, { tamano: 8, color: COLOR.tintaSuave, ancho: anchoTexto });
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
  const lista = noIncluyeDe(propuesta.lineas, propuesta.condiciones.noIncluyeExtra);
  if (!lista.length) return;

  hoja.rotulo('Qué NO incluye');
  hoja.parrafo(
    'Si algo de esto te hace falta, lo cotizamos aparte y lo sabes antes de firmar.',
    { tamano: 8.5, color: COLOR.tintaTenue },
  );
  for (const punto of lista) hoja.punto(punto);
  hoja.avanzar(4);
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

  hoja.espacio(alto + 16);
  hoja.avanzar(4);
  for (const bloque of bloques) bloqueCifra(hoja, { ...bloque, alto });
  hoja.avanzar(alto + 6);

  if (totales.terceros.length) {
    hoja.rotulo('A terceros');
    hoja.parrafo(
      'Esto no lo cobra PanaClaw. Son las cuentas donde vive tu eBot y las pagas tú, directamente a quien presta el servicio. Se publican aquí porque callarlas sería exactamente la letra chica que no tenemos.',
      { tamano: 8.5 },
    );
    for (const costo of totales.terceros) {
      hoja.punto(`${costo.concepto}: ${costo.precioTexto} a ${costo.aQuien}`);
    }
    hoja.avanzar(3);
  }

  escribir(doc, `${MONEDA_DECLARADA} Los precios no incluyen ${ITBMS.texto}, que se suma aparte.`, hoja.x, hoja.y + 3, {
    tamano: 7.5,
    color: COLOR.tintaTenue,
  });
  hoja.avanzar(6);
}

interface BloqueCifra {
  x: number;
  ancho: number;
  rotulo: string;
  base: Dinero;
  cifra: string;
  pie: string;
}

const ALTO_CIFRA = 28;
const ALTO_DESGLOSE = 15;

/** Lo que mide un panel: la cifra, el desglose del impuesto y el pie, completo. */
function altoDeBloque(doc: jsPDF, bloque: BloqueCifra): number {
  const alto = altoDe(doc, bloque.pie, { tamano: 7.5, ancho: bloque.ancho - 12 });
  return ALTO_CIFRA + ALTO_DESGLOSE + alto + 4;
}

function bloqueCifra(hoja: Hoja, bloque: BloqueCifra & { alto: number }): void {
  const { doc } = hoja;
  const { impuesto, total } = conImpuesto(bloque.base, ITBMS.tasa);
  panel(doc, { x: bloque.x, y: hoja.y, ancho: bloque.ancho, alto: bloque.alto }, { fondo: COLOR.negro });

  escribir(doc, bloque.rotulo.toUpperCase(), bloque.x + 6, hoja.y + 8, {
    tamano: 7,
    color: COLOR.grisMarca,
    negrita: true,
    entreLetras: 1.1,
  });

  // La cifra se encoge sola si el rango es largo: '$1,455–$1,530/mes' no cabe
  // al mismo cuerpo que '$295', y dejarlo desbordar rompería el panel.
  let tamano = 21;
  while (anchoDe(doc, bloque.cifra, tamano, true) > bloque.ancho - 12 && tamano > 11) tamano -= 1;
  escribir(doc, bloque.cifra, bloque.x + 6, hoja.y + 19.5, {
    tamano,
    color: COLOR.naranja,
    negrita: true,
  });

  // Desglose: lo publicado, lo que se suma aparte y lo que de verdad se paga.
  // Cada total lleva el mismo sufijo que su cifra, para que el mensual no se
  // lea como un pago único.
  const sufijo = bloque.rotulo === 'Cada mes' ? '/mes' : '';
  const derecha = bloque.x + bloque.ancho - 6;
  const yDesglose = hoja.y + ALTO_CIFRA - 3;
  regla(doc, bloque.x + 6, yDesglose - 3.2, bloque.ancho - 12, [70, 62, 62], 0.2);
  escribir(doc, ITBMS.texto, bloque.x + 6, yDesglose + 1.2, { tamano: 8, color: COLOR.grisMarca });
  escribir(doc, `+ ${formatoExacto(impuesto)}${sufijo}`, derecha, yDesglose + 1.2, {
    tamano: 8,
    color: COLOR.blancoCalido,
    alineacion: 'right',
  });
  escribir(doc, 'Total con ITBMS', bloque.x + 6, yDesglose + 7, { tamano: 8.5, color: COLOR.blancoCalido, negrita: true });
  escribir(doc, `${formatoExacto(total)}${sufijo}`, derecha, yDesglose + 7, {
    tamano: 8.5,
    color: COLOR.blancoCalido,
    negrita: true,
    alineacion: 'right',
  });

  escribir(doc, bloque.pie, bloque.x + 6, hoja.y + ALTO_CIFRA + ALTO_DESGLOSE - 1.5, {
    tamano: 7.5,
    color: COLOR.grisMarca,
    ancho: bloque.ancho - 12,
  });
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
  const plazos = plazosDe(propuesta.lineas);

  if (plazos.length) {
    hoja.rotulo('Plazo');
    for (const plazo of plazos) hoja.punto(`${plazo.que}: ${plazo.cuando}`);
    // Va donde se anuncia el plazo, no en una nota al pie: la causa número uno
    // de retraso, con diferencia, es esperar los textos del cliente.
    hoja.parrafo(PLAZO_DESDE, { tamano: 9, color: COLOR.negro, negrita: true });
    hoja.avanzar(3);
  }

  const rondas = rondasDe(propuesta.lineas);
  if (rondas) {
    hoja.rotulo('Cambios');
    hoja.parrafo(
      rondas.incluidas === 0
        ? `${rondas.plan} no trae rondas de cambios. Cada ronda extra cuesta ${rondas.extra}, sin discusión y sin mala cara.`
        : `${rondas.plan} incluye ${rondas.incluidas} ${rondas.incluidas === 1 ? 'ronda' : 'rondas'} de cambios. La ronda extra cuesta ${rondas.extra}, sin discusión y sin mala cara.`,
      { tamano: 9, color: COLOR.negro },
    );
    hoja.avanzar(3);
  }
}

/* ------------------------------------------------------------------ *
 * Fronteras y condiciones
 * ------------------------------------------------------------------ */

function lasFronteras(hoja: Hoja, propuesta: Propuesta): void {
  const frases = fronterasDe(propuesta.lineas);
  if (!frases.length) return;

  hoja.rotulo('Qué es cada cosa');
  for (const frase of frases) hoja.punto(frase);
  hoja.avanzar(3);
}

function condiciones(hoja: Hoja, propuesta: Propuesta): void {
  hoja.rotulo('Condiciones');
  hoja.punto(QUE_NECESITAS_PARA_ARRANCAR);
  hoja.punto(CODIGO_TUYO);
  hoja.punto(CANCELACION);
  if (propuesta.lineas.some((l) => itemDe(l.itemId)?.recurrencia === 'mensual')) {
    hoja.punto(CANCELACION_MENSUAL);
  }
  hoja.punto(TRABAJO_REMOTO);
  hoja.punto(`Ningún precio de esta propuesta incluye el ${ITBMS.texto}: se suma aparte, sobre el pago único y sobre lo mensual por separado.`);

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
function aceptacion(hoja: Hoja): void {
  const { doc } = hoja;
  hoja.avanzar(4);
  hoja.espacio(48);
  hoja.rotulo('Aceptación');
  hoja.parrafo('Firmar aquí es aceptar esta propuesta con lo que incluye y con lo que no incluye.', {
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

    regla(doc, HOJA.margen, y - 5, ANCHO_UTIL, COLOR.borde, 0.25);

    doc.setFont(FUENTE, 'normal');
    doc.setFontSize(TIPO.pie);
    tinta(doc, COLOR.tintaTenue);
    doc.text(
      `${EMPRESA.nombre} · ${EMPRESA.sitio.replace('https://', '')} · WhatsApp ${EMPRESA.whatsapp} · ${EMPRESA.horario}`,
      HOJA.margen,
      y,
    );
    doc.text(
      `${propuesta.numero || 'Sin emitir'} · ${pagina}/${paginas}`,
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
