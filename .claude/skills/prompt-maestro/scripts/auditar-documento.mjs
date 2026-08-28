#!/usr/bin/env node
/**
 * auditar-documento.mjs — audita el HTML que devolvió el modelo.
 *
 *   node auditar-documento.mjs documento.html --prompt prompt-maestro.txt
 *   node auditar-documento.mjs documento.html --prompt prompt.txt --png ./salida
 *
 * Hace las tres comprobaciones que a ojo cuestan una hora y encuentran cosas
 * que el ojo no ve:
 *
 *   1. Cada cadena del prompt, buscada en el documento carácter a carácter.
 *      Es la que dice si el modelo inventó o alteró algo.
 *   2. Los PNG que producen los propios botones del documento, superpuestos a
 *      su vista previa. Un desfase por encima de 6 px es exportador roto.
 *   3. El inventario: cuántas piezas, de qué tamaño, y con qué imágenes.
 *
 * Necesita Playwright con Chromium.
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const args = process.argv.slice(2);
const doc = args.find((a) => !a.startsWith('--'));
const opt = (n) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : null; };

if (!doc || !existsSync(doc)) {
  console.error('Uso: node auditar-documento.mjs <documento.html> [--prompt <prompt.txt>] [--png <dir>]');
  process.exit(1);
}

async function cargarChromium() {
  const require = createRequire(import.meta.url);
  for (const c of ['playwright', 'playwright-core',
    '/opt/node22/lib/node_modules/playwright/index.js', '/usr/lib/node_modules/playwright/index.js']) {
    try { const m = require(c); if (m?.chromium) return m.chromium; } catch { /* siguiente */ }
  }
  console.error('No encuentro Playwright.  npm i -D playwright && npx playwright install chromium');
  process.exit(1);
}

const chromium = await cargarChromium();
const html = readFileSync(doc, 'utf8');
const dirPng = opt('png');
if (dirPng) mkdirSync(dirPng, { recursive: true });

const navegador = await chromium.launch({ acceptDownloads: true });
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 1200 }, deviceScaleFactor: 1 });
const fallosDeRed = [];
pagina.on('requestfailed', (r) => fallosDeRed.push(`${r.url().slice(0, 70)} — ${r.failure()?.errorText}`));
await pagina.goto(pathToFileURL(resolve(doc)).href, { waitUntil: 'load', timeout: 180000 });
await pagina.evaluate(() => document.fonts.ready);
await pagina.waitForTimeout(2500);

/* ─── 1 · el texto, carácter a carácter ───────────────────────────────── */
const textoDoc = await pagina.evaluate(() => document.body.innerText);
const rutaPrompt = opt('prompt');
let comprobadas = 0, faltan = [];

if (rutaPrompt && existsSync(rutaPrompt)) {
  const P = readFileSync(rutaPrompt, 'utf8');
  const PL = P.split('\n');
  const cadenas = [];

  // líneas de titular
  for (let i = 0; i < PL.length; i++) {
    if (!/^TITULAR,/.test(PL[i])) continue;
    let j = i + 1;
    while (j < PL.length && PL[j].startsWith('  ') && PL[j].trim()) { cadenas.push(['titular', PL[j].trim()]); j++; }
  }
  // antetítulos, bajadas, cifras, notas
  for (const l of PL) {
    const m = l.match(/^(ANTETÍTULO|BAJADA|CIFRA|NOTA)\s{2,}(.+)$/);
    if (m && !/^ninguna$/i.test(m[2].trim())) cadenas.push([m[1].toLowerCase(), m[2].trim().replace(/\s+\(.*$/, '')]);
  }
  // descripciones, párrafo a párrafo, y hashtags
  const re = /DESCRIPCIÓN DE LA PUBLICACIÓN\s+(\S+)[^\n]*:\n\n([\s\S]*?)\n\nHASHTAGS:\s*([^\n]+)/g;
  let m2;
  while ((m2 = re.exec(P))) {
    m2[2].split('\n').filter((x) => x.trim()).forEach((p) => cadenas.push([`descripción ${m2[1]}`, p.trim()]));
    cadenas.push([`hashtags ${m2[1]}`, m2[3].trim()]);
  }

  const norm = (s) => s.replace(/\s+/g, ' ').trim();
  const doc1 = norm(textoDoc);
  for (const [tipo, c] of cadenas) {
    comprobadas++;
    if (!doc1.includes(norm(c))) faltan.push([tipo, c]);
  }
}

/* ─── 2 · inventario de piezas ────────────────────────────────────────── */
const inv = await pagina.evaluate(() => {
  // Una «pieza» es un elemento escalado con transform dentro de un contenedor
  // recortado. Es la única forma agnóstica de encontrarlas.
  const piezas = [...document.querySelectorAll('*')].filter((el) => {
    const t = getComputedStyle(el).transform;
    if (!t || t === 'none' || !t.startsWith('matrix')) return false;
    const esc = parseFloat(t.slice(7).split(',')[0]);
    return esc > 0.05 && esc < 0.99 && el.offsetWidth >= 300;
  });
  const marcos = piezas.map((p) => p.parentElement).filter(Boolean);
  const anchos = [...new Set(marcos.map((m) => Math.round(m.getBoundingClientRect().width)))];
  const tamanos = [...new Set(piezas.map((p) => `${p.offsetWidth}×${p.offsetHeight}`))];
  const imgs = [...document.querySelectorAll('img,[style*="background-image"]')].length;
  const b64 = (document.documentElement.innerHTML.match(/data:image\/[a-z+]*;base64,/g) || []).length;
  const botones = [...document.querySelectorAll('button,a')]
    .filter((b) => /descargar|download|png/i.test(b.textContent || '')).length;
  const copiar = [...document.querySelectorAll('button,a')]
    .filter((b) => /copiar|copy/i.test(b.textContent || '')).length;
  return { piezas: piezas.length, anchosDeVistaPrevia: anchos, tamanosDeLienzo: tamanos, imgs, b64, botones, copiar };
});

/* ─── 3 · PNG contra vista previa ─────────────────────────────────────── */
const comparaciones = [];
if (dirPng) {
  // Marcar solo las piezas GRANDES. Un carrusel se muestra dos veces: en tira,
  // a escala pequeña y sin botón, y suelto a la vista previa normal. Si se
  // cuentan las dos, los índices dejan de corresponder con los botones y la
  // comparación empareja cada PNG con la pieza equivocada.
  const marcar = () => {
    const escalados = [...document.querySelectorAll('*')].filter((el) => {
      const t = getComputedStyle(el).transform;
      if (!t || t === 'none' || !t.startsWith('matrix')) return false;
      const e = parseFloat(t.slice(7).split(',')[0]);
      return e > 0.05 && e < 0.99 && el.offsetWidth >= 300;
    });
    const anchos = escalados.map((p) => Math.round(p.parentElement?.getBoundingClientRect().width || 0));
    const mayor = Math.max(...anchos);
    let n = 0;
    escalados.forEach((p, i) => {
      if (Math.abs(anchos[i] - mayor) > 2) return;      // fuera la tira
      p.parentElement?.setAttribute('data-auditoria', String(n++));
    });
    return n;
  };
  const marcos = await pagina.evaluate(marcar);

  // Emparejar cada botón con la pieza marcada que lo precede en el documento.
  const parejas = await pagina.evaluate(() => {
    const orden = [...document.querySelectorAll('*')];
    const idxDe = new Map(orden.map((el, i) => [el, i]));
    const piezas = [...document.querySelectorAll('[data-auditoria]')]
      .map((el) => ({ n: +el.dataset.auditoria, pos: idxDe.get(el) }));
    const botones = [...document.querySelectorAll('button, a')]
      .filter((b) => /descargar|download/i.test(b.textContent || '') && !/todas|all/i.test(b.textContent || ''));
    botones.forEach((b, i) => b.setAttribute('data-boton', String(i)));
    return botones.map((b, i) => {
      const pos = idxDe.get(b);
      const previas = piezas.filter((p) => p.pos < pos);
      return { boton: i, pieza: previas.length ? previas[previas.length - 1].n : null };
    }).filter((x) => x.pieza !== null);
  });

  const escala = await pagina.evaluate(() => {
    const el = document.querySelector('[data-auditoria="0"]')?.firstElementChild;
    if (!el) return 1;
    const t = getComputedStyle(el).transform;
    return t.startsWith('matrix') ? parseFloat(t.slice(7).split(',')[0]) : 1;
  });

  // vista previa a resolución nativa: deviceScaleFactor compensa la escala
  const dsf = Math.min(4, Math.max(1, Math.round(1 / escala)));
  const pag2 = await navegador.newPage({ viewport: { width: 1400, height: 1200 }, deviceScaleFactor: dsf });
  await pag2.goto(pathToFileURL(resolve(doc)).href, { waitUntil: 'load', timeout: 180000 });
  await pag2.evaluate(() => document.fonts.ready);
  await pag2.waitForTimeout(2500);
  await pag2.evaluate(marcar);

  for (const { boton, pieza: i } of parejas) {
    try {
      const b = await pagina.$(`[data-boton="${boton}"]`);
      if (!b) continue;
      const [descarga] = await Promise.all([
        pagina.waitForEvent('download', { timeout: 25000 }),
        b.click(),
      ]);
      const rutaPng = join(dirPng, `png-${String(i).padStart(2, '0')}.png`);
      await descarga.saveAs(rutaPng);
      const rutaPrev = join(dirPng, `previa-${String(i).padStart(2, '0')}.png`);
      const marco = await pag2.$(`[data-auditoria="${i}"]`);
      if (!marco) continue;
      await marco.screenshot({ path: rutaPrev });

      const d = await pag2.evaluate(async ([a, b]) => {
        const carga = (s) => new Promise((r) => { const im = new Image(); im.onload = () => r(im); im.src = s; });
        const [A, B] = await Promise.all([carga(a), carga(b)]);
        const W = 1080, H = Math.round((A.height / A.width) * W);
        const datos = (im) => { const c = document.createElement('canvas'); c.width = W; c.height = H;
          const x = c.getContext('2d'); x.drawImage(im, 0, 0, W, H); return x.getImageData(0, 0, W, H).data; };
        const [da, db] = [datos(A), datos(B)];
        const perfil = (d) => { const f = new Int32Array(H);
          for (let y = 0; y < H; y++) { let s = 0;
            for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (d[i] > 150 && d[i + 1] > 60) s++; } f[y] = s; }
          return f; };
        const [pa, pb] = [perfil(da), perfil(db)];
        let mejor = 0, punt = -1;
        for (let s = -40; s <= 40; s++) { let sc = 0;
          for (let y = 40; y < H - 40; y++) { const j = y + s; if (j >= 0 && j < H) sc += Math.min(pa[j], pb[y]); }
          if (sc > punt) { punt = sc; mejor = s; } }
        let dif = 0;
        for (let i = 0; i < W * H * 4; i += 4) {
          if (Math.abs(da[i] - db[i]) > 40 || Math.abs(da[i + 1] - db[i + 1]) > 40) dif++;
        }
        return { desfase: mejor, difPct: +((100 * dif) / (W * H)).toFixed(2), alto: H };
      }, ['data:image/png;base64,' + readFileSync(rutaPng).toString('base64'),
          'data:image/png;base64,' + readFileSync(rutaPrev).toString('base64')]);
      comparaciones.push({ pieza: i, ...d });
    } catch (e) {
      comparaciones.push({ pieza: i, error: String(e.message || e).slice(0, 60) });
    }
  }
  if (marcos !== parejas.length) {
    console.log(`\n  ⚠ ${marcos} piezas y ${parejas.length} botones de descarga: no cuadran.`);
  }
  await pag2.close();
}

await navegador.close();

/* ─── informe ─────────────────────────────────────────────────────────── */
const linea = '─'.repeat(74);
console.log(`\n${doc}\n${linea}`);

console.log(`\nINVENTARIO`);
console.log(`  piezas compuestas        ${inv.piezas}`);
const anchos = inv.anchosDeVistaPrevia.sort((a, b) => b - a);
console.log(`  vista previa             ${anchos.join(', ')} px de ancho` +
  (anchos.length === 2 ? '   (el menor suele ser la tira del carrusel)'
   : anchos.length > 2 ? '   ⚠ hay más de dos tamaños: las piezas no miden todas lo mismo' : ''));
console.log(`  lienzos                  ${inv.tamanosDeLienzo.join(', ')}` +
  (inv.tamanosDeLienzo.length > 1 ? '   ⚠ hay más de un tamaño' : ''));
console.log(`  imágenes incrustadas     ${inv.b64}`);
console.log(`  botones de descarga      ${inv.botones}`);
console.log(`  botones de copiar        ${inv.copiar}`);
if (fallosDeRed.length) {
  console.log(`\n  ⚠ recursos que no cargaron (${fallosDeRed.length}) — si son las fuentes, todo lo demás da igual:`);
  fallosDeRed.slice(0, 3).forEach((f) => console.log('     ' + f));
}

if (rutaPrompt) {
  console.log(`\nTEXTO`);
  if (!faltan.length) {
    console.log(`  ${comprobadas} / ${comprobadas} cadenas copiadas sin alterar un carácter.`);
  } else {
    console.log(`  ${comprobadas - faltan.length} / ${comprobadas} cadenas correctas.`);
    console.log(`\n  NO ENCONTRADAS EN EL DOCUMENTO (${faltan.length}) — reescritas, acortadas o con una tilde comida:`);
    faltan.slice(0, 25).forEach(([t, c]) => console.log(`     ${t}: «${c.slice(0, 66)}${c.length > 66 ? '…' : ''}»`));
    if (faltan.length > 25) console.log(`     … y ${faltan.length - 25} más`);
  }
}

if (comparaciones.length) {
  console.log(`\nPNG CONTRA VISTA PREVIA`);
  if (fallosDeRed.some((f) => /fonts\.(googleapis|gstatic)/.test(f))) {
    console.log(`  ⚠ Las tipografías no cargaron en esta máquina, así que esta comparación
    NO vale: el navegador está midiendo una fuente del sistema. Ejecútala
    donde haya salida a fonts.googleapis.com y vuelve a mirar.\n`);
  }
  const malos = comparaciones.filter((c) => Math.abs(c.desfase ?? 0) > 6);
  comparaciones.forEach((c) => {
    if (c.error) return console.log(`  pieza ${c.pieza}: ${c.error}`);
    const señal = Math.abs(c.desfase) > 6 ? '✗' : Math.abs(c.desfase) > 3 ? '·' : '✓';
    console.log(`  ${señal} pieza ${String(c.pieza).padStart(2)}   desfase ${String(c.desfase).padStart(4)} px   diferencia ${c.difPct} %`);
  });
  if (malos.length) {
    console.log(`\n  ${malos.length} piezas con más de 6 px de desfase. Casi siempre es la trampa 2:
  el titular se está dibujando con textBaseline='top' en vez de por línea base.
  Con interlínea por debajo de 1 los dos anclajes no coinciden nunca.`);
  } else {
    console.log(`\n  Dos o tres píxeles son normales: el lienzo posiciona por la caja del tipo
  y el navegador por la caja de línea.`);
  }
}

console.log(`\n${linea}
Lo que esto NO comprueba, y hay que mirar a ojo:
  · los carruseles EN TIRA, pegados. Las costuras no se ven de otra manera
  · si algún fondo trae letras dentro
  · si el fondo invade la banda del logo — el logo desaparece sobre su propio color
  · si los tramos de acento, leídos en orden, forman una frase
`);
