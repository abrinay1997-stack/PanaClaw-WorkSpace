# El repositorio de PanaClaw

`abrinay1997-stack/PanaClaw-WorkSpace` es el cerebro de la marca. Esta skill es un
**puntero** hacia él, no una copia: cuando los dos digan cosas distintas, manda el
repositorio.

Si tienes el repositorio delante, **léelo directamente y usa esta skill solo para el
logo y la ficha**. Esto de abajo es para cuando no lo tienes a mano.

---

## La jerarquía de autoridad

```
datos/*.json  →  adn/*  →  catalogo/*  →  todo lo demás
```

Un `.md` que diga una cifra distinta de la de `precios.json` está equivocado, y se
corrige el `.md`. Nunca al revés.

---

## Qué leer según lo que pidan

**Siempre, antes de escribir texto de cara al cliente:** `adn/02-voz-y-tono.md`,
`adn/05-personalidad.md`, `adn/06-claridad.md` y `adn/07-redaccion.md`. El primero
dice cómo se construye una frase; el segundo, desde dónde se dice; el tercero, qué se
dice primero; el cuarto, cómo se hace que funcione.

| Si piden… | Lee, en este orden |
|---|---|
| **Contenido de Instagram del mes** | `skills/contenido-instagram/SKILL.md`, y de ahí a todo lo demás |
| Prompts de imagen, creativos | `datos/marca.json` → `prompts/README.md` → `prompts/bloques/` → `prompts/imagen/nano-banana.md` |
| Maquetar una pieza | `datos/marca.json` → `redesSociales` + `prompts/imagen/texto-en-imagen.md` |
| **Un carrusel** | `datos/marca.json` → `redesSociales.carrusel` + `texto-en-imagen.md` (§ Carrusel) + `nano-banana.md` (el fondo) |
| Que Meta AI monte el HTML | `prompts/plataformas/meta-ai.md` |
| Precios o una propuesta | `datos/precios.json` → `catalogo/` → `skills/propuesta-comercial/SKILL.md` |
| Explicar un producto o comparar planes | `catalogo/` del producto + `catalogo/08-fronteras.md` |
| Copy de web, correo, WhatsApp, orgánico | la base de arriba + `prompts/texto/organico.md` |
| Por qué una pieza **no se entiende** | `adn/06-claridad.md` — las tres alturas y el traductor |
| Por qué una pieza se entiende pero **no mueve** | `adn/07-redaccion.md` — las seis palancas, la prueba, el gancho, el ritmo |
| Responder una objeción | `adn/04-audiencia.md` — están catalogadas |
| **Qué se publicó ya** | `operacion/publicado.md` — ANTES de escribir, y se actualiza al entregar |
| Si el repo está al día | `operacion/sincronizacion.md` + `node herramientas/verificar.mjs` |

---

## Los cinco tipos de publicación

De `prompts/texto/organico.md`, ordenados por lo que rinden con esta marca:

1. **La cifra publicada** — un precio, un plazo o una condición, con el porqué detrás.
   `[la cifra] + [qué incluye] + [qué NO incluye] + [por qué está publicada]`
2. **El desastre explicado** — una escena concreta, con la causa real.
   `[escena] + [por qué pasa de verdad] + [qué se hace distinto]`
3. **La objeción contestada** — una pregunta que la gente se calla, respondida entera,
   incluso si la respuesta honesta incomoda.
4. **La frontera** — dos cosas que la gente confunde, separadas. De
   `catalogo/08-fronteras.md`.
5. **El trabajo enseñado** — un proyecto publicado, con su enlace. **Sin métricas**:
   no están medidas.

**La mezcla para doce:** 4 · 3 · 3 · 1 · 1, en ese orden.

---

## Los seis públicos

De `adn/04-audiencia.md`. **Son momentos, no demografías**, y un lote va de uno solo.

| # | Quién | Producto | Lo que abre la conversación |
|---|---|---|---|
| 1 | El que no tiene sitio | Start, Launch | una cifra |
| 2 | El que tiene un WordPress que le da vergüenza | Diagnóstico → Corporate | que le expliquen **por qué** se rompió lo anterior |
| 3 | El que invierte en publicidad | Launch | velocidad y medición |
| 4 | El que quiere vender en línea | Commerce | **Yappy** — que pueda cobrar como cobra hoy |
| 5 | El que no da abasto con los mensajes | eBot | «pago único, sin mensualidad nuestra» |
| 6 | El que no sabe si está expuesto | Auditoría | el procedimiento, **no el miedo** |

> **El principio que ordena todo esto:** la mayoría de la gente no sabe cómo se llama
> lo que necesita. Sabe en qué situación está. Por eso el titular es la situación y el
> nombre del producto es el subtítulo, nunca al revés.

---

## Las cuatro fronteras que hay que respetar

De `catalogo/08-fronteras.md`. **Lectura obligatoria** antes de escribir sobre
cualquiera de estos cuatro, porque confundirlos no produce un texto feo: produce una
venta que después no se puede cumplir.

| | Qué mira | Cuándo |
|---|---|---|
| **Care** | Que el sitio siga en pie | Cada mes |
| **Seguridad** | Quién entra y por dónde | Único + mensual |
| **Diagnóstico de Ventas** | Por qué no vende | Una vez, 48 h |
| **Auditoría de Seguridad** | Por dónde te pueden entrar | Una vez, 5 días |

Las dos frases oficiales están en la ficha, en `fronteras[].fraseOficial`, y se usan
**con esas palabras exactas**.

---

## Lo que la marca NO puede decir hoy

De `catalogo/09-prueba.md`. Es menos de lo que a un publicista le gustaría, **y ese es
exactamente el punto.**

**No existe verificado:** testimonios, número de clientes, proyectos entregados, años
de experiencia, métricas de rendimiento por proyecto, logos de clientes, premios,
comparativas de antes y después, porcentajes de mejora de cualquier tipo.

**Sí existe y se puede decir:** los cuatro proyectos publicados con su enlace —
StemFlow, LiveSync Pro, **Acústica Superior** (el único panameño, y el más útil en
campaña local) y Bukoflow Tienda. Y las promesas comprobables el primer día: abre en
menos de un segundo, el código y el dominio quedan a nombre del cliente, el precio
está publicado, la lista de exclusiones está publicada.

> **Cuando falte prueba social, usa una promesa verificable en su lugar.** «El código
> queda a tu nombre» hace más trabajo que un testimonio inventado, y no se cae.

**Y no se anuncia el hueco.** No se inventa prueba social y tampoco se dice que no la
hay: se ocupa su sitio con lo que sí es comprobable.
