# Enrutador

El [CLAUDE.md](../CLAUDE.md) trae la tabla corta. Esto es la versión larga: para
cada tipo de petición, qué leer, en qué orden, qué preguntar antes de empezar y
con qué forma se entrega.

**Cómo se usa.** Localiza la fila que se parezca a lo que pidió el humano. Si
ninguna encaja, usa el procedimiento genérico del final. Si encajan dos, lee las
dos: este repositorio está construido para que leer de más no haga daño.

---

## Base común

Estos cuatro se leen **siempre**, independientemente de la petición, y evitan
el 90 % de los errores:

1. [`CLAUDE.md`](../CLAUDE.md) — dónde está todo y las cinco reglas duras
2. [`adn/01-identidad.md`](../adn/01-identidad.md) — quién es la marca
3. [`adn/02-voz-y-tono.md`](../adn/02-voz-y-tono.md) — cómo habla
4. [`adn/05-personalidad.md`](../adn/05-personalidad.md) — desde dónde habla

Y según el medio:

- Vas a escribir texto de cara al cliente → añade
  [`adn/06-claridad.md`](../adn/06-claridad.md), que dice qué se dice primero y
  con qué palabras, y [`adn/07-redaccion.md`](../adn/07-redaccion.md), que dice
  cómo se hace que funcione. Los dos, siempre: con el primero solo, el texto se
  entiende y no mueve a nadie; con el segundo solo, suena bien y hay que
  descifrarlo
- Vas a describir algo visual → [`datos/marca.json`](../datos/marca.json)
- Vas a decir un precio → [`datos/precios.json`](../datos/precios.json)

---

## Rutas por petición

### Creativos e imágenes

> «Dame prompts para Nano Banana», «necesito imágenes para la campaña»,
> «creativos para Instagram»

**Lee:** `datos/marca.json` → `prompts/README.md` → `prompts/bloques/estilo-visual.md`
→ `prompts/bloques/negativos.md` → `prompts/imagen/nano-banana.md`

**Pregunta antes de generar:**
- ¿Para qué canal y en qué proporción? (feed 1:1, story 9:16, anuncio 4:5, OG 1.91:1)
- ¿Lleva texto dentro de la imagen o el texto va aparte?
- ¿Qué producto del catálogo es el sujeto?

**Entrega:** el prompt completo listo para pegar, la proporción, y qué esperar
que salga mal en el primer intento. Nunca un prompt con huecos.

---

### Imágenes por lote

> «Genera 40 creativos», «un lote para todo el mes», «variaciones de esto»

**Lee:** lo de arriba + `prompts/imagen/lote.md` + `skills/lote-visual/SKILL.md`

**Pregunta antes:**
- ¿Cuántas piezas y en cuántas proporciones?
- ¿Qué eje varía entre piezas: producto, escena, encuadre o mensaje?

**Entrega:** una tabla donde cada fila es una pieza con su prompt resuelto, más
el bloque de estilo compartido escrito una sola vez arriba. La regla del lote es
que **el estilo no varía y el sujeto sí** — si varían los dos, no es un lote, son
40 imágenes sueltas y se van a ver como tales.

---

### Contenido de Instagram del mes

> «Dame el contenido de Instagram del mes», «planeamiento del siguiente mes
> enfocado en eBot», «el prompt para que Meta me arme las piezas»

**Lee:** [`skills/contenido-instagram/SKILL.md`](../skills/contenido-instagram/SKILL.md)
y sigue su lista — manda a `datos/`, al `catalogo/` del producto, a
`adn/04-audiencia.md`, a `prompts/imagen/texto-en-imagen.md` y a
`prompts/plataformas/meta-ai.md`.

**Pregunta antes:**
- ¿Qué producto es el foco del mes? Uno, no seis
- ¿Cuántas publicaciones? Por defecto 12
- ¿Algo del mes anterior que no se pueda repetir?

**Entrega:** un solo prompt maestro listo para pegar en Meta AI, que devuelve el
documento HTML con las piezas ya compuestas, sus descripciones, sus hashtags y la
descarga en PNG a 1080×1350.

**La regla que no se negocia:** Claude escribe el 100 % del texto y Meta no
redacta nada. Meta inventa cifras con formato perfecto —la última vez, ocho
invenciones en doce publicaciones— y esta marca vende precisamente que no hay
letra chica.

---

### Un post del blog, para SEO

> «Escribe un post del blog sobre X», «el próximo artículo para SEO», «qué
> blog toca este mes»

**Lee:** [`skills/blog-seo/SKILL.md`](../skills/blog-seo/SKILL.md) y sigue su
lista — manda a `adn/04-audiencia.md` para el tema, a `prompts/texto/blog.md`
para la anatomía y el contrato técnico, y a `catalogo/09-prueba.md` para lo
único que se puede citar como dato.

**Pregunta antes:**
- ¿Hay un tema concreto, o toca elegirlo?
- ¿Qué categoría de las cinco (`precios`, `guias`, `comparativas`, `casos`, `panama`)?
- ¿A qué público de `adn/04-audiencia.md` le habla?

**Entrega:** un bloque Markdown con el frontmatter completo —validado contra
el schema de `src/content.config.ts` del sitio— y el cuerpo, listo para
guardarse en `src/content/blog/<slug>.md`.

**La regla que no se negocia:** se lee primero lo que ya está publicado en
`src/content/blog/` y ningún tema nuevo repite el ángulo de uno existente. Y
ninguna estadística de mercado, de la competencia o cifra de proyecto entra
sin estar en `catalogo/09-prueba.md` — es el formato donde más tienta
rellenar con un dato que «suena creíble» y donde más caro sale, porque el post
vive meses.

---

### Candidatos de blog a partir de Search Console

> «Tengo el CSV de Search Console, dame candidatos de blog», «qué deberíamos
> escribir el próximo mes según lo que la gente busca»

**Lee:** [`skills/candidatos-blog-seo/SKILL.md`](../skills/candidatos-blog-seo/SKILL.md)
— cruza las consultas reales con `adn/04-audiencia.md`, descarta lo que no
encaje con ningún público, y valida cada candidato con
`node herramientas/validar-candidatos.mjs` antes de entregarlo.

**Pregunta antes:** dónde está el CSV exportado, y cuántos candidatos hacen
falta (por defecto, entre 5 y 10).

**Entrega:** una tabla de candidatos —título, categoría, keywords, público y
la consulta real que lo justifica—, nunca el post completo. Escribirlo es
trabajo de la skill de arriba, sobre el candidato que se elija.

**La regla que no se negocia:** esta skill nunca hace `git push` ni toca
`src/content/blog/`. Propone; publicar sigue siendo de una persona.

---

### Video

> «Un reel», «guion para un video», «prompt para Veo/Sora»

**Lee:** `prompts/video/video-corto.md` + `adn/02-voz-y-tono.md`

**Pregunta antes:** duración, si lleva voz o solo texto en pantalla, y cuál es
la única acción que tiene que provocar.

**Entrega:** estructura plano a plano con duración por plano, el texto en
pantalla, y el prompt de generación si el video es sintético. La marca no tiene
locutor definido: si hace falta voz, se pregunta.

---

### Anuncios pagados

> «Anuncios para Meta», «campaña de Google», «copy para pauta»

**Lee:** `campanas/plantillas/estructura-anuncio.md` →
`campanas/canales/{meta,google,whatsapp}.md` → el `catalogo/` del producto que se
anuncia → `skills/anuncio-pagado/SKILL.md`

**Pregunta antes:**
- ¿Qué producto y a qué precio? (verifica contra `precios.json`)
- ¿Etapa del embudo: frío, tibio o remarketing?
- ¿A dónde cae el clic: `/planes`, `/cotizador`, `/ebot`, WhatsApp?

**Entrega:** variantes en tabla con gancho, cuerpo, CTA y destino. Cada variante
prueba **una** hipótesis distinta, no cuatro redacciones del mismo mensaje.

---

### Campaña completa

> «Arma la campaña de lanzamiento», «plan de contenido del mes»

**Lee:** `campanas/README.md` entero (es la arquitectura del embudo) y de ahí a
las plantillas que toque.

**Entrega:** el embudo por etapas, qué pieza va en cada etapa, qué mide cada una,
y el calendario. Sin las piezas escritas todavía — primero se aprueba la
estructura, después se produce.

---

### Alimentar otra IA con el ADN

> «Pásale esto a Pomelli», «configura Grok con nuestra marca», «un system prompt»

**Lee:** `prompts/plataformas/` — el archivo de la plataforma concreta.

**Pomelli es distinto**
([`prompts/plataformas/pomelli.md`](../prompts/plataformas/pomelli.md)): no lee
este repositorio, deriva su «Business DNA» rastreando el sitio en vivo. Lo que
hay que hacer es comprobar lo que va a leer y corregir lo que deduzca mal.

**Entrega:** el bloque de contexto listo para pegar en esa plataforma, adaptado a
su formato y a su límite de caracteres. No un volcado de este repositorio.

---

### Precios, cotizaciones y propuestas

> «¿Cuánto cuesta…?», «arma una propuesta», «compara los planes»

**Lee:** `datos/precios.json` **primero y literalmente** → el `catalogo/` del
producto → `catalogo/07-condiciones.md` → `skills/propuesta-comercial/SKILL.md`

**Entrega:** el precio con su forma de cobro, su plazo, sus rondas de cambios y
su lista de exclusiones. Las cuatro cosas o ninguna: un precio suelto es la mitad
de la información y la mitad que falta siempre es la cara.

---

### Explicar o comparar productos

> «¿Qué diferencia hay entre…?», «¿esto para quién es?»

**Lee:** el `catalogo/` de cada producto + **`catalogo/08-fronteras.md`**

Si la pregunta toca Care, Seguridad, Diagnóstico o Auditoría, las fronteras son
obligatorias. Son los cuatro productos que se confunden entre sí, y cada
confusión es una venta que después no se puede cumplir.

---

### Objeciones y conversación con cliente

> «Un cliente dice que es caro», «cómo respondo a…»

**Lee:** `adn/04-audiencia.md` — las objeciones están catalogadas con la
respuesta que ya usa la marca. `adn/02-voz-y-tono.md` para el tono.

La marca **no regatea**: el precio publicado es el mismo para todos y eso es
parte del argumento. No ofrezcas descuentos que no existen.

---

## Procedimiento genérico

Si nada encaja:

1. Lee la base común.
2. Identifica de qué naturaleza es el entregable: ¿texto, imagen, estructura,
   dato o procedimiento? Cada carpeta cubre una.
3. Localiza el producto del catálogo implicado y léelo entero.
4. Si vas a decir cifras, `precios.json`. Si vas a describir visual, `marca.json`.
5. Antes de entregar, pasa por
   [`protocolo-entrega.md`](protocolo-entrega.md).

Y si lo que te piden **no se puede hacer sin inventar algo** —un dato que no
existe, un testimonio que no hay, un precio que nadie fijó— eso se dice. Es
literalmente el producto que vende la marca.
