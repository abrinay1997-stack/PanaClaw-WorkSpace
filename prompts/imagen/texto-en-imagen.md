# Imagen · Texto dentro de la pieza

Cómo se maqueta una pieza de redes donde **el texto ya viene puesto**. Es la
especificación de diseño gráfico de la marca: retícula, escala, dónde cae cada
cosa y por qué.

**Antes:** [`datos/marca.json`](../../datos/marca.json) → `redesSociales`. Los
valores mandan desde ahí; este archivo explica cómo se usan.

---

## Las dos capas, y por qué no se mezclan

Una pieza de PanaClaw son **dos capas separadas**:

```
CAPA 2   El texto        Antonio y Archivo de verdad, compuesto sobre la imagen
CAPA 1   El fondo        Generado por el motor de imagen. Sin una sola letra
```

El motor genera la capa 1 y **nunca** la capa 2. No es una preferencia: los
motores de imagen siguen comiéndose las tildes y convirtiendo la eñe en ene, y
ninguno reproduce Antonio con su interlínea de 0.88. Una pieza que dice
«CODIGO TUYO» sin tilde ya no es de esta marca.

Lo que cambia respecto de como se trabajaba antes es **quién monta la capa 2**.
Antes se montaba a mano en Canva. Ahora la monta el HTML que devuelve el modelo,
con las fuentes cargadas y las medidas de este archivo escritas en el código —
y el resultado se descarga ya en 1080×1350.

> Canva deja de ser el paso obligatorio y pasa a ser el retoque:
> [`prompts/plataformas/canva.md`](../plataformas/canva.md).

---

## La retícula

Sobre lienzo de 1080×1350. Todas las medidas en píxeles.

```
0 ────────────────────────────────────────────── borde superior
                        ⌁                          96   rayo, 64×64, centrado
72 │                                          │ 1008   márgenes laterales
   │                                          │
   │  ANTETÍTULO EN NARANJA                   │        (opcional)
   │  TITULAR EN ANTONIO                      │  ← el bloque de texto se ancla
   │  QUE OCUPA VARIAS LÍNEAS                 │     arriba, al medio o abajo
   │  bajada gris de apoyo                    │
   │  $CIFRA                                  │        (si la pieza la lleva)
   │  NOTA DEL LÍMITE                         │        (obligatoria si hay cifra)
   │                                          │
   │  PANACLAW.                               │ 1254   wordmark, base del bloque
1350 ───────────────────────────────────────────── borde inferior
```

**Todo se alinea a la izquierda, en x=72.** El rayo es la única excepción: va
centrado. Es la misma composición del sitio, donde el titular cae siempre en el
carril izquierdo del contenedor.

### El orden del bloque no se negocia

De arriba abajo, siempre, sin excepción:

```
ANTETÍTULO      la categoría en la que está el lector; el nombre del
                producto solo si lleva minúscula obligatoria (06 §9)
TITULAR         lo que se lee de lejos
bajada          si la lleva
CIFRA           si la lleva
NOTA            el límite, si hay cifra o plazo
```

**La cifra va después del titular, nunca antes.** Un importe suelto encima del
antetítulo no tiene de qué ser el precio todavía: el lector se encuentra el
número antes que la cosa. El titular monta el argumento y la cifra lo cierra —
por eso `cifra` lleva 44 px de aire por encima y no por debajo.

Es el error que comete un modelo cuando se le da la escala pero no el orden, y
se detecta en un vistazo: si lo primero que lees en la pieza es un número, está
al revés.

### Los tres anclajes verticales

El bloque de texto no se centra a ojo. Se ancla a uno de tres sitios, y lo
decide el número de líneas del titular:

| Anclaje | Dónde | Cuándo |
|---|---|---|
| **Alto** | Tope del bloque en y=248 | Titular de 6–8 líneas |
| **Medio** | Centro óptico del bloque en y=594 | Titular de 3–5 líneas |
| **Bajo** | Base del bloque en y=1112 | La imagen manda en la mitad superior |

**594 y no 675.** El centro óptico va por encima del centro geométrico: un
bloque centrado matemáticamente se lee caído. Es el ajuste que separa una pieza
compuesta de una pieza colocada.

---

## La escala

El tamaño del titular **lo decide el número de líneas**, no el gusto de quien
maqueta. Es lo que hace que doce piezas del mismo mes se vean hermanas.

| Rol | Familia | Peso | Tamaño | Interlínea base | Tracking | Color |
|---|---|---|---|---|---|---|
| Titular XL · 2–3 líneas | Antonio | 700 | 132 | 0.88 | −0.01em | `#FFF7F7` |
| Titular L · 4–5 líneas | Antonio | 700 | 112 | 0.88 | −0.01em | `#FFF7F7` |
| Titular M · 6–8 líneas | Antonio | 700 | 92 | 0.90 | −0.01em | `#FFF7F7` |
| Antetítulo | Archivo | 500 | 24 | — | 0.16em | `#FF5100` |
| Bajada | Archivo | 300 | 30 | 1.45 | — | `#BABABA` |
| Nota / límite | Archivo | 400 | 20 | 1.5 | 0.14em | `#BABABA` |
| Cifra | Antonio | 700 | 76 | — | 0 | `#FFF7F7` |
| Wordmark | Archivo | 700 | 30 | — | 0.22em | `#FFF7F7` + punto `#FF5100` |

> **«Interlínea base» quiere decir base.** Es el punto de partida de una cuenta
> que se hace línea a línea, y está en la sección siguiente. Aplicar 0.88 a todas
> las líneas por igual es exactamente el fallo que se come las tildes.

**Titular y cifra siempre en versalitas.** La bajada nunca: en minúscula se lee
mucho más rápido, y la bajada está para leerse.

**Más de 8 líneas no es un titular, es un párrafo.** Si no cabe en ocho, el
mensaje tiene dos ideas y son dos piezas.

**El número de líneas propone, el carácter más largo dispone.** Si una línea se
pasa del rango de caracteres de su tamaño, baja un escalón. Un titular de tres
líneas donde una tiene 19 caracteres es un titular L, no XL.

### eBot no cabe en un titular

**`eBot` se escribe con e minúscula y B mayúscula, siempre.** El titular va en
versalitas, así que dentro de un titular se convertiría en `EBOT`, que es una de
las tres formas que la marca prohíbe expresamente.

La salida es una sola, y es limpia:

> **El nombre del producto vive en el antetítulo, y el antetítulo respeta su
> escritura.** El antetítulo va en versalitas *salvo* cuando contiene un nombre
> con minúscula obligatoria. Ahí se escribe tal cual: `eBot`.

```
✓  eBot                          ← antetítulo, escritura respetada
   ATIENDE TUS MENSAJES.         ← titular en versalitas, sin el nombre dentro
   NO REEMPLAZA TU SITIO.

✗  EBOT ATIENDE TUS MENSAJES.    ← el nombre roto dentro del titular
```

En la descripción no hay problema: va en caja normal y se escribe `eBot`.

Aplica a cualquier nombre futuro que lleve minúscula obligatoria, no solo a este.

### Antonio a −0.01em, no a −0.02em

El titular del sitio va a −0.02em porque Archivo es de ancho normal y necesita
cerrarse. Antonio ya viene condensada; a −0.02em las letras se tocan y la
palabra deja de leerse a tamaño de pulgar.

---

## La interlínea no es un número: es una cuenta

Es lo que más rompe una pieza sin que nadie sepa nombrarlo: **las tildes y la eñe
se comen la línea de arriba.**

### Por qué pasa, medido

Antonio **no trae acentos rebajados para versalitas** — no tiene la
característica `case` de OpenType. Así que la tilde de una `Á` ocupa toda su
altura natural: llega a **1.1294 em** sobre su línea base, cuando la altura de
versalita es **0.8594 em**. La tilde sobresale **0.27 em por encima de la letra**.

Con interlínea fija de 0.88, esa tilde sube **0.25 em por encima de la línea base
de la línea anterior** — y como las letras de esa línea se apoyan en esa base y
crecen hacia arriba, la tilde acaba dentro de ellas. Y por abajo pasa
lo mismo: la cola de una `Q` baja 0.1426 em y el `¿` baja 0.1382 em, así que
también invaden lo que venga debajo.

No es teoría. Renderizado en Antonio 700 a 112 px, midiendo tinta contra tinta:

| Par de líneas | Con 0.88 en todas |
|---|---|
| Versalita lisa sobre versalita lisa | 3 px limpios · **es el hueco de la marca** |
| Tilde aguda debajo de un asta llena | **solapa 27 px** |
| Eñe debajo de un asta llena | **solapa 19 px** |
| Tilde debajo de la cola de una `Q` | **solapa 39 px** |

### La cuenta

```
avance(n → n+1) = base + holguraSuperior(línea n+1) + holguraInferior(línea n)
```

**Lo que la línea de abajo sube** por encima de la altura de versalita:

| Si la línea de abajo lleva | holguraSuperior |
|---|---|
| `Á` `É` `Í` `Ó` `Ú` | **0.27** |
| `Ñ` `Ü` | **0.20** |
| nada de lo anterior | 0 |

**Lo que la línea de arriba baja** por debajo de su línea base:

| Si la línea de arriba lleva | holguraInferior |
|---|---|
| `Q` `¿` `¡` `,` | **0.17** |
| nada de lo anterior | 0 |

Las dos se suman cuando coinciden. Una línea con tilde debajo de una que termina
en `Q` avanza `0.88 + 0.27 + 0.17`.

### Por qué el bloque no se afloja

Cada holgura es **exactamente lo que sobresale la tinta**, ni un punto más. El
hueco óptico que queda es el mismo que ya había entre dos líneas sin tilde, así
que el bloque se sigue viendo igual de apretado. Comprobado con los mismos pares
de antes:

| Par de líneas | Con la cuenta puesta |
|---|---|
| Versalita lisa sobre versalita lisa | 3 px limpios |
| Tilde aguda debajo de un asta llena | 3 px limpios |
| Eñe debajo de un asta llena | 3 px limpios |
| Tilde debajo de la cola de una `Q` | 8 px limpios |

**La alternativa era subir la interlínea a 1.16 en todas.** Despeja la tilde,
sí — y afloja el bloque entero para arreglar dos líneas. El titular de esta marca
es un bloque compacto; una interlínea uniforme que respete las tildes deja de
serlo. Por eso la holgura va donde hace falta y solo donde hace falta.

### Dónde NO se toca

Solo el titular y la cifra. Son lo único que va por debajo de interlínea 1. La
bajada va a 1.45 y la nota a 1.5, las dos en Archivo: ahí sobra sitio y no hay
nada que corregir.

### Los anclajes se miden sobre la versalita, no sobre la tinta

El tope del bloque es el **tope de versalita** de la primera línea, y la base es
la **línea base** de la última. Nunca la caja de tinta.

Si se midieran sobre la tinta, una pieza cuya primera línea lleva tilde caería
0.27 em respecto de otra que no la lleva, y dos piezas del mismo mes no
cuadrarían. La tilde de la primera línea vive en el aire de encima: a 132 px son
36 px, el anclaje alto empieza en 248 y el símbolo termina en 168 — entra con 44
px de sobra.

### Y no la recortes

Con interlínea por debajo de 1, la tinta de la primera línea **sale por arriba de
su propia caja de línea**. Cualquier recorte sobre el bloque de texto —una caja
de alto fijo que corte lo que sobra— le rasura la tilde a la primera línea. El
bloque no lleva recorte.

---

## El acento naranja

Es la decisión que más define la pieza y la que más fácil se arruina.

**Un solo tramo del titular va en `#FF5100`. Continuo. Nunca más de la mitad de
los caracteres.** Todo lo demás en `#FFF7F7`.

> El tope estuvo un rato en el 40 % y estaba mal. La pieza publicada que mejor
> funciona —«no hacemos cubos con brasa / hacemos obsidiana fría, rápida»— lleva
> el 56 % en naranja, porque la afirmación es más larga que la negación y eso es
> exactamente lo que la hace funcionar. **Lo que rompe una pieza no es la
> proporción: es que haya dos tramos naranjas en vez de uno.**

```
✓  NO HACEMOS PLANTILLAS.
   CADA SITIO ES CÓDIGO NUEVO.        ← «código nuevo» en naranja

✗  NO HACEMOS PLANTILLAS.             ← dos tramos naranjas: ya no hay acento,
   CADA SITIO ES CÓDIGO NUEVO.           hay dos colores peleando
```

**Qué va en naranja:** la afirmación, la consecuencia o la cifra. En un titular
con forma «no hacemos X, hacemos Y», el naranja es **Y**.

**Qué no va nunca en naranja:** la negación, la bajada, la nota, ni el titular
entero. Un titular entero en naranja no tiene acento — es una pieza naranja.

**`#FF1E1E` no toca una letra.** Aquí tampoco. Es color de fondo, y en cuanto
aparece en un texto hay dos rojos discutiendo cuál es el acento de la marca.

---

## Los cortes de línea se escriben, no se calculan

Ninguna línea de titular la parte el navegador. Se decide dónde corta, y corta
**por unidad de sentido**.

```
✓  NO HACEMOS
   SIMETRÍA BONITA
   PERO LENTA.

✗  NO HACEMOS SIMETRÍA          ← «simetría bonita» partido por la mitad:
   BONITA PERO LENTA.              se lee en dos tiempos y pierde el golpe
```

Tres reglas:

1. **Una unidad de sentido por línea.** Sujeto, o verbo con su objeto, o el
   remate. No se parte un sustantivo de su adjetivo.
2. **Sin líneas huérfanas**, salvo que la huérfana sea el remate. `PERO LENTA.`
   sola es buena; `NUEVO.` sola es buena; una preposición sola nunca.
3. **La última línea lleva el punto.** El titular de esta marca termina. Es la
   voz: frases que terminan.

---

## El velo

La imagen va a sangre y **bajo un velo que abre el carril del texto**. Es la
regla 9 del sitio, con los números recalculados: allí la imagen es el fondo de
una sección larga y va al 0.4–0.5; aquí la imagen es el 100 % de la pieza, y a
ese valor se ve un rectángulo negro con una mancha.

- **Brillo de la imagen:** 0.55–0.75
- **Degradado:** lineal, desde el borde donde cae el texto hacia el opuesto.
  De `rgba(16,1,1,0.92)` a `rgba(16,1,1,0.10)`

**Ninguna caja detrás del texto.** Ni tarjeta, ni franja, ni rectángulo
semitransparente, ni sombra sobre las letras. El contraste lo pone el velo, que
es continuo y no tiene borde. Una caja detrás de un titular es la señal más
rápida de que la pieza se maquetó sin sistema.

Si con el velo puesto el titular todavía compite con la imagen, **el fondo está
mal generado**: se regenera pidiendo que la incandescencia se apague antes de
llegar al carril. No se sube el velo hasta tapar la imagen.

---

## El rayo y el wordmark

**Símbolo:** 88 de ancho por 72 de alto, centrado horizontalmente, borde superior
en y=96. Son **seis figuras rellenas** —dos corchetes angulares, un punto
romboidal y tres zarpazos—, no tres trazos. El path completo sale de
[`datos/marca.json`](../../datos/marca.json) → `logo.pathSVG`, en
`viewBox="0 0 100 81.56"` y con `fill-rule="evenodd"`. El archivo está en
[`logo-original.svg`](../../logo-original.svg).

**Se copia literal, nunca se redibuja.** Un generador al que se le describe el
símbolo en prosa —«una garra de tres zarpazos», «88 por 72 px»— lo interpreta,
y lo que devuelve son trazos con `stroke` que no son el logo de esta marca. El
bloque de código listo para pegar, en sus dos versiones, está en
[`prompts/plataformas/meta-ai.md`](../plataformas/meta-ai.md) → «El símbolo,
literal — nunca se redibuja».

Cuatro cosas que se rompen solas si no se dicen:

1. **No es cuadrado.** 100 × 81.56. Meterlo en una caja cuadrada lo estira, y
   estirar el símbolo está en la lista de usos prohibidos.
2. **`fill-rule="evenodd"`.** Sin eso los huecos de los corchetes se rellenan y
   el logo sale como una mancha.
3. **Naranja `#FF5100` plano**, sin degradado. A 88 píxeles el degradado a ember
   no se ve y solo ensucia el borde.
4. **`fill`, nunca `stroke`.** Son figuras rellenas, no líneas. Y la escala del
   `<canvas>` de exportación va igual en los dos ejes —0.88 y 0.88—, nunca uno
   distinto del otro.

Sobre fondo oscuro no lleva cuadrado detrás: el fondo ya es el cuadrado.

**Wordmark:** `PANACLAW` en Archivo 700, tracking 0.22em, `#FFF7F7`, **seguido de
un punto en `#FF5100`**. Alineado a la izquierda en x=72, base del bloque en
y=1254.

> **Divergencia detectada.** Las piezas que la marca ha publicado hasta ahora
> parten el wordmark en dos colores —`PANA` blanco y `CLAW` naranja, sin punto—
> y eso no es lo que declara `marca.json` ni lo que usa el sitio. Aquí manda el
> JSON. Si la versión partida va a ser la oficial, se cambia primero en el sitio
> y después baja aquí, como todo: [`operacion/sincronizacion.md`](../../operacion/sincronizacion.md).

---

## Carrusel

> **Un carrusel es UNA pieza larga cortada en trozos, no N piezas seguidas.**

Es la regla de la que salen todas las demás de este apartado. Al deslizar tiene
que seguir siendo el mismo objeto, la misma luz y la misma frase. Si cada
diapositiva se compone por su cuenta, lo que se publica son N piezas que
comparten paleta — que es justo lo que se nota y lo que hace que nadie llegue a
la última.

Cuatro cosas lo producen, y ninguna es opcional: **un fondo, un velo, un
recorrido y una frase.**

### 1 · Un fondo, cortado en trozos

El fondo se genera **una vez para todo el carrusel** y se corta. No una vez por
diapositiva.

| Diapositivas | Cómo |
|---|---|
| **2 o 3** | **Panorámica cortada.** Una sola imagen que cubre 1080×N de ancho por 1350 de alto, partida en trozos de 1080 |
| **4 o más** | **Cadena de relevo.** Cada diapositiva se genera con la anterior delante, avanzando la cámara |

El corte cae en `x = 1080`, `2160`… de la panorámica. El trozo `k` se coloca
desplazando la imagen `−1080·k`. Cómo se le pide al motor está en
[`prompts/imagen/nano-banana.md`](nano-banana.md).

**Por qué 3 es el tope de la panorámica.** Tres diapositivas son 3240×1350, o
sea 2.4:1 — una panorámica 21:9 escalada a ese ancho da 1388 de alto y solo hay
que recortar 38 px. Cuatro serían 3.2:1, que ningún motor entrega: escalar una
21:9 hasta ahí obliga a tirar más de un tercio del alto y se pierde el encuadre
con el que se compuso.

### 2 · Un velo, con el mismo número en todas

**El velo es vertical y con los mismos valores en las N. El brillo de la imagen
es el mismo número en las N.**

Un velo vertical vale lo mismo en todo el ancho, así que en la costura no hay
escalón. En cuanto una diapositiva cambia de anclaje o de brillo, el velo cambia
de dirección o de valor y **el corte se ve**.

Esa es la razón mecánica de que **el anclaje del texto no salte**: si la primera
va anclada al medio, las demás también. No es gusto — es que se nota el corte.

### 3 · Un recorrido

- **La dirección es de izquierda a derecha**, la misma en la que se desliza. El
  sujeto tira del dedo hacia la siguiente.
- **En la 01 el sujeto entra, en las intermedias cruza, en la última se detiene o
  aterriza.** Un carrusel que acaba con el sujeto todavía cruzando no ha
  terminado.
- **La luz va en un solo sentido:** o crece o se apaga a lo largo del carrusel.
  Nunca sube, baja y vuelve a subir.

**Por la costura pasa materia continua** —una estela, el cuerpo del sujeto, la
caída de la luz—, **nunca el punto focal.** Al deslizar, la aplicación mete un
hueco entre diapositivas: lo que esté partido justo ahí se lee roto; lo que solo
cruza, se lee entero.

### 4 · Una frase

- **El antetítulo es el mismo en todas.** Es el hilo: cada diapositiva declara de
  qué concepto forma parte. Es lo más barato que se puede hacer por la
  continuidad y lo primero que se nota cuando falta.
- **Los tramos naranjas, leídos en orden, forman una frase.** Uno por
  diapositiva, como en cualquier pieza. Léelos seguidos sin el resto del texto:
  si no dicen nada, el carrusel son N piezas con un tema común, no un concepto.
- **La primera lleva el peso.** Es la única que se ve en el feed sin deslizar: el
  titular más corto y más grande del carrusel va ahí.
- **La última cierra o pide algo.** No se deja morir en un dato.
- **El símbolo y el wordmark van en todas.** Cada diapositiva se puede compartir
  suelta.
- **Numerador encendido.** En una pieza suelta va apagado; en un carrusel es la
  barra de avance del concepto y va en la esquina superior derecha en x=1008,
  formato `01/05`, en `#BABABA`.

### Cómo se revisa

**En tira, no una a una.** Las N pegadas por el borde, sin separación entre
ellas, y se miran las costuras. Es el equivalente para carrusel de mirar un lote
en cuadrícula: una diapositiva que suelta está perfecta puede romper la tira, y
suelta no hay manera de verlo.

---

## Antes de dar una pieza por buena

- [ ] ¿El titular es Antonio 700 en versalitas, y el resto Archivo?
- [ ] ¿El tamaño corresponde al número de líneas, y ninguna línea se pasa de su
      rango de caracteres?
- [ ] **Busca las tildes, las eñes y los signos de apertura del titular.** ¿Cada
      línea que lleva una tiene su holgura sumada al avance? Y si encima de ella
      hay una `Q`, un `¿`, un `¡` o una coma, ¿está sumada también la de abajo?
- [ ] Si el titular tiene más de un par de líneas que necesita holgura, ¿está
      calculada en **cada** par, o solo en el primero que se notó? Un titular de
      cuatro líneas con tilde en la 2 y eñe en la 3 lleva dos holguras distintas,
      no una.
- [ ] ¿El símbolo es el SVG/Path2D **literal** de `prompts/plataformas/meta-ai.md`
      —seis figuras rellenas, `fill`, `fill-rule="evenodd"`, escala 0.88 en los
      dos ejes—, o alguien lo redibujó con trazos?
- [ ] Amplía el titular y **mira el punto donde una tilde queda debajo de una
      letra.** Si se tocan, falta holgura. Si hay un dedo de aire, sobra.
- [ ] ¿El bloque de texto va sin recorte, para que la tilde de la primera línea
      no salga rasurada?
- [ ] ¿Algún nombre de minúscula obligatoria —`eBot`— metido dentro del titular?
- [ ] ¿Hay **un solo** tramo naranja, y es la afirmación o la cifra?
- [ ] ¿Alguna letra en `#FF1E1E`?
- [ ] ¿Los cortes de línea respetan las unidades de sentido?
- [ ] ¿Alguna línea huérfana que no sea el remate?
- [ ] ¿Alguna caja, franja o sombra detrás del texto?
- [ ] ¿El wordmark lleva su punto naranja?
- [ ] ¿Todo alineado a x=72, con el rayo como única excepción centrada?
- [ ] ¿Se lee el titular al tamaño de un pulgar? Aléjate y míralo pequeño.
- [ ] Si la pieza dice una cifra, ¿está la nota del límite debajo?
- [ ] **Mira la banda del símbolo, y 96 a 168.** ¿Asoma algo del fondo detrás?
      Si hay resplandor, forma o reflejo, el fondo está mal generado y se
      regenera. El símbolo naranja sobre un resplandor naranja desaparece.
- [ ] Lo mismo en la banda del wordmark, de y 1190 a 1350.
- [ ] ¿El wordmark termina en y=1254? Si se colocó por su borde superior en vez
      de por su base, queda unos 14 px alto y se nota contra el margen.

### Si es un carrusel, además

- [ ] ¿El fondo salió de **una sola** imagen cortada, o de N imágenes distintas?
- [ ] ¿El anclaje del texto es el mismo en todas?
- [ ] ¿El brillo de la imagen es el mismo número en todas?
- [ ] ¿El antetítulo es el mismo en todas?
- [ ] Lee **solo los tramos naranjas** en orden: ¿forman una frase?
- [ ] ¿El sujeto avanza hacia la derecha y se detiene en la última?
- [ ] ¿Está el numerador encendido?
- [ ] **Ponlas en tira, pegadas.** ¿Se ve alguna costura? ¿Hay un escalón de
      brillo en algún corte? ¿Hay un punto focal partido por la mitad?

### La comprobación que no se puede saltar

**Descarga la pieza y ponla al lado de su vista previa.** Si no son idénticas, el
exportador está mal — y si está mal en una, está mal en todas. Las siete trampas
que lo causan están en
[`prompts/plataformas/meta-ai.md`](../plataformas/meta-ai.md).

Un desfase de dos o tres píxeles entre las dos es normal y viene de que el lienzo
posiciona por la caja del tipo y el navegador por la caja de línea. Por encima de
seis, algo está mal calculado.
