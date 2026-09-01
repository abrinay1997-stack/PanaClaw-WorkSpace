# Skill · Blog SEO

Produce **un post del blog, listo para pegar en `src/content/blog/` del
repositorio del sitio**: frontmatter completo y válido contra el schema real,
más el cuerpo en Markdown.

---

## 1 · Cuándo se usa

**Se dispara con:**
- «Escribe un post para el blog sobre X»
- «Necesito el próximo artículo del blog»
- «Dame un blog para SEO sobre [tema]»
- «Qué blog toca este mes»
- «Redacta un artículo para posicionar [búsqueda]»

**NO se usa cuando:**
- Piden contenido de Instagram, aunque sea del mismo tema →
  [`contenido-instagram`](../contenido-instagram/SKILL.md)
- Piden copy de anuncio pagado → [`anuncio-pagado`](../anuncio-pagado/SKILL.md)
- Piden solo el titular o un fragmento suelto para reusar en otra pieza — el
  blog no es un banco de frases, es una entrega completa o nada
- Piden una ficha de producto para la web (no un post) →
  `catalogo/` del producto directamente

---

## 2 · Qué se lee

En este orden:

1. [`adn/01-identidad.md`](../../adn/01-identidad.md) — quién es la marca y los tres pilares
2. [`adn/02-voz-y-tono.md`](../../adn/02-voz-y-tono.md) — cómo se construye una frase
3. [`adn/04-audiencia.md`](../../adn/04-audiencia.md) — los seis públicos, sus escenas y sus objeciones. **De aquí sale el tema si no lo trae el humano**
4. [`adn/05-personalidad.md`](../../adn/05-personalidad.md) — desde dónde se dice
5. [`adn/06-claridad.md`](../../adn/06-claridad.md) — a qué altura abre el lead y el traductor
6. [`adn/07-redaccion.md`](../../adn/07-redaccion.md) — el gancho, la prueba y el ritmo, aplicados a un formato largo
7. [`datos/precios.json`](../../datos/precios.json) — toda cifra que se vaya a citar
8. [`catalogo/`](../../catalogo/) — la ficha del producto que el post va a enlazar en el cierre
9. [`catalogo/08-fronteras.md`](../../catalogo/08-fronteras.md) — si el post toca Care, Seguridad, Diagnóstico o Auditoría
10. [`catalogo/09-prueba.md`](../../catalogo/09-prueba.md) — lo único verificable que se puede citar como dato de sector o de proyecto
11. [`prompts/texto/blog.md`](../../prompts/texto/blog.md) — el contrato técnico y la anatomía del post
12. [`operacion/deuda-conocida.md`](../../operacion/deuda-conocida.md) — qué no se puede prometer todavía (métricas sin medir, afirmaciones de mercado sin comprobar)
13. **Los posts que ya existen**, en `src/content/blog/*.md` del repositorio
    `abrinay1997-stack/PanaClaw` — título, `category` y `keywords` de cada uno.
    Es lectura obligatoria y va antes de proponer un tema, no después.

---

## 3 · Qué se pregunta antes de empezar

1. **¿Hay un tema concreto, o toca elegirlo?** Si el humano ya lo dio, se pasa
   directo al paso 2 del procedimiento.
2. **¿Qué categoría de las cinco es** (`precios`, `guias`, `comparativas`,
   `casos`, `panama`)? Si el tema no encaja claramente en una, se dice antes de
   forzarlo.
3. **¿A qué público de [`adn/04-audiencia.md`](../../adn/04-audiencia.md) le
   habla?** Cambia el ángulo, el enlace del cierre y qué objeción resolver.

Si el humano ya dio los tres, no preguntes nada y produce.

**Valores por defecto**, si dice «el que toque» o «lo que veas»:
- Categoría → la que tenga menos posts publicados hasta ahora, salvo `casos`
  (bloqueada, ver paso 3 de abajo)
- Público → el que no se haya tocado en el post más reciente
- Longitud → `readingTime` 5–7, el rango donde caen los cuatro posts ya publicados

---

## 4 · Procedimiento

### Paso 1 · Leer lo publicado y descartar lo repetido

Antes de proponer nada: lee `src/content/blog/*.md` completo. Anota, de cada
uno, el `title`, la `category` y las `keywords`. **Ningún tema nuevo puede
compartir el ángulo central de uno que ya existe**, aunque el titular sea
distinto — «cuánto cuesta una web» y «qué determina el precio de una web» son
el mismo post con otro nombre.

Si el humano pidió explícitamente un tema que ya está cubierto, se dice —no se
escribe una segunda vez el mismo argumento con otras palabras— y se ofrece el
ángulo más cercano que sí esté libre.

### Paso 2 · Fijar el tema como una pregunta de búsqueda real

El tema se escribe primero como lo escribiría un dueño de negocio panameño en
Google, no como un titular de marca. Sale de cruzar:

- Una situación de [`adn/04-audiencia.md`](../../adn/04-audiencia.md) — lo que
  esa persona teme o lo que abre su conversación —, o
- Uno de los tres pilares o las tres cosas contra las que se define la marca
  en [`adn/01-identidad.md`](../../adn/01-identidad.md).

**No se inventa un dolor nuevo que no esté catalogado.** Si ninguna situación
existente encaja con lo que pidió el humano, se dice y se pregunta por el
público.

### Paso 3 · Comprobar que el tema no exige un dato que no existe

Antes de escribir una palabra: ¿este ángulo necesita una estadística de
mercado, una métrica de proyecto o una comparación con la competencia para
sostenerse? Si sí, revisa
[`catalogo/09-prueba.md`](../../catalogo/09-prueba.md) y
[`operacion/deuda-conocida.md`](../../operacion/deuda-conocida.md).

- Si el dato existe y está verificado, se usa con su atribución.
- Si no existe, **el post no se escribe con ese ángulo.** Se busca el que sí
  se sostiene con lo que hay, o se dice qué falta y se para. Esto es lo que
  cierra la puerta a rellenar con «el 60% de las búsquedas…» o «la mayoría de
  las agencias…»: si no está en `09-prueba.md`, no entra.

**`casos` sigue bloqueada** hasta que se resuelva
[`operacion/deuda-conocida.md`](../../operacion/deuda-conocida.md) punto 2: los
cuatro proyectos no tienen reto, solución ni métricas medidas. Se puede
escribir sobre un proyecto solo si el post no promete cifra de resultado — y
en ese caso, se dice al entregar que es una ficha a medias, no un caso
completo.

### Paso 4 · Escribir el frontmatter

Con el contrato exacto de
[`prompts/texto/blog.md`](../../prompts/texto/blog.md) → «El contrato
técnico». `title` de 15 a 90 caracteres, `description` de 60 a 200, `category`
del enum cerrado, `keywords` de 1 a 6, `readingTime` entero de 2 a 30, fecha de
hoy salvo que el humano pida otra. **Cuenta los caracteres, no los estimes** —
es lo primero que revienta el `build` del sitio si se falla.

**`date` se confirma justo antes de fusionar, no se da por buena la del
momento de redactar.** Esta conversación es asíncrona: entre que se redacta el
post y el humano aprueba y fusiona el PR puede pasar tiempo real —a veces
minutos, a veces varios días—, y `date` es la fecha de publicación, no la de
escritura. Ya pasó: un post quedó fechado seis días antes de su fusión real
porque nadie volvió a mirar el campo. Antes de decir que un PR está listo para
fusionar, comprueba la fecha de ese momento (`date -u +%Y-%m-%d`, ajustada a
hora de Panamá si cruza medianoche UTC) contra la que quedó escrita en el
archivo, y corrígela si ya no coincide.

### Paso 5 · Escribir el cuerpo

Con la anatomía de [`prompts/texto/blog.md`](../../prompts/texto/blog.md) →
«Anatomía del cuerpo»: lead a la altura de la consecuencia, un H2 por
pregunta real, cierre con enlace interno. Sigue el método de seis pasos de
[`adn/07-redaccion.md`](../../adn/07-redaccion.md) §7 — se escribe largo y
feo primero, se recorta el 30% después, se lee en voz alta al final.

**Ninguna llamada a la acción a mitad del cuerpo.** La plantilla del sitio
pone una tarjeta de conversión automática al final de cada post; el texto no
la duplica ni se le adelanta.

### Paso 6 · Verificar los enlaces internos

Cada enlace del cierre —y cualquiera que aparezca en el cuerpo— va a una ruta
real: `/planes/`, `/cotizador/`, `/servicios/#diagnostico`, `/proyectos/`,
`/ebot/`, `/seguridad/`, o el slug de otro post ya publicado. Ninguna ruta
inventada ni «próximamente».

### Paso 7 · Entregar

Un solo bloque de código Markdown, con el frontmatter y el cuerpo completos,
listo para guardarse tal cual en
`src/content/blog/<slug>.md`. Ver
[`orquestador/protocolo-entrega.md`](../../orquestador/protocolo-entrega.md).

---

## 5 · Verificación

Antes de entregar, una a una — la lista completa está en
[`prompts/texto/blog.md`](../../prompts/texto/blog.md) → «Antes de entregar».
Además, específico de esta skill:

- [ ] ¿Se leyeron los posts ya publicados antes de fijar el tema?
- [ ] ¿El ángulo no repite el de ninguno de los existentes?
- [ ] ¿La categoría es una de las cinco, y si es `casos`, se avisó que es una
      ficha a medias sin cifra de resultado?
- [ ] ¿El slug propuesto no colisiona con uno ya existente?
- [ ] ¿Toda cifra existe en [`datos/precios.json`](../../datos/precios.json)?
- [ ] ¿Todo hex, si el entregable incluye una descripción visual, sale de
      [`datos/marca.json`](../../datos/marca.json)?
- [ ] ¿Algún pago único sumado a una mensualidad?
- [ ] ¿Jerga? (`Jamstack`, `CDN`, `stack`, `deploy`, `framework`, `headless`, `SEO on-page`, `keyword stuffing`) <!-- v: lista de jerga prohibida, se nombra para vigilarla -->
- [ ] ¿Alguna estadística de mercado, de la competencia o un caso anecdótico
      sin fuente verificable en este repositorio?
- [ ] ¿La única cifra de sector autorizada lleva su atribución en la misma frase?
- [ ] ¿Huecos sin resolver — `[completa aquí]`, corchetes vacíos? <!-- v: contraejemplos de huecos sin resolver -->
- [ ] ¿Se dice qué NO incluye, si el post habla de un producto?
- [ ] ¿Cada campo del frontmatter cumple su rango de caracteres, contado y no estimado?
- [ ] ¿`date` sigue siendo la de hoy en el momento de fusionar, o pasó tiempo real desde que se redactó y quedó desfasada?

---

## Qué se dice al entregar

Tres cosas como máximo:

1. El título, la categoría y el público al que le habla.
2. **Qué no incluye o qué quedó pendiente** — si el tema pedido necesitaba un
   dato que no existe y se cambió el ángulo, se dice aquí, no se calla.
3. Solo si aplica: qué decisión tomaste que el humano podría querer distinta —
   por ejemplo, si elegiste la categoría o el público por defecto.
