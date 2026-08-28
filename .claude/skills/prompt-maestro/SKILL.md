---
name: prompt-maestro
description: Produce un prompt maestro, listo para pegar, que hace que Meta AI (o cualquier modelo que genere imágenes y devuelva HTML) monte un lote entero de piezas de redes sociales de una marca — con el texto ya escrito y compuesto encima, la tipografía real, y cada pieza descargable en PNG a tamaño completo. Úsala siempre que alguien pida un lote, calendario o tanda de publicaciones de Instagram o Facebook para una marca que ya tiene ADN, manual o branding declarado; que pida «el prompt maestro», «el prompt para que Meta me arme las piezas», «los creativos del mes», «12 posts para la marca X»; o que quiera aplicar este mismo sistema a un cliente nuevo. También cuando el documento HTML ya volvió y hay que auditarlo, medirlo o corregirlo. Se dispara aunque no digan «prompt maestro» con esas palabras — basta con que el encargo sea un lote de piezas de marca con texto compuesto encima.
---

# Prompt maestro para un lote de piezas de marca

Esto produce **un solo bloque de texto, listo para pegar**, que hace que un modelo
multimodal devuelva un documento HTML autocontenido con el lote entero: cada pieza
compuesta con su texto, la descripción de cada publicación con sus hashtags y un
botón para copiarlas, y cada lienzo descargable en PNG a tamaño real.

**El reparto del trabajo es la idea entera**, y no es negociable:

```
TÚ            escribes el 100 % del texto, verificado contra la fuente de la marca
  ↓           titulares, descripciones, hashtags, cortes de línea, qué va en acento
EL MODELO     genera los fondos y monta el HTML
  ↓           copia el texto LITERAL. No lo redacta, no lo mejora, no lo acorta
EL HUMANO     descarga los PNG y publica
```

Existe porque los modelos de imagen **inventan datos con formato perfecto**. En el
lote que originó este sistema, un modelo devolvió doce publicaciones bien maquetadas
con ocho cifras inventadas dentro: precios que no existían, plazos que nadie había
prometido, estadísticas de sector sin fuente. Todas verosímiles. Ninguna cierta.

La segunda vez, con el reparto de arriba escrito en el prompt, el mismo modelo copió
**201 de 201 cadenas sin alterar un carácter**. Ese es el rendimiento que este
procedimiento busca reproducir para cualquier marca.

---

## 1 · Antes de nada: el contrato de marca

Este procedimiento es **agnóstico de marca**. Todo lo específico entra por una ficha
que la marca tiene que declarar. Léela entera en
[`references/contrato-de-marca.md`](references/contrato-de-marca.md); el resumen es
que hacen falta dieciséis cosas —doce de cómo se ve y suena, y cuatro de lo que la
marca no puede decir— y las tres primeras son las que más se olvidan:

1. **De dónde sale cada cifra.** Un archivo, una tabla, una página. Si el encargo
   dice un precio que no está ahí, ese producto no existe todavía: dilo y para.
2. **El logo como código, no como descripción.** El trazado SVG literal y su
   `Path2D` equivalente. Esto es lo más importante del contrato y la sección 4
   explica por qué.
3. **La tipografía de titular, con su archivo o su nombre en Google Fonts.** Hace
   falta para medirla, no para nombrarla.

**Si falta una, pregunta antes de producir.** Adivinarla cuesta rehacer
el lote entero, y el error no se ve hasta que el documento vuelve montado.

Cuando la marca ya tiene un repositorio de ADN, casi todo esto está escrito y solo
hay que ir a buscarlo. Cuando no, la ficha en blanco de
[`assets/ficha-de-marca.json`](assets/ficha-de-marca.json) es lo que se le pide al
cliente.

---

## 2 · Lo que se pregunta antes de empezar

Cuatro cosas. Si el humano ya las dio, no preguntes nada y produce.

1. **¿Cuántas publicaciones y de qué producto?** Un lote es de un producto y un
   público, no de seis. Rotar entre públicos dentro del mismo lote no construye
   argumento.
2. **¿Qué formatos?** No «para Instagram»: Instagram tiene feed cuadrado, feed
   vertical 4:5, story 9:16 y reel. No se recortan entre sí sin perder el titular.
3. **¿Cuántos carruseles?** Deciden cómo se generan los fondos, y eso cambia el
   trabajo. Ver sección 5.
4. **¿Qué salió en el lote anterior?** Sin esto, el lote nuevo repite la redacción
   del anterior. Ver sección 8.

**Valores por defecto** si dicen «lo que veas»: 12 publicaciones, todo 4:5, entre 3
y 5 carruseles de 2 o 3 diapositivas, llamada a la acción en 4 como mucho.

---

## 3 · La interlínea se mide, no se copia

**Este es el paso que más caro sale saltarse, y el que casi nadie sospecha.**

Un titular compacto va con interlínea por debajo de 1 — es lo que produce el bloque
apretado que casi toda marca con carácter usa. A esa interlínea, en español, **la
tilde de una Á se mete dentro de las letras de la línea de arriba**, porque las
tipografías de titular no rebajan los acentos para versalitas. Y por abajo pasa lo
mismo con la cola de una Q, con la coma y con los signos de apertura.

La solución no es subir la interlínea de todas las líneas: eso afloja el bloque
entero para arreglar dos líneas. Es una **holgura por par de líneas**, calculada:

```
avance(n → n+1) = base
                + holguraSuperior(línea n+1)     lo que sube la tinta de abajo
                + holguraInferior(línea n)       lo que baja la tinta de arriba
```

**Las holguras dependen de la fuente y hay que medirlas.** Una tabla copiada de otra
marca está mal por definición. Corre:

```bash
node scripts/medir-fuente.mjs --familia "Antonio" --peso 700
node scripts/medir-fuente.mjs --archivo ./assets/DisplayDeLaMarca.woff2
```

Devuelve la tabla lista para pegar en el contrato de marca y en el prompt maestro.

**Y mide el hueco óptico, no solo la tinta.** Es el matiz que rompió el primer lote
real de este sistema: la tabla perseguía dejar el mismo hueco que entre dos
versalitas lisas —dos centésimas de em—, y entre dos versalitas eso se lee como
separación porque los dos bordes son largos y planos, pero entre una tilde
puntiaguda y la línea base de arriba se lee como **contacto**. El ojo suelda una
marca pequeña y aislada a la tinta que tenga más cerca. El script ya suma ese hueco;
el porqué está en [`references/interlinea.md`](references/interlinea.md).

**Se entrega resuelta, par a par.** Si el modelo tiene que calcularla, no lo hace —
o la aplica al primer par que se nota y deja el resto del bloque en la base.

---

## 4 · El logo va como código. Siempre

De todo lo que se le pide a un modelo, esto es lo único que nunca ha fallado, y se
sabe por qué: **es lo único que va como código en vez de como prosa.**

Descrito —«una garra de tres zarpazos», «88 por 72 píxeles, centrado»— el modelo lo
**interpreta** y devuelve algo parecido que no es la marca. Pegado como trazado
literal, en sus dos versiones —el `<svg>` de la vista previa y el `Path2D` del
lienzo de exportación—, sale idéntico en todas las piezas del lote.

**Generaliza el patrón, no solo el caso.** Cuando algo del prompt falle dos veces
seguidas, la pregunta útil es: *¿esto lo estoy pidiendo en prosa pudiendo darlo
resuelto?* Casi siempre la respuesta es sí — y casi siempre lo que hay que dar
resuelto es un número, una coordenada o un bloque de código.

Tres cosas se rompen solas si no se dicen, y van literales:

- `fill`, nunca `stroke`. Y `fill-rule` explícito, o los huecos se rellenan.
- La misma escala en los dos ejes. Un logo que no es cuadrado y se mete en una
  caja cuadrada sale deformado, y deformarlo suele estar prohibido.
- El color plano del logo, sin degradado. A tamaño de pieza el degradado no se ve
  y solo ensucia el borde.

---

## 5 · Un carrusel es una pieza larga cortada

No son N publicaciones seguidas. Al deslizar tiene que seguir siendo el mismo objeto,
la misma luz y la misma frase. Cuatro cosas lo producen y ninguna es opcional: **un
fondo, un velo, un recorrido y una frase.**

| Diapositivas | Cómo se genera el fondo |
|---|---|
| 2 o 3 | **Una sola panorámica cortada.** Se pide 3:2 para dos, 21:9 para tres, y se corta en trozos del ancho del lienzo |
| 4 o más | **Cadena de relevo.** Cada una se genera con la anterior delante, avanzando la cámara |

La diapositiva `k` no lleva su propia imagen: lleva la panorámica entera desplazada
`−ancho·k`. Si se recorta y reescala cada trozo por separado, los redondeos dejan una
costura de uno o dos píxeles en cada corte.

**Y los acentos leídos en orden tienen que formar una frase.** Escríbelos seguidos y
léelos sin el resto del texto: si no dicen nada, el carrusel son N piezas con un tema
común, no un concepto. Es la prueba más barata que existe y la que más carruseles
salva.

El detalle entero —velo, costura, recorrido, numerador— está en
[`references/carrusel.md`](references/carrusel.md).

---

## 6 · Las siete secciones del prompt maestro

El orden no es decorativo. Está en
[`references/estructura-prompt.md`](references/estructura-prompt.md) con lo que es
fijo y lo que se rellena marcado pieza por pieza.

```
1. QUÉ ERES Y QUÉ NO HACES     el reparto y la prohibición literal de redactar
2. EL SISTEMA VISUAL           paleta, tipografías con roles, retícula, escala,
                               EL LOGO EN CÓDIGO, la interlínea medida, el acento
3. EL CONTRATO DEL HTML        fuentes, lienzo a medida real, vista previa,
                               las nueve trampas del exportador, los botones
4. EL BLOQUE DE ESTILO         literal, una sola vez, idéntico en todos los fondos
5. LOS NEGATIVOS               literal, más los del tema del lote
6. LAS PIEZAS                  una por una, con su texto ya escrito y su fondo
7. ANTES DE DEVOLVER           la lista de comprobación, con la prohibición repetida
```

**La prohibición de escribir va la primera y se repite en la séptima.** Una sola vez,
al principio de un prompt de mil líneas, se le olvida a la mitad. No es redundancia
por si acaso: es la única instrucción que se ha visto degradarse por distancia.

El contrato del HTML —vista previa, maquetado del documento, exportador— es la parte
que **no cambia de una marca a otra** y la que más cuesta redescubrir. Está entera y
lista para copiar en [`references/contrato-html.md`](references/contrato-html.md),
incluidas las nueve trampas del exportador, que son fallos observados y no gustos.

Dos de esas nueve merecen mención aquí porque son invisibles hasta que alguien
compara:

- **El documento es una lista de publicaciones, no una rejilla de piezas.** Metidas
  en una rejilla, un carrusel de tres ocupa cinco veces el alto de una pieza suelta
  y el resultado sale dentado, con huecos de media pantalla y piezas de dos
  publicaciones en la misma fila.
- **El titular se dibuja por línea base, no con `textBaseline='top'`.** Con
  interlínea por debajo de 1 los dos anclajes no coinciden y el PNG entero sale unos
  cinco píxeles por encima de su vista previa. Se ve solo superponiéndolos.

---

## 7 · La altura: por dónde abre cada pieza

Es el eje que decide si un lote **vende o solo informa**, y es invisible mientras no
se nombra. Todo lo que una marca puede decir de un producto está en una de tres
alturas:

| Altura | Contesta a |
|---|---|
| **Consecuencia** | ¿Qué le cambia a mi negocio? |
| **Hecho** | ¿Qué es y cuánto cuesta? |
| **Condición** | ¿Qué no entra y desde cuándo cuenta? |

> **Una pieza baja de altura. Nunca sube.** Se abre en consecuencia, se aterriza en
> el hecho y se cierra en la condición.

Una pieza que **abre** en condición contesta en voz alta algo que quien lee todavía
no ha preguntado en silencio. Decir el límite antes de que lo pregunten es de las
cosas que más confianza generan — **ponerlo de titular no lo es.** El límite vive en
la nota, en la bajada o en el último tercio de la descripción.

**Se anota una altura por pieza y se cuentan**, porque estimarlas no funciona: en la
auditoría que originó esta regla, cuatro de ocho piezas hablaban de cómo se cobra y
una sola de lo que le cambiaba al negocio de quien lee. Nadie lo había notado.

La proporción se declara en la ficha. Una que funciona, por cada ocho piezas: **4
consecuencia, 3 hecho, 1 condición**, con un tope duro de **una de cada tres**
abriendo por el límite. Por encima de ahí, el conjunto deja de sonar a alguien que
enseña la cocina y empieza a sonar a alguien que se defiende.

`verificar-lote.mjs` las cuenta si cada pieza lleva su línea `ALTURA consecuencia`.

**No confundas altura con tipo ni con puerta.** Son tres ejes distintos y se cruzan:
el tipo dice **de qué habla** la pieza, la puerta dice **por dónde entra** al
argumento (sección 8), y la altura dice **a qué distancia del bolsillo empieza**. Una
pieza sobre un precio puede y debe estar escrita a la altura de la consecuencia; lo
que la arruina no es su tema, es abrir por el importe.

---

## 8 · Que no suene igual que el lote anterior

Cuando una marca tiene un corpus cerrado —toda cifra de una fuente, toda afirmación
de un catálogo— el material de partida es siempre el mismo, y eso es el precio de no
inventar datos. Se paga con gusto. Pero produce un efecto que el cliente nota antes
que nadie: **los lotes empiezan a sonar iguales.**

No son las ideas: es la redacción. Y tiene tres causas, de las cuales solo una se
puede tapar sin romper la marca.

1. **El corpus cerrado.** No se toca.
2. **El ADN trae frases modelo que se leen como copy aprobado.** Quien busca cómo
   decir algo encuentra la frase canónica ya escrita y la copia. No es pereza: es lo
   que hace un archivo bien escrito. **Regla: ninguna frase del ADN se copia
   literal.** Son formas, no guiones. La prueba es mecánica — busca la frase en los
   archivos de ADN antes de entregarla; si está, reescríbela.
3. **No hay memoria de lo entregado.** Dos ejecuciones idénticas dan resultados
   idénticos. Esta es la que se tapa.

**Lleva un índice en negativo** — no guarda copy para reutilizarlo, lo guarda para
prohibirlo. Qué anotar y las tres reglas están en
[`references/antirrepeticion.md`](references/antirrepeticion.md). La que más rompe el
parecido no es la del titular, es esta:

> **Ninguna puerta de entrada se usa más de dos veces por lote**, y aparecen al
> menos cinco de las ocho.

La puerta es por dónde entra la pieza al argumento: situación, cifra, límite,
mecanismo, objeción, proceso, comparación, o lo que pasa si no hace nada. Dos lotes
de productos distintos escritos los dos por la puerta de la situación suenan igual
aunque no compartan una palabra.

---

## 9 · Antes de entregar el prompt

Corre el verificador. Comprueba de una pasada lo que se puede comprobar a máquina, y
lo hace contra la ficha de la marca, no contra reglas fijas:

```bash
node scripts/verificar-lote.mjs prompt-maestro.txt --marca ficha-de-marca.json
```

- Cada línea de titular dentro del rango de caracteres de su tamaño
- Cada tabla de interlínea recalculada par a par contra la fórmula
- Un solo tramo de acento por titular, contiguo y dentro de su tope
- Cada importe, existente en la fuente declarada
- Cada tope de caracteres de las descripciones
- Jerga y léxico prohibido, por búsqueda literal
- Huecos sin resolver: ni un `[completa aquí]`, ni un corchete vacío

**Lo que la máquina no puede comprobar** y hace quien entrega: si un titular es una
adivinanza, si el acento cae en la afirmación y no en la negación, y si el lote
entero le habla a un solo público.

---

## 10 · Cuando el documento vuelve

**La comprobación que no se puede saltar:** descarga una pieza y ponla al lado de su
vista previa. Si no son idénticas, el exportador está mal — y si está mal en una,
está mal en todas.

Hazla a máquina, que es más fiable y encuentra desfases de píxeles que el ojo no ve:

```bash
node scripts/auditar-documento.mjs documento.html --prompt prompt-maestro.txt
```

Compara las cadenas del documento contra el prompt carácter a carácter, exporta cada
PNG con la propia función del documento, lo superpone a su vista previa y devuelve el
desfase en píxeles. Un desfase de dos o tres es normal y viene de que el lienzo
posiciona por la caja del tipo y el navegador por la caja de línea. Por encima de
seis, algo está mal calculado.

Los fallos por frecuencia, con la frase exacta que los corrige, están en
[`references/que-revisar.md`](references/que-revisar.md).

**Y cuenta los hashtags de cada pieza.** Es lo que más se le va: le das seis y
devuelve nueve.

---

## Qué se dice al entregar

Tres cosas como máximo:

1. Qué es, para qué plataforma y qué proporción produce.
2. **Qué no incluye**: qué pieza no se pudo escribir por falta de material
   verificado, y qué dato haría falta para completarla.
3. Solo si aplica: qué decisión tomaste que el humano podría querer distinta.
