# PanaClaw Workspace — Orquestador

Este repositorio es **el cerebro de la marca PanaClaw**. Existe para que
cualquier agente de IA —Claude, Grok, Gemini, Pomelli, el que sea— pueda entrar,
entender la marca en una sola lectura y devolver un entregable que suene, se vea
y cobre exactamente como PanaClaw.

Desde agosto de 2026 publica además **el hub de herramientas del equipo**: la
portada (`index.html`), el cotizador y el panel de clientes (`cotizador/`), y el
servidor que los atiende (`worker/`). Es la única parte que se compila y se
despliega; el resto sigue siendo conocimiento y no se toca al construir. Si vas
a tocar el hub, lee antes la sección 7.

**Si eres un agente y solo vas a leer un archivo, lee este.** Al final hay una
tabla que te manda al resto según lo que te haya pedido el humano.

---

## 1. Qué es PanaClaw en cuatro líneas

Agencia de sitios web en Panamá. Vende webs que abren en menos de un segundo,
se entregan en días en vez de meses, y cuyo código queda a nombre del cliente.
Desde $295. Además vende un bot multicanal (eBot), ciberseguridad web,
mantenimiento (Care) y un diagnóstico de ventas.

El argumento entero de la marca es **la ausencia de trampa**: precio publicado,
plazo publicado, lista de lo que NO está incluido publicada, y el código en manos
del cliente al terminar de pagar. Todo lo que produzcas tiene que sostener eso.

---

## 2. Las cinco reglas que no puedes romper

Estas cinco cuestan clientes si se rompen. La lista completa, con el porqué de
cada una, está en [`orquestador/reglas.md`](orquestador/reglas.md).

1. **Ninguna cifra que no esté en [`datos/precios.json`](datos/precios.json).**
   No inventes, no redondees, no proyectes, no estimes. Si te falta un precio, el
   producto no existe todavía y lo dices.
2. **Un importe de pago único y uno mensual NUNCA se suman.** Dos totales
   separados, siempre. Sumarlos da un número creíble y falso.
3. **Cero jerga.** Nada de Jamstack, CDN, LCP, headless, stack, deploy, SSG,
   Lighthouse ni «scope creep». Solo los nombres que un dueño de negocio panameño
   ya reconoce: WordPress, Google, WhatsApp, Instagram, Yappy, GitHub.
4. **Nada de datos inventados.** Métricas, testimonios, casos y logos de clientes
   solo si están verificados y con fecha. Una cifra inflada desmonta el argumento
   de las otras diez piezas.
5. **Un solo acento cromático: naranja `#FF5100`.** El rojo `#FF1E1E` es
   exclusivo de fondos y jamás toca un texto. Nada de azul, nunca.

---

## 3. Cómo está organizado este repositorio

```
datos/          Las dos fuentes de verdad. Máquina antes que prosa.
  precios.json    Toda cifra que la marca puede decir en voz alta
  marca.json      Todo token visual: hex, fuentes, formas, movimiento

adn/            Quién es la marca. Se lee antes de escribir una sola palabra.
catalogo/       Qué vende, en prosa. Capa legible sobre precios.json.
prompts/        ESTRUCTURAS de prompt por medio y por plataforma. No guiones.
campanas/       Arquitectura de campaña, embudo y plantillas de pieza.
skills/         Procedimientos empaquetados para agentes.
orquestador/    Reglas duras, enrutador y protocolo de entrega.
herramientas/   verificar.mjs — comprueba que nada de esto se haya desincronizado.
operacion/      Cómo se mantiene vivo este repositorio.
  publicado.md    Índice en negativo: lo que ya salió y no vuelve a salir

── lo único que se publica ─────────────────────────────────────

index.html      Portada del hub. Sin construir y sin dependencias.
hub/assets/     Su icono y la tipografía de la marca.
cotizador/      El cotizador y el panel de clientes. IMPORTAN datos/precios.json.
compartido/     El contrato con el servidor: qué viaja por el cable.
worker/         La API en Cloudflare: historial, clientes y la puerta de Access.
migraciones/    El esquema de la base, en SQL.
scripts/        construir.mjs — verifica, prueba y arma publico/.
wrangler.jsonc  Cómo lo publica Cloudflare.
netlify.toml    Cómo se publica la vista previa, sin servidor.
```

**La jerarquía de autoridad, cuando dos archivos se contradigan:**

```
datos/*.json  →  adn/*  →  catalogo/*  →  todo lo demás
```

Un `.md` que diga `$300` cuando `precios.json` dice `$295` está equivocado, y se <!-- v: contraejemplo, $300 es la cifra equivocada que se ilustra -->
corrige el `.md`. Nunca al revés.

---

## 4. Enrutador — qué leer según lo que te pidan

Lee siempre **`adn/02-voz-y-tono.md`**, **`adn/05-personalidad.md`**,
**`adn/06-claridad.md`** y **`adn/07-redaccion.md`** antes de escribir texto de
cara al cliente, y **`datos/marca.json`** antes de describir cualquier cosa
visual. El primero dice cómo se construye una frase; el segundo, desde dónde se
dice; el tercero, qué se dice primero y con qué palabras lo entiende quien lo
lee; el cuarto, cómo se hace que funcione. Eso es la base. Encima de esa base,
según la petición:

| Si el humano pide… | Lee, en este orden |
|---|---|
| **Contenido de Instagram del mes** (piezas + descripciones + hashtags) | `skills/contenido-instagram/SKILL.md` — y de ahí a todo lo demás |
| **Un post del blog, para SEO** | `skills/blog-seo/SKILL.md` — y de ahí a `prompts/texto/blog.md` |
| Prompts de imagen, creativos, Nano Banana | `datos/marca.json` → `prompts/README.md` → `prompts/bloques/` → `prompts/imagen/nano-banana.md` |
| Imágenes **por lote** (10, 50, 200 piezas) | lo anterior + `prompts/imagen/lote.md` + `skills/lote-visual/SKILL.md` |
| Maquetar una pieza: retícula, tamaños, qué va en naranja | `datos/marca.json` → `redesSociales` + `prompts/imagen/texto-en-imagen.md` |
| **Un carrusel**: que las diapositivas se lean como una sola pieza | `datos/marca.json` → `redesSociales.carrusel` + `prompts/imagen/texto-en-imagen.md` (§ Carrusel) + `prompts/imagen/nano-banana.md` (el fondo) |
| Guion o prompt de video, reel, anuncio en video | `prompts/video/video-corto.md` + `adn/02-voz-y-tono.md` |
| Anuncios pagados (Meta, Google) | `campanas/plantillas/estructura-anuncio.md` + `campanas/canales/` + `catalogo/` del producto |
| Una campaña completa | `campanas/README.md` (el embudo entero) y de ahí a las plantillas |
| Alimentar Pomelli / Google Labs | `prompts/plataformas/pomelli.md` — deriva la marca del sitio en vivo, no de aquí |
| Prompts para Grok, GPT u otro modelo ajeno | `prompts/plataformas/grok.md` |
| Que Meta AI monte el HTML del mes | `prompts/plataformas/meta-ai.md` |
| Diseños en Canva | `prompts/plataformas/canva.md` |
| Precios, cotizar, armar una propuesta | `datos/precios.json` → `catalogo/` → `skills/propuesta-comercial/SKILL.md` (y existe el cotizador del hub, que la ejecuta entera) |
| Explicar un producto, comparar planes | `catalogo/` del producto + `catalogo/08-fronteras.md` |
| Copy de web, correo, WhatsApp, orgánico | la base de arriba + `prompts/texto/organico.md` |
| Revisar por qué una pieza no se entiende, o no suena a la marca | `adn/06-claridad.md` — las tres alturas y el traductor |
| Revisar por qué una pieza se entiende pero no mueve a nadie | `adn/07-redaccion.md` — las seis palancas, la prueba, el gancho y el ritmo |
| Responder una objeción de un cliente | `adn/04-audiencia.md` (las objeciones están catalogadas ahí) |
| Crear una skill nueva | `skills/README.md` + `skills/_plantilla/SKILL.md` |
| **Saber qué se publicó ya, para no repetirlo** | `operacion/publicado.md` — se lee ANTES de escribir un calendario y se actualiza AL entregarlo |
| Saber si el repo está al día | `operacion/sincronizacion.md` + `node herramientas/verificar.mjs` |
| **Tocar el hub, el cotizador o el panel de clientes** | la sección 7 de aquí abajo + `cotizador/README.md` |

---

## 5. Cómo se entrega

Todo entregable pasa por [`orquestador/protocolo-entrega.md`](orquestador/protocolo-entrega.md)
antes de salir. El resumen:

- **Un prompt se entrega listo para pegar.** Sin `[completa aquí]`, sin <!-- v: contraejemplos de huecos sin resolver -->
  `<tu producto>`, sin corchetes vacíos. Si te falta un dato, lo pides antes de <!-- v: contraejemplos de huecos sin resolver -->
  generar, no lo dejas como hueco.
- **Todo importe citado se verifica contra `datos/precios.json`** en el momento
  de escribirlo. No de memoria.
- **Todo hex se copia de `datos/marca.json`.** No «naranja», no «#FF5500», <!-- v: contraejemplo de hex equivocado -->
  no de memoria: `#FF5100`.
- **Di qué no incluye.** Es la firma de la marca y aplica también a tu trabajo:
  si el entregable tiene un límite, se dice arriba y no en una nota al pie.

---

## 6. Relación con el repositorio del sitio

El sitio vive en **`abrinay1997-stack/PanaClaw`** (Astro estático en Netlify). Ese
repositorio es la fuente original de casi todo lo que hay aquí: los precios salen
de `src/data/*.ts` y los tokens de `src/styles/global.css`.

**Este repositorio es un espejo, no una copia paralela.** Cuando cambie un precio
en el sitio, cambia aquí. El mapeo archivo-a-archivo y el procedimiento están en
[`operacion/sincronizacion.md`](operacion/sincronizacion.md), y
`node herramientas/verificar.mjs` detecta las divergencias más caras sin pedir
permiso a nadie.

No edites el sitio desde aquí, ni edites esto para «arreglar» algo que en
realidad está mal en el sitio. Si encuentras una contradicción, la reportas.

---

## 7. Si vas a tocar el hub

El hub es la portada, el cotizador, el panel de clientes y el servidor que los
atiende, y son la única parte de este repositorio que se ejecuta. Siete cosas
que hay que saber antes:

1. **El cotizador no contiene ni una cifra.** Importa
   [`datos/precios.json`](datos/precios.json) de la raíz y compone el catálogo
   con lo que encuentre. Si necesitas un precio nuevo, se añade allí. Nunca se
   escribe un importe en el código.
2. **`Totales` no tiene un campo `total`, y es a propósito.** Es la regla 2
   escrita en el sistema de tipos: mientras no exista dónde guardar la suma de
   un pago único y uno mensual, ninguna pantalla puede enseñarla por descuido.
   **La misma ausencia baja hasta la base de datos**: la tabla `propuestas`
   tiene cuatro columnas de dinero —el mínimo y el máximo de lo único y de lo
   mensual— y ninguna es la suma de otras dos. No lo añadas en ningún nivel.
3. **La prosa del documento son citas literales de `catalogo/`**, recogidas en
   `cotizador/src/datos/textos.ts` con el archivo de origen anotado encima. No
   se redacta ahí: si el texto tiene que cambiar, cambia en `catalogo/` y se
   copia.
4. **La ficha del cliente manda; la propuesta toma prestado.** Emitir puede
   crear una ficha que no existía, pero nunca cambia una que ya está escrita, y
   dos negocios que se llaman igual no se unen solos. Enlazar mal es peor que no
   enlazar: la ficha equivocada se atribuye un dinero que no es suyo y nadie
   vuelve a mirarlo.
5. **La identidad no se pide, se comprueba.** Quién emitió una propuesta sale
   del token firmado de Cloudflare Access —`worker/acceso.ts` verifica la firma,
   no se limita a leer la cabecera— y jamás de un campo del cuerpo.
6. **Sin Access bien configurado, el hub no se sirve.** Si `ACCESO_DOMINIO` o
   `ACCESO_AUD` faltan, siguen en `PENDIENTE` **o no tienen la forma que les
   toca**, el Worker responde 503 a todo —portada, cotizador y API— diciendo
   qué falta. Lo de la forma no es celo: la etiqueta AUD son 64 caracteres y el
   identificador de la cuenta 32, están a un clic el uno del otro en el mismo
   panel, y con el equivocado el hub queda en pie contestando «la sesión
   caducó» a cada llamada —sin sesión que caducar—. Un fallo que manda a
   recargar es un fallo que nadie puede arreglar recargando. Y por eso `assets.run_worker_first`
   está encendido en `wrangler.jsonc`: sin él, Cloudflare entregaría los
   archivos desde el borde sin llegar a ejecutar ese cierre. No quites ninguna
   de las dos cosas: juntas son lo que impide que el hub quede en pie y abierto
   entre el despliegue y el momento en que alguien se acuerda de la puerta.
7. **`node herramientas/verificar.mjs` también vigila el código del hub**:
   ningún hex fuera de `datos/marca.json` —en el cotizador, en `compartido/` y
   en `worker/`— y el trazado del logo de `index.html` igual al de `marca.json`.
   Y `npm test` comprueba que todo importe que el cotizador puede imprimir esté
   literal en `precios.json`.

El resto —qué revisa antes de emitir, por qué el «qué NO incluye» va antes del
precio, cómo se reconoce a un cliente y por qué el número lo da el servidor—
está en [`cotizador/README.md`](cotizador/README.md).

---

## 8. Lo que este repositorio NO es

- **No es un almacén de guiones escritos.** No hay copys finales guardados
  esperando a ser reutilizados. Hay estructuras: el copy se genera cada vez,
  contra el ADN, para el contexto concreto que pida el humano.
- **No es un histórico.** Lo que deja de ser cierto se borra, no se archiva. El
  historial de git ya guarda lo viejo. **La única excepción es
  [`operacion/publicado.md`](operacion/publicado.md)**, y no la contradice: no
  guarda copy para reutilizarlo, guarda titulares para prohibirlos. Sin él, cada
  lote de contenido vuelve a caer en las frases del anterior.
- **No es documentación del código del sitio.** Eso está en el otro repositorio,
  en `docs/`.
- **No es el sitio.** El hub que se publica desde aquí es interno, para el
  equipo y detrás de Cloudflare Access. Lo que ve un cliente vive en
  `abrinay1997-stack/PanaClaw` y desde aquí no se edita.
- **No es el CRM.** Las conversaciones de eBot y los datos que deja quien
  escribe por WhatsApp o Instagram viven en `abrinay1997-stack/CRM-PANACLAW`,
  con su propio servidor. La libreta del hub es otra cosa: a quién le hemos
  propuesto qué, y en qué acabó.
