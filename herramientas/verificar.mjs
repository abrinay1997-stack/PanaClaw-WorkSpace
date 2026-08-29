#!/usr/bin/env node
/**
 * verificar.mjs — comprueba que este repositorio no se haya desincronizado.
 *
 *   node herramientas/verificar.mjs
 *
 * Vigila mecánicamente las cuatro reglas que se pueden vigilar mecánicamente:
 *
 *   1. Ninguna cifra fuera de datos/precios.json
 *   3. Cero jerga
 *   5. Un solo acento cromático (hex fuera de datos/marca.json)
 *   8. Los rangos se citan enteros
 *   9. Ninguna tipografía fuera de las declaradas en datos/marca.json
 *
 * Y además: que no queden enlaces internos rotos ni huecos sin resolver.
 *
 * Las demás reglas son de criterio y las revisa quien entrega
 * (orquestador/protocolo-entrega.md).
 *
 * REGLA AL AÑADIR UNA COMPROBACIÓN, heredada del repositorio del sitio:
 * rompe lo que vigila y comprueba que salta. Un cepo que también pasa con la
 * función desactivada no vigila nada.
 *
 * Sale con código 1 si hay algún error. Los avisos no rompen la ejecución.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const errores = [];
const avisos = [];
const error = (archivo, linea, msg) => errores.push({ archivo, linea, msg });
const aviso = (archivo, linea, msg) => avisos.push({ archivo, linea, msg });

/* ------------------------------------------------------------------ *
 * Recorrido de archivos
 * ------------------------------------------------------------------ */

function listar(dir, ext, acc = []) {
  for (const nombre of readdirSync(dir)) {
    if (nombre === '.git' || nombre === 'node_modules') continue;
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) listar(ruta, ext, acc);
    else if (nombre.endsWith(ext)) acc.push(ruta);
  }
  return acc;
}

const md = listar(RAIZ, '.md');
const rel = (ruta) => relative(RAIZ, ruta);

/**
 * Un archivo, en líneas, con las zonas donde una cifra o un hex NO cuentan
 * como infracción: los bloques de código son prompts y ejemplos, y ahí las
 * cifras van a propósito.
 *
 * ESCAPE EXPLÍCITO: una línea que termine en `<!-- v: motivo -->` queda exenta
 * de todas las comprobaciones. Existe porque este repositorio ENSEÑA con
 * contraejemplos —«nunca escribas $420», «no uses #FF5500»— y sin una salida
 * declarada habría que elegir entre no poder enseñar o apagar el cepo entero.
 * El motivo es obligatorio: un escape sin explicación es un escape que nadie
 * puede revisar dentro de seis meses.
 */
const ESCAPE = /<!--\s*v:\s*\S.*?-->\s*$/;

function lineas(ruta) {
  const texto = readFileSync(ruta, 'utf8');
  let enBloque = false;
  return texto.split('\n').map((contenido, i) => {
    if (/^\s*```/.test(contenido)) {
      enBloque = !enBloque;
      return { n: i + 1, contenido, codigo: true, exenta: true };
    }
    return { n: i + 1, contenido, codigo: enBloque, exenta: ESCAPE.test(contenido) };
  });
}

/**
 * Archivos que no se verifican.
 *
 * `skills/_plantilla/` son plantillas con marcadores a propósito.
 *
 * `.claude/` es herramienta de agente, no prosa de marca: lleva listas de lo
 * PROHIBIDO —tipografías que no se pueden usar, importes de ejemplo, colores
 * que ilustran un error— y este verificador las leería como usos. Un cepo que
 * marca contenido legítimo acaba desactivado, que es peor que no tenerlo.
 * Lo que hay ahí dentro se comprueba con sus propios scripts.
 */
const NO_VERIFICAR = [/^skills\/_plantilla\//, /^\.claude\//];
const saltar = (ruta) => NO_VERIFICAR.some((re) => re.test(rel(ruta)));

/* ------------------------------------------------------------------ *
 * Las dos fuentes de verdad
 * ------------------------------------------------------------------ */

const rutaPrecios = join(RAIZ, 'datos/precios.json');
const rutaMarca = join(RAIZ, 'datos/marca.json');

for (const ruta of [rutaPrecios, rutaMarca]) {
  if (!existsSync(ruta)) {
    console.error(`✗ Falta ${rel(ruta)} — es una fuente de verdad, sin ella no hay nada que verificar.`);
    process.exit(1);
  }
}

let precios, marca;
try {
  precios = JSON.parse(readFileSync(rutaPrecios, 'utf8'));
  marca = JSON.parse(readFileSync(rutaMarca, 'utf8'));
} catch (err) {
  console.error(`✗ JSON inválido en datos/: ${err.message}`);
  process.exit(1);
}

/**
 * Todos los importes declarados, normalizados: '$1,200' → '$1200'.
 *
 * El recorte de la puntuación final no es cosmético: la expresión que caza
 * importes en prosa incluye el punto y la coma porque los necesita dentro
 * ('$1,200', '$1.50'), así que '$295.' al final de una frase llegaba aquí con
 * el punto pegado y no encontraba nada. Eran ocho falsos positivos, y un cepo
 * que grita ocho veces sin razón deja de leerse.
 */
const normalizar = (s) => s.replace(/[\s,]/g, '').replace(/[.,]+$/, '');

const importesValidos = new Set();
(function recolectar(nodo) {
  if (typeof nodo === 'string') {
    // Un valor puede traer varias cifras: '$80–$150', '$1–2 al mes'
    for (const m of nodo.matchAll(/\$\s?[\d.,]+/g)) importesValidos.add(normalizar(m[0]));
    return;
  }
  if (typeof nodo === 'number') {
    importesValidos.add(`$${nodo}`);
    return;
  }
  if (nodo && typeof nodo === 'object') Object.values(nodo).forEach(recolectar);
})(precios);

/** Los hex de marca.json, en minúscula. */
const hexValidos = new Set();
(function recolectarHex(nodo) {
  if (typeof nodo === 'string') {
    for (const m of nodo.matchAll(/#[0-9a-fA-F]{6}\b/g)) hexValidos.add(m[0].toLowerCase());
    return;
  }
  if (nodo && typeof nodo === 'object') Object.values(nodo).forEach(recolectarHex);
})(marca);

/* ------------------------------------------------------------------ *
 * Regla 1 — ninguna cifra fuera de precios.json
 * ------------------------------------------------------------------ */

/**
 * Los rangos se escriben '$80–$150' con guion largo. Al partirlos por importe
 * suelto, '$150' tiene que estar en la lista blanca — y lo está, porque
 * precios.json declara el tramo. Los que no estén son cifras inventadas.
 */
function reglaImportes() {
  for (const ruta of md) {
    if (saltar(ruta)) continue;

    for (const { n, contenido, codigo, exenta } of lineas(ruta)) {
      if (codigo || exenta) continue;
      for (const m of contenido.matchAll(/\$\s?[\d.,]+/g)) {
        const bruto = m[0];
        const norm = normalizar(bruto);
        if (importesValidos.has(norm)) continue;
        // '$1–2 al mes' deja un '$1' suelto que sí está declarado; si llega
        // aquí es que la cifra no existe en ningún sitio.
        error(rel(ruta), n, `Importe ${bruto} no existe en datos/precios.json`);
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * Regla 8 — los rangos se citan enteros
 * ------------------------------------------------------------------ */

/**
 * Detecta el mínimo de un rango citado a secas. Solo mira los mínimos que son
 * el extremo bajo de un rango declarado: si '$80' aparece sin '–$150' cerca y
 * sin la palabra «desde» delante, es una cita incompleta.
 */
function reglaRangos() {
  const rangos = [];
  (function buscar(nodo) {
    if (typeof nodo === 'string') {
      const m = nodo.match(/^\$([\d.,]+)[–-]\$([\d.,]+)$/);
      if (m) rangos.push({ min: `$${m[1]}`, texto: nodo });
      return;
    }
    if (nodo && typeof nodo === 'object') Object.values(nodo).forEach(buscar);
  })(precios);

  for (const ruta of md) {
    if (saltar(ruta)) continue;
    for (const { n, contenido, codigo, exenta } of lineas(ruta)) {
      if (codigo || exenta) continue;
      for (const { min, texto } of rangos) {
        // El rango entero en la línea: correcto
        if (contenido.includes(texto)) continue;
        const suelto = new RegExp(`(^|[^–\\-\\d])\\${min}(?![\\d.,–-])`);
        if (!suelto.test(contenido)) continue;
        // «desde $80» es la forma corta autorizada
        if (new RegExp(`desde\\s+\\${min}`, 'i').test(contenido)) continue;
        aviso(rel(ruta), n, `${min} es el mínimo del rango ${texto}: cítalo entero o con «desde»`);
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * Regla 3 — cero jerga
 * ------------------------------------------------------------------ */

const JERGA = [
  'Jamstack', 'CDN', 'LCP', 'SSG', 'headless', 'Lighthouse',
  'Core Web Vitals', 'scope creep', 'pipeline', 'onboarding',
];

/**
 * La jerga está prohibida en el COPY, no al nombrarla para prohibirla. Los
 * archivos que la enumeran como lista negra se saltan; en el resto, una
 * mención dentro de un renglón que ya habla de prohibir tampoco cuenta.
 */
const EXENTOS_JERGA = new Set([
  'CLAUDE.md',
  'orquestador/reglas.md',
  'orquestador/protocolo-entrega.md',
  'adn/02-voz-y-tono.md',
  'prompts/bloques/voz.md',
  'prompts/plataformas/grok.md',
  'prompts/plataformas/pomelli.md',
  'operacion/deuda-conocida.md',
  'herramientas/README.md',
]);

function reglaJerga() {
  for (const ruta of md) {
    if (saltar(ruta) || EXENTOS_JERGA.has(rel(ruta))) continue;
    for (const { n, contenido, codigo, exenta } of lineas(ruta)) {
      if (codigo || exenta) continue;
      for (const palabra of JERGA) {
        const re = new RegExp(`\\b${palabra.replace(/ /g, '\\s')}\\b`, 'i');
        if (re.test(contenido)) error(rel(ruta), n, `Jerga prohibida: «${palabra}»`);
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * Regla 5 — un solo acento cromático
 * ------------------------------------------------------------------ */

function reglaColor() {
  for (const ruta of md) {
    if (saltar(ruta)) continue;
    for (const { n, contenido, exenta } of lineas(ruta)) {
      if (exenta) continue;
      // Los hex sí se comprueban dentro de bloques de código: un prompt con el
      // naranja equivocado es exactamente el fallo que hay que cazar.
      for (const m of contenido.matchAll(/#[0-9a-fA-F]{6}\b/g)) {
        const hex = m[0].toLowerCase();
        if (hexValidos.has(hex)) continue;
        error(rel(ruta), n, `Color ${m[0]} no está en datos/marca.json`);
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * Tipografía — solo las familias declaradas en marca.json
 * ------------------------------------------------------------------ */

/**
 * Las familias que cualquier editor sugiere por defecto para el aspecto de
 * esta marca. Ninguna es de PanaClaw y todas entran por la misma puerta:
 * alguien maqueta una pieza partiendo de una plantilla, la fuente de la
 * plantilla se queda, y a la tercera pieza el sistema tiene cuatro familias
 * y ya no se reconoce.
 *
 * La lista blanca NO está aquí: sale de los campos `familia` de marca.json.
 * El día que el dueño de la marca adopte una de estas, la declara en el JSON
 * y este cepo deja de saltar solo, sin tocar el código.
 */
const FAMILIAS_VIGILADAS = [
  'Montserrat', 'Open Sans', 'Inter', 'Roboto', 'Poppins', 'Oswald',
  'Bebas Neue', 'Impact', 'Helvetica', 'Arial', 'Lato', 'Futura',
];

function reglaTipografia() {
  const declaradas = new Set();
  (function recolectar(nodo, clave) {
    if (typeof nodo === 'string') {
      if (clave === 'familia') declaradas.add(nodo.trim().toLowerCase());
      return;
    }
    if (nodo && typeof nodo === 'object') {
      for (const [k, v] of Object.entries(nodo)) recolectar(v, k);
    }
  })(marca, null);

  const vigiladas = FAMILIAS_VIGILADAS.filter((f) => !declaradas.has(f.toLowerCase()));

  for (const ruta of md) {
    if (saltar(ruta)) continue;
    for (const { n, contenido, exenta } of lineas(ruta)) {
      if (exenta) continue;
      for (const familia of vigiladas) {
        const re = new RegExp(`\\b${familia.replace(/ /g, '\\s')}\\b`);
        if (re.test(contenido)) {
          error(rel(ruta), n, `Tipografía «${familia}» no está declarada en datos/marca.json`);
        }
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * Enlaces internos
 * ------------------------------------------------------------------ */

function enlaces() {
  for (const ruta of md) {
    if (saltar(ruta)) continue;
    const base = dirname(ruta);
    for (const { n, contenido } of lineas(ruta)) {
      for (const m of contenido.matchAll(/\]\(([^)]+)\)/g)) {
        const destino = m[1].split('#')[0].trim();
        if (!destino || /^(https?:|mailto:)/.test(destino)) continue;
        if (!existsSync(resolve(base, destino))) {
          error(rel(ruta), n, `Enlace roto: ${destino}`);
        }
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * Huecos sin resolver
 * ------------------------------------------------------------------ */

// `TODO` y `TBD` piden dos puntos o paréntesis detrás a propósito: «todo» es
// una palabra española corriente y los titulares van en versalitas, así que
// /\bTODO\b/ a secas marcaba «SE CREA TODO A TU NOMBRE» como si fuera un
// marcador sin resolver. Un hueco de verdad se escribe TODO: o TODO(...).
const HUECOS = [/\[completa aquí\]/i, /<tu [^>]+>/i, /\bTODO\s*[:(]/, /\bTBD\s*[:(]?\b(?![a-záéíóúñ])/i, /XXXX/];

function huecos() {
  for (const ruta of md) {
    if (saltar(ruta)) continue;
    for (const { n, contenido, exenta } of lineas(ruta)) {
      if (exenta) continue;
      // Un aviso por línea, no uno por patrón: cuatro marcadores en el mismo
      // renglón son un renglón que corregir, no cuatro.
      if (HUECOS.some((re) => re.test(contenido))) {
        aviso(rel(ruta), n, `Hueco sin resolver: ${contenido.trim().slice(0, 60)}`);
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * El hub — la portada y el cotizador
 *
 * Desde que este repositorio publica algo, hay código de cara al cliente que
 * también puede desincronizarse de `datos/marca.json`, y el código no se
 * revisa leyéndolo: se revisa aquí.
 *
 * Se vigilan dos cosas y solo dos, que son las que se rompen solas:
 *
 *   · Ningún hex fuera de `datos/marca.json`. El día que alguien maquete un
 *     estado de error con un rojo cualquiera o un «correcto» con un verde, el
 *     acento único deja de ser único y nadie lo nota mirando la pantalla.
 *   · El trazado del logo pegado en `index.html` sigue siendo el de
 *     `marca.json`. Es una copia a propósito —esa página no se construye— y
 *     una copia sin vigilancia es una divergencia esperando su turno.
 *
 * Los importes NO se vigilan aquí, y es deliberado: el cotizador no escribe
 * ninguno. Los lee de `datos/precios.json` al arrancar, que es una garantía
 * más fuerte que cualquier comprobación de texto, y sus propias pruebas
 * (`npm test`) comprueban que lo que imprime coincide con lo declarado.
 *
 * ESCAPE EXPLÍCITO, igual que en los `.md`: una línea que termine en un
 * comentario `v: motivo` queda exenta. Lo usa `cotizador/src/pdf/marca.ts`
 * para los dos grises de papel, que no son de la paleta y están declarados.
 * ------------------------------------------------------------------ */

const ESCAPE_CODIGO = /(?:\/\*|\/\/)\s*v:\s*\S[^\n]*?(?:\*\/)?\s*$/;

/**
 * Lo que se publica: la portada, el código del cotizador, el contrato con el
 * servidor y el Worker que lo atiende.
 *
 * `worker/` y `compartido/` no pintan nada en pantalla y por eso no deberían
 * traer ni un hex —pero el día que alguien escriba ahí un color para un correo,
 * una tarjeta o un aviso, entrará por la misma puerta que el resto—.
 */
const RUTAS_DEL_HUB = ['index.html', 'cotizador/src', 'compartido', 'worker'];

function archivosDelHub() {
  const encontrados = [];
  for (const relativa of RUTAS_DEL_HUB) {
    const ruta = join(RAIZ, relativa);
    if (!existsSync(ruta)) continue;
    if (statSync(ruta).isDirectory()) {
      for (const ext of ['.ts', '.tsx', '.css', '.html']) listar(ruta, ext, encontrados);
    } else {
      encontrados.push(ruta);
    }
  }
  // Las pruebas quedan fuera: ahí un hex equivocado es justo lo que se está
  // comprobando que no pase.
  return encontrados.filter((ruta) => !/\.test\.[jt]sx?$/.test(ruta));
}

function reglaHub() {
  const archivos = archivosDelHub();

  for (const ruta of archivos) {
    readFileSync(ruta, 'utf8')
      .split('\n')
      .forEach((contenido, i) => {
        if (ESCAPE_CODIGO.test(contenido)) return;
        for (const m of contenido.matchAll(/#[0-9a-fA-F]{6}\b/g)) {
          if (hexValidos.has(m[0].toLowerCase())) continue;
          error(rel(ruta), i + 1, `Color ${m[0]} no está en datos/marca.json`);
        }
      });
  }

  const portada = join(RAIZ, 'index.html');
  if (existsSync(portada) && !readFileSync(portada, 'utf8').includes(marca.logo.pathSVG)) {
    error(
      'index.html',
      0,
      'El trazado del logo no coincide con datos/marca.json → logo.pathSVG. Cópialo de allí.',
    );
  }

  return archivos.length;
}

/* ------------------------------------------------------------------ *
 * Ejecución
 * ------------------------------------------------------------------ */

reglaImportes();
reglaRangos();
reglaJerga();
reglaColor();
reglaTipografia();
const archivosDeCodigo = reglaHub();
enlaces();
huecos();

const pintar = (lista, icono) => {
  for (const { archivo, linea, msg } of lista) {
    console.log(`  ${icono} ${archivo}:${linea}  ${msg}`);
  }
};

console.log(`\nPanaClaw Workspace — verificación`);
console.log(
  `${md.length} archivos .md · ${archivosDeCodigo} del hub · ` +
    `${importesValidos.size} importes declarados · ${hexValidos.size} colores declarados\n`,
);

if (avisos.length) {
  console.log(`Avisos (${avisos.length}):`);
  pintar(avisos, '·');
  console.log('');
}

if (errores.length) {
  console.log(`Errores (${errores.length}):`);
  pintar(errores, '✗');
  console.log(`\n✗ La verificación falló. Corrige el archivo, nunca los datos/*.json al revés.\n`);
  process.exit(1);
}

console.log('✓ Sin errores.\n');
