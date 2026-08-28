# Qué revisar cuando vuelve el documento

Los fallos por frecuencia, con la frase exacta que los corrige. Están escritas para
pegárselas al modelo tal cual: dicen qué está mal y qué hacer, sin discutir.

**Antes de leer nada:** corre el auditor. Encuentra en treinta segundos lo que a ojo
cuesta una hora, y encuentra desfases de píxeles que el ojo no ve.

```bash
node ../scripts/auditar-documento.mjs documento.html --prompt prompt-maestro.txt
```

---

## Los del texto

| Fallo | Cómo se ve | Qué se le dice |
|---|---|---|
| **Reescribió un texto** | Una descripción que suena parecida pero no igual | «El texto de la pieza N no coincide con el que te di. Cópialo literal.» |
| **Añadió una cifra** | Un porcentaje o una estadística que no le diste | «Quita el dato de la pieza N. No estaba en lo que te pasé.» |
| **Se comió una tilde** | `CODIGO TUYO` | «Faltan tildes en la pieza N. El texto correcto es: …» |
| **Alargó una descripción** | Una frase «que ayuda» al final del cuerpo | «Las descripciones están escritas con tope contado. Devuelve la de la pieza N a la que te di, sin la frase añadida.» |
| **Contó mal los hashtags** | Ocho donde había seis | «Cuenta los hashtags de la pieza N. Son los que te di, ni uno más.» |

**Cuenta los hashtags de cada pieza.** Es lo que más se le va: le das seis y devuelve
nueve.

---

## Los de la tipografía

| Fallo | Cómo se ve | Qué se le dice |
|---|---|---|
| **Aplicó la interlínea igual a todas las líneas** | Una tilde o una eñe metida dentro de las letras de la línea de encima | «Falta la holgura del titular de la pieza N. Cada par lleva el avance de su tabla; están todas escritas en el documento.» |
| **Calculó la holgura solo para un par** | Un titular donde una tilde se come la línea de encima, pero solo en una de las transiciones | «Recalcula la holgura de CADA par de líneas de la pieza N, no solo del primero. Corre la tabla línea por línea hasta la última.» |
| **Subió la interlínea de todas** | El bloque del titular se ve suelto y ya no compacto | «La interlínea base no cambia. La holgura va solo en las líneas que la necesitan.» |
| **Usó otra familia** | El titular no se reconoce | «El titular va en la familia declarada y el resto en la de apoyo. Ninguna otra, en ningún caso.» |

**Y una que no se ve leyendo:** si la tilde no se solapa pero queda a menos de tres
píxeles de la línea de encima, se lee soldada. La tabla de holguras está corta — no es
un fallo del modelo, es del contrato. Vuelve a
[`interlinea.md`](interlinea.md).

---

## Los del logo

| Fallo | Cómo se ve | Qué se le dice |
|---|---|---|
| **Lo redibujó** | Trazos con `stroke`, de otro color, en vez de las figuras rellenas | «El logo de la pieza N no es el de la marca. Reemplázalo por el bloque SVG/Path2D literal de la sección 2 de este documento. No lo redibujes.» |
| **Lo deformó** | Se ve estirado o achatado | «La escala del logo va igual en los dos ejes. No es cuadrado.» |
| **Se le rellenaron los huecos** | Sale como una mancha | «Falta `fill-rule` en el SVG y en `ctx.fill`.» |

Si esto falla, casi siempre es porque el logo se dio descrito en algún sitio del
prompt en vez de como código. Búscalo y cámbialo.

---

## Los del maquetado

| Fallo | Cómo se ve | Qué se le dice |
|---|---|---|
| **Metió las publicaciones en una rejilla** | Columnas de alturas dispares, huecos de media pantalla, piezas de dos publicaciones en la misma fila | «El documento es una lista vertical de publicaciones. Cada una ocupa una fila entera con su cabecera, sus piezas en fila y su descripción debajo. Dos publicaciones nunca comparten fila.» |
| **La vista previa sale de otro tamaño** | Las piezas se ven enormes o diminutas, o no todas miden lo mismo | «La vista previa mide N px de ancho en todas: la pieza se construye a tamaño real y se escala con la división. No la adaptes a la pantalla.» |
| **Escaló la pieza sin marco** | Huecos enormes entre piezas y la página se desplaza a lo ancho | «El marco lleva su ancho y su alto escritos con overflow:hidden, y la pieza va con transform-origin: top left.» |
| **Metió una caja detrás del texto** | Un rectángulo semitransparente bajo el titular | «El contraste lo pone el velo, que es continuo y no tiene borde. Ninguna caja, franja ni sombra detrás del texto.» |

---

## Los del exportador

**La comprobación que no se puede saltar:** descarga una pieza y ponla al lado de su
vista previa. Si no son idénticas, el exportador está mal — y si está mal en una, está
mal en todas.

| Fallo | Cómo se ve | Qué se le dice |
|---|---|---|
| **El PNG no coincide con la vista previa** | Superpuestos, el texto del PNG cae unos píxeles más arriba | «Dibuja el titular por línea base, no con `textBaseline='top'`: con interlínea por debajo de 1 los dos anclajes no coinciden. La cuenta está en la trampa 2.» |
| **El lienzo no mide lo que toca** | El PNG sale de otro tamaño | «El lienzo de exportación mide exactamente N × M.» |
| **Una nota larga se sale por el borde** | En el PNG, no en la vista previa | «Los textos de varias líneas se parten también en el lienzo. Mide con `measureText` y corta donde cortaría el navegador.» |
| **El PNG entero sale apagado** | Más oscuro que la vista previa | «`ctx.filter` se queda puesto después del fondo. Ponlo a `'none'` justo después del `drawImage`.» |
| **El tracking se filtró** | El titular se sale del lienzo | «`ctx.letterSpacing` no se reinicia al cambiar `ctx.font`. Ponlo a `'0px'` después de cada elemento que lo use.» |

Un desfase de dos o tres píxeles entre las dos es normal y viene de que el lienzo
posiciona por la caja del tipo y el navegador por la caja de línea. **Por encima de
seis, algo está mal calculado.**

---

## Los de los fondos

| Fallo | Cómo se ve | Qué se le dice |
|---|---|---|
| **Metió texto en la imagen** | Letras dentro del fondo generado | «El fondo de la pieza N tiene letras. Regenéralo sin ningún texto.» |
| **Invadió la banda del logo** | El logo desaparece sobre un resplandor de su mismo color | «El fondo de la pieza N invade la banda reservada de arriba. Regenéralo con esa franja en negro limpio. No subas el velo para taparlo.» |
| **Generó un fondo por diapositiva** | Al poner el carrusel en tira, cada corte es una imagen distinta | «El fondo del carrusel es una sola panorámica cortada. Usa la misma imagen desplazada −ancho·k en cada diapositiva.» |
| **Cambió el brillo entre diapositivas** | Un escalón de luz en la costura | «El brillo de la imagen es el mismo número en las N diapositivas.» |

**Y mira los carruseles en tira antes que sueltos.** Las costuras no se ven de ninguna
otra manera.

---

## Lo que no se le pide nunca

- Que escriba, sugiera o mejore copy
- Que proponga publicaciones que no estén en el plan
- Que ajuste una cifra «para que se lea mejor»
- Que resuma la lista de exclusiones
- Que traduzca
- Que añada emojis a un titular o dentro de una imagen
