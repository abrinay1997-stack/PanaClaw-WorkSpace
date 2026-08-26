# Plataforma · Meta AI

Meta AI se usa para **dos cosas y ninguna más**: generar los fondos y montar el
documento HTML donde se ven las piezas ya compuestas y se descargan.

**No escribe una sola palabra de la marca.** Ese es el contrato entero de este
archivo, y hay una razón medida detrás.

---

## Lo que hace bien

1. **Genera el mundo visual.** La estética de materia oscura incandescente le
   sale a la primera y bastante consistente entre piezas.
2. **Devuelve un documento HTML completo**, con las imágenes dentro del propio
   archivo. Es lo que lo separa de un generador suelto: entrega el lote entero
   en un archivo que se abre en el navegador y no depende de nada externo.
3. **Sostiene la retícula si se la das en píxeles.** Si le das «x=72, y=248,
   132 px, interlínea 0.88» la respeta. Si le dices «bien maquetado», improvisa.
   Lo mismo con la holgura de las tildes: la aplica si se la das como cuenta, y
   la ignora si se la pides como criterio.

## Lo que hace mal, con la prueba delante

**Inventa datos con total fluidez y formato perfecto.** No es una sospecha: es lo
que devolvió la última vez que se le pasó un plan de contenido para que lo
maquetara, en la misma entrega que por lo demás estaba bien.

| Lo que escribió | Lo que es cierto |
|---|---|
| «$295 incluye dominio + alojamiento + código fuente primer año» | El dominio se renueva aparte, unos $15 al año |
| «entrega en 7 a 10 días» | Start entrega en 72 h |
| «cada segundo de carga = 7% menos conversión» | Nadie midió eso |
| «tu sitio tarda 4 segundos, pierdes 28% de ventas» | Nadie midió eso |
| «no usamos 47 complementos» | Cifra inventada |
| «nuestro proceso tiene 6 puertas» | Ese proceso no existe en el catálogo |
| «accesos: cpanel, ftp, base de datos» | No es lo que se entrega |
| Ocho hashtags por publicación | El tope son seis |

Ocho invenciones en doce publicaciones. Todas verosímiles, todas con la cifra
bien puesta, ninguna cierta. **Un modelo que inventa el 60 % de las piezas no
puede escribir el copy de una marca cuyo argumento es que no hay letra chica.**

De ahí sale la única regla dura de este archivo.

---

## El reparto del trabajo

```
CLAUDE          escribe el 100 % del texto, verificado contra datos/precios.json
  ↓             titulares, descripciones, hashtags, cortes de línea, qué va naranja
META AI         genera los fondos y monta el HTML
  ↓             copia el texto LITERAL. No lo redacta, no lo mejora, no lo acorta
HUMANO          descarga los PNG y publica
```

**Meta recibe el texto ya escrito y su trabajo es pegarlo, no producirlo.** La
instrucción que lo cierra va literal en el prompt maestro:

```
No escribas, no redactes, no completes, no acortes, no traduzcas y no
"mejores" ningún texto. Todo el texto de este documento ya está escrito más
abajo. Cópialo carácter por carácter, con sus tildes, sus eñes y sus puntos
finales. Si algo te parece incompleto, déjalo como está: está así a propósito.
No añadas ninguna cifra, porcentaje, estadística, plazo, testimonio ni
beneficio que no esté escrito literalmente en este documento.
```

Esa frase es lo primero que se comprueba al revisar lo que devuelva.

---

## El contrato del HTML

Lo que el documento tiene que traer. Va en el prompt maestro tal cual.

### Fuentes

```
Carga Antonio y Archivo desde Google Fonts:
https://fonts.googleapis.com/css2?family=Antonio:wght@700&family=Archivo:wght@300;400;500;700&display=swap
```

Sin esas dos, todo lo demás da igual: el navegador cae a una fuente del sistema
y la pieza deja de ser de la marca.

### El símbolo, literal — nunca se redibuja

**Regla inquebrantable, y hay una prueba delante.** Un prompt que describe el
símbolo en prosa —«una garra de tres zarpazos», «88 por 72 px, centrado»— no
basta: Meta AI lo interpretó y devolvió tres trazos blancos con `stroke`, que
no son el logo de esta marca. El símbolo real son **seis figuras rellenas**
—dos corchetes angulares, un punto romboidal y tres zarpazos— en `#FF5100`
plano. Va literal, en las dos versiones que hacen falta, y ninguna se
aproxima ni se redibuja:

**En la vista previa de cada pieza:**

```html
<svg width="88" height="72" viewBox="0 0 100 81.56" aria-hidden="true">
  <path fill="#FF5100" fill-rule="evenodd" d="M73.43 28.64L54.69 50.19L42.73 77.94L67.38 50.63L67.45 47.83L68.19 44.36Z M81.03 21.85L73.95 28.93L85.68 40.52L67.9 58.38L75.2 65.76L100 40.52Z M74.61 15.5L74.39 15.5L73.8 16.09L73.65 16.39L73.28 16.61L72.69 17.2L72.62 17.42L67.6 22.44L67.6 22.59L72.1 27.01L72.25 27.01L79.19 20.08Z M25.17 15.35L0 40.3L25.39 65.32L32.32 58.16L14.32 40.37L32.18 22.36Z M59.26 1.77L32.69 28.79L32.62 31.52L31.59 36.31L26.64 51.74L45.68 29.75L50.41 19.41Z M75.94 0.15L52.18 27.24L50.85 31L41.62 43.62L23.91 81.56L48.12 52.55L49.89 47.98L59.04 35.65Z"/>
</svg>
```

**En la función que dibuja el `<canvas>` de exportación —la misma que usan
todas las piezas—, el mismo trazado, como `Path2D`:**

```js
const SIMBOLO_PANACLAW = new Path2D("M73.43 28.64L54.69 50.19L42.73 77.94L67.38 50.63L67.45 47.83L68.19 44.36Z M81.03 21.85L73.95 28.93L85.68 40.52L67.9 58.38L75.2 65.76L100 40.52Z M74.61 15.5L74.39 15.5L73.8 16.09L73.65 16.39L73.28 16.61L72.69 17.2L72.62 17.42L67.6 22.44L67.6 22.59L72.1 27.01L72.25 27.01L79.19 20.08Z M25.17 15.35L0 40.3L25.39 65.32L32.32 58.16L14.32 40.37L32.18 22.36Z M59.26 1.77L32.69 28.79L32.62 31.52L31.59 36.31L26.64 51.74L45.68 29.75L50.41 19.41Z M75.94 0.15L52.18 27.24L50.85 31L41.62 43.62L23.91 81.56L48.12 52.55L49.89 47.98L59.04 35.65Z");

ctx.save();
ctx.translate(anchoLienzo / 2 - 44, yLogoTop); // yLogoTop = 96 en feed; su equivalente en story
ctx.scale(0.88, 0.88);                          // 88 / 100 = 0.88 — LOS DOS EJES, nunca uno distinto del otro
ctx.fillStyle = "#FF5100";
ctx.fill(SIMBOLO_PANACLAW, "evenodd");
ctx.restore();
```

Tres cosas que no se negocian, y las tres van literales en el prompt maestro:

```
1. fill, nunca stroke. Son seis figuras rellenas, no líneas ni trazos.
2. fill-rule="evenodd" en el SVG y ctx.fill(SIMBOLO, "evenodd") en el canvas.
   Sin esto los huecos de los corchetes se rellenan y el logo sale como una
   mancha.
3. La misma escala en los dos ejes — 0.88 y 0.88 —, nunca un eje distinto
   del otro. El símbolo no es cuadrado: 100 de ancho por 81.56 de alto.
   Escalarlo con ejes distintos lo deforma, y deformarlo está en la lista de
   usos prohibidos de datos/marca.json.
```

Es el mismo bloque en las N piezas del documento: no se redibuja, no se
aproxima, no se interpreta la descripción de arriba.

> **Comprobado en producción el 2026-08-26.** El lote de agosto de 2026 salió
> con las diecinueve piezas llevando el símbolo correcto —seis figuras
> rellenas, `#FF5100` plano, sin deformar—, y es la única parte del contrato
> que salió perfecta a la primera. La razón es exactamente que va como código
> literal y no como descripción. **No conviertas este bloque en prosa, no lo
> resumas y no lo sustituyas por una referencia a `marca.json`: se pega
> entero, tal cual, en cada prompt maestro.** Es el patrón a copiar cuando
> algo más de este contrato se rompa dos veces seguidas. Sale de
[`datos/marca.json`](../../datos/marca.json) → `logo.pathSVG`, y es el mismo
código que trae [`prompts/imagen/texto-en-imagen.md`](../imagen/texto-en-imagen.md)
→ «El rayo y el wordmark».

### Cada pieza, compuesta y a medida real

Cada diapositiva se dibuja a **1080×1350 exactos** —no «aproximadamente
vertical»— con la imagen de fondo a sangre, el velo encima y el texto compuesto
según [`prompts/imagen/texto-en-imagen.md`](../imagen/texto-en-imagen.md). Story
y reel, a **1080×1920**. Ese es el único maquetado que existe, y es el que se
exporta.

### El documento es una lista de publicaciones, no una rejilla de piezas

**Corregido el 2026-08-26, después del primer lote real.** El contrato anterior
solo decía «las piezas se colocan en una rejilla de columnas», y Meta AI hizo lo
único que se podía hacer con esa instrucción: metió cada publicación en una
celda de la rejilla. Como un carrusel de tres ocupa cinco veces el alto de una
pieza suelta, la rejilla salió dentada — columnas de alturas dispares, huecos de
media pantalla y piezas de dos publicaciones distintas una al lado de la otra.
El documento era ilegible para lo único que sirve, que es revisar un calendario.

Va literal en el prompt maestro:

```
El documento es una LISTA VERTICAL de publicaciones, una debajo de otra. NO
es una rejilla de piezas sueltas, y dos publicaciones distintas nunca
comparten fila.

Cada publicación es un bloque a todo el ancho, y dentro lleva, en este orden:

  1. Una cabecera de una línea, en Archivo 500 de 14 px con tracking 0.14em y
     color #BABABA, con el número, el formato y el tipo:
     «PUBLICACIÓN 04 · PIEZA SUELTA · CIFRA PUBLICADA»
     El nombre del tipo va escrito en la pieza; cópialo, no lo inventes.

  2. Si es un carrusel, la TIRA. Si es una pieza suelta, nada.

  3. Sus piezas en UNA fila horizontal: una sola si es suelta, las N
     diapositivas en orden si es carrusel. La fila se desplaza en horizontal
     dentro de su propio contenedor si no cabe (overflow-x: auto). No se
     parten en dos filas.

  4. Debajo, a todo el ancho del bloque y en una sola columna de texto de
     como mucho 720 px: la descripción, los hashtags y los botones.

Entre una publicación y la siguiente va una línea de 1 px en
rgba(255,247,247,0.10) y 48 px de aire por arriba y por abajo.
```

### La vista previa mide 480 de ancho, en todas

**Un tamaño de pantalla, escrito en píxeles, igual en las N piezas y en todos
los meses.** Dejarlo en «se puede ver reducida» es pedirle a Meta AI un
criterio, y este archivo ya sabe cómo acaba eso: un mes las piezas salen
enormes, al siguiente diminutas, y dentro del mismo documento no siempre
miden lo mismo.

**480 y no 360.** El primer lote salió a 360 y el dueño de la marca no podía
juzgar las piezas sin descargarlas: a un tercio, el titular se lee pero la
nota y el wordmark no, que es justo donde se cuelan los fallos. 480 es 1080
entre 2.25 exactos, deja el cuerpo de la nota por encima del umbral de lectura
y sigue permitiendo dos piezas por pantalla en un portátil.

La cuenta es 1080 ÷ 2.25. La pieza se construye a su tamaño real y **se encoge
entera con `transform`**, sin tocar ni una medida del maquetado: así lo que se
ve en pantalla es exactamente lo que va a salir en el PNG, solo que a 4/9.
Va literal en el prompt maestro:

```
La pieza se construye SIEMPRE a su tamaño real en píxeles —1080×1350 en
feed, 1080×1920 en story—, con todas sus medidas en px reales: cuerpos,
márgenes, retícula. No hagas una versión pequeña para la pantalla y otra
grande para el lienzo: se descuadran entre sí y la vista previa deja de
servir para revisar nada.

Para verla en pantalla se encoge entera, sin cambiar ni una medida:

  :root { --escala-vista: calc(480 / 1080); }   /* 1080 → 480 exactos */

  .marco        { box-sizing: border-box;
                  width: 480px; height: 600px; overflow: hidden; }
  .marco--story { height: 853px; }
  .pieza        { width: 1080px; height: 1350px;
                  transform: scale(var(--escala-vista));
                  transform-origin: top left; }
  .pieza--story { height: 1920px; }

La escala se escribe como esa división, no como 0.4444: redondeada a cuatro
decimales la pieza mide 479.95 y deja una rendija de fondo contra el borde
derecho del marco.

480 px de ancho es la vista previa de TODAS las piezas del documento, sea
cual sea el mes, el tipo de pieza o cuántas haya. No lo ajustes «para que se
vea mejor» y no lo cambies de una pieza a otra.

Cuatro cosas que fallan justo aquí:

1. transform NO encoge el sitio que la pieza ocupa en la página: escalada
   sigue ocupando 1080×1350. Por eso el marco lleva su ancho y su alto
   escritos —480×600, o 480×853 en story— y overflow:hidden. Sin marco, el
   documento se desplaza a lo ancho y deja huecos enormes entre piezas.

2. transform-origin: top left. Con el valor por defecto (center) la pieza se
   encoge hacia su centro y se sale del marco por arriba y por la izquierda.

3. Nada de vw, %, clamp() ni «que se adapte a la pantalla» para el tamaño de
   la vista previa. Es un número fijo: la misma pieza tiene que verse igual
   en un portátil que en un monitor grande. Lo que se adapta es cuántas
   piezas caben a lo ancho, nunca el tamaño de la pieza.

4. El borde y la sombra van en el MARCO, no en la pieza, y como outline o
   box-shadow, nunca como border. Dentro de la pieza, un borde de 1 px
   escalado a 4/9 se queda en menos de medio píxel y desaparece. Y un
   border en el marco empuja la pieza 1 px hacia dentro y le rasura el
   borde derecho y el inferior: outline se dibuja por fuera y no mueve
   nada.

Las piezas de una misma publicación van en una fila de marcos de 480 px con
24 px de separación, alineadas por arriba.
```

**No hace falta un zoom ni un «ver a tamaño real».** El tamaño real se ve
descargando el PNG, que es justo la comprobación que hay que hacer de todas
formas.

### Las dos coordenadas que hay que fijar, o las inventa

El primer lote las inventó porque este archivo no las decía, y acertó de
milagro. Van literales:

```
El wordmark se coloca por su LÍNEA BASE en y=1254, no por el borde superior
ni por el inferior de su caja. En HTML eso NO es «bottom: 96px»: es colocar
el elemento y comprobar que la línea base de las letras cae en 1254.

El numerador se coloca con su borde superior en y=56 y su borde derecho en
x=1008.
```

### El titular se compone línea a línea, con su holgura

**Cada línea del titular es su propio elemento.** Los cortes ya vienen decididos
en el texto de la pieza; el navegador no parte ninguna línea.

Y **el avance entre dos líneas no es un número fijo**: es una cuenta que depende
de lo que lleve cada una. La razón, medida en píxeles, está en
[`prompts/imagen/texto-en-imagen.md`](../imagen/texto-en-imagen.md). Esto es lo
que va literal en el prompt maestro:

```
Cada línea del titular es su propio bloque. La interlínea base es la de su
tamaño (0.88 en XL y L, 0.90 en M) y NO se aplica igual a todas las líneas:

  avance(n → n+1) = base
                  + 0.34  si la línea n+1 lleva Á, É, Í, Ó o Ú
                  + 0.27  si la línea n+1 lleva Ñ
                  + 0.25  si la línea n+1 lleva Ü
                  + 0.24  si la línea n   termina o lleva coma
                  + 0.22  si la línea n   lleva Q
                  + 0.20  si la línea n   lleva ¿
                  + 0.18  si la línea n   lleva ¡

De las de arriba manda una sola —la mayor— y de las de abajo también una
sola, la mayor; pero una de arriba y una de abajo SÍ se suman entre sí. **Se calcula para CADA par de líneas
consecutivas del titular, sin excepción — no solo para el primer par que se
note.** Un titular de cuatro líneas con tilde en la línea 2 y eñe en la línea
3 lleva DOS holguras distintas, una en cada par que la necesita. El error más
caro que se comete aquí no es olvidar la fórmula: es aplicarla al primer par
y dejar el resto del bloque en la interlínea base, como si ya estuviera
resuelto. Recorre las N líneas del titular una por una, del primer par al
último, y aplica la fórmula a cada uno — no hay un punto en el que ya se
puede dejar de calcularla.

En HTML esa holgura es un margen superior en «em» sobre la línea que la
necesita, con la interlínea base puesta en el bloque. En el lienzo de
exportación es ese mismo valor sumado al avance vertical de esa línea.

Antonio no rebaja los acentos en versalitas: la tilde de una Á sube 0.281 em
por encima de la letra. Sin esa holgura la tilde cae DENTRO de las letras de
la línea de arriba — 29 píxeles a tamaño 112 — y la pieza sale con las
líneas comidas. No subas la interlínea de todas las líneas para arreglarlo:
afloja el bloque entero y deja de ser el titular de esta marca.

Estos números no son «lo que sobresale la tinta» a secas: llevan dentro
0.079 em de hueco óptico, que a 112 px son unos 9 px. Una tilde que solo
libra la tinta por 2 px se sigue leyendo pegada a la línea de encima.

El bloque de texto no lleva recorte de ningún tipo. Con interlínea por
debajo de 1, la tinta de la primera línea sale por encima de su caja de
línea, y cualquier recorte le rasura la tilde.
```

### Botón de descarga

Cada pieza lleva su botón que la baja en PNG a tamaño real, dibujando la imagen
y el texto sobre un `<canvas>` de 1080×1350. Sin librerías externas: el lienzo
del navegador dibuja texto con tildes sin ningún problema, y las fuentes ya
están cargadas.

Y un botón que las descargue todas de una.

### Las nueve trampas del exportador

**Aquí es donde falla, y falla en silencio: la vista previa se ve perfecta y el
PNG sale roto.** Estas nueve van literales en el prompt maestro, porque no son
gustos — son fallos observados en documentos que por lo demás estaban bien. La
8 y la 9 salieron del lote de agosto de 2026, midiendo el PNG contra su vista
previa píxel a píxel.

```
1. ctx.letterSpacing NO se reinicia al cambiar ctx.font. Si lo usas para el
   tracking del wordmark, ponlo a '0px' inmediatamente después de dibujarlo.
   Si no, el tracking se filtra a la cifra, al antetítulo y al titular, y el
   titular se sale del lienzo.

2. NO uses ctx.textBaseline='top' para el titular con la Y del maquetado.
   Es la trampa que más caro sale y la que parece resuelta. 'top' ancla en el
   tope de la caja EM de la fuente; el navegador, con interlínea por debajo
   de 1, ancla la línea con medio interlineado NEGATIVO. Los dos anclajes no
   coinciden y el PNG entero sale unos 5 px por encima de la vista previa.

   Dibuja por LÍNEA BASE. Para cada línea del titular:

     ctx.textBaseline = 'alphabetic';
     const m = ctx.measureText('N');                  // versalita de control
     const medioInterlineado = (tamaño * base - (m.fontBoundingBoxAscent
                                + m.fontBoundingBoxDescent)) / 2;
     const lineaBase = topeDeLaCaja + medioInterlineado + m.fontBoundingBoxAscent;
     ctx.fillText(linea, 72, lineaBase);

   Y compruébalo: descarga una pieza, ponla sobre su vista previa y mira el
   desplazamiento. Por encima de 3 px, el anclaje está mal.

3. Mide el alto real del bloque de texto con getBoundingClientRect() del
   elemento ya maquetado. No lo estimes multiplicando líneas por interlínea:
   el anclaje al centro óptico se descuadra respecto a lo que se ve.

4. El símbolo EMPIEZA en y=96, no está centrado en y=96. Su caja va de 96 a
   168, y mide 88 de ancho por 72 de alto. No es cuadrado.

5. Un botón que lanza una descarga por pieza, todas seguidas, lo bloquea el
   navegador a la tercera. O agrupas en un ZIP de verdad, o el botón se llama
   "descargar una por una" y avisa de que hay que permitirlo.

6. El avance vertical entre líneas del titular NO es líneas × interlínea.
   Lleva la holgura de las tildes sumada línea a línea. Acumula el avance
   real; si lo calculas multiplicando, el PNG sale con las líneas comidas
   aunque la vista previa esté bien, o al revés.

7. En un carrusel, el fondo de cada diapositiva es un TROZO de una sola
   imagen. Se dibuja la panorámica entera desplazada −1080·k, no una imagen
   por diapositiva. Si recortas y reescalas cada trozo por separado, los
   redondeos dejan una línea de costura de uno o dos píxeles en cada corte.

8. La bajada y la nota SE PARTEN EN LÍNEAS en el lienzo, igual que en la
   vista previa. La bajada tiene un ancho máximo de 52 caracteres y la nota
   ocupa los 936 px útiles: en HTML el navegador las parte solo, y en el
   lienzo no las parte nadie. Mide con ctx.measureText palabra a palabra y
   corta donde cortaría el navegador. Si no lo haces, una nota larga sale
   en una sola línea que se va por el borde derecho del PNG mientras la
   vista previa se ve perfecta.

9. El brillo del fondo se aplica igual en los dos sitios. En HTML es
   filter: brightness(n) sobre el elemento del fondo; en el lienzo es
   ctx.filter = `brightness(${n})` ANTES del drawImage y ctx.filter='none'
   justo después. Si se queda puesto, el velo, el símbolo y el texto salen
   también atenuados y el PNG entero se ve más apagado que la vista previa.
```

**Y una comprobación que el humano hace, no el modelo:** descarga una pieza y
ponla al lado de su vista previa. Si no son idénticas, el exportador está mal y
lo están todas las del lote.

### Un carrusel se monta como una tira

Un carrusel **no son N piezas seguidas en el documento**: es una pieza larga
cortada. El documento tiene que dejar ver las dos cosas — la tira entera para
juzgar la continuidad, y cada diapositiva suelta para descargarla.

Va literal en el prompt maestro:

```
Un carrusel se muestra DOS veces en el documento:

1. Primero la tira: las N diapositivas en fila, pegadas por el borde, sin
   ninguna separación, margen ni borde entre ellas, todas a escala 0.2
   —216 px de ancho cada una—. Es la única vista donde se ven las costuras.
   Si las N no caben a lo ancho, la tira se desplaza horizontalmente dentro
   de su propio contenedor (overflow-x: auto). NO la encojas más para que
   quepa entera: por debajo de ese tamaño las costuras dejan de verse, que
   es lo único para lo que sirve la tira.

2. Debajo, cada diapositiva por separado, a la vista previa de 480 px como
   cualquier otra pieza, en una sola fila horizontal y con su botón de
   descarga.

El fondo del carrusel es UNA sola imagen panorámica que cubre 1080×N de
ancho por 1350 de alto. La diapositiva k NO lleva su propia imagen: lleva la
panorámica entera desplazada −1080·k. En la vista previa eso es una imagen
de fondo con background-position; en el lienzo de exportación es la misma
imagen dibujada con ese mismo desplazamiento.

El velo es vertical y con exactamente los mismos valores en las N
diapositivas. El brillo de la imagen es exactamente el mismo número en las
N. Si cambia entre diapositivas, aparece un escalón en cada costura.

El antetítulo, el anclaje del bloque de texto y el tamaño del titular no
cambian entre diapositivas del mismo carrusel salvo que el texto de cada una
lo diga.

El numerador va ENCENDIDO en carrusel: esquina superior derecha, x=1008,
formato 01/05, color #BABABA.
```

**Por qué la tira va primero.** Una diapositiva suelta puede estar perfecta y
romper el carrusel: un escalón de brillo o un punto focal partido por la mitad
solo se ven con las N pegadas. Si el documento no las enseña juntas, ese fallo
llega a la publicación.

### El resto del documento

Debajo de cada pieza, en texto seleccionable:

- La **descripción** de la publicación, tal cual
- Los **hashtags**, tal cual

Y **un botón que copie las dos cosas juntas al portapapeles**, en el orden y con
el formato con el que se pegan en Instagram: la descripción, una línea en blanco
y los hashtags en una sola línea. Es el gesto que se repite doce veces al mes, y
seleccionar a mano se come una tilde o deja media palabra fuera.

**El prompt del fondo NO va en el documento.** La imagen ya está generada y
metida dentro del archivo: enseñar al lado la receta de algo que ya existe solo
alarga la página. Si hay que regenerar un fondo, el prompt sigue estando en el
prompt maestro, que es de donde salió.

Va literal en el prompt maestro:

```
Debajo de cada pieza van su descripción y sus hashtags en texto
seleccionable, y un botón «Copiar descripción» que copie las dos cosas de una
vez: la descripción, una línea en blanco, y los hashtags en una sola línea
separados por un espacio.

El botón confirma que copió —cambia a «Copiado» un par de segundos y vuelve—
porque el portapapeles no se ve y si no confirma se pulsa dos veces.

Copia desde una constante de JavaScript con el texto literal, no leyendo el
HTML ya pintado. Leer del DOM devuelve el texto con los saltos de línea y los
espacios que decidió el navegador, no los que están escritos aquí.

El documento se abre con doble clic desde el disco, y ahí navigator.clipboard
no siempre existe. Envuélvelo en try/catch y cae a un <textarea> oculto con
document.execCommand('copy'). Sin esa caída el botón no hace nada y tampoco
avisa de que no hizo nada.

En un carrusel el botón es UNO para toda la pieza, no uno por diapositiva: la
descripción y los hashtags son de la publicación entera.

No pongas el prompt del fondo en el documento. La imagen ya está generada
dentro del archivo y repetir su receta no sirve para nada.
```

### La interfaz del documento

Fondo `#100101`, texto `#FFF7F7`, acento `#FF5100`. Es una herramienta interna,
pero se ve todo el mes: si el documento es feo, las piezas parecen feas.

---

## Cómo se le pide

El prompt maestro lo arma
[`skills/contenido-instagram/SKILL.md`](../../skills/contenido-instagram/SKILL.md).
El orden importa y es este:

```
1. QUÉ ERES Y QUÉ NO HACES      el reparto del trabajo, la prohibición de escribir
2. EL SISTEMA VISUAL            hex, tipografías, retícula, escala, velo
3. EL CONTRATO DEL HTML         fuentes, medidas, descarga
4. EL BLOQUE DE ESTILO          literal, de bloques/estilo-visual.md
5. LOS NEGATIVOS                literal, de bloques/negativos.md
6. LAS PIEZAS                   una por una, con su texto ya escrito y su fondo
7. LA VERIFICACIÓN              lo que tiene que comprobar antes de devolver
```

**La prohibición de escribir va la primera y se repite en la séptima.** Una sola
vez, al principio de un prompt largo, se le olvida a la mitad.

---

## Qué revisar cuando devuelva el documento

Los cinco fallos, por frecuencia:

| Fallo | Cómo se ve | Qué se le dice |
|---|---|---|
| **Reescribió un texto** | Una descripción que suena parecida pero no igual | «El texto de la pieza N no coincide con el que te di. Cópialo literal.» |
| **Añadió una cifra** | Un porcentaje o una estadística que no le diste | «Quita el dato de la pieza N. No estaba en lo que te pasé.» |
| **Se comió una tilde** | «CODIGO TUYO» | «Faltan tildes en la pieza N. El texto correcto es: …» |
| **Metió texto en la imagen** | Letras dentro del fondo generado | «El fondo de la pieza N tiene letras. Regenéralo sin ningún texto.» |
| **El lienzo no mide 1080×1350** | El PNG descargado sale de otro tamaño | «El lienzo de exportación tiene que ser exactamente 1080×1350.» |
| **Aplicó la interlínea igual a todas las líneas** | Una tilde o una eñe metida dentro de las letras de la línea de encima | «Falta la holgura del titular de la pieza N. La línea que lleva la tilde avanza 0.34 más; la que lleva eñe, 0.27; y la que va debajo de una coma, 0.24 más.» |
| **Aplicó la tabla vieja** | La tilde no se solapa, pero se lee soldada a la línea de encima: menos de 3 px de aire | «Las holguras son 0.34 / 0.27 / 0.25 arriba y 0.24 / 0.22 / 0.20 / 0.18 abajo. Con 0.27 y 0.17 la tilde queda a 1.8 px y se lee pegada.» |
| **Subió la interlínea de todas** | El bloque del titular se ve suelto y ya no compacto | «La interlínea base sigue siendo 0.88. La holgura va solo en las líneas que la necesitan.» |
| **Calculó la holgura solo para un par de líneas** | Un titular de varias líneas donde una tilde o una eñe se come la línea de encima, pero solo en una de las transiciones — el resto del bloque sí quedó bien | «Recalcula la holgura de CADA par de líneas de la pieza N, no solo del primero. La línea X necesita su holgura igual que la línea Y — corre la fórmula línea por línea hasta la última.» |
| **Redibujó el símbolo en vez de copiar el SVG/Path2D** | Trazos con `stroke`, blancos o de otro color, en vez de las seis figuras rellenas en `#FF5100` | «El símbolo de la pieza N no es el de PanaClaw. Reemplázalo por el bloque SVG/Path2D literal de la sección "El símbolo, literal" de este documento: fill, `fill-rule="evenodd"`, escala 0.88 en los dos ejes. No lo redibujes.» |
| **Generó un fondo por diapositiva** | Al poner el carrusel en tira, cada corte es una imagen distinta | «El fondo del carrusel es una sola panorámica cortada. Usa la misma imagen desplazada −1080·k en cada diapositiva.» |
| **Cambió el brillo entre diapositivas** | Un escalón de luz en la costura | «El brillo de la imagen es el mismo número en las N diapositivas.» |
| **Dejó el prompt del fondo debajo de la pieza** | Un párrafo con la receta de la imagen que ya está ahí arriba | «Quita el prompt del fondo del documento. Debajo de cada pieza van la descripción, los hashtags y el botón de copiar, nada más.» |
| **El botón de copiar no copia** | Se pulsa, no confirma nada y el portapapeles sigue igual | «El botón de copiar tiene que caer a un `<textarea>` oculto con `execCommand('copy')` cuando `navigator.clipboard` no esté, y confirmar con «Copiado». El documento se abre desde el disco.» |
| **La vista previa sale de otro tamaño** | Las piezas se ven enormes o diminutas, o no todas miden lo mismo | «La vista previa mide 480 px de ancho en todas las piezas: la pieza se construye a 1080 y se escala calc(480/1080). No la adaptes a la pantalla.» |
| **Metió las publicaciones en una rejilla** | Columnas de alturas dispares, huecos de media pantalla, piezas de dos publicaciones en la misma fila | «El documento es una lista vertical de publicaciones. Cada una ocupa una fila entera con su cabecera, sus piezas en fila y su descripción debajo. Dos publicaciones nunca comparten fila.» |
| **El PNG no coincide con la vista previa** | Al superponerlos, el texto del PNG cae unos píxeles más arriba | «Dibuja el titular por línea base, no con textBaseline='top': con interlínea por debajo de 1 los dos anclajes no coinciden. La cuenta está en la trampa 2.» |
| **Escaló la pieza sin marco** | Huecos enormes entre piezas y la página se desplaza a lo ancho | «El marco lleva su ancho y su alto escritos (360×450) con overflow:hidden, y la pieza va con transform-origin: top left.» |

**Cuenta los hashtags de cada pieza.** Es lo que más se le va: le das seis y
devuelve nueve.

**Y mira los carruseles en tira antes que sueltos.** Las costuras no se ven de
ninguna otra manera.

---

## Lo que no se le pide nunca

- Que escriba, sugiera o mejore copy
- Que proponga publicaciones que no estén en el plan
- Que ajuste un precio «para que se lea mejor»
- Que resuma la lista de lo que NO incluye
- Que traduzca al inglés
- Que añada emojis a un titular o dentro de una imagen

Nada de lo que devuelva se publica sin pasar por
[`orquestador/protocolo-entrega.md`](../../orquestador/protocolo-entrega.md).
