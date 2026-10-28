# Skill · Candidatos de blog contra Search Console

Produce una lista de **candidatos a post del blog** —título, categoría,
keywords, público al que le habla y la consulta real que lo justifica— a
partir de lo que la gente ya busca en Google. No escribe el post: eso es
[`blog-seo`](../blog-seo/SKILL.md), sobre el candidato que se elija.

---

## 1 · Cuándo se usa

**Se dispara con:**
- «Tengo el CSV de Search Console, dame candidatos de blog»
- «Qué deberíamos escribir el próximo mes según lo que la gente busca»
- «Candidatos de blog contra Search Console»
- «Cruza estas búsquedas con el ADN y dime qué posts valen la pena»

**NO se usa cuando:**
- Ya hay un tema decidido y lo que hace falta es el post completo →
  [`blog-seo`](../blog-seo/SKILL.md) directamente, sin pasar por aquí
- Piden ideas de contenido para Instagram, no para el blog →
  [`contenido-instagram`](../contenido-instagram/SKILL.md)
- No hay ningún CSV ni lista de consultas que cruzar — sin datos de
  búsqueda real, esto se convierte en adivinar temas, que ya lo resuelve
  `blog-seo` solo con `adn/04-audiencia.md`

---

## 2 · Qué se lee

En este orden:

1. [`adn/04-audiencia.md`](../../adn/04-audiencia.md) — los seis públicos y
   sus situaciones. Es contra esto que se cruza cada consulta: si una
   búsqueda no encaja con ningún público, no se convierte en candidato.
2. **Los posts que ya existen**, en `src/content/blog/*.md` del repositorio
   `abrinay1997-stack/PanaClaw` — título, `category` y `keywords` de cada
   uno. Ningún candidato puede repetir el ángulo central de un post
   publicado, exactamente la misma regla que
   [`blog-seo`](../blog-seo/SKILL.md) paso 1.
3. El contrato técnico de
   [`prompts/texto/blog.md`](../../prompts/texto/blog.md) → «El contrato
   técnico» — los límites exactos de `title`, `description`, `category`,
   `keywords` y `readingTime` que tiene que respetar cada candidato.
4. [`catalogo/09-prueba.md`](../../catalogo/09-prueba.md) y
   [`operacion/deuda-conocida.md`](../../operacion/deuda-conocida.md) — por
   si alguna consulta candidata solo se puede responder con un dato que no
   existe todavía. Mismo filtro que `blog-seo` paso 3: si hace falta
   inventar una cifra o una estadística, esa consulta no se convierte en
   candidato tal cual, se dice qué le falta.

---

## 3 · Qué se pregunta antes de empezar

1. **¿Dónde está el CSV de Search Console?** Esta skill no se conecta a
   ninguna API: lee el archivo que exportaste desde el panel (Rendimiento
   → Exportar). Pide la ruta si no la dieron.
2. **¿Cuántos candidatos hacen falta?** Si no lo dicen, se entregan entre 5
   y 10 — lo que de verdad cruce con un público real y no repita nada, no
   un número fijo relleno a la fuerza.

Si el humano ya dio los dos, no preguntes nada y produce.

---

## 4 · Procedimiento

### Paso 1 · Leer el CSV y descartar ruido

Un export de Search Console trae columnas como `Consultas`, `Clics`,
`Impresiones`, `CTR`, `Posición`. Antes de cruzar nada, se descarta:

- Consultas de marca (`panaclaw`, `panaclaw panamá`, variantes del nombre)
- Consultas sin ninguna intención de negocio reconocible (errores de
  tecleo, fragmentos sin sentido)
- Consultas con una sola impresión — no hay patrón ahí, es ruido

### Paso 2 · Cruzar cada consulta con un público real

Por cada consulta que sobrevive el filtro, se pregunta: ¿qué situación de
[`adn/04-audiencia.md`](../../adn/04-audiencia.md) describe a quien
escribió exactamente eso en Google? Si la respuesta es clara, la consulta
pasa a candidata con ese público anotado. **Si no encaja con ninguno, se
descarta** — no se inventa un dolor nuevo que no esté catalogado, la misma
regla que gobierna `blog-seo` paso 2.

### Paso 3 · Comprobar que no repite nada

Dos comprobaciones, no una:

- **Contra lo ya publicado.** ¿Algún post existente ya cubre este ángulo
  central, aunque el titular fuera distinto? Si sí, se descarta.
- **Dentro de este mismo lote.** Dos consultas parecidas («cuánto cuesta
  una web en panamá» y «precio página web panamá») no se convierten en dos
  candidatos — es la misma pieza, una sola vez.

### Paso 4 · Redactar el candidato

Por cada consulta que llega hasta aquí, se escribe:

- `title` — no la consulta tal cual pegada, sino el titular que
  **respondería** esa búsqueda, dentro de 15 a 90 caracteres
- `description` — 60 a 200 caracteres, lo que ganaría el clic en el
  resultado de Google
- `category` — una de las cinco (`precios`, `guias`, `comparativas`,
  `casos`, `panama`); si no encaja con claridad en una, se dice y se
  propone la más cercana
- `keywords` — de 1 a 6, pensadas para el bloque de posts relacionados,
  no para meter de vuelta la consulta exacta
- `readingTime` — una estimación entera entre 2 y 30; no hace falta
  precisión aquí, eso se ajusta cuando `blog-seo` escriba el post real
- `publico` y `consultaOrigen` — de qué situación de audiencia viene y con
  qué consulta real se justifica, para que quien decida no tenga que
  confiar a ciegas

**Ninguna cifra en el `title` ni en la `description`** que no esté en
[`datos/precios.json`](../../datos/precios.json). Un candidato que necesite
una cifra para sonar atractivo se verifica exactamente igual que un post
terminado — no hay una versión relajada de la regla 1 para borradores.

### Paso 5 · Validar en código, no de memoria

Se escribe la lista completa de candidatos como un array JSON (un objeto
por candidato, con los campos del paso 4) a un archivo, y se corre:

```bash
node herramientas/validar-candidatos.mjs ruta/al/archivo.json
```

Si algo no pasa, se corrige el candidato y se vuelve a correr — **nunca se
entrega un candidato que el validador rechazó**, aunque el error parezca
menor. Es la comprobación mecánica de los límites de `title`,
`description`, `category`, `keywords` y `readingTime`; lo que el validador
no puede ver —si el ángulo repite uno ya publicado, si encaja con un
público real— lo deciden los pasos 2 y 3 de arriba, no el script.

### Paso 6 · Entregar

Una tabla, no los posts completos:

| # | Título propuesto | Categoría | Público | Consulta de origen | Impresiones |
|---|---|---|---|---|---|

Con una línea debajo de cada fila explicando por qué ese candidato y no
otro. Ver
[`orquestador/protocolo-entrega.md`](../../orquestador/protocolo-entrega.md).

---

## 5 · Lo que se queda en código, no en el modelo

Tres garantías que no dependen de que el agente se acuerde:

1. **Esta skill nunca hace `git push` ni crea archivos en
   `src/content/blog/`.** Produce una lista para que una persona elija.
   Escribir el post completo y publicarlo es trabajo de
   [`blog-seo`](../blog-seo/SKILL.md), que sigue terminando en
   `orquestador/protocolo-entrega.md` con una persona de por medio para el
   `push`.
2. **Los límites del schema se comprueban con
   `herramientas/validar-candidatos.mjs`**, no solo porque esta skill lo
   diga. El script es un espejo declarado del schema real de
   `content.config.ts` — si el sitio cambia sus límites, el script se
   desincroniza y hay que actualizar los dos juntos, igual que
   `datos/precios.json` con el sitio.
3. **Cualquier cifra citada se verifica contra `datos/precios.json`**, con
   el mismo rigor que cualquier entregable de cara al cliente — no existe
   una versión «es solo un borrador» de la regla 1.

---

## 6 · Verificación

Antes de entregar, una a una:

- [ ] ¿Se leyeron los posts ya publicados antes de proponer candidatos?
- [ ] ¿Cada candidato está anclado a un público real de
      [`adn/04-audiencia.md`](../../adn/04-audiencia.md), no inventado?
- [ ] ¿Ningún candidato repite el ángulo central de un post existente, ni
      de otro candidato del mismo lote?
- [ ] ¿`node herramientas/validar-candidatos.mjs` corrió sin errores sobre
      la lista completa?
- [ ] ¿Toda cifra citada existe en
      [`datos/precios.json`](../../datos/precios.json)?
- [ ] ¿Jerga en algún título o descripción propuesta?
- [ ] ¿Se entregó una lista de candidatos, y no un post ya escrito ni un
      `push`?

---

## Qué se dice al entregar

Tres cosas como máximo:

1. Cuántos candidatos sobrevivieron el filtro, de cuántas consultas se
   partió.
2. **Qué consultas se descartaron y por qué** — sobre todo las que no
   encajaron con ningún público, porque es la señal de que ese tema no
   tiene hueco real en el catálogo todavía.
3. Solo si aplica: qué candidato recomendarías tú primero, y por qué.
