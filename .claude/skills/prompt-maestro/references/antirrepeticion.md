# Que el lote no suene igual que el anterior

Es la queja que llega tarde y bien formulada: *«siempre me generas las mismas ideas,
pero el problema no son las ideas — es que me escribes los mismos textos.»*

**La distinción es exacta y hay que respetarla.** Las ideas se repiten poco: una marca
con seis productos, cuatro listas de exclusiones y veinte objeciones catalogadas tiene
inventario para medio año. Lo que se repite es **la redacción**, y tiene tres causas
mecánicas. Ninguna es falta de creatividad.

---

## Las tres causas

### 1 · El corpus es cerrado a propósito

Toda cifra de una fuente, toda afirmación de un catálogo. Es lo que impide inventar
datos, y no se toca. **La consecuencia inevitable es que el material de partida es
siempre el mismo.** Este es el precio de no mentir, y se paga.

### 2 · El ADN trae frases que se leen como copy aprobado

Los buenos documentos de marca traen frases modelo: «sin discusión y sin mala cara»,
«no una entrega a ciegas al final». Están ahí como **formas**, y normalmente el
documento lo avisa en una línea fácil de pasar por alto.

En la práctica, quien busca cómo decir algo encuentra la frase canónica ya escrita y
la copia. **No es pereza: es lo que hace un archivo bien escrito.**

> **Regla: ninguna frase del ADN se copia literal.** La prueba es mecánica — busca la
> frase en los archivos de ADN antes de entregarla; si está, reescríbela. La única
> excepción es la tagline, que está declarada y se dice siempre igual a propósito.

En un lote real de doce descripciones, esta comprobación encontró **cuatro fragmentos
de ocho palabras o más copiados literales**. Ninguno era obvio al leerlo.

### 3 · No hay memoria de lo entregado

Cada lote arranca del mismo corpus, con las mismas instrucciones, sin saber qué se
dijo el mes anterior. **Dos ejecuciones idénticas dan resultados idénticos**, y eso no
es un defecto de quien escribe: es que falta la entrada que las diferencie.

**Es la única de las tres que se puede tapar sin romper la marca.**

---

## El índice en negativo

Un archivo que crece y no se poda, con lo que ya salió. **No guarda copy para
reutilizarlo: lo guarda para prohibirlo.** Es lo contrario de un almacén, y por eso no
contradice la regla de que un repositorio de marca no es un histórico.

Se lee **antes** de escribir un lote y se actualiza **al entregarlo**, no después. Si
el paso se salta, el archivo miente en el lote siguiente y la regla deja de valer.

### Qué se anota, y nada más

| Campo | Por qué |
|---|---|
| Fecha y lote | Para poder podar por año cuando crezca |
| Puerta de entrada | La regla que más rompe el parecido. Ver abajo |
| Titular, en una línea | Lo que no se puede repetir nunca |
| Escena | Para no repetir la imagen madre con el mismo público |

**No se anota la descripción entera.** Esto es un índice, no un archivo de copy.

---

## Las tres reglas

### 1 · Ningún titular se repite. Nunca

No «parecido»: ninguno. Si un titular ya está en el índice, no vuelve a salir aunque
el lote sea otro y el público sea otro. Un titular publicado está gastado.

### 2 · Ninguna puerta de entrada se usa más de dos veces por lote

**Esta es la que de verdad rompe el parecido**, más que el tema. Dos lotes de
productos distintos escritos los dos por la puerta de la situación suenan igual aunque
no compartan una palabra.

La puerta es **por dónde entra la pieza al argumento**. Las ocho:

`situación` · `cifra` · `límite` · `mecanismo` · `objeción` · `proceso` ·
`comparación` · `lo que pasa si no hace nada`

Se anota una por pieza. En un lote de doce, ninguna aparece más de dos veces y **al
menos cinco de las ocho aparecen**. Y se comprueba contra el índice: una puerta que se
gastó en el lote anterior con este mismo público arranca ya usada.

### 3 · Ninguna frase del ADN se copia literal

Ver causa 2 arriba. Se comprueba con una búsqueda, no con criterio.

---

## Cómo se comprueba a máquina

El verificador trae el modo:

```bash
node ../scripts/verificar-lote.mjs prompt.txt --marca ficha.json --adn ./adn/ --indice ./publicado.md
```

- Cada titular contra el índice: si ya salió, error.
- Cada puerta contra el tope de dos, y el mínimo de cinco distintas.
- Cada fragmento de ocho palabras o más de cada descripción, contra los archivos de
  ADN: si aparece literal, aviso con la frase señalada.

**Lo que la máquina no puede comprobar:** si dos titulares distintos dicen lo mismo
con otras palabras. Eso lo ve quien entrega, leyendo el índice entero antes de
escribir — que es corto y se lee en un minuto.
