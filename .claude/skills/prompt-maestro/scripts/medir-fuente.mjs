#!/usr/bin/env node
/**
 * medir-fuente.mjs — mide una tipografía de titular y devuelve la tabla de
 * holguras de interlínea lista para pegar en la ficha de marca.
 *
 *   node medir-fuente.mjs --familia "Antonio" --peso 700
 *   node medir-fuente.mjs --archivo ./Display.woff2
 *   node medir-fuente.mjs --familia "Antonio" --peso 700 --comprobar
 *
 * Por qué existe: las holguras dependen de la fuente. Una tabla copiada de otra
 * marca está mal por definición, y el fallo no se ve hasta que el lote está
 * montado y las tildes tocan la línea de encima.
 *
 * Necesita Playwright con Chromium. Si no lo tienes:  npm i -D playwright
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { createRequire } from 'node:module';

/* ─── argumentos ──────────────────────────────────────────────────────── */
const args = process.argv.slice(2);
const opt = (n, d = null) => {
  const i = args.indexOf('--' + n);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d;
};
const flag = (n) => args.includes('--' + n);

const familia = opt('familia');
const peso = opt('peso', '700');
const archivo = opt('archivo');
const base = parseFloat(opt('base', '0.88'));
const hueco = parseFloat(opt('hueco', '0.079'));
const tamano = parseInt(opt('tamano', '112'), 10);

if (!familia && !archivo) {
  console.error(`
Falta qué medir.

  --familia "Antonio" --peso 700      una familia de Google Fonts
  --archivo ./Display.woff2           un archivo local

Opcionales:
  --base 0.88      la interlínea base del titular (por defecto 0.88)
  --hueco 0.079    el hueco óptico objetivo en em (por defecto 0.079 ≈ 9 px a 112)
  --tamano 112     el cuerpo con el que se reportan los píxeles
  --comprobar      además, renderiza los pares problemáticos y mide el hueco real
`);
  process.exit(1);
}

/* ─── Playwright ──────────────────────────────────────────────────────── */
async function cargarChromium() {
  const require = createRequire(import.meta.url);
  const candidatos = [
    'playwright',
    'playwright-core',
    '/opt/node22/lib/node_modules/playwright/index.js',
    '/usr/lib/node_modules/playwright/index.js',
  ];
  for (const c of candidatos) {
    try {
      const m = require(c);
      if (m?.chromium) return m.chromium;
    } catch { /* siguiente */ }
  }
  console.error(`
No encuentro Playwright. Instálalo con:

  npm i -D playwright && npx playwright install chromium

Si lo tienes global, exporta NODE_PATH a su carpeta de node_modules.
`);
  process.exit(1);
}

/* ─── CSS de la fuente, con los woff2 incrustados ─────────────────────── */
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36';

async function cssDeFuente() {
  if (archivo) {
    const ruta = resolve(archivo);
    if (!existsSync(ruta)) { console.error(`No existe: ${ruta}`); process.exit(1); }
    const b64 = readFileSync(ruta).toString('base64');
    const ext = ruta.endsWith('.woff2') ? 'woff2' : ruta.endsWith('.woff') ? 'woff' : 'truetype';
    const nombre = basename(ruta).replace(/\.[^.]+$/, '');
    return { css: `@font-face{font-family:"${nombre}";font-weight:${peso};src:url(data:font/${ext};base64,${b64}) format("${ext}")}`, nombre };
  }
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(familia)}:wght@${peso}&display=swap`;
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) { console.error(`Google Fonts devolvió ${r.status} para «${familia}».`); process.exit(1); }
  let css = await r.text();
  const urls = [...new Set([...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/g)].map(m => m[1]))];
  for (const u of urls) {
    const f = await fetch(u, { headers: { 'User-Agent': UA } });
    if (!f.ok) continue;
    const b64 = Buffer.from(await f.arrayBuffer()).toString('base64');
    css = css.split(u).join(`data:font/woff2;base64,${b64}`);
  }
  return { css, nombre: familia };
}

/* ─── medición ────────────────────────────────────────────────────────── */
const chromium = await cargarChromium();
const { css, nombre } = await cssDeFuente();

const navegador = await chromium.launch();
const pagina = await navegador.newPage();
await pagina.setContent(`<style>${css}</style><body>medición</body>`);
await pagina.evaluate(([n, p]) => document.fonts.load(`${p} 1000px "${n}"`), [nombre, peso]);
await pagina.evaluate(() => document.fonts.ready);

const m = await pagina.evaluate(([n, p]) => {
  const c = document.createElement('canvas').getContext('2d');
  c.font = `${p} 1000px "${n}"`;
  const arriba = (s) => c.measureText(s).actualBoundingBoxAscent / 1000;
  const abajo = (s) => c.measureText(s).actualBoundingBoxDescent / 1000;
  const cap = Math.max(arriba('N'), arriba('H'), arriba('E'));
  return {
    versalita: cap,
    tilde: Math.max(...['Á', 'É', 'Í', 'Ó', 'Ú'].map(arriba)),
    enye: arriba('Ñ'),
    dieresis: arriba('Ü'),
    colaQ: abajo('Q'),
    coma: abajo(','),
    interrogacion: abajo('¿'),
    exclamacion: abajo('¡'),
    anchoDePrueba: Math.round(c.measureText('HAMBURGUESA').width),
  };
}, [nombre, peso]);

// Si el ancho de prueba coincide con el de una fuente de sistema, no cargó.
const control = await pagina.evaluate(([p]) => {
  const c = document.createElement('canvas').getContext('2d');
  c.font = `${p} 1000px sans-serif`;
  return Math.round(c.measureText('HAMBURGUESA').width);
}, [peso]);

if (m.anchoDePrueba === control) {
  console.error(`
La fuente «${nombre}» no llegó a cargar: mide exactamente lo mismo que la del
sistema. Comprueba el nombre, el peso, o la conexión a Google Fonts.
`);
  await navegador.close();
  process.exit(1);
}

/* ─── la cuenta ───────────────────────────────────────────────────────── */
// Lo que ya sobra en la base entre dos versalitas lisas:
const sobraEnLaBase = base - m.versalita;
const r2 = (x) => Math.round(x * 100) / 100;

// holgura = lo que sobresale la tinta − lo que ya sobra + el hueco óptico
const sup = (topeDeTinta) => Math.max(0, r2(topeDeTinta - m.versalita - sobraEnLaBase + hueco));
const inf = (bajaDeTinta) => Math.max(0, r2(bajaDeTinta - sobraEnLaBase + hueco));

const tabla = {
  holguraSuperior: {
    'Á É Í Ó Ú': sup(m.tilde),
    'Ñ': sup(m.enye),
    'Ü': sup(m.dieresis),
  },
  holguraInferior: {
    ',': inf(m.coma),
    'Q': inf(m.colaQ),
    '¿': inf(m.interrogacion),
    '¡': inf(m.exclamacion),
  },
};

const px = (em) => Math.round(em * tamano * 10) / 10;

console.log(`
Tipografía  ${nombre} ${peso}
Interlínea base  ${base}     Hueco óptico objetivo  ${hueco} em (${px(hueco)} px a ${tamano})

MÉTRICAS REALES, en em
  altura de versalita        ${m.versalita.toFixed(3)}
  tope de Á É Í Ó Ú          ${m.tilde.toFixed(3)}
  tope de Ñ                  ${m.enye.toFixed(3)}
  tope de Ü                  ${m.dieresis.toFixed(3)}
  cola de Q                  −${m.colaQ.toFixed(3)}
  coma                       −${m.coma.toFixed(3)}
  signo ¿                    −${m.interrogacion.toFixed(3)}
  signo ¡                    −${m.exclamacion.toFixed(3)}

  hueco entre dos versalitas lisas a interlínea ${base}: ${px(sobraEnLaBase)} px
${sobraEnLaBase < 0 ? '  ⚠ La base es MENOR que la altura de versalita: las líneas ya se solapan\n    entre sí antes de cualquier tilde. Sube la base.\n' : ''}
LA TABLA, para la ficha de marca
${JSON.stringify(tabla, null, 2)}

PARA PEGAR EN EL PROMPT MAESTRO
  avance(n → n+1) = base
                  + ${tabla.holguraSuperior['Á É Í Ó Ú']}  si la línea n+1 lleva Á, É, Í, Ó o Ú
                  + ${tabla.holguraSuperior['Ñ']}  si la línea n+1 lleva Ñ
                  + ${tabla.holguraSuperior['Ü']}  si la línea n+1 lleva Ü
                  + ${tabla.holguraInferior[',']}  si la línea n   lleva coma
                  + ${tabla.holguraInferior['Q']}  si la línea n   lleva Q
                  + ${tabla.holguraInferior['¿']}  si la línea n   lleva ¿
                  + ${tabla.holguraInferior['¡']}  si la línea n   lleva ¡

  De las de arriba manda UNA sola, la mayor. De las de abajo, UNA sola, la mayor.
  Pero una de arriba y una de abajo SÍ se suman entre sí.
`);

/* ─── comprobación opcional ───────────────────────────────────────────── */
if (flag('comprobar')) {
  // Las cadenas de control llevan solo letras de lados planos —sin O, S, C, G—
  // porque las redondas sobresalen por diseño un par de milésimas de em por
  // arriba y por abajo. Es tipografía normal, no un defecto, pero falsea la
  // medida del hueco si se cuela en la línea de referencia.
  const pares = [
    ['ALTA MENTE', 'ELEMENTAL', 0, 'control: dos versalitas planas'],
    ['ALTA MENTE', 'MÁS ALTA', tabla.holguraSuperior['Á É Í Ó Ú'], 'tilde debajo de versalita'],
    ['ALTA MENTE', 'MAÑANA', tabla.holguraSuperior['Ñ'], 'eñe debajo de versalita'],
    ['ALTA MENTE,', 'MÁS ALTA', tabla.holguraSuperior['Á É Í Ó Ú'] + tabla.holguraInferior[','], 'tilde debajo de coma'],
    ['TIENE UNA Q', 'MÁS ALTA', tabla.holguraSuperior['Á É Í Ó Ú'] + tabla.holguraInferior['Q'], 'tilde debajo de Q'],
  ];
  const filas = pares.map(([a, b, h]) =>
    `<div class="par"><div class="l">${a}</div><div class="l" style="margin-top:${h}em">${b}</div></div>`).join('');
  await pagina.setContent(`<style>${css}
    body{margin:0;padding:20px;background:#111}
    .par{margin-bottom:40px}
    .l{font-family:"${nombre}";font-weight:${peso};font-size:${tamano}px;line-height:${base};
       color:#fff;white-space:nowrap;text-transform:uppercase}
  </style>${filas}`);
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.waitForTimeout(400);

  const huecos = await pagina.evaluate(([n, p, t]) => {
    const c = document.createElement('canvas').getContext('2d');
    c.font = `${p} ${t}px "${n}"`;
    const mide = (s) => c.measureText(s);
    return [...document.querySelectorAll('.par')].map((par) => {
      const ls = par.querySelectorAll('.l');
      const a = ls[0].getBoundingClientRect(), b = ls[1].getBoundingClientRect();
      const avance = b.top - a.top;
      const topeAbajo = mide(ls[1].textContent).actualBoundingBoxAscent;
      const bajaArriba = mide(ls[0].textContent).actualBoundingBoxDescent;
      return Math.round((avance - topeAbajo - bajaArriba) * 10) / 10;
    });
  }, [nombre, peso, tamano]);

  console.log(`COMPROBACIÓN a ${tamano} px — tinta limpia entre las dos líneas\n`);
  pares.forEach(([, , , etiqueta], i) => {
    const v = huecos[i];
    const señal = i === 0 ? '  ' : v < huecos[0] ? ' ✗' : ' ✓';
    console.log(`${señal} ${String(v).padStart(6)} px   ${etiqueta}`);
  });
  console.log(`
  El primero es el control: lo que deja un par de versalitas planas a la base.
  Si un par con tilde queda por debajo de él, la holgura está corta aunque las
  letras técnicamente no se toquen — la tinta se lee soldada. Sube el --hueco.

  Los dos últimos dan más o menos el doble, y es a propósito: cuando coinciden
  una holgura de arriba y una de abajo, cada una trae su hueco óptico. En un
  par así las dos tintas suelen caer en columnas distintas, y quedarse corto
  ahí es mucho más caro que pasarse.

  Y una advertencia sobre lo que estás midiendo: las letras redondas —O, S, C,
  G— sobresalen por diseño un par de milésimas de em por arriba y por abajo.
  Un titular real que las lleve dará un hueco algo menor que este control. Es
  tipografía normal y no hay que corregirlo.
`);
}

await navegador.close();
