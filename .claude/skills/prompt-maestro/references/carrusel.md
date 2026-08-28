# Un carrusel es una pieza larga cortada

No son N publicaciones seguidas. Al deslizar tiene que seguir siendo el mismo objeto,
la misma luz y la misma frase. Si cada diapositiva se compone por su cuenta, lo que se
publica son N piezas que comparten paleta — que es justo lo que se nota y lo que hace
que nadie llegue a la última.

Cuatro cosas lo producen, y ninguna es opcional: **un fondo, un velo, un recorrido y
una frase.**

---

## 1 · Un fondo, cortado en trozos

El fondo se genera **una vez para todo el carrusel** y se corta. No una vez por
diapositiva. No se arregla describiendo la misma escena N veces: el motor devuelve N
imágenes **parecidas y distintas**, con la luz en otro sitio y el material con otro
brillo. La costura canta.

| Diapositivas | Cómo | Por qué |
|---|---|---|
| **2 o 3** | **Panorámica cortada** | Cabe en una proporción que el motor entrega |
| **4 o más** | **Cadena de relevo** | Ya no cabe: haría falta 3.2:1 o más |

### Panorámica cortada

Se pide una sola imagen ancha y se corta en trozos del ancho del lienzo. La
diapositiva `k` se coloca desplazando la panorámica `−ancho·k`.

Para un lienzo de 1080 × 1350:

| Diapositivas | Lienzo final | Se pide | Sobra |
|---|---|---|---|
| 3 | 3240 × 1350 | **21:9** | 38 px de alto, 19 arriba y 19 abajo |
| 2 | 2160 × 1350 | **3:2** | 90 px de alto |

**Para dos no sirve 21:9**: escalada a 2160 de ancho se queda en 925 de alto y no
cubre. Hay que pedirla menos apaisada.

Tres cosas cambian respecto de un encuadre normal, y van dentro del prompt del fondo:

1. **Las bandas reservadas cruzan la panorámica entera.** El logo y el wordmark van en
   todas las diapositivas, así que las franjas se piden de lado a lado, no por trozo.
2. **El carril del texto es una franja horizontal continua**, a la misma altura de un
   extremo al otro. El anclaje no salta entre diapositivas, así que el hueco tampoco.
3. **El punto focal de cada trozo cae en su centro, no en sus bordes.** Por los cortes
   pasa materia continua; nunca el detalle que hay que mirar.

**Nombra los cortes como fracciones del ancho.** Es la única forma que tiene el motor
de entenderlos: no sabe qué es una diapositiva. «Justo en el primer tercio y en los
dos tercios del ancho no debe haber ningún detalle que llame la atención.»

### Cadena de relevo

Por encima de tres, la panorámica pediría 3.2:1 o más y ningún motor la entrega.
Escalar una 21:9 hasta ahí obliga a tirar más de un tercio del alto y con él el
encuadre con el que se compuso.

Se encadena aprovechando que estos motores son conversacionales: se genera la primera
y **cada siguiente se pide con la anterior delante**, en el mismo hilo, pidiendo que la
cámara siga avanzando en la misma dirección.

**Siempre con la anterior, nunca con la primera.** Encadenando contra la primera, la
tercera y la cuarta se van pareciendo cada vez menos a su vecina — que es justo la
unión que se ve al deslizar.

La cadena no da continuidad de píxel, y no pasa nada. Lo que tiene que sobrevivir es
el material, la temperatura de la luz y la dirección del movimiento.

---

## 2 · Un velo, con el mismo número en todas

**El velo es vertical y con los mismos valores en las N. El brillo de la imagen es el
mismo número en las N.**

Un velo vertical vale lo mismo en todo el ancho, así que en la costura no hay escalón.
En cuanto una diapositiva cambia de anclaje o de brillo, el velo cambia de dirección o
de valor y **el corte se ve**.

Esa es la razón mecánica de que el anclaje del texto no salte: si la primera va
anclada al medio, las demás también. No es gusto — es que se nota el corte.

---

## 3 · Un recorrido

- **De izquierda a derecha**, en el sentido en que se desliza. El sujeto tira del dedo
  hacia la siguiente.
- **En la 01 el sujeto entra, en las intermedias cruza, en la última se detiene o
  aterriza.** Un carrusel que acaba con el sujeto todavía cruzando no ha terminado.
- **La luz va en un solo sentido**: o crece o se apaga a lo largo del carrusel. Nunca
  sube, baja y vuelve a subir.

**Por la costura pasa materia continua**, nunca el punto focal. Al deslizar, la
aplicación mete un hueco entre diapositivas: lo que esté partido justo ahí se lee
roto; lo que solo cruza, se lee entero.

---

## 4 · Una frase

- **El antetítulo es el mismo en todas.** Es el hilo: cada diapositiva declara de qué
  concepto forma parte. Es lo más barato que se puede hacer por la continuidad y lo
  primero que se nota cuando falta.
- **Los tramos de acento, leídos en orden, forman una frase.** Uno por diapositiva.
  Escríbelos seguidos sin el resto del texto y léelos: si no dicen nada, el carrusel
  son N piezas con un tema común, no un concepto. **Es la prueba más barata que existe
  y la que más carruseles salva.**
- **La primera lleva el peso.** Es la única que se ve en el feed sin deslizar: el
  titular más corto y más grande del carrusel va ahí.
- **La última cierra o pide algo.** No se deja morir en un dato.
- **El logo y el wordmark van en todas.** Cada diapositiva se puede compartir suelta.
- **Numerador encendido.** En una pieza suelta va apagado; en un carrusel es la barra
  de avance del concepto.

---

## Cómo se revisa

**En tira, no una a una.** Las N pegadas por el borde, sin separación, y se miran las
costuras. Una diapositiva que suelta está perfecta puede romper la tira, y suelta no
hay manera de verlo.

Por eso el documento HTML tiene que enseñar las dos cosas: la tira primero, para juzgar
la continuidad, y cada diapositiva suelta después, para descargarla.

- [ ] ¿Es **una** imagen cortada, o son N imágenes?
- [ ] Ponlas en tira, pegadas. ¿Se ve alguna costura?
- [ ] ¿Hay un escalón de brillo en algún corte?
- [ ] ¿Hay un punto focal partido justo por un corte?
- [ ] ¿El carril limpio está a la misma altura en las N?
- [ ] ¿El sujeto avanza hacia la derecha y se detiene en la última?
- [ ] ¿La luz va en un solo sentido?
- [ ] Lee **solo los tramos de acento** en orden. ¿Forman una frase?
