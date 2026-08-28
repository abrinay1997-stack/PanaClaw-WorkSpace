# El contrato de marca

Las doce cosas que una marca tiene que tener declaradas para que este procedimiento
produzca algo publicable. **Si falta una, pregunta antes de producir**: adivinarla
cuesta rehacer el lote entero y el error no se ve hasta que el documento vuelve
montado.

La ficha en blanco, lista para pasarle a un cliente nuevo, está en
[`../assets/ficha-de-marca.json`](../assets/ficha-de-marca.json).

---

## Las tres que más se olvidan

### 1 · La fuente de las cifras

Un archivo, una tabla o una página donde vive **todo importe que la marca puede decir
en voz alta**, y solo ahí. No la memoria de nadie, no la propuesta que se mandó el
mes pasado.

Sirve para dos cosas distintas: para copiar cada cifra en el momento de escribirla, y
para que el verificador pueda comprobarlas sin criterio humano.

> **Si el encargo pide una cifra que no está ahí, ese producto no existe todavía.**
> Dilo y para. Es preferible entregar once piezas que doce con una inventada: una
> cifra que no aguanta una comprobación desmonta las otras once.

### 2 · El logo como código

El trazado literal, en sus dos formas:

- El `<svg>` completo con su `viewBox`, su `fill` y su `fill-rule`.
- El mismo trazado como `Path2D` para el lienzo de exportación.

Y tres datos que se rompen solos si no se dicen: **la proporción real** (ancho por
alto; si no es cuadrado, hay que decirlo), **el color plano** con el que va, y **la
escala en los dos ejes**.

Descrito en prosa, un modelo lo interpreta y devuelve algo parecido que no es la
marca. Es el error más caro del sistema y el más fácil de evitar.

### 3 · La tipografía de titular

Nombre y peso si está en Google Fonts, o el archivo si es de pago o propia. **Hace
falta para medirla, no para nombrarla**: las holguras de interlínea salen de sus
métricas reales y no se pueden copiar de otra marca.

Si es una fuente con licencia que no se puede compartir, hace falta al menos que
alguien corra el medidor donde sí esté instalada y devuelva la tabla.

---

## Las nueve restantes

### 4 · La paleta, con los roles cerrados

Cada color con su función, no una lista de hex sueltos:

| Rol | Para qué |
|---|---|
| Fondo | El maestro de todas las piezas |
| Texto principal | Titular y cifra |
| Texto secundario | Bajada, nota, numerador |
| Acento | Antetítulo, tramo del titular, logo |
| Solo fondo | Si la marca tiene colores que no pueden tocar una letra |

**Y lo prohibido, con su porqué.** Un modelo de imagen se va solo al azul en cuanto
oye «tecnología». Si la marca se posiciona contra eso, tiene que estar escrito.

### 5 · Las tipografías con sus roles, y las prohibidas

Qué familia va en titular, cuál en texto de apoyo, y **la regla de que no se cruzan**.
El día que una aparece en el rol de la otra, la pieza deja de reconocerse.

Nombra también las que un editor sugiere por defecto para ese aspecto y que hay que
excluir. Es la lista que impide que el modelo caiga en Montserrat o Bebas Neue
«porque se parecen».

### 6 · El lienzo por canal

En píxeles exactos. Feed vertical 1080 × 1350, story y reel 1080 × 1920, feed cuadrado
1080 × 1080. **No «aproximadamente vertical»**: el lienzo de exportación se escribe
como número y se comprueba.

### 7 · La retícula, en píxeles

Márgenes, ancho útil, dónde va el logo y dónde el wordmark. Y **las coordenadas
exactas de las dos cosas que un modelo inventa si no se las das**: la línea base del
wordmark y la esquina del numerador.

Se dan como coordenada, no como «abajo a la izquierda».

### 8 · La escala tipográfica

Cada rol con su familia, peso, tamaño, interlínea base, tracking y color. Y **el
criterio mecánico que decide el tamaño del titular**: normalmente el número de
líneas, con un rango de caracteres por línea que hace de tope.

Que sea mecánico es lo que hace que doce piezas del mismo lote se vean hermanas. Si
el tamaño lo decide el gusto de quien maqueta, no hay lote: hay doce piezas sueltas.

### 9 · El orden del bloque de texto

De arriba abajo, sin excepción. Un orden típico:

```
ANTETÍTULO    la categoría en la que está quien lee
TITULAR       lo que se lee de lejos
bajada        si la lleva
CIFRA         si la lleva
NOTA          el límite, si hay cifra o plazo
```

**Dar la escala sin el orden es el error que deja al modelo poniendo la cifra encima
del titular.** Se detecta en un vistazo: si lo primero que lees en la pieza es un
número, está al revés.

### 10 · La regla del acento

Cuántos tramos del titular van en el color de acento —normalmente uno—, qué parte de
la frase se acentúa y qué tope hay. Y qué **nunca** se acentúa.

La regla que más piezas salva: en un titular con forma «no hacemos X, hacemos Y», el
acento va en la Y. Acentuar la negación deja la pieza sonando a queja.

### 11 · El tratamiento de la imagen

Cómo se relaciona el fondo con el texto: si va a sangre, con qué brillo, si lleva un
velo y con qué valores, y **qué está prohibido** — cajas, tarjetas o franjas
semitransparentes detrás del texto suelen serlo, porque son la señal más rápida de
que la pieza se maquetó sin sistema.

Y el bloque de estilo del generador: el párrafo literal que hace que una imagen se
vea de esa marca, que **se copia entero y nunca se parafrasea**. Su única razón de
existir es ser idéntico entre piezas.

### 12 · La voz

Lo mínimo para que el texto no lo tenga que revisar un humano frase a frase:

- **Léxico prohibido**, en dos listas: la jerga del oficio y el relleno genérico.
  Sirven para búsqueda literal, así que tienen que estar escritas como palabras.
- **Persona y registro.** Segunda persona o tercera, tuteo o usted, variante regional.
- **Emojis, exclamaciones y mayúsculas de énfasis**: dónde sí y dónde no.
- **La firma de cierre**, si la hay, y si es fija dentro de un lote.
- **El tope de caracteres de una descripción.** Las redes cortan sobre los 125
  caracteres y esconden el resto; sin un tope escrito, las descripciones crecen
  hasta el doble de lo que alguien lee. Un reparto que funciona: 100 la primera
  línea, 300 el cuerpo, 500 el total sin hashtags.
- **El tope de hashtags**, y que sean concretos.

---

## Las cuatro que sostienen las reglas duras

Las doce de arriba describen cómo se ve y cómo suena la marca. Estas cuatro son
lo que la marca **no puede decir**, y existen porque una regla que solo vive en la
cabeza de quien entrega se rompe el día que entrega otro.

Cada una se declara como una lista, no como una advertencia en prosa: el
verificador las busca literales.

### 13 · Lo que no se afirma jamás

`prohibido.afirmar`. Métricas sin medir, testimonios, casos, premios, años de
experiencia, promesas de resultado o de posición en Google. Se escriben **como
aparecerían en el texto** —«clientes satisfechos», «primeros en Google»,
«garantizamos resultados»— para que una búsqueda literal las cace.

> Una cifra inflada aquí no estropea una pieza: desmonta las otras once. Si el
> argumento de la marca es que sus números se miden, un número sin medir lo
> contradice entero.

Cuando falte prueba y haga falta llenar ese sitio, **usa una promesa comprobable
el primer día** en su lugar. «El código queda a tu nombre» hace más trabajo que un
testimonio inventado, y no se cae.

### 14 · Lo que no se imprime nunca

`prohibido.imprimir`. Cadenas que no pueden aparecer en una pieza aunque sean
ciertas: un teléfono que la marca decide no publicar, un dominio de pruebas, un
correo personal. Se declaran en todas sus formas —`+507 6531-0721`, `6531`,
`50765310721`— porque se cuelan por la que no anotaste.

### 15 · Los rangos, y lo que nunca se suma

`cifras.rangos`, `cifras.pagoUnico` y `cifras.mensual`.

Un rango citado por su mínimo a secas es publicidad engañosa: o el rango entero,
o «desde». Declararlo permite al verificador cazarlo.

Y las dos listas de importes permiten cazar el error más creíble de todos: **un
total que es la suma de un pago único y una mensualidad.** Da un número
perfectamente redondo y completamente falso, porque anuncia un compromiso que el
cliente no ha firmado. Con las listas puestas, el verificador lo encuentra solo.

### 16 · Las fronteras

`fronteras`. Productos que el cliente confunde, con **la frase oficial** que los
separa. Si una pieza nombra dos de ellos, la frase va dentro.

Confundirlos no produce un texto feo: produce **una venta que después no se puede
cumplir**, o un cliente que cree estar cubierto y no lo está. Es el error más caro
del catálogo y el más fácil de cometer, porque los dos productos suenan igual de
lejos.

---

## Cómo se rellena cuando la marca ya tiene repositorio

Casi todo está escrito y solo hay que ir a buscarlo. El mapeo típico:

| Punto del contrato | Dónde suele vivir |
|---|---|
| 1 · cifras | un `precios.json`, una hoja de tarifas, la página de planes |
| 2 · logo | el SVG original, o el generador de assets de marca |
| 3–5 · tipografía y paleta | el manual, o los tokens del sitio (`global.css`, `tokens.json`) |
| 6–11 · retícula y escala | casi nunca existe: es lo que hay que decidir la primera vez |
| 12 · voz | el documento de tono, si lo hay |
| 13–16 · lo prohibido | las reglas duras del repositorio, si están escritas |

**Los puntos 6 a 11 son los que normalmente no existen.** Una marca puede tener un
manual excelente y no haber decidido nunca en qué píxel empieza el bloque de texto de
una pieza de feed. Decidirlo una vez, escribirlo, y no volver a decidirlo es la mitad
del valor de este sistema.
