# Skill · Contenido de Instagram

Produce **un solo prompt maestro, listo para pegar en Meta AI**, que devuelve un
documento HTML con el mes entero: las piezas ya compuestas con su texto, la
descripción de cada publicación con sus hashtags y su botón para copiarlos, y el
botón para descargar cada pieza en PNG a 1080×1350.

---

## 1 · Cuándo se usa

**Se dispara con:**
- «Dame el contenido de Instagram del mes»
- «Planeamiento de contenido para el siguiente mes, enfocado en eBot»
- «Necesito las publicaciones del mes con sus descripciones»
- «El prompt para que Meta me arme las piezas»

**NO se usa cuando:**
- Piden **una** pieza suelta → [`prompts/imagen/nano-banana.md`](../../prompts/imagen/nano-banana.md)
- Piden solo los fondos, sin texto ni descripciones → [`lote-visual`](../lote-visual/SKILL.md)
- Piden **pauta**, no orgánico → [`anuncio-pagado`](../anuncio-pagado/SKILL.md)
- Piden la campaña completa con embudo y presupuesto → [`campanas/README.md`](../../campanas/README.md)
  primero, y esta skill después para la parte orgánica

---

## 2 · Qué se lee

En este orden:

0. [`operacion/publicado.md`](../../operacion/publicado.md) — **lo que ya salió,
   para no repetirlo**. Se lee el primero y se actualiza el último. Sin este
   paso el lote nuevo repite los titulares del anterior, y ese fallo ya se
   produjo
1. [`datos/precios.json`](../../datos/precios.json) — toda cifra que se vaya a decir
2. [`datos/marca.json`](../../datos/marca.json) → `redesSociales` — retícula, escala, velo
3. [`adn/02-voz-y-tono.md`](../../adn/02-voz-y-tono.md) — y en particular «La excepción de redes sociales»
4. [`adn/05-personalidad.md`](../../adn/05-personalidad.md) — desde dónde se dice
5. [`adn/06-claridad.md`](../../adn/06-claridad.md) — a qué altura empieza cada
   pieza y la proporción del calendario. **Es el archivo que decide si el mes
   vende o solo informa**
6. [`adn/07-redaccion.md`](../../adn/07-redaccion.md) — el gancho, el ritmo y el
   cierre. Es el que decide si además se recuerda
7. [`adn/04-audiencia.md`](../../adn/04-audiencia.md) — el público del mes y sus objeciones
8. [`catalogo/`](../../catalogo/) — la ficha del producto del mes, entera
9. [`catalogo/08-fronteras.md`](../../catalogo/08-fronteras.md) — si el mes toca Care, Seguridad, Diagnóstico o Auditoría
10. [`prompts/texto/organico.md`](../../prompts/texto/organico.md) — los cinco tipos de publicación
11. [`prompts/imagen/texto-en-imagen.md`](../../prompts/imagen/texto-en-imagen.md) — la maquetación
12. [`prompts/plataformas/meta-ai.md`](../../prompts/plataformas/meta-ai.md) — el contrato
13. [`prompts/imagen/nano-banana.md`](../../prompts/imagen/nano-banana.md) — si el mes
    lleva carruseles: cómo se genera un fondo que es uno solo
14. [`campanas/plantillas/calendario.md`](../../campanas/plantillas/calendario.md) — la mezcla de tipos
15. [`prompts/bloques/estilo-visual.md`](../../prompts/bloques/estilo-visual.md) y
    [`negativos.md`](../../prompts/bloques/negativos.md) — se copian literales

---

## 3 · Qué se pregunta antes de empezar

1. **¿Qué producto es el foco del mes?** Cambia el público, las objeciones y las
   escenas. Un mes es de un producto, no de seis.
2. **¿Cuántas publicaciones?**
3. **¿Hay algo del mes anterior que no se pueda repetir?**

Si el humano ya los dio, no preguntes nada y produce.

**Valores por defecto**, si dice «lo que veas»:
- Publicaciones → **12**
- Formato → todo 4:5, 1080×1350
- Carruseles → entre 4 y 6 del total; el resto piezas sueltas
- Llamada a la acción → en 4 de 12, nunca más

---

## 4 · Procedimiento

### Paso 1 · Fijar el público, el ángulo y la firma

Del producto sale el público, y de
[`adn/04-audiencia.md`](../../adn/04-audiencia.md) salen su situación, lo que
teme y su objeción principal. **Un solo público y un solo ángulo en el mes.**

Y la firma, que también la manda el producto: la tagline de su ficha de
[`catalogo/`](../../catalogo/) si tiene una declarada, y la de marca si no. La
tabla está en [`adn/02-voz-y-tono.md`](../../adn/02-voz-y-tono.md). Se fija aquí
y no cambia en las doce.

Escríbelos antes de nada. Todo lo demás se mide contra ellos: una publicación que
no le habla a ese público sobra aunque esté bien escrita.

### Paso 2 · Repartir los tipos

Los cinco tipos están en
[`prompts/texto/organico.md`](../../prompts/texto/organico.md). Para doce
publicaciones, esta mezcla funciona:

| Tipo | Cuántas |
|---|---|
| Cifra publicada | 4 |
| Desastre explicado | 3 |
| Objeción contestada | 3 |
| Frontera | 1 |
| Trabajo enseñado | 1 |

**Y a cada pieza se le asigna aquí su PUERTA DE ENTRADA**, que es un eje
distinto del tipo: el tipo dice de qué habla, la puerta dice por dónde entra.
Las ocho están en [`adn/07-redaccion.md`](../../adn/07-redaccion.md) §4 —
`situación`, `cifra`, `límite`, `mecanismo`, `objeción`, `proceso`,
`comparación`, `lo que pasa si no hace nada`—. En doce piezas, **ninguna puerta
se usa más de dos veces y al menos cinco de las ocho aparecen**. Es lo que
impide que dos calendarios de productos distintos suenen igual, y se comprueba
contra [`operacion/publicado.md`](../../operacion/publicado.md): una puerta que
se gastó en el lote anterior con este mismo público arranca ya usada.

**El «trabajo enseñado» solo entra si hay un proyecto publicado y verificado que
encaje.** Si no lo hay, se sustituye por otra cifra publicada y **se dice al
entregar** — no se rellena con un caso inventado.

### Paso 3 · Escribir el texto de cada pieza

Por publicación, y en este orden:

1. **El titular**, que es lo que va dentro de la imagen. La situación primero,
   nunca el nombre del plan. De 2 a 8 líneas, con los cortes ya decididos y el
   tramo naranja ya marcado, según
   [`prompts/imagen/texto-en-imagen.md`](../../prompts/imagen/texto-en-imagen.md).
   **Y a la altura de la consecuencia**, no del hecho ni de la condición: la
   escalera y el traductor están en
   [`adn/06-claridad.md`](../../adn/06-claridad.md). Un titular que dice el
   precio o lo que no incluye está usando el sitio de otro.
2. **La descripción**, con las tres articulaciones y su firma al cierre.
   **Con tope, y se cuenta:** 100 caracteres la primera línea, 300 el cuerpo y
   500 la descripción entera sin los hashtags —
   [`adn/02-voz-y-tono.md`](../../adn/02-voz-y-tono.md) → «El largo tiene tope».
   Lo que no cabe en 500 casi siempre son dos ideas: se parte en dos
   publicaciones, no se aprieta.
3. **Los hashtags**, seis como máximo.
4. **La nota del límite**, si la pieza dice una cifra o un plazo. Obligatoria.

**Toda cifra se copia de [`datos/precios.json`](../../datos/precios.json) en el
momento de escribirla**, no de memoria. Y un importe único no se suma nunca a uno
mensual: eBot es `$499` de una vez, y aparte los `$5` al mes de la nube y los
`$1–2` al mes de la llave de inteligencia artificial.

### Paso 4 · Asignar la escena a cada pieza

La tabla de escena canónica por producto está en
[`prompts/README.md`](../../prompts/README.md). Se respeta: es lo que hace que el
visitante reconozca el tema sin leer.

Dentro de la escena madre se varía distancia, ángulo, cantidad o momento. **El
bloque de estilo no varía nunca** — si varían el estilo y el sujeto a la vez, no
es un mes de contenido, son doce imágenes sueltas.

Y los negativos específicos del tema, de
[`skills/lote-visual/SKILL.md`](../lote-visual/SKILL.md) paso 5. Para eBot:
`robots, androides, burbujas de chat`.

### Paso 5 · Elegir anclaje y tamaño por pieza, y resolver la interlínea

Mecánico, no artístico: el número de líneas del titular decide el tamaño, y el
tamaño decide el anclaje. La tabla está en
[`prompts/imagen/texto-en-imagen.md`](../../prompts/imagen/texto-en-imagen.md).

**Y con el titular ya cortado, se resuelve la interlínea línea a línea.** No es
un número fijo: cada línea que lleva `Á É Í Ó Ú` suma 0.27 al avance, cada una
con `Ñ` o `Ü` suma 0.20, y la que va debajo de una línea con `Q`, `¿`, `¡` o
coma suma 0.17. Antonio no rebaja los acentos en versalitas, así que sin esa
cuenta la tilde cae dentro de las letras de la línea de arriba. La cuenta entera,
medida, está en el mismo archivo.

Se entrega **resuelta**, no como regla: si Meta tiene que decidirlo, no lo hace.

El anclaje decide dónde tiene que quedar limpio el fondo, y eso se escribe dentro
del prompt de esa pieza — describiendo **qué hay** en esa zona (negro limpio, la
incandescencia apagándose), nunca «espacio para el texto».

### Paso 6 · Coser los carruseles

Un carrusel es **una pieza larga cortada en trozos**, no N publicaciones
seguidas. Por cada carrusel del mes se decide, antes de escribir el prompt
maestro:

1. **Cuántas diapositivas**, porque decide cómo se genera el fondo: 2 o 3 van con
   una panorámica cortada; 4 o más, con cadena de relevo.
   [`prompts/imagen/nano-banana.md`](../../prompts/imagen/nano-banana.md).
2. **Un solo prompt de fondo** para todo el carrusel. No uno por diapositiva.
3. **Un antetítulo**, el mismo en las N. Es el hilo.
4. **Un anclaje y un brillo**, los mismos en las N. Si cambian, se ve la costura.
5. **Los tramos naranjas leídos en orden tienen que formar una frase.**
   Escríbelos seguidos y léelos: si no dicen nada, el carrusel son N piezas con
   un tema común.
6. **El recorrido:** en la 01 el sujeto entra, en las intermedias cruza, en la
   última se detiene. Y la luz va en un solo sentido.

### Paso 7 · Armar el prompt maestro

Siete secciones, en este orden. El orden no es decorativo: la prohibición de
escribir va primero y se repite al final, porque en un prompt largo una sola
mención se le olvida a la mitad.

```
━━ 1. QUÉ ERES Y QUÉ NO HACES ━━
El reparto del trabajo y la prohibición literal de redactar, mejorar,
acortar, traducir o completar cualquier texto.

━━ 2. EL SISTEMA VISUAL ━━
Los cinco hex. Las dos familias con sus roles. La retícula en píxeles. LA
ESCALA COMPLETA. EL ORDEN DEL BLOQUE DE TEXTO. EL SÍMBOLO EN SU SVG/PATH2D
LITERAL —nunca descrito para que lo redibuje: se copia de
prompts/plataformas/meta-ai.md → «El símbolo, literal»—. LA CUENTA DE LA
INTERLÍNEA, con sus tres holguras, calculada para CADA par de líneas del
titular, sin saltarse ninguna. El velo. La regla del acento naranja. Y si el
mes lleva carruseles, las reglas de continuidad.

━━ 3. EL CONTRATO DEL HTML ━━
Las dos fuentes de Google Fonts. Lienzo de 1080×1350 exactos. LA VISTA
PREVIA A 480 PX DE ANCHO —pieza construida a 1080 y escalada calc(480/1080), dentro
de un marco de 360×450 con overflow:hidden— igual en todas las piezas, con
sus cuatro trampas. Botón de descarga por pieza y botón de descargar todas.
Descripción y hashtags en texto seleccionable debajo de cada pieza, con su
botón de copiar las dos juntas —y sin el prompt del fondo, que no vuelve al
documento—. Y las nueve trampas del exportador de
prompts/plataformas/meta-ai.md, literales.

━━ 4. EL BLOQUE DE ESTILO ━━
Literal, de prompts/bloques/estilo-visual.md. Una sola vez.

━━ 5. LOS NEGATIVOS ━━
Literal, de prompts/bloques/negativos.md, más los del tema del mes.

━━ 6. LAS PIEZAS ━━
Una por una: número, tipo, titular con sus cortes y su tramo naranja,
anclaje, prompt del fondo, descripción, hashtags. En el titular, la holgura
de interlínea ya resuelta línea a línea. Un carrusel va como UNA pieza con N
diapositivas y UN prompt de fondo, no como N piezas.

━━ 7. ANTES DE DEVOLVER ━━
La lista que Meta tiene que comprobar, con la prohibición repetida.
```

### Paso 8 · Pasar el verificador

La lista de la sección 5 es larga y se comprueba a mano. **Buena parte se comprueba
sola**, contra la ficha de la marca, y encuentra lo que el ojo no ve:

```bash
node .claude/skills/prompt-maestro/scripts/verificar-lote.mjs prompt.txt \
  --marca .claude/skills/prompt-maestro-panaclaw/assets/ficha-panaclaw.json \
  --adn adn --indice operacion/publicado.md
```

Cada línea de titular dentro de su rango de caracteres, cada tabla de interlínea
recalculada par a par, un solo tramo naranja y contiguo, cada importe existente en
`precios.json`, los topes de las descripciones, la jerga, los huecos sin resolver,
los titulares que ya salieron y las frases del ADN copiadas literales.

**Y las siete reglas duras que antes solo vivían en prosa:** la nota de límite
obligatoria con cifra, el ember en un rol de texto, un rango citado por su mínimo a
secas, las afirmaciones prohibidas, el número que no se imprime, las fronteras entre
productos y la suma de un pago único con una mensualidad.

Lo que no comprueba, y sigue siendo de quien entrega: si un titular es una
adivinanza, si el acento cae en la afirmación, si el lote le habla a un solo
público, y si dos titulares distintos dicen lo mismo con otras palabras.

**Córrelo ANTES del paso 9.** Si lo corres después de anotar el índice, los titulares
del lote ya están dentro y el aviso de repetición pierde sentido.

### Paso 9 · Anotar lo publicado

**Antes de entregar, no después.** Añade a
[`operacion/publicado.md`](../../operacion/publicado.md) una fila por pieza con
su fecha, su puerta, su titular y su escena. Si este paso se salta, el archivo
miente en el siguiente lote y la regla de no repetir deja de valer.

### Paso 10 · Entregar

El prompt maestro completo, en un bloque, listo para pegar. Ver
[`orquestador/protocolo-entrega.md`](../../orquestador/protocolo-entrega.md).

---

## 5 · Verificación

Antes de entregar, una a una:

- [ ] ¿Toda cifra existe en [`datos/precios.json`](../../datos/precios.json)?
- [ ] ¿Todo hex sale de [`datos/marca.json`](../../datos/marca.json)?
- [ ] ¿Algún pago único sumado a una mensualidad?
- [ ] ¿Algún rango citado por su mínimo a secas, sin «desde»?
- [ ] ¿Jerga? Búsqueda literal, no de memoria
- [ ] ¿Algún dato, métrica, testimonio o proceso que no exista en el catálogo?
- [ ] ¿Cada pieza que dice una cifra o un plazo lleva su nota de límite?
- [ ] ¿Un solo público y un solo ángulo en las doce?
- [ ] ¿Cuántos titulares abren por la consecuencia, cuántos por el hecho y
      cuántos por la condición? La proporción está en
      [`adn/06-claridad.md`](../../adn/06-claridad.md) y se cuenta, no se estima
- [ ] ¿Más de una de cada tres piezas abre por el límite? → reordénalas
- [ ] ¿Hay alguna palabra de la columna izquierda del traductor en un titular
      —«código», «panel», «complementos», «alojamiento»—? → baja el hecho a la
      nota y sube su consecuencia
- [ ] ¿Llamada a la acción en 4 como mucho?
- [ ] ¿Seis hashtags o menos en todas, y todos concretos?
- [ ] ¿Emojis solo en las descripciones, y solo en sus tres articulaciones?
- [ ] ¿Ninguna descripción sin su firma al cierre, y la misma en las doce?
- [ ] ¿La firma es la tagline del producto del mes, y no una inventada?
- [ ] ¿Alguna pieza dice su tagline tres veces —titular, apertura y firma—?
- [ ] ¿Cada titular cabe en 8 líneas, con los cortes escritos?
- [ ] ¿Un solo tramo naranja por titular?
- [ ] ¿Está resuelta la interlínea línea a línea en cada titular que lleva
      tilde, eñe o signo de apertura? → `texto-en-imagen.md`
- [ ] En un titular con más de un par que necesita holgura, ¿está calculada en
      **cada** par, o se quedó solo en el primero?
- [ ] ¿El símbolo de las N piezas es el SVG/Path2D literal de
      `prompts/plataformas/meta-ai.md`, y no una aproximación con trazos?
- [ ] En cada carrusel: ¿un solo prompt de fondo, un antetítulo, un anclaje y un
      brillo para todas las diapositivas?
- [ ] En cada carrusel: lee **solo los tramos naranjas** en orden. ¿Forman una
      frase?
- [ ] ¿Pide el prompt maestro que los carruseles se muestren **en tira**, pegados
      y sin separación, además de sueltos?
- [ ] ¿El bloque de estilo está una sola vez y es idéntico para todas?
- [ ] ¿La prohibición de escribir aparece al principio **y** al final?
- [ ] ¿Está el orden del bloque de texto escrito, y no solo la escala? Dar los
      tamaños sin el orden deja al modelo poniendo la cifra encima del titular
- [ ] ¿Están las nueve trampas del exportador dentro del prompt maestro?
- [ ] ¿Pasa cada pieza la prueba del rótulo? Tapa la marca y la cifra: ¿se sabe
      qué se vende sin deducirlo? → [`adn/06-claridad.md`](../../adn/06-claridad.md) §9
- [ ] ¿El antetítulo nombra la categoría en la que está el lector, y no el
      nombre del plan?
- [ ] ¿Pasa la prueba del descarte? Si el titular valdría para otra agencia de
      Panamá, es un rótulo → [`adn/07-redaccion.md`](../../adn/07-redaccion.md) §4
- [ ] ¿Cada afirmación fuerte lleva su prueba a menos de una frase? → `07` §3
- [ ] ¿Está **cada titular** ausente de
      [`operacion/publicado.md`](../../operacion/publicado.md)? Ninguno se repite
      nunca, ni cambiando el mes
- [ ] ¿Ninguna puerta de entrada se usa más de dos veces, y aparecen al menos
      cinco de las ocho? Se cuentan, no se estiman
- [ ] **Busca cada frase de la descripción en `adn/`.** Si alguna está literal,
      es un guion copiado y se reescribe. La única excepción es la tagline
- [ ] ¿Pasa cada descripción de 500 caracteres, o su primera línea de 100?
      → recorta, y si no baja, es que lleva dos ideas
- [ ] ¿Huecos sin resolver en el prompt maestro?

**Y cuando vuelva el documento, antes de publicar nada:** descarga una pieza y
ponla al lado de su vista previa. Si no son idénticas, el exportador está mal y
lo están todas las del mes.

Eso se hace a máquina, que encuentra desfases de píxeles que el ojo no ve:

```bash
node .claude/skills/prompt-maestro/scripts/auditar-documento.mjs documento.html \
  --prompt prompt.txt --png ./auditoria
```

Compara cada cadena del prompt contra el documento carácter a carácter —es la que
dice si el modelo inventó o alteró algo—, pulsa los botones de descarga y superpone
cada PNG a su vista previa. Por encima de 6 px de desfase, el exportador está mal.

---

## Qué se dice al entregar

Tres cosas como máximo:

1. Cuántas publicaciones, de qué producto, para qué público y en qué formato.
2. **Qué no incluye:** qué pieza no se pudo escribir por falta de material
   verificado, y qué dato haría falta para completarla.
3. Solo si aplica: qué decisión tomaste que el humano podría querer distinta.
