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
import { catalogo, itemDe } from '../dominio/catalogo';
import { esCero, formato, formatoMensual } from '../dominio/dinero';
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
  const alto = 18;

  panel(doc, { x: hoja.x, y: hoja.y, ancho: hoja.ancho, alto }, { fondo: COLOR.papelTenue });

  const columnas = [
    { rotulo: 'Para', valor: cliente.negocio || '—' },
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

  const anchoImporte = 34;
  const anchoTexto = hoja.ancho - anchoImporte - 6;

  for (const linea of propuesta.lineas) {
    const item = itemDe(linea.itemId);
    const nota = [linea.nota.trim(), item?.queConsigue].find(Boolean) ?? '';
    const titulo = linea.cantidad > 1 ? `${linea.descripcion} × ${linea.cantidad}` : linea.descripcion;

    const altoTitulo = altoDe(doc, titulo, { tamano: TIPO.tabla, negrita: true, ancho: anchoTexto });
    const altoNota = nota ? altoDe(doc, nota, { tamano: 8, ancho: anchoTexto }) : 0;
    hoja.espacio(altoTitulo + altoNota + 6);

    hoja.y += 4.5;
    const yFila = hoja.y;

    let y = escribir(doc, titulo, hoja.x, yFila, {
      tamano: TIPO.tabla,
      color: COLOR.negro,
      negrita: true,
      ancho: anchoTexto,
    });
    if (nota) {
      y = escribir(doc, nota, hoja.x, y + 0.4, { tamano: 8, color: COLOR.tintaSuave, ancho: anchoTexto });
    }

    // El importe, alineado a la derecha y a la altura del título. Una línea
    // incluida enseña «Incluido» en vez de $0: un cero se lee como un error de
    // cálculo, «Incluido» se lee como lo que es.
    const importe = linea.incluida ? 'Incluido' : formato(importeDeLinea(linea));
    escribir(doc, importe, hoja.x + hoja.ancho, yFila, {
      tamano: TIPO.tabla,
      color: linea.incluida ? COLOR.tintaTenue : COLOR.negro,
      negrita: !linea.incluida,
      alineacion: 'right',
    });

    // El sufijo mensual va debajo del importe, no pegado a él: es lo que
    // distingue esta línea de las que se pagan una sola vez.
    if (item?.recurrencia === 'mensual' && !linea.incluida) {
      escribir(doc, 'cada mes', hoja.x + hoja.ancho, yFila + 4, {
        tamano: 7,
        color: COLOR.naranja,
        alineacion: 'right',
        negrita: true,
      });
    }

    hoja.y = Math.max(y, yFila + 6);
    regla(doc, hoja.x, hoja.y + 1, hoja.ancho, COLOR.borde, 0.15);
  }

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
  const alto = 28;

  hoja.espacio(alto + 16);
  hoja.avanzar(4);

  /**
   * Dos paneles separados por un hueco, y nunca uno con dos cifras dentro.
   *
   * La separación física ES el mensaje: son dos compromisos con dos
   * duraciones. Un solo panel con las dos cifras invita a leerlas como partes
   * de un mismo número, y ese número no existe.
   */
  const hueco = 6;
  const ancho = hayMensual ? (hoja.ancho - hueco) / 2 : hoja.ancho;

  bloqueCifra(hoja, {
    x: hoja.x,
    ancho,
    alto,
    rotulo: 'Pago único',
    cifra: formato(totales.unico),
    pie: cobroDe(propuesta),
  });

  if (hayMensual) {
    bloqueCifra(hoja, {
      x: hoja.x + ancho + hueco,
      ancho,
      alto,
      rotulo: 'Cada mes',
      cifra: formatoMensual(totales.mensual),
      pie: 'Opcional y sin permanencia. Se cancela cuando quieras.',
    });
  }

  hoja.avanzar(alto + 2);

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

  escribir(doc, MONEDA_DECLARADA, hoja.x, hoja.y + 3, { tamano: 7.5, color: COLOR.tintaTenue });
  hoja.avanzar(6);
}

function bloqueCifra(
  hoja: Hoja,
  bloque: { x: number; ancho: number; alto: number; rotulo: string; cifra: string; pie: string },
): void {
  const { doc } = hoja;
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

  escribir(doc, bloque.pie, bloque.x + 6, hoja.y + 25.5, {
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

  if (propuesta.condiciones.observaciones.trim()) {
    hoja.avanzar(2);
    hoja.rotulo('Notas');
    hoja.parrafo(propuesta.condiciones.observaciones.trim(), { tamano: 9, color: COLOR.negro });
  }
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
