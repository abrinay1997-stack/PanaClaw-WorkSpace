# Las siete secciones del prompt maestro

El orden no es decorativo. **La prohibición de escribir va la primera y se repite en
la séptima**: una sola vez, al principio de un prompt de mil líneas, se le olvida a la
mitad. No es redundancia por si acaso — es la única instrucción que se ha visto
degradarse por distancia.

Abajo, sección a sección: qué es **fijo** (se copia igual para cualquier marca) y qué
se **rellena** desde el contrato de marca.

---

## 1 · Qué eres y qué no haces

**Fijo.** Es el bloque más importante del documento y se pega literal:

```
No escribas, no redactes, no completes, no acortes, no traduzcas y no
"mejores" ningún texto. Todo el texto de este documento ya está escrito más
abajo. Cópialo carácter por carácter, con sus tildes, sus eñes y sus puntos
finales. Si algo te parece incompleto, déjalo como está: está así a propósito.
No añadas ninguna cifra, porcentaje, estadística, plazo, testimonio ni
beneficio que no esté escrito literalmente en este documento.
```

**Y explica por qué**, en una frase. Un modelo que entiende el motivo lo sostiene
mejor que uno que solo tiene la prohibición: «esta marca vende que sus números se
miden; una cifra añadida, aunque suene verosímil, destruye el argumento de las N
piezas a la vez».

Después, la lista de lo que no hay que hacer, en concreto. Se rellena con los fallos
que esa marca ya ha visto. Los universales:

- No propongas publicaciones que no estén en la lista.
- No resumas ni acortes la lista de exclusiones.
- No traduzcas nada.
- No añadas emojis a ningún titular ni dentro de ninguna imagen.
- No añadas hashtags. Los que hay son los que van: cuéntalos.
- No alargues ninguna descripción. Están escritas con tope contado.

---

## 2 · El sistema visual

**Se rellena entero desde el contrato de marca**, en este orden:

| Bloque | De dónde sale |
|---|---|
| La paleta con sus roles y lo prohibido | contrato 4 |
| Las dos tipografías con sus roles cerrados y las prohibidas | contrato 5 |
| La retícula en píxeles | contrato 7 |
| El orden del bloque de texto | contrato 9 |
| La escala completa | contrato 8 |
| **El logo, en su SVG y su Path2D literales** | contrato 2 |
| La cuenta de la interlínea, medida | `medir-fuente.mjs` |
| El velo y el tratamiento de imagen | contrato 11 |
| La regla del acento | contrato 10 |
| Las reglas de carrusel, si el lote lleva | [`carrusel.md`](carrusel.md) |

**Dar la escala sin el orden del bloque** es el error que deja al modelo poniendo la
cifra encima del titular. Van los dos.

---

## 3 · El contrato del HTML

**Casi todo fijo.** Se copia de [`contrato-html.md`](contrato-html.md); lo único que
se sustituye son las medidas del lienzo y los colores de la interfaz del documento.

Incluye las nueve trampas del exportador, literales. No las resumas: cada una tapa un
fallo observado y la versión corta no lo tapa.

---

## 4 · El bloque de estilo

**Se rellena** con el párrafo de estilo visual de la marca, **una sola vez arriba** y
después literal dentro de cada prompt de fondo.

Su única razón de existir es ser idéntico entre piezas. Si se parafrasea en cada
fondo, el lote deja de verse como un lote.

---

## 5 · Los negativos

**Mitad y mitad.** La parte fija tapa los fallos que cualquier generador comete:
personas, oficinas, pantallas, colores fuera de paleta, luz natural, texto generado,
iconos, marcas de agua, estética de stock corporativo.

**La parte que se rellena** son los negativos del tema del lote. Un generador al que
se le habla de «proceso» se va solo a flechas y líneas de tiempo; al que se le habla
de «seguridad», a candados y escudos. Añádelos.

---

## 6 · Las piezas

Una por una. Por pieza:

```
PUBLICACIÓN NN · FORMATO · TIPO

FORMATO       pieza suelta o carrusel de N, con el lienzo
ALTURA        consecuencia · hecho · condición   (se cuentan en el lote)
PUERTA        por dónde entra al argumento       (ninguna más de dos veces)
ANTETÍTULO    literal
ANCLAJE       cuál de los anclajes declarados, y su coordenada
TITULAR       tamaño, y las líneas con sus cortes ya decididos
TRAMO ACENTO  literal, entre comillas, y qué queda en el color principal
AVANCES       la tabla de interlínea resuelta par a par
BAJADA        literal, o «ninguna»
CIFRA         literal, o «ninguna»
NOTA          literal, o «ninguna»
FONDO         el prompt entero: sujeto, escena, estilo, encuadre, negativos
DESCRIPCIÓN   literal
HASHTAGS      literales
```

**Un carrusel va como UNA publicación con N diapositivas y UN prompt de fondo**, no
como N publicaciones.

**Y la cabecera de cada pieza es la que el documento imprime encima**, así que se
escribe pensando en que se lee: número, formato, tipo.

---

## 7 · Antes de devolver

**La prohibición de escribir, repetida entera.** Y después la lista de comprobación
que el modelo tiene que pasar, agrupada por familia:

```
TEXTO             líneas literales, tildes, descripciones sin tocar, hashtags contados
COLOR Y TIPO      familias en su rol, un tramo de acento, colores prohibidos ausentes
EL LOGO           el bloque literal, no una aproximación con trazos
INTERLÍNEA        cada tabla par a par, la base sin subir, el bloque sin recorte
MEDIDAS           lienzos exactos, vista previa igual en todas
CARRUSELES        una sola panorámica, mismo brillo, mismo anclaje, tira visible
FONDOS            sin letras, bandas reservadas limpias, carril del texto limpio
EL DOCUMENTO      botones de descarga y de copiar, sin el prompt del fondo impreso
```

**Incluye la comprobación de los acentos en orden** si hay carruseles: escribe en el
prompt la frase que tienen que formar, para que el modelo pueda verificar que la
compuso bien.

Y una lista literal de las palabras con tilde y con eñe que aparecen en el lote. Es la
comprobación más barata que existe y caza el fallo más frecuente de todos.

---

## Una pieza rellenada, entera

Del lote que originó este sistema. Sirve para ver el formato exacto que espera
`verificar-lote.mjs`, y el nivel de resolución que hay que entregar: **nada queda
a criterio del modelo.**

```
──────────────────────────────────────────────────────────────────────────
PUBLICACIÓN 04 · PIEZA SUELTA · cifra publicada
──────────────────────────────────────────────────────────────────────────

FORMATO       Pieza suelta, 1080 × 1350
PUERTA        cifra
ANTETÍTULO    SI VAS A ENCARGAR TU WEB
ANCLAJE       MEDIO — centro óptico del bloque en y = 594
BRILLO        0.68
NUMERADOR     Apagado

TITULAR, cuatro líneas, Titular L 112:
  UN CAMBIO MÁS
  DESPUÉS DE LAS
  RONDAS INCLUIDAS
  YA TIENE PRECIO.

TRAMO ACENTO #FF5100: «YA TIENE PRECIO.»
El resto del titular en #FFF7F7.

AVANCES ENTRE LÍNEAS (base 0.88):
  1 → 2 : 1.22    (0.88 +0.34 por una vocal con tilde de «DESPUÉS DE LAS»)
  2 → 3 : 0.88
  3 → 4 : 0.88

BAJADA   ninguna
CIFRA    $40
NOTA     START NO LLEVA RONDAS · LAUNCH 2 · CORPORATE 3 · COMMERCE 4

FONDO:

Una cinta de luz roja incandescente que se separa del trenzado principal,
traza una curva corta por fuera y vuelve a entrar en el trenzado, sobre
obsidiana pulida.

El trenzado principal está en el centro, apretado y encendido. La cinta que
se sale dibuja un arco limpio y vuelve. El punto donde vuelve a entrar es el
más brillante del cuadro.

[aquí va el BLOQUE DE ESTILO, literal e idéntico en todos los fondos]

Encuadre: composición vertical 4:5. Los 180 píxeles superiores y los 160
inferiores del cuadro quedan en negro limpio, sin ninguna forma, resplandor ni
reflejo, ni siquiera difuso. El sujeto se abre hacia los bordes y hacia el
tercio superior. La banda central del cuadro queda en negro limpio, con la luz
muriendo antes de entrar en ella.

[aquí van los NEGATIVOS, literales]

DESCRIPCIÓN DE LA PUBLICACIÓN 04:

Se te ocurre un cambio más cuando ya se acabaron las rondas. 🧾

Las rondas llevan número desde el principio para que la cuarta no haya que
negociarla. Cada plan trae las suyas —Launch 2, Corporate 3, Commerce 4— y
Start ninguna. Lo que venga después ya tiene precio, y lo sabes antes de
empezar, no cuando lo pides.

Ronda extra: $40. ⚡

PanaClaw — sitios rápidos, código tuyo. 🌋

HASHTAGS: #panaclaw #sitioswebpanama #panama #paginaswebpanama #diseñoweb
```

**Fíjate en tres cosas del encuadre**, porque son las que más se hacen mal:

1. **Las bandas reservadas van al PRINCIPIO del encuadre, no al final.** Medido: en
   la primera pieza producida con este sistema, la banda iba en la última frase y el
   motor la ignoró — metió el sujeto incandescente justo detrás del logo, y el logo
   naranja quedó sobre un resplandor naranja. **Y el velo no lo arregla**: subirlo
   mejoró la luminancia de 52 a 43 y apagó la imagen entera. Si el fondo invade la
   banda, se regenera el fondo.

2. **El hueco del texto se pide describiendo QUÉ HAY en esa zona**, no que falta
   algo. «Deja espacio para el texto» hace que el motor meta un degradado plano y
   feo; «la banda central queda en negro limpio, con la luz muriendo antes de entrar
   en ella» produce un hueco que parece intencionado.

3. **No hay ni un `[completa aquí]`.** Los corchetes de arriba marcan dónde se pegan
   dos bloques literales, y en el prompt real están pegados. Un prompt con huecos no
   está entregado: está delegado de vuelta.
