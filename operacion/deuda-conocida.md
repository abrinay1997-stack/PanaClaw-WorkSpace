# Deuda conocida

Lo que hoy está mal o falta, y a qué trabajo bloquea.

**Regla de este documento:** lo que se cierra **se borra**, no se archiva. El
historial de git guarda lo cerrado. Un listado donde conviven cosas hechas y
pendientes deja de leerse a los dos meses.

Cada punto lleva quién lo desbloquea:

| Marca | Significa |
|---|---|
| `[código]` | Se hace entero desde un repositorio. Cero dinero, cero cuentas |
| `[tuyo]` | Necesita una decisión o una gestión que solo puede hacer el dueño |
| `[cuenta]` | Gratis en dinero, pero exige abrir una cuenta externa |
| `[$]` | Cuesta dinero |

---

## 1 · Google Analytics 4 sin configurar `[cuenta]`

**Qué pasa.** `ga4MeasurementId` está vacío en `src/data/analytics.ts`, a
propósito: un identificador falso mediría en la cuenta de nadie y lo parecería
todo menos roto.

**Qué bloquea.**

- **Google Ads.** Sin GA4 no se puede importar la conversión, así que una campaña
  se puede correr pero no leer. Ver
  [`campanas/canales/google.md`](../campanas/canales/google.md).
- Ver el recorrido completo de alguien desde que entra hasta que envía.

**Hoy solo mide Meta**, con el píxel `1067898639025746` y el evento `Lead` en
`/gracias/`.

**Cómo se arregla.** Sacar el identificador (`G-…`) de Analytics → Administrar →
Flujos de datos y ponerlo en `src/data/analytics.ts`. **Y actualizar
`/privacidad` en el mismo commit** — la página declara qué se recoge y quién lo
recibe; si dice una cosa y el sitio hace otra, deja de ser un descuido de
redacción y pasa a ser una declaración falsa.

---

## 2 · Los cuatro proyectos están sin medir `[código]`

**Qué pasa.** Las fichas de `src/data/projects.ts` tienen nombre, dominio, enlace
y sector. No tienen métricas, ni año, ni reto, ni solución.

**Qué bloquea.** Cualquier pieza que necesite prueba. Ver
[`catalogo/09-prueba.md`](../catalogo/09-prueba.md).

**Cómo se arregla.** `npm run medir` en el repositorio del sitio saca las medidas
con su fecha. Necesita una clave gratuita de PageSpeed Insights. El contenido
—reto y solución— lo escribe quien hizo el proyecto.

**Mientras tanto:** no se publica ninguna cifra de resultado. Una ficha a medias
se ve corta pero nunca falsa.

---

## 3 · No hay identidad sonora `[tuyo]`

**Qué pasa.** La marca no tiene música, ni locutor, ni criterio de audio
definido.

**Qué bloquea.** Nada crítico: los reels y las stories se consumen sin sonido la
mayoría de las veces, y
[`prompts/video/video-corto.md`](../prompts/video/video-corto.md) está escrito
para que el video funcione mudo.

**Cuando toque decidirlo:** si hay voz, ¿es la del dueño o sintética? Es la
pregunta que hay que hacerle al humano cada vez que pida un video con voz.

---

## 4 · No hay cuentas de redes sociales `[tuyo]`

**Qué pasa.** El footer del sitio lista WhatsApp, Instagram, LinkedIn, GitHub y
X, pero **solo WhatsApp tiene enlace**. Los demás iconos salen desactivados,
porque un icono que lleva a un 404 hace más daño que un icono apagado.

**Qué bloquea.** El contenido orgánico de
[`prompts/texto/organico.md`](../prompts/texto/organico.md) no tiene dónde
publicarse todavía.

---

## 5 · El sitio dibuja el símbolo equivocado `[código]`

**Qué pasa.** El símbolo real de la marca es la garra de tres zarpazos sobre los
corchetes angulares — el que está en
[`logo-original.png`](../logo-original.png) y el que llevan todas las piezas
publicadas. `scripts/generate-brand-assets.mjs`, en el repositorio del sitio,
sigue dibujando un rayo: `M37.5 6 18 35.5h11.2L26.5 58 46 28.5H34.8L37.5 6Z`.

**Qué bloquea.** Nada del contenido —aquí ya manda el símbolo correcto— pero
**los favicons y el `og.png` del sitio salen con el símbolo viejo**. Es lo que se
ve en la pestaña del navegador y en la miniatura cuando alguien comparte el
enlace por WhatsApp.

**Cómo se arregla,** en el repositorio del sitio:

1. Sustituir el path y el `viewBox` en `scripts/generate-brand-assets.mjs` por
   los de [`datos/marca.json`](../datos/marca.json) → `logo`, respetando
   `fill-rule="evenodd"` y la proporción 100 × 81.56.
2. Reemplazar `brand-assets/logo-original.svg` por
   [`logo-original.svg`](../logo-original.svg) de este repositorio.
3. Correr `npm run brand` y commitear los archivos generados: no se recalculan
   en cada build.
4. Comprobar que el favicon no se deforma: la caja del favicon es cuadrada y el
   símbolo no lo es. Va centrado con aire, nunca estirado.

**Mientras tanto:** en Canva y en cualquier pieza se usa
[`logo-original.svg`](../logo-original.svg) de aquí, **nunca** el `favicon.svg`
del sitio.

---

## 6 · Dos afirmaciones de mercado sin verificar `[tuyo]`

**Qué pasa.** El ADN se apoyaba en dos cosas sobre la competencia que nadie ha
comprobado:

1. `adn/01-identidad.md`, `adn/05-personalidad.md`, `adn/06-claridad.md`,
   `adn/07-redaccion.md` y `prompts/texto/organico.md` decían que la categoría
   **no publica el precio** y que la agencia «no te dice la cifra hasta la
   tercera reunión». Una búsqueda del 2026-08-19 encontró agencias panameñas con
   cifras públicas —una con «desde $399» en el propio título de su web, otra con <!-- v: precio publicado por un competidor, no un importe del catálogo de PanaClaw -->
   tres precios publicados—. No se pudieron abrir las páginas para confirmarlo,
   así que **el hallazgo es indicativo, no concluyente**.

   **Hecho el 2026-08-19:** la afirmación se sacó de los cinco archivos y se
   prohibió expresamente en [`catalogo/09-prueba.md`](../catalogo/09-prueba.md).
   Lo que queda es el argumento comprobable —nuestro precio está publicado y se
   lee sin escribirle a nadie— y el `$1,200` de referencia, que sí está en el
   sitio. **Lo que sigue abierto es la comprobación**, abajo.

2. `adn/05-personalidad.md` presenta el `$1,200` de
   [`datos/precios.json`](../datos/precios.json) → `otrosImportes.referenciaCompetencia`
   como el precio de la categoría. Es una referencia, no una medición.

**Qué bloquea.** Nada para producir, pero es la clase de afirmación que un
competidor desmonta con una captura de pantalla, dentro de un repositorio cuya
regla 4 prohíbe los datos sin verificar. Y si resulta cierta, el argumento de
«somos los únicos que publicamos el precio» deja de ser un diferenciador y pasa
a ser una paridad.

**Cómo se arregla.** Abrir cinco o seis webs de agencias panameñas, anotar cuáles
publican cifra y con qué fecha. Con eso en la mano se puede volver a afirmar algo
sobre la categoría — con su fecha al lado, como cualquier otro dato de este
repositorio. Si la mayoría publica precio, el diferenciador se muda a lo que
nadie más dice: a nombre de quién queda el sitio.

---

## 7 · Los cuatro pilares están ordenados por facilidad, no por defensibilidad `[tuyo]`

**Qué pasa.** `adn/01-identidad.md` ordena el argumento en velocidad, seguridad y
plazo, y la campaña reparte el peso a partes iguales entre velocidad, precio,
plazo y propiedad. De esos cuatro ejes, precio y plazo los puede igualar
cualquiera, velocidad es una carrera de números, y **propiedad y mecanismo son
los dos únicos que la competencia no puede copiar sin cambiar de modelo de
negocio**: una agencia que vive del mantenimiento recurrente no puede prometer
que el código queda a nombre del cliente.

**Qué bloquea.** Nada hoy. **Decisión del dueño de la marca del 2026-08-19: los
cuatro pilares se quedan como están** hasta tener datos propios de la primera
campaña. Queda anotado para revisarlo entonces, no antes.

**Por qué se anota igual.** Porque el orden salió del sitio y cambiarlo obliga a
tocar el otro repositorio; si la campaña dice que propiedad rinde más, este es el
punto por donde se empieza.

---

## 8 · Los cuatro posts del blog ya publicados tienen datos sin verificar `[tuyo]`

**Qué pasa.** `skills/blog-seo/SKILL.md` y
[`prompts/texto/blog.md`](../prompts/texto/blog.md) se escribieron el
2026-08-20 con la regla de que ninguna estadística de mercado entra sin estar
en [`catalogo/09-prueba.md`](../catalogo/09-prueba.md). Los cuatro posts que ya
existen en `src/content/blog/` del repositorio del sitio se escribieron antes
de que esa regla estuviera empaquetada, y llevan cifras que no están
verificadas aquí:

- **`cuanto-cuesta-pagina-web-panama.md`**: «dos de cada tres agencias»,
  rangos de precio del mercado panameño por tramo ($250–$450, $400–$800, <!-- v: cifras de mercado citadas por el post existente, no importes de PanaClaw -->
  etc.), «perdieron el 40% del tráfico», rangos de mantenimiento y de SEO
  mensual — ninguno con fuente citada.
- **`wordpress-vs-sitio-a-medida.md`**: «43% de los sitios del mundo»,
  «70% de las agencias en Panamá», «~7% de reducción de conversión por
  segundo», rangos de costo de plugins y hospedaje sin fuente.
- **`instagram-no-es-tu-web.md`**: «60% de las búsquedas comerciales
  terminan en Google», y tres «casos reales del último año en Panamá»
  (cuentas suspendidas, marcas con 20,000 seguidores) contados como hecho sin
  que haya un caso propio y verificado detrás.
- **`como-elegir-agencia-web-panama.md`** es el único de los cuatro que no
  metió una cifra de mercado sin fuente.

**Qué bloquea.** Nada para seguir publicando — el blog sigue en línea y
funcionando. Es la clase de afirmación que un lector que sí conoce el sector
puede desmontar, dentro de un repositorio cuya regla 4 prohíbe justo esto.

**Cómo se arregla.** Reescribir los tres posts para que cada cifra de mercado
tenga una fuente citable al lado, o se sustituya por el ángulo que sí se
sostiene con lo que hay en `catalogo/09-prueba.md` — casi siempre cambia poco
el argumento, porque la marca no necesita el dato inflado para sonar bien: el
precio publicado y el código a nombre del cliente ya hacen el trabajo. No es
trabajo de código; es una reescritura de contenido y se hace con
`skills/blog-seo/SKILL.md` como procedimiento.

---

## 9 · El hub se publica sin puerta hasta que alguien la ponga `[$]`

**Qué pasa.** El hub —la portada y el cotizador— sale a Netlify en cuanto se
conecta el repositorio, y Netlify no pide contraseña por defecto. La portada
lleva `noindex` en el HTML y en las cabeceras, así que no la va a encontrar un
buscador, pero cualquiera que dé con la dirección entra.

**Qué se ve si entra.** Los precios no son el problema: PanaClaw los publica en
su web a propósito. Lo delicado es el **historial de propuestas**, que guarda
nombre del negocio, contacto y teléfono de cada cliente al que se le ha cotizado.

**Cómo se cierra.** En Netlify: Site configuration → Access control → Password
protection. Es función del plan de pago, y esa es la razón por la que no está
puesta ya.

**Mientras tanto.** El historial vive en el navegador de cada persona, no en un
servidor, así que quien entre sin permiso ve la herramienta vacía: los datos de
clientes no viajan a ningún sitio. Lo que hay que evitar es repartir la
dirección.

**Bloquea:** que el equipo empiece a usar el cotizador con clientes reales desde
más de un equipo.

---

## Cómo se usa este documento

Cualquier agente que vaya a producir una campaña, conectar una herramienta
externa o proponer una métrica **lee esto antes**, y dice en la entrega qué punto
afecta a su trabajo.

No es una lista de excusas: es la aplicación hacia dentro de la regla 7 de la
marca —**di siempre qué no incluye**—. Entregar una campaña sin avisar de que su
canal principal todavía no se puede medir es exactamente la letra chica que esta
marca dice no tener.
