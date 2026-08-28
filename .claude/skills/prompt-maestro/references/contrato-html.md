# El contrato del HTML

> **Precedencia.** Si la marca ya tiene este contrato escrito —PanaClaw lo tiene en
> `prompts/plataformas/meta-ai.md`, y con más detalle que aquí—, **manda el suyo**.
> Este archivo existe para las marcas que no lo tienen, y para no perder lo
> aprendido cuando se empieza con un cliente nuevo. Dos copias de la misma verdad
> es exactamente el fallo que produjo la tabla de interlínea equivocada.

**Esta es la parte que no cambia de una marca a otra.** Se copia casi entera en la
sección 3 del prompt maestro; lo único que se sustituye son las medidas del lienzo y
los colores de la interfaz del documento.

Todo lo de aquí son fallos observados en documentos que por lo demás estaban bien.
Ninguno es un gusto.

---

## Las fuentes

```
Carga las tipografías desde Google Fonts, en una sola etiqueta:
<link href="https://fonts.googleapis.com/css2?family=…&display=swap" rel="stylesheet">
```

Sin esto, todo lo demás da igual: el navegador cae a una fuente del sistema y la
pieza deja de ser de la marca. Si la tipografía no está en Google Fonts, va incrustada
como `@font-face` con la fuente en base64 dentro del propio archivo.

**Y espera a `document.fonts.ready` antes de dibujar cualquier lienzo.** Exportar con
la fuente a medio cargar produce un PNG con la métrica del sistema.

---

## Cada pieza, a medida real

Cada pieza y cada diapositiva se dibuja a las medidas exactas del canal. No
«aproximadamente vertical». El lienzo de exportación se escribe como número.

---

## El documento es una lista de publicaciones, no una rejilla

Va literal en el prompt maestro:

```
El documento es una LISTA VERTICAL de publicaciones, una debajo de otra. NO es
una rejilla de piezas sueltas, y dos publicaciones distintas nunca comparten
fila.

Cada publicación es un bloque a todo el ancho y lleva dentro, en este orden:

  1. Una cabecera de una línea con el número, el formato y el tipo. Está escrita
     en cada pieza de la sección 6; cópiala literal, no la inventes.

  2. Si es un carrusel, la TIRA. Si es una pieza suelta, nada.

  3. Sus piezas en UNA fila horizontal: una sola si es suelta, las N diapositivas
     en orden si es carrusel, con separación entre marcos y alineadas por arriba.
     Si no caben a lo ancho, la fila se desplaza en horizontal dentro de su propio
     contenedor (overflow-x: auto). No se parten en dos filas.

  4. Debajo, en una columna de texto estrecha: la descripción, los hashtags y los
     botones.

Entre una publicación y la siguiente, una línea de 1 px y aire por arriba y por
abajo.
```

**Por qué.** El contrato anterior de este sistema solo decía «las piezas se colocan en
una rejilla de columnas», y el modelo hizo lo único que se podía hacer con esa
instrucción: metió cada publicación en una celda. Como un carrusel de tres ocupa cinco
veces el alto de una pieza suelta, la rejilla salió dentada — columnas de alturas
dispares, huecos de media pantalla y piezas de dos publicaciones una al lado de la
otra. El documento era ilegible para lo único que sirve, que es revisar un lote.

---

## La vista previa: un tamaño fijo, igual en todas

Dejarlo en «se puede ver reducida» es pedirle un criterio al modelo, y así acaba: un
lote las piezas salen enormes, al siguiente diminutas, y dentro del mismo documento
no siempre miden lo mismo.

**Elige una división exacta del ancho real** y escríbela como división, no como
decimal. Para un lienzo de 1080, `calc(480 / 1080)` da 480 px exactos; escrito como
`0.4444` la pieza mide 479.95 y deja una rendija de fondo contra el borde del marco.

**Y no lo pongas demasiado pequeño.** A un tercio del tamaño real el titular se lee
pero la nota y el wordmark no — que es justo donde se cuelan los fallos. Si hay que
descargar el PNG para juzgar una pieza, la vista previa no está haciendo su trabajo.

```
La pieza se construye SIEMPRE a su tamaño real en píxeles, con todas sus medidas
en px reales: cuerpos, márgenes, retícula. No hagas una versión pequeña para la
pantalla y otra grande para el lienzo: se descuadran entre sí y la vista previa
deja de servir para revisar nada.

Para verla en pantalla se encoge entera, sin cambiar ni una medida:

  :root { --escala-vista: calc(480 / 1080); }

  .marco { box-sizing: border-box;
           width: 480px; height: 600px; overflow: hidden; }
  .pieza { width: 1080px; height: 1350px;
           transform: scale(var(--escala-vista));
           transform-origin: top left; }

Cuatro cosas que fallan justo aquí:

1. transform NO encoge el sitio que la pieza ocupa en la página: escalada sigue
   ocupando su tamaño real. Por eso el marco lleva su ancho y su alto escritos y
   overflow:hidden. Sin marco, el documento se desplaza a lo ancho y deja huecos
   enormes entre piezas.

2. transform-origin: top left. Con el valor por defecto (center) la pieza se
   encoge hacia su centro y se sale del marco por arriba y por la izquierda.

3. Nada de vw, %, clamp() ni «que se adapte a la pantalla» para el tamaño de la
   vista previa. Es un número fijo: la misma pieza tiene que verse igual en un
   portátil que en un monitor grande. Lo que se adapta es cuántas piezas caben a
   lo ancho, nunca el tamaño de la pieza.

4. El borde y la sombra van en el MARCO, no en la pieza, y como outline o
   box-shadow, nunca como border. Dentro de la pieza, un borde de 1 px escalado
   se queda en menos de medio píxel y desaparece. Y un border en el marco empuja
   la pieza 1 px hacia dentro y le rasura el borde derecho y el inferior: outline
   se dibuja por fuera y no mueve nada.
```

---

## El titular se compone línea a línea

Cada línea del titular es su propio elemento. Los cortes vienen decididos en el texto
de la pieza; **el navegador no parte ninguna línea**. Y la holgura de interlínea va
como margen superior en `em` sobre la línea que la necesita, con la interlínea base
puesta en el bloque.

**El bloque de texto no lleva recorte de ningún tipo.** Con interlínea por debajo de
1, la tinta de la primera línea sale por encima de su caja de línea, y cualquier
recorte le rasura la tilde.

---

## Las nueve trampas del exportador

**Aquí es donde falla, y falla en silencio: la vista previa se ve perfecta y el PNG
sale roto.** Van literales en el prompt maestro.

```
1. ctx.letterSpacing NO se reinicia al cambiar ctx.font. Si lo usas para el
   tracking de algún elemento, ponlo a '0px' inmediatamente después de dibujarlo.
   Si no, el tracking se filtra a los elementos siguientes y el titular se sale
   del lienzo.

2. NO uses ctx.textBaseline='top' para el titular con la Y del maquetado. Es la
   trampa que más caro sale y la que parece resuelta. 'top' ancla en el tope de
   la caja EM de la fuente; el navegador, con interlínea por debajo de 1, ancla
   la línea con medio interlineado NEGATIVO. Los dos anclajes no coinciden y el
   PNG entero sale unos 5 px por encima de la vista previa.

   Dibuja por LÍNEA BASE. Para cada línea del titular:

     ctx.textBaseline = 'alphabetic';
     const m = ctx.measureText('N');
     const medioInterlineado = (tamaño * base
                                - (m.fontBoundingBoxAscent
                                 + m.fontBoundingBoxDescent)) / 2;
     const lineaBase = topeDeLaCaja + medioInterlineado
                                    + m.fontBoundingBoxAscent;
     ctx.fillText(linea, x, lineaBase);

3. Mide el alto real del bloque de texto con getBoundingClientRect() del elemento
   ya maquetado. No lo estimes multiplicando líneas por interlínea: el anclaje se
   descuadra respecto a lo que se ve.

4. Coloca el logo por el borde que diga la retícula. «Empieza en y=N» y «está
   centrado en y=N» son dos cosas distintas y se confunden siempre.

5. Un botón que lanza una descarga por pieza, todas seguidas, lo bloquea el
   navegador a la tercera. O agrupas en un ZIP de verdad, o el botón se llama
   "descargar una por una" y avisa de que hay que permitirlo.

6. El avance vertical entre líneas del titular NO es líneas × interlínea. Lleva
   la holgura sumada línea a línea, con la tabla que trae cada pieza. Acumula el
   avance real; si lo calculas multiplicando, el PNG sale con las líneas comidas
   aunque la vista previa esté bien, o al revés.

7. En un carrusel, el fondo de cada diapositiva es un TROZO de una sola imagen.
   Se dibuja la panorámica entera desplazada −ancho·k, no una imagen por
   diapositiva. Si recortas y reescalas cada trozo por separado, los redondeos
   dejan una línea de costura de uno o dos píxeles en cada corte.

8. Los textos de varias líneas SE PARTEN EN LÍNEAS en el lienzo, igual que en la
   vista previa. En HTML el navegador los parte solo; en el lienzo no los parte
   nadie. Mide con ctx.measureText palabra a palabra y corta donde cortaría el
   navegador. Si no lo haces, una nota larga sale en una sola línea que se va por
   el borde derecho del PNG mientras la vista previa se ve perfecta.

9. El brillo del fondo se aplica igual en los dos sitios. En HTML es
   filter: brightness(n) sobre el elemento del fondo; en el lienzo es
   ctx.filter = `brightness(n)` ANTES del drawImage y ctx.filter = 'none' justo
   después. Si se queda puesto, todo lo que se dibuje encima sale también
   atenuado y el PNG entero se ve más apagado que la vista previa.
```

---

## Descripción, hashtags y botón de copiar

```
Debajo de cada publicación van su descripción y sus hashtags en texto
seleccionable, y un botón «Copiar descripción» que copie las dos cosas de una
vez: la descripción, una línea en blanco, y los hashtags en una sola línea
separados por un espacio.

El botón confirma que copió —cambia a «Copiado» un par de segundos y vuelve—
porque el portapapeles no se ve y si no confirma se pulsa dos veces.

Copia desde una constante de JavaScript con el texto literal, no leyendo el HTML
ya pintado. Leer del DOM devuelve el texto con los saltos de línea y los espacios
que decidió el navegador, no los que están escritos aquí.

El documento se abre con doble clic desde el disco, y ahí navigator.clipboard no
siempre existe. Envuélvelo en try/catch y cae a un <textarea> oculto con
document.execCommand('copy'). Sin esa caída el botón no hace nada y tampoco avisa
de que no hizo nada.

En un carrusel el botón es UNO para toda la publicación, no uno por diapositiva.

No pongas el prompt del fondo en el documento. La imagen ya está generada dentro
del archivo y repetir su receta no sirve para nada.
```

---

## La interfaz del documento

Con los colores de la marca. Es una herramienta interna, pero se ve todo el mes: si
el documento es feo, las piezas parecen feas.

Un título arriba con el nombre del lote, y nada más. Sin instrucciones, sin leyenda,
sin el prompt de los fondos.
