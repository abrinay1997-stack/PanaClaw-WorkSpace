#!/usr/bin/env node
/**
 * verificar-lote.mjs — comprueba un prompt maestro contra la ficha de la marca,
 * antes de entregárselo a nadie.
 *
 *   node verificar-lote.mjs prompt.txt --marca ficha.json
 *   node verificar-lote.mjs prompt.txt --marca ficha.json --adn ./adn --indice ./publicado.md
 *
 * Comprueba lo que se puede comprobar a máquina, y lo hace contra la ficha, no
 * contra reglas fijas. Lo que no puede: si un titular es una adivinanza, si el
 * acento cae en la afirmación, y si el lote le habla a un solo público.
 *
 * Sale con código 1 si hay errores, 0 si solo hay avisos.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const args = process.argv.slice(2);
const archivo = args.find((a) => !a.startsWith('--'));
const opt = (n) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : null; };

if (!archivo || !existsSync(archivo)) {
  console.error('Uso: node verificar-lote.mjs <prompt.txt> --marca <ficha.json> [--adn <dir>] [--indice <archivo>]');
  process.exit(1);
}
const rutaMarca = opt('marca');
const marca = rutaMarca && existsSync(rutaMarca) ? JSON.parse(readFileSync(rutaMarca, 'utf8')) : {};
const L = readFileSync(archivo, 'utf8').split('\n');
const T = L.join('\n');

const errores = [], avisos = [];
const error = (m) => errores.push(m);
const aviso = (m) => avisos.push(m);

/* ─── la ficha ────────────────────────────────────────────────────────── */
const inter = marca.interlinea || {};
const SUP = Object.entries(inter.holguraSuperior || {}).sort((a, b) => b[1] - a[1]);
const INF = Object.entries(inter.holguraInferior || {}).sort((a, b) => b[1] - a[1]);
const hs = (s) => (SUP.find(([cs]) => [...cs.replace(/\s/g, '')].some((c) => s.includes(c))) || [, 0])[1];
const hi = (s) => (INF.find(([cs]) => [...cs.replace(/\s/g, '')].some((c) => s.includes(c))) || [, 0])[1];

// rango de caracteres por línea, por tamaño en px
const rangos = {};
for (const [rol, def] of Object.entries(marca.escala?.roles || {})) {
  if (def?.size && def?.caracteresPorLinea) {
    const tope = parseInt(String(def.caracteresPorLinea).split(/[–-]/).pop(), 10);
    if (tope) rangos[def.size] = { tope, rol };
  }
}

const importes = new Set(marca.cifras?.importesPermitidos || []);
const topes = marca.voz?.topeDescripcion || {};
const topeHashtags = marca.voz?.topeHashtags ?? null;
const topeAcento = /mitad/i.test(marca.acento?.topeDeCaracteres || '') ? 50 : null;

/* ─── 1 · titulares ───────────────────────────────────────────────────── */
const NUM = { dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8 };
let nTit = 0, conVariasHolguras = 0;

for (let i = 0; i < L.length; i++) {
  const m = L[i].match(/^TITULAR,\s+(\w+)\s+líneas?,\s+(.+?)\s+(\d+):/);
  if (!m) continue;
  nTit++;
  const etq = `titular ${nTit} (línea ${i + 1})`;
  const px = parseInt(m[3], 10);
  const lineas = [];
  let j = i + 1;
  while (j < L.length && L[j].startsWith('  ') && L[j].trim()) { lineas.push(L[j].trim()); j++; }

  if (NUM[m[1]] && lineas.length !== NUM[m[1]]) {
    error(`${etq}: dice «${m[1]} líneas» pero tiene ${lineas.length}`);
  }
  if (rangos[px] && lineas.length) {
    const larga = lineas.reduce((a, b) => (a.length >= b.length ? a : b));
    if (larga.length > rangos[px].tope) {
      error(`${etq}: «${larga}» son ${larga.length} caracteres, y ${rangos[px].rol} tope en ${rangos[px].tope}. Baja un escalón de tamaño o vuelve a cortar`);
    }
  }

  // tramo de acento
  let k = j;
  while (k < L.length && !/^TRAMO\s+(NARANJA|ACENTO|DE ACENTO)/i.test(L[k]) && !/^AVANCES/.test(L[k])) k++;
  const mt = L[k]?.match(/[«"](.+?)[»"]/);
  if (!mt) {
    aviso(`${etq}: no encuentro el tramo de acento`);
  } else {
    const tramo = mt[1], plano = lineas.join(' ');
    if (!plano.includes(tramo)) {
      error(`${etq}: el tramo «${tramo}» no aparece contiguo en el titular. Un tramo partido en dos ya no es un acento`);
    }
    const total = lineas.reduce((s, x) => s + x.length, 0);
    if (topeAcento && total && (100 * tramo.length) / total > topeAcento) {
      error(`${etq}: el acento ocupa el ${Math.round((100 * tramo.length) / total)} % y el tope es ${topeAcento} %`);
    }
  }

  // tabla de avances
  while (k < L.length && !/^AVANCES ENTRE LÍNEAS/.test(L[k])) k++;
  const mb = L[k]?.match(/base\s+([\d.]+)/);
  if (!mb) { aviso(`${etq}: no encuentro la tabla de avances`); i = j - 1; continue; }
  const base = parseFloat(mb[1]);
  const dec = {};
  let p = k + 1;
  while (p < L.length && !/^(BAJADA|TITULAR|CIFRA|NOTA|FONDO)/.test(L[p])) {
    const mm = L[p].match(/^\s+(\d+)\s*→\s*(\d+)\s*:\s*([\d.]+)/);
    if (mm) dec[+mm[1]] = parseFloat(mm[3]);
    p++;
  }
  let conHolgura = 0;
  for (let a = 1; a < lineas.length; a++) {
    const esp = Math.round((base + hs(lineas[a]) + hi(lineas[a - 1])) * 100) / 100;
    if (Math.abs(esp - base) > 1e-9) conHolgura++;
    if (dec[a] === undefined) error(`${etq}: falta el avance del par ${a}→${a + 1}`);
    else if (Math.abs(dec[a] - esp) > 0.005) {
      error(`${etq}: par ${a}→${a + 1} dice ${dec[a]} y la fórmula da ${esp}  ·  «${lineas[a - 1]}» / «${lineas[a]}»`);
    }
  }
  if (conHolgura > 1) conVariasHolguras++;
  i = j - 1;
}

/* ─── 2 · descripciones ───────────────────────────────────────────────── */
let nDesc = 0;
const reDesc = /DESCRIPCIÓN DE LA PUBLICACIÓN\s+(\S+)[^\n]*:\n\n([\s\S]*?)\n\nHASHTAGS:\s*([^\n]+)/g;
let md;
while ((md = reDesc.exec(T))) {
  nDesc++;
  const [, id, cuerpo, hashtags] = md;
  const partes = cuerpo.split('\n').filter((x) => x.trim());
  const total = cuerpo.length;
  if (topes.primeraLinea && partes[0]?.length > topes.primeraLinea) {
    error(`descripción ${id}: la primera línea son ${partes[0].length} caracteres y el tope es ${topes.primeraLinea}`);
  }
  if (topes.cuerpo && partes[1]?.length > topes.cuerpo) {
    error(`descripción ${id}: el cuerpo son ${partes[1].length} caracteres y el tope es ${topes.cuerpo}`);
  }
  if (topes.total && total > topes.total) {
    error(`descripción ${id}: son ${total} caracteres y el tope es ${topes.total}. Lo que no cabe suele ser una segunda idea`);
  }
  const nh = hashtags.trim().split(/\s+/).filter((x) => x.startsWith('#')).length;
  if (topeHashtags && nh > topeHashtags) error(`descripción ${id}: ${nh} hashtags y el tope es ${topeHashtags}`);
  if (marca.voz?.firma && !cuerpo.includes(marca.voz.firma)) {
    aviso(`descripción ${id}: no encuentro la firma de cierre`);
  }
}

/* ─── 3 · cifras ──────────────────────────────────────────────────────── */
if (importes.size) {
  const vistos = new Set((T.match(/\$[0-9][0-9.,]*(?:\s*\/\s*mes|\/mes)?/gi) || []).map((x) => x.replace(/[.,]$/, '')));
  for (const v of vistos) {
    const ok = [...importes].some((i) => v.toLowerCase() === i.toLowerCase() || v.toLowerCase().startsWith(i.toLowerCase()));
    if (!ok) error(`importe «${v}» no está en la fuente declarada (${marca.cifras.fuente || 'la ficha'}). Si el producto existe, añádelo allí; si no, no existe todavía`);
  }
}

/* ─── 4 · léxico ──────────────────────────────────────────────────────── */
for (const [lista, etiqueta] of [[marca.voz?.jergaProhibida, 'jerga'], [marca.voz?.rellenoProhibido, 'relleno']]) {
  for (const p of lista || []) {
    const re = new RegExp(`\\b${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (re.test(T)) error(`${etiqueta} prohibida: «${p}»`);
  }
}
if (marca.voz?.exclamaciones === false && /[!¡]/.test(T.replace(/lleva ¡/g, ''))) {
  aviso('hay signos de exclamación y la marca los tiene prohibidos (revisa si es la fórmula de interlínea)');
}

/* ─── 5 · huecos ──────────────────────────────────────────────────────── */
// `TODO` pide dos puntos o paréntesis, y la casilla `[ ]` de una lista de
// comprobación se salta antes de buscar corchetes vacíos: los dos son palabras
// y signos corrientes en español, y un cepo que caza contenido legítimo acaba
// desactivado, que es peor que no tenerlo.
const HUECOS = [/\[completa aquí\]/i, /<tu [^>]+>/i, /\bTODO\s*[:(]/, /\bXXXX/, /\[\s*\](?!\s*$)/];
const ES_CASILLA = /^\s*\[[ xX]?\]/;
L.forEach((l, n) => {
  if (ES_CASILLA.test(l)) return;
  if (HUECOS.some((r) => r.test(l))) error(`hueco sin resolver, línea ${n + 1}: ${l.trim().slice(0, 60)}`);
});

/* ─── 5b · las reglas que la ficha declara ────────────────────────────── */
// Cada bloque de aquí abajo tapa una regla que la ficha puede declarar y que
// antes solo vivía en la cabeza de quien entregaba.

// La nota del límite, obligatoria cuando la pieza dice una cifra.
if (marca.voz?.notaObligatoriaConCifra) {
  const piezas = T.split(/^PUBLICACIÓN /m).slice(1);
  piezas.forEach((pz) => {
    const id = (pz.match(/^(\S+)/) || [])[1] || '?';
    // Un carrusel lleva varias diapositivas; se mira cada una por separado.
    const trozos = pz.split(/^- - - DIAPOSITIVA/m);
    trozos.forEach((t, k) => {
      const cifra = t.match(/^CIFRA\s{2,}(.+)$/m);
      const nota = t.match(/^NOTA\s{2,}(.+)$/m);
      if (cifra && !/^ninguna$/i.test(cifra[1].trim())) {
        if (!nota || /^ninguna$/i.test(nota[1].trim())) {
          error(`publicación ${id}${trozos.length > 1 ? ` diapositiva ${k}` : ''}: dice «${cifra[1].trim()}» y no lleva nota de límite. Una cifra sin su condición prepara una discusión`);
        }
      }
    });
  });
}

// Un color que la marca reserva a fondos, colándose en un rol de texto.
for (const hex of marca.color?.soloFondo || []) {
  const re = new RegExp(`^.*(TRAMO|TITULAR|CIFRA|NOTA|BAJADA|ANTETÍTULO|wordmark|numerador|color del texto).*${hex.replace('#', '#')}.*$`, 'gim');
  const hits = T.match(re) || [];
  for (const h of hits) {
    if (/prohibid|nunca|jamás|no toca/i.test(h)) continue;   // la regla que lo prohíbe
    error(`«${hex}» está reservado a fondos y aparece en un rol de texto: ${h.trim().slice(0, 70)}`);
  }
}

// Un rango citado por su mínimo a secas.
for (const r of marca.cifras?.rangos || []) {
  if (!r.desde) continue;
  const esc = r.desde.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?<!desde\\s)(?<!Desde\\s)(?<!DESDE\\s)${esc}(?!\\s*[–-])`, 'g');
  if (re.test(T)) {
    error(`«${r.desde}» es el mínimo de un rango (${r.desde}–${r.hasta}${r.producto ? ', ' + r.producto : ''}) y aparece a secas. O el rango entero, o «desde ${r.desde}»`);
  }
}

// Un importe que es la suma de un pago único y una mensualidad.
const aNumero = (s) => parseFloat(String(s).replace(/[^0-9.]/g, '')) || 0;
for (const u of marca.cifras?.pagoUnico || []) {
  for (const m of marca.cifras?.mensual || []) {
    const suma = aNumero(u) + aNumero(m);
    if (!suma) continue;
    const re = new RegExp(`\\$${suma.toLocaleString('en-US')}\\b|\\$${suma}\\b`);
    if (re.test(T)) {
      error(`aparece $${suma}, que es ${u} más ${m}. Un pago único y una mensualidad no se suman nunca: son dos totales separados`);
    }
  }
}

// Lo que la marca no afirma jamás, y lo que no se imprime nunca.
for (const f of marca.prohibido?.afirmar || []) {
  const re = new RegExp(f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  if (re.test(T)) error(`afirmación prohibida: «${f}». Si no está medido, no se dice`);
}
for (const c of marca.prohibido?.imprimir || []) {
  if (T.includes(c)) error(`«${c}» no se imprime nunca en una pieza`);
}

// Fronteras: si una pieza nombra dos productos que se confunden, va la frase oficial.
for (const fr of marca.fronteras || []) {
  const [a, b] = fr.productos || [];
  if (!a || !b) continue;
  const piezas = T.split(/^PUBLICACIÓN /m).slice(1);
  piezas.forEach((pz) => {
    const id = (pz.match(/^(\S+)/) || [])[1] || '?';
    const reA = new RegExp(`\\b${a}\\b`, 'i'), reB = new RegExp(`\\b${b}\\b`, 'i');
    if (reA.test(pz) && reB.test(pz) && fr.fraseOficial && !pz.includes(fr.fraseOficial.slice(0, 40))) {
      aviso(`publicación ${id}: nombra ${a} y ${b}, que se confunden. Comprueba que la frontera queda dicha — confundirlos produce una venta que no se puede cumplir`);
    }
  });
}

// La proporción de alturas del lote.
const alturas = [...T.matchAll(/^ALTURA\s+(\p{L}+)/gimu)].map((m) => m[1].toLowerCase());
if (alturas.length && marca.alturas?.proporcionPorCadaOcho) {
  const cuenta = {};
  alturas.forEach((a) => (cuenta[a] = (cuenta[a] || 0) + 1));
  const n = alturas.length;
  const cond = cuenta['condicion'] || cuenta['condición'] || 0;
  if (cond > Math.floor(n / 3)) {
    error(`${cond} de ${n} piezas abren por la condición, y el tope es una de cada tres. Por encima de ahí el lote deja de sonar a alguien que enseña la cocina y empieza a sonar a alguien que se defiende`);
  }
  const esperado = marca.alturas.proporcionPorCadaOcho;
  const cons = cuenta['consecuencia'] || 0;
  const minCons = Math.round((esperado.consecuencia / 8) * n) - 1;
  if (cons < minCons) {
    aviso(`solo ${cons} de ${n} piezas abren por la consecuencia; la proporción declarada pide unas ${Math.round((esperado.consecuencia / 8) * n)}. Un lote que abre por el hecho informa, pero no mueve`);
  }
} else if (marca.alturas?.proporcionPorCadaOcho && !alturas.length) {
  aviso('no encuentro las alturas. Anótalas con «ALTURA consecuencia» en cada pieza para que se puedan contar');
}

/* ─── 6 · el índice en negativo ───────────────────────────────────────── */
const rutaIndice = opt('indice');
if (rutaIndice && existsSync(rutaIndice)) {
  const indice = readFileSync(rutaIndice, 'utf8');
  let i2 = 0;
  const repetidos = [];
  for (let i = 0; i < L.length; i++) {
    if (!/^TITULAR,/.test(L[i])) continue;
    i2++;
    const lineas = [];
    let j = i + 1;
    while (j < L.length && L[j].startsWith('  ') && L[j].trim()) { lineas.push(L[j].trim()); j++; }
    if (indice.includes(lineas.join(' / '))) repetidos.push(i2);
  }
  // El orden de trabajo es: leer el índice, escribir, verificar, anotar. Si más
  // de la mitad del lote ya está en el índice, no son titulares repetidos: es
  // este mismo lote, ya anotado. Marcarlos como error sería ruido y acabaría
  // con alguien ignorando la comprobación entera.
  if (repetidos.length > i2 / 2) {
    aviso(`${repetidos.length} de ${i2} titulares están en el índice: parece este mismo lote, ya anotado. Verifica ANTES de anotar, o pásale un índice sin este lote`);
  } else {
    repetidos.forEach((n) => error(`titular ${n} ya salió: está en el índice. Un titular publicado está gastado`));
  }
  const puertas = [...T.matchAll(/^PUERTA\s*:?\s*(\p{L}[\p{L}\s]*)$/gimu)].map((m) => m[1].trim().toLowerCase());
  if (puertas.length) {
    const cuenta = {};
    puertas.forEach((p) => (cuenta[p] = (cuenta[p] || 0) + 1));
    for (const [p, n] of Object.entries(cuenta)) if (n > 2) error(`la puerta «${p}» se usa ${n} veces y el tope es 2`);
    if (Object.keys(cuenta).length < 5) aviso(`solo ${Object.keys(cuenta).length} puertas distintas; hacen falta al menos 5 para que el lote no suene al anterior`);
  } else {
    aviso('no encuentro las puertas de entrada. Anótalas con «PUERTA: situación» en cada pieza');
  }
}

/* ─── 7 · frases del ADN copiadas literales ───────────────────────────── */
const dirAdn = opt('adn');
if (dirAdn && existsSync(dirAdn)) {
  const norm = (s) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const leer = (d) => readdirSync(d).flatMap((f) => {
    const r = join(d, f);
    return statSync(r).isDirectory() ? leer(r) : ['.md', '.txt'].includes(extname(f)) ? [readFileSync(r, 'utf8')] : [];
  });
  const adn = norm(leer(dirAdn).join('\n'));
  const reD = /DESCRIPCIÓN DE LA PUBLICACIÓN\s+(\S+)[^\n]*:\n\n([\s\S]*?)\n\nHASHTAGS:/g;
  let m2;
  while ((m2 = reD.exec(T))) {
    const partes = m2[2].split('\n').filter((x) => x.trim());
    const w = norm(partes.slice(1, -1).join(' ')).split(' ');
    // Algunas frases del ADN SÍ se dicen igual a propósito: la tagline, la
    // columna del traductor —donde la cifra y su traducción van juntas por
    // regla— y las frases oficiales de las fronteras. Se declaran en la ficha
    // y no cuentan como guion copiado.
    const permitidas = (marca.antirrepeticion?.frasesPermitidas || [])
      .concat(marca.voz?.firma ? [marca.voz.firma] : [])
      .concat((marca.fronteras || []).map((f) => f.fraseOficial).filter(Boolean))
      .map(norm);
    for (let n = w.length; n >= 8; n--) {
      const hit = Array.from({ length: w.length - n + 1 }, (_, i) => w.slice(i, i + n).join(' '))
        .find((f) => adn.includes(f) && !permitidas.some((pp) => pp.includes(f)));
      if (hit) { error(`descripción ${m2[1]}: frase copiada literal del ADN — «${hit}». Son formas, no guiones: reescríbela, o decláralas en antirrepeticion.frasesPermitidas si esa se dice igual a propósito`); break; }
    }
  }
}

/* ─── informe ─────────────────────────────────────────────────────────── */
console.log(`
${archivo}
${nTit} titulares · ${nDesc} descripciones · ${conVariasHolguras} titulares con más de una holgura
`);
if (errores.length) { console.log(`ERRORES (${errores.length})`); errores.forEach((e) => console.log('  ✗ ' + e)); console.log(); }
if (avisos.length) { console.log(`AVISOS (${avisos.length})`); avisos.forEach((a) => console.log('  · ' + a)); console.log(); }
if (!errores.length && !avisos.length) console.log('✓ Sin errores.\n');

console.log(`Lo que esto NO comprueba, y hace quien entrega:
  · si un titular es una adivinanza — tapa la marca y la cifra: ¿se sabe qué se vende?
  · si el acento cae en la afirmación y no en la negación
  · si el lote entero le habla a un solo público
  · si dos titulares distintos dicen lo mismo con otras palabras
`);
process.exit(errores.length ? 1 : 0);
