# La interlínea es una cuenta, no un número

Es lo que más rompe un titular sin que nadie sepa nombrarlo, y el paso que más caro
sale saltarse. **Las holguras dependen de la fuente: una tabla copiada de otra marca
está mal por definición.**

---

## Por qué pasa

Un titular compacto va con interlínea por debajo de 1 — es lo que produce el bloque
apretado que casi toda marca con carácter usa. A esa interlínea, en español:

- **Las tipografías de titular no rebajan los acentos para versalitas.** No tienen la
  característica `case` de OpenType, así que la tilde de una `Á` ocupa toda su altura
  natural y sube muy por encima de la altura de versalita.
- **Y por abajo pasa lo mismo.** La cola de una `Q`, la coma y los signos de apertura
  `¿` `¡` bajan por debajo de la línea base e invaden lo que venga debajo.

La alternativa fácil —subir la interlínea de todas las líneas— despeja la tilde y
**afloja el bloque entero para arreglar dos líneas**. El titular deja de ser compacto.
Por eso la holgura va donde hace falta y solo donde hace falta.

---

## La fórmula

```
avance(n → n+1) = base
                + holguraSuperior(línea n+1)
                + holguraInferior(línea n)
```

De las holguras superiores manda **una sola, la mayor**. De las inferiores también una
sola, la mayor. Pero **una de arriba y una de abajo sí se suman entre sí**: una línea
con tilde debajo de una que termina en coma lleva las dos.

**Se calcula para cada par de líneas consecutivas, sin excepción.** El error más caro
no es olvidar la fórmula: es aplicarla al primer par que se nota y dejar el resto del
bloque en la interlínea base, como si ya estuviera resuelto.

---

## Cómo se mide

```bash
node ../scripts/medir-fuente.mjs --familia "Antonio" --peso 700
node ../scripts/medir-fuente.mjs --archivo ./DisplayDeLaMarca.woff2
```

El script renderiza la fuente real en Chromium y mide, con `actualBoundingBox` sobre
un lienzo a 1000 px = 1 em:

| Qué mide | Para qué sirve |
|---|---|
| Altura de versalita (`N`, `H`) | Es la referencia: lo que ocupa una línea «normal» |
| Tope de `Á É Í Ó Ú` | Cuánto sobresale una tilde por encima |
| Tope de `Ñ`, `Ü` | Sobresalen menos que una tilde aguda; llevan holgura propia |
| Cola de `Q`, coma, `¿`, `¡` | Cuánto bajan por debajo de la línea base |

Y devuelve la tabla de holguras ya calculada, lista para pegar.

---

## El matiz que rompió el primer lote real

**La holgura no es solo lo que sobresale la tinta.** Este es el error que produjo un
lote entero con las tildes soldadas a la línea de arriba, y es difícil de ver porque
la lógica equivocada suena muy razonable.

La tabla original perseguía dejar **el mismo hueco óptico que hay entre dos versalitas
lisas**. En la fuente de aquel caso, ese hueco eran 0.020 em — unos 2 px a tamaño 112.
La cuenta era: holgura = lo que sobresale la tinta, y así el hueco resultante queda
igual que el de un par normal.

Medido después, con la tilde puesta a esa holgura, quedaban **1.8 px de tinta limpia**
y se leía pegada. Con la fuente real y el número corregido seguía quedando pegada.

La razón no es aritmética, es óptica:

> **0.020 em entre dos versalitas se leen como separación** porque los dos bordes son
> largos y planos, y el ojo los lee como dos masas distintas.
>
> **Esos mismos 0.020 em entre una tilde puntiaguda y la línea base de arriba se leen
> como contacto**, porque el ojo suelda una marca pequeña y aislada a la tinta que
> tenga más cerca.

De ahí sale el número del que cuelga toda la tabla: **un hueco óptico objetivo**, que
en el caso medido fueron 0.079 em — unos 9 px a tamaño 112. Cada holgura es entonces:

```
holgura = (lo que sobresale la tinta)
        − (lo que ya sobra en la base)
        + (el hueco óptico objetivo)
```

**Y hay tope por arriba.** Probado a cinco valores en la misma fuente: por debajo de
cierto punto la tilde se sigue leyendo pegada, y por encima el bloque se afloja y deja
de ser el titular de la marca. El script devuelve el valor central; si el bloque queda
suelto, bájalo antes que cambiar la interlínea base.

---

## Cómo se comprueba

No a ojo. Renderiza el par de líneas y mide tinta contra tinta:

```
hueco = avance − (tope de tinta de la línea de abajo)
                − (baja de tinta de la línea de arriba)
```

El script `medir-fuente.mjs` trae un modo `--comprobar` que renderiza los cinco pares
problemáticos —tilde bajo versalita, eñe bajo versalita, tilde bajo coma, tilde bajo
Q, y un par liso de control— y devuelve el hueco de cada uno en píxeles.

**El par liso es el control.** Si el hueco de un par con tilde es mucho menor que el
del par liso, la holgura está corta aunque las letras técnicamente no se toquen.

---

## Dónde NO se toca

Solo el titular y lo que vaya por debajo de interlínea 1 — normalmente la cifra
grande. Los textos de apoyo van con interlínea por encima de 1.4 y con holgura de
sobra: ahí no hay nada que corregir.

---

## Se entrega resuelta

En el prompt maestro, cada titular lleva **su tabla de avances ya calculada, par a
par**, y una nota cuando hay más de uno con holgura. Si el modelo tiene que
calcularla, no lo hace — o la aplica al primer par y deja el resto en la base.

```
AVANCES ENTRE LÍNEAS (base 0.88):
  1 → 2 : 0.88
  2 → 3 : 1.22    (0.88 +0.34 por una vocal con tilde de «EN LA PÁGINA.»)
  3 → 4 : 1.22    (0.88 +0.34 por una vocal con tilde de «SABES CUÁNTO CUESTA»)
  4 → 5 : 0.88
  Son 2 pares con holgura, en 2 sitios distintos del bloque. Resuélvelos todos,
  no solo el primero.
```
