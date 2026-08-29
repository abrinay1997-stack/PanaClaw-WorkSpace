/**
 * Arma `publico/`, que es lo que se publica.
 *
 *   publico/index.html      la portada del hub, copiada tal cual
 *   publico/hub/assets/     su icono
 *   publico/cotizador/      el cotizador y el panel de clientes, ya construidos
 *
 * Es la carpeta que Cloudflare sirve desde el borde (`assets` en
 * `wrangler.jsonc`); el Worker solo se ejecuta para `/api/*`. La misma carpeta
 * vale para la vista previa de Netlify, que se construye con `VITE_DEMO=1` y no
 * tiene servidor detrás.
 *
 * La portada no se construye: es un `index.html` con los estilos dentro y sin
 * dependencias, y esa propiedad —abrirla con doble clic y verla igual que
 * publicada— vale más que meterla en el empaquetador para no ganar nada.
 *
 * El orden importa. Primero se verifica el repositorio, después se prueban las
 * reglas de precio, y solo entonces se construye. Si algo de eso falla,
 * `publico/` se queda vacío en vez de quedarse a medias, y no se publica nada.
 * Es deliberado: una herramienta que cotiza mal es peor que una herramienta
 * caída, porque la caída se nota.
 */

import { execFileSync } from 'node:child_process';
import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = dirname(dirname(fileURLToPath(import.meta.url)));
const destino = join(raiz, 'publico');

const correr = (orden, argumentos) =>
  execFileSync(orden, argumentos, { cwd: raiz, stdio: 'inherit' });

console.log('· Verificando el repositorio…');
correr('node', ['herramientas/verificar.mjs']);

console.log('· Probando las reglas del cotizador…');
correr('npm', ['--prefix', 'cotizador', 'run', 'test']);

await rm(destino, { recursive: true, force: true });
await mkdir(destino, { recursive: true });

console.log('· Construyendo el cotizador…');
correr('npm', [
  '--prefix',
  'cotizador',
  'run',
  'build',
  '--',
  '--outDir',
  '../publico/cotizador',
  '--emptyOutDir',
]);

console.log('· Copiando la portada…');
for (const archivo of ['index.html', 'hub']) {
  await cp(join(raiz, archivo), join(destino, archivo), { recursive: true });
}

console.log('Listo. `publico/` preparado para `wrangler deploy`.');
