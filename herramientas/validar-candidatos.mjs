#!/usr/bin/env node
/**
 * validar-candidatos.mjs — comprueba una lista de candidatos de blog contra
 * el schema real del sitio, antes de que un humano los vea.
 *
 *   node herramientas/validar-candidatos.mjs ruta/al/candidatos.json
 *
 * Por qué existe: la skill `candidatos-blog-seo` propone título, descripción,
 * categoría, keywords y tiempo de lectura para posts que todavía no se
 * escriben. Esos cinco campos tienen que caber en el schema real de
 * `content.config.ts` del repositorio del sitio — si no caben, `astro build`
 * falla el día que alguien intente publicarlos. Antes, esa comprobación la
 * hacía una persona a mano, contando caracteres con `wc -m` cada vez. Esto la
 * saca de la cabeza de quien entrega y la pone en código, para que no dependa
 * de que nadie se acuerde de correrla.
 *
 * ESPEJO DECLARADO: los límites de abajo (LIMITES) son una copia exacta de
 * `src/content.config.ts` en abrinay1997-stack/PanaClaw. Si ese schema
 * cambia, este archivo se desincroniza y hay que actualizar los dos a la vez
 * — la misma relación que datos/precios.json tiene con src/data/*.ts, descrita
 * en operacion/sincronizacion.md.
 *
 * Sale con código 1 si algún candidato no pasa. No escribe nada, no llama a
 * ninguna API, no toca git: solo lee el JSON y contesta sí o no.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const LIMITES = {
  title: { min: 15, max: 90 },
  description: { min: 60, max: 200 },
  category: ['precios', 'guias', 'comparativas', 'casos', 'panama'],
  keywords: { min: 1, max: 6 },
  readingTime: { min: 2, max: 30 },
};

const rutaArg = process.argv[2];
if (!rutaArg) {
  console.error('Uso: node herramientas/validar-candidatos.mjs <ruta-al-json-de-candidatos>');
  process.exit(1);
}

const ruta = resolve(process.cwd(), rutaArg);
if (!existsSync(ruta)) {
  console.error(`✗ No existe ${rutaArg}`);
  process.exit(1);
}

let candidatos;
try {
  candidatos = JSON.parse(readFileSync(ruta, 'utf8'));
} catch (err) {
  console.error(`✗ JSON inválido en ${rutaArg}: ${err.message}`);
  process.exit(1);
}

if (!Array.isArray(candidatos)) {
  console.error(`✗ ${rutaArg} tiene que ser un array de candidatos, no un objeto suelto.`);
  process.exit(1);
}

if (candidatos.length === 0) {
  console.error(`✗ ${rutaArg} está vacío. No hay nada que proponer.`);
  process.exit(1);
}

const errores = [];
const error = (i, titulo, msg) => errores.push({ i, titulo, msg });

/** Cuenta caracteres de verdad, no bytes — `á`, `ñ` cuentan uno. */
const largo = (s) => Array.from(s ?? '').length;

const titulosVistos = new Map();

candidatos.forEach((c, i) => {
  const etiqueta = typeof c.title === 'string' && c.title ? c.title : `candidato #${i + 1}`;

  if (typeof c.title !== 'string' || !c.title.trim()) {
    error(i, etiqueta, 'Falta "title" o está vacío.');
  } else {
    const n = largo(c.title);
    if (n < LIMITES.title.min || n > LIMITES.title.max) {
      error(i, etiqueta, `"title" tiene ${n} caracteres — debe estar entre ${LIMITES.title.min} y ${LIMITES.title.max}.`);
    }
    const normalizado = c.title.trim().toLowerCase();
    if (titulosVistos.has(normalizado)) {
      error(i, etiqueta, `"title" repetido en este mismo lote (también en el candidato #${titulosVistos.get(normalizado) + 1}).`);
    } else {
      titulosVistos.set(normalizado, i);
    }
  }

  if (typeof c.description !== 'string' || !c.description.trim()) {
    error(i, etiqueta, 'Falta "description" o está vacía.');
  } else {
    const n = largo(c.description);
    if (n < LIMITES.description.min || n > LIMITES.description.max) {
      error(i, etiqueta, `"description" tiene ${n} caracteres — debe estar entre ${LIMITES.description.min} y ${LIMITES.description.max}.`);
    }
  }

  if (!LIMITES.category.includes(c.category)) {
    error(i, etiqueta, `"category" = ${JSON.stringify(c.category)} — debe ser una de: ${LIMITES.category.join(', ')}.`);
  }

  if (!Array.isArray(c.keywords)) {
    error(i, etiqueta, 'Falta "keywords" o no es un array.');
  } else {
    const n = c.keywords.length;
    if (n < LIMITES.keywords.min || n > LIMITES.keywords.max) {
      error(i, etiqueta, `"keywords" trae ${n} — debe traer entre ${LIMITES.keywords.min} y ${LIMITES.keywords.max}.`);
    }
    c.keywords.forEach((k, ki) => {
      if (typeof k !== 'string' || !k.trim()) {
        error(i, etiqueta, `"keywords[${ki}]" está vacía o no es texto.`);
      }
    });
  }

  if (c.readingTime !== undefined) {
    const rt = c.readingTime;
    if (!Number.isInteger(rt) || rt < LIMITES.readingTime.min || rt > LIMITES.readingTime.max) {
      error(i, etiqueta, `"readingTime" = ${JSON.stringify(rt)} — debe ser un entero entre ${LIMITES.readingTime.min} y ${LIMITES.readingTime.max}.`);
    }
  }
});

console.log(`\nValidación de candidatos — ${rutaArg}`);
console.log(`${candidatos.length} candidato(s) revisado(s)\n`);

if (errores.length) {
  console.log(`Errores (${errores.length}):`);
  for (const { titulo, msg } of errores) {
    console.log(`  ✗ «${titulo}» — ${msg}`);
  }
  console.log(`\n✗ ${new Set(errores.map((e) => e.i)).size} de ${candidatos.length} candidato(s) no caben en el schema. Corrígelos antes de entregarlos.\n`);
  process.exit(1);
}

console.log('✓ Todos los candidatos caben en el schema de content.config.ts.\n');
