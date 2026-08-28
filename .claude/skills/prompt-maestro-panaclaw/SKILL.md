---
name: prompt-maestro-panaclaw
description: La ficha de marca de PanaClaw para producir lotes de piezas de redes sociales — el logo como código literal, la paleta, la retícula, las holguras de interlínea medidas sobre Antonio 700, y las reglas duras del repositorio. Úsala siempre que el encargo sea de PanaClaw y toque contenido de Instagram o Facebook — un calendario del mes, doce publicaciones, los creativos de la semana, un carrusel, o el prompt maestro para que Meta AI monte las piezas. También al auditar el HTML que Meta devolvió, o al revisar por qué una pieza de PanaClaw no salió bien. Aporta los datos; el procedimiento lo pone la skill prompt-maestro, que se carga junto con esta. Si el encargo es de otra marca, usa prompt-maestro sola.
---

# PanaClaw · la ficha de marca

**Esto son los datos. El procedimiento está en la skill `prompt-maestro`** — cárgala
también, porque aquí no se repite: si el método viviera en dos sitios, el día que se
mejore uno el otro se queda viejo y nadie se entera.

Esta skill aporta cuatro cosas que `prompt-maestro` pide y que solo PanaClaw puede
dar: **el logo**, la ficha rellena, el mapa del repositorio y las reglas duras.

---

## 1 · El logo. Esto es lo que no se negocia

Va **literal, como código**, en las dos versiones. Nunca descrito. Un modelo al que
se le describe «una garra de tres zarpazos atravesando unos corchetes» devuelve tres
trazos blancos con `stroke` que no son esta marca — está comprobado, pasó.

**Y está también como archivo**, para que nadie tenga que transcribirlo:

| Archivo | Para qué |
|---|---|
| [`assets/logo-original.svg`](assets/logo-original.svg) | El original del repositorio, tal cual |
| [`assets/logo-pieza.svg`](assets/logo-pieza.svg) | Listo para pegar en una pieza, con color y medidas puestos |
| [`assets/logo-canvas.js`](assets/logo-canvas.js) | El `Path2D` y la función que lo coloca en el lienzo |

Los tres llevan el mismo trazado que `datos/marca.json` → `logo.pathSVG`. Si tienes
el repositorio delante, ese JSON manda.

**En la vista previa de cada pieza:**

```html
<svg width="88" height="72" viewBox="0 0 100 81.56" aria-hidden="true">
  <path fill="#FF5100" fill-rule="evenodd" d="M73.43 28.64L54.69 50.19L42.73 77.94L67.38 50.63L67.45 47.83L68.19 44.36Z M81.03 21.85L73.95 28.93L85.68 40.52L67.9 58.38L75.2 65.76L100 40.52Z M74.61 15.5L74.39 15.5L73.8 16.09L73.65 16.39L73.28 16.61L72.69 17.2L72.62 17.42L67.6 22.44L67.6 22.59L72.1 27.01L72.25 27.01L79.19 20.08Z M25.17 15.35L0 40.3L25.39 65.32L32.32 58.16L14.32 40.37L32.18 22.36Z M59.26 1.77L32.69 28.79L32.62 31.52L31.59 36.31L26.64 51.74L45.68 29.75L50.41 19.41Z M75.94 0.15L52.18 27.24L50.85 31L41.62 43.62L23.91 81.56L48.12 52.55L49.89 47.98L59.04 35.65Z"/>
</svg>
```

**En el lienzo de exportación, el mismo trazado como `Path2D`:**

```js
const SIMBOLO_PANACLAW = new Path2D("M73.43 28.64L54.69 50.19L42.73 77.94L67.38 50.63L67.45 47.83L68.19 44.36Z M81.03 21.85L73.95 28.93L85.68 40.52L67.9 58.38L75.2 65.76L100 40.52Z M74.61 15.5L74.39 15.5L73.8 16.09L73.65 16.39L73.28 16.61L72.69 17.2L72.62 17.42L67.6 22.44L67.6 22.59L72.1 27.01L72.25 27.01L79.19 20.08Z M25.17 15.35L0 40.3L25.39 65.32L32.32 58.16L14.32 40.37L32.18 22.36Z M59.26 1.77L32.69 28.79L32.62 31.52L31.59 36.31L26.64 51.74L45.68 29.75L50.41 19.41Z M75.94 0.15L52.18 27.24L50.85 31L41.62 43.62L23.91 81.56L48.12 52.55L49.89 47.98L59.04 35.65Z");

ctx.save();
ctx.translate(anchoLienzo / 2 - 44, 96);
ctx.scale(0.88, 0.88);
ctx.fillStyle = "#FF5100";
ctx.fill(SIMBOLO_PANACLAW, "evenodd");
ctx.restore();
```

**Cuatro cosas, y las cuatro se rompen solas si no van escritas:**

1. **`fill`, nunca `stroke`.** Son seis figuras rellenas —dos corchetes angulares, un
   punto romboidal y tres zarpazos—, no líneas.
2. **`fill-rule="evenodd"`** en el SVG y `ctx.fill(SIMBOLO, "evenodd")` en el lienzo.
   Sin eso los huecos de los corchetes se rellenan y el logo sale como una mancha.
3. **La misma escala en los dos ejes**, 0.88 y 0.88. El símbolo **no es cuadrado**:
   100 de ancho por 81.56 de alto. Meterlo en una caja cuadrada lo deforma, y
   deformarlo está en la lista de usos prohibidos.
4. **`#FF5100` plano, sin degradado.** A 88 píxeles el degradado a ember no se ve y
   solo ensucia el borde.

**Posición:** 88 × 72, centrado horizontalmente, **borde superior en y=96** — su caja
va de 96 a 168. No está centrado en 96.

**El wordmark:** `PANACLAW` entero en `#FFF7F7` seguido de un punto en `#FF5100`.
Archivo 700, 30 px, tracking 0.22em, alineado en x=72, **línea base en y=1254**. No
se parte en dos colores.

> **Comprobado en producción.** En el lote de agosto, el logo salió idéntico en las
> diecinueve piezas. Fue lo único del prompt que no falló, y la razón es esta: fue lo
> único que iba como código en vez de como prosa.

---

## 2 · La ficha

[`assets/ficha-panaclaw.json`](assets/ficha-panaclaw.json) — generada desde el
repositorio, no escrita a mano. La leen los scripts de `prompt-maestro`:

```bash
# desde la raíz del repositorio PanaClaw-WorkSpace
node .claude/skills/prompt-maestro/scripts/verificar-lote.mjs prompt.txt \
  --marca .claude/skills/prompt-maestro-panaclaw/assets/ficha-panaclaw.json \
  --adn adn \
  --indice operacion/publicado.md
```

**La ficha es un espejo, no una fuente.** Si un precio cambia, cambia en
`datos/precios.json` del repositorio y de ahí baja aquí. Nunca al revés — y si
encuentras una contradicción entre las dos, manda el repositorio y la ficha está
vieja.

Lo que ya trae resuelto y no hay que volver a decidir:

| | |
|---|---|
| Interlínea | Medida el 2026-08-26 sobre Antonio 700. `0.34 / 0.27 / 0.25` arriba, `0.24 / 0.22 / 0.20 / 0.18` abajo |
| Retícula | Márgenes 72, ancho útil 936, tres anclajes en 248 / 594 / 1112 |
| Paleta | `#100101` fondo, `#FFF7F7` texto, `#BABABA` secundario, `#FF5100` acento |
| Tipografía | Antonio 700 en titular y cifra, Archivo en todo lo demás. No se cruzan |
| Rangos y sumas | Los cuatro rangos declarados, y las listas que cazan una suma prohibida |
| Fronteras | Care/Seguridad y Diagnóstico/Auditoría, con su frase oficial |

---

## 3 · Las cinco reglas que cuestan clientes

Están enteras en `orquestador/reglas.md` del repositorio, y la ficha las lleva en
forma de lista para que el verificador las cace. El resumen que hay que tener en la
cabeza mientras se escribe:

1. **Ninguna cifra que no esté en `datos/precios.json`.** No inventes, no redondees,
   no estimes. Si falta un precio, ese producto no existe todavía: dilo y para.
2. **Un pago único y una mensualidad NUNCA se suman.** Dos totales separados,
   siempre. Sumarlos da un número creíble y falso.
3. **Cero jerga.** Solo los nombres que un dueño de negocio panameño ya reconoce:
   WordPress, Google, WhatsApp, Instagram, Yappy, GitHub.
4. **Nada de datos inventados.** Métricas, testimonios, casos y logos solo si están
   verificados y con fecha.
5. **Un solo acento cromático: naranja `#FF5100`.** El rojo `#FF1E1E` es exclusivo de
   fondos y jamás toca un texto. Nada de azul, nunca.

**Y la que no está en esa lista pero define la marca:** *di qué NO incluye*. Si la
pieza dice una cifra o un plazo, lleva su nota de límite. Es la firma de PanaClaw y
aplica también al trabajo propio.

---

## 4 · Dónde está cada cosa en el repositorio

El mapa completo, con qué leer según lo que pidan, está en
[`references/el-repositorio.md`](references/el-repositorio.md). Lo imprescindible:

| Para | Lee |
|---|---|
| Cualquier texto de cara al cliente | `adn/02-voz-y-tono.md`, `05-personalidad.md`, `06-claridad.md`, `07-redaccion.md` |
| Cualquier cifra | `datos/precios.json` — en el momento de escribirla, no de memoria |
| El público del lote y sus objeciones | `adn/04-audiencia.md` |
| Los cinco tipos de publicación y su mezcla | `prompts/texto/organico.md` |
| Lo que ya salió, para no repetirlo | `operacion/publicado.md` — **antes** de escribir |
| Si el lote toca Care, Seguridad, Diagnóstico o Auditoría | `catalogo/08-fronteras.md`, obligatorio |

Y antes de dar nada por bueno: `node herramientas/verificar.mjs` en el repositorio,
que vigila las reglas 1, 3, 5 y 8 sin pedirle permiso a nadie.

---

## 5 · Lo propio de PanaClaw que la ficha no puede llevar

Tres cosas que son criterio, no dato, y que `prompt-maestro` no puede saber:

**Un lote es de un producto y un público.** Los seis públicos están en
`adn/04-audiencia.md` y son momentos, no demografías. Rotar entre ellos dentro del
mismo lote no construye argumento.

**La mezcla de tipos.** Para doce publicaciones: 4 cifra publicada, 3 desastre
explicado, 3 objeción contestada, 1 frontera, 1 trabajo enseñado. El «trabajo
enseñado» **solo entra si hay un proyecto publicado y verificado que encaje**; si no
lo hay, se sustituye por otra cifra publicada y **se dice al entregar**, no cuando
toque producirla.

**La escena madre.** La tabla de escena canónica por producto está en
`prompts/README.md` y se respeta: es lo que hace que alguien reconozca el tema sin
leer. Dentro de la escena madre se varía distancia, ángulo, cantidad o momento — **el
bloque de estilo no varía nunca.** Si varían el estilo y el sujeto a la vez, no es un
lote: son N imágenes sueltas.
