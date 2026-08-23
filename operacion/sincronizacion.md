# Sincronización con el repositorio del sitio

Este repositorio es **un espejo, no una copia paralela**. Casi todo lo que hay
aquí nace en `abrinay1997-stack/PanaClaw`, el repositorio del sitio.

Cuando cambia algo allí, cambia aquí. Este archivo dice qué mirar y en qué orden.

---

## La dirección del flujo

```
abrinay1997-stack/PanaClaw   →   PanaClaw-WorkSpace
     (el sitio)                    (el cerebro)
```

**Nunca al revés.** No se edita el sitio desde aquí, y no se edita esto para
«arreglar» algo que en realidad está mal en el sitio. Si encuentras una
contradicción, se reporta — y se anota en
[`deuda-conocida.md`](deuda-conocida.md).

---

## Mapa archivo a archivo

### Precios y catálogo → `datos/precios.json`

| En el sitio | Manda sobre |
|---|---|
| `src/data/plans.ts` | `webs.planes`, `webs.rondaExtra`, `diagnostico` |
| `src/data/modules.ts` | `capacidades` |
| `src/data/ebot.ts` | `ebot` completo, incluidos los costos de terceros |
| `src/data/seguridad.ts` | `seguridad`: auditoría, tramos y los dos mensuales |
| `src/data/care.ts` | `care` |

### Tokens visuales → `datos/marca.json`

| En el sitio | Manda sobre |
|---|---|
| `src/styles/global.css` (`:root`) | `color.tokens` |
| `src/styles/global.css` | `tipografia.escala`, `forma`, `layout` |
| `scripts/generate-brand-assets.mjs` | `logo` — **hoy en divergencia, ver abajo** |
| `src/data/site.ts` | `identidad`, `contacto` |
| `astro.config.mjs` (`site`) | `identidad.sitio` — el dominio público, hoy `panaclaw.com` |
| `src/data/analytics.ts` | `medicion` |
| **Nada. No existe allí** | **`redesSociales`** |

> `redesSociales` es el único bloque de `marca.json` que **no** baja del sitio: el
> sitio no publica en Instagram y no tiene ni Antonio ni una retícula de
> 1080×1350. Se decidió aquí, el 2026-08-16, y por eso lleva su propio campo
> `decidido` en vez de heredar `verificadoContra`.
>
> **Consecuencia:** si algún día el sitio adopta Antonio, deja de ser una
> extensión y pasa a ser espejo — y entonces el flujo se invierte al normal.
> Mientras tanto, un cambio en la tipografía del sitio **no** toca este bloque, y
> un cambio en este bloque **no** es motivo para tocar el sitio.

> **`logo` está en divergencia desde el 2026-08-17.** Es la única excepción viva
> a la regla de que el sitio manda: el generador de assets dibuja un rayo y el
> símbolo real de la marca es la garra sobre los corchetes. Aquí manda el
> símbolo real, porque el original —`logo-original.png`— es más autoridad que un
> script que quedó sin actualizar. **El sitio es el que tiene que ponerse al
> día**, y el procedimiento exacto está en
> [`deuda-conocida.md`](deuda-conocida.md) punto 5. Hasta que eso pase, los
> favicons y el `og.png` siguen saliendo con el rayo.

### Copy y reglas → `adn/` y `catalogo/`

| En el sitio | Manda sobre |
|---|---|
| `src/data/services.ts` | Los tres pilares de `adn/01-identidad.md` |
| `src/data/faq.ts` | Las objeciones de `adn/04-audiencia.md` |
| `src/data/projects.ts` | `catalogo/09-prueba.md` |
| `docs/convenciones.md` | `orquestador/reglas.md` |
| Las listas `*NoIncluye` de cada producto | El «qué NO incluye» de cada ficha |
| `src/content.config.ts` (schema de `blog`) | El contrato técnico de [`prompts/texto/blog.md`](../prompts/texto/blog.md) — rangos de caracteres y el enum de `category` |
| `src/content/blog/*.md` | Los temas ya publicados. `skills/blog-seo/SKILL.md` los lee antes de proponer uno nuevo — no viven espejados aquí, se consultan en vivo |

### El hub → `cotizador/`

El cotizador **no** copia nada de `datos/`: importa
[`datos/precios.json`](../datos/precios.json) directamente, así que los precios
no hay que sincronizarlos con él. Lo que sí puede desincronizarse es la prosa,
porque esa sí está escrita dentro:

| Aquí | Se copia a | Qué es |
|---|---|---|
| `catalogo/02-capacidades.md` → «Las seis» | `cotizador/src/datos/textos.ts` → `QUE_CONSIGUE` | Qué consigue el cliente con cada capacidad |
| `catalogo/07-condiciones.md` → «Qué no incluye ningún precio» | `textos.ts` → `NO_INCLUYE_SIEMPRE` | La lista base de exclusiones |
| `catalogo/07-condiciones.md` → plazos, cancelación, accesos | `textos.ts` → `PLAZO_DESDE`, `CANCELACION`, … | Las condiciones que imprime la propuesta |
| `catalogo/08-fronteras.md` → las frases oficiales | `textos.ts` → `FRONTERAS` | Las tres frases que van con estas palabras exactas |
| `catalogo/01-webs.md` + `precios.json` → `secciones` | `textos.ts` → `QUE_CONSIGUE_PLAN` | Qué consigue el cliente con cada plan |
| `datos/marca.json` → `logo.pathSVG` | `index.html` | El trazado del símbolo en la portada |

**Al cambiar cualquier archivo de `catalogo/`, revisa `textos.ts`.** Las dos
últimas filas las vigila `node herramientas/verificar.mjs`; las otras cuatro no
puede vigilarlas —son prosa, no datos— y las tiene que mirar una persona.

Lo que sí está vigilado sin que nadie se acuerde:

- `npm test` comprueba que **todo importe que el cotizador puede imprimir esté
  literal en `precios.json`**. Un precio que cambie allí y rompa el formato
  —o un producto nuevo sin precio— hace fallar las pruebas y con ellas el
  despliegue.
- `node herramientas/verificar.mjs` comprueba que **ningún hex del hub esté
  fuera de `marca.json`** y que el trazado del logo de `index.html` siga siendo
  el de `marca.json`.
- `npm run build` corre las dos cosas antes de construir, así que un repositorio
  desincronizado no llega a publicarse.

---

### Lo que NO tiene espejo en el sitio

Tres bloques se decidieron aquí y no vienen de `abrinay1997-stack/PanaClaw`. No
se sincronizan: se mantienen aquí y llevan su propia fecha de decisión.

| Archivo | Qué es | Decidido |
|---|---|---|
| `datos/marca.json` → `redesSociales` | La segunda familia tipográfica y la retícula de las piezas de redes | 2026-08-16 |
| `adn/06-claridad.md` | Qué se dice primero y con qué palabras | 2026-08-17 |
| `adn/07-redaccion.md` | Cómo se hace que el texto funcione | 2026-08-19 |
| `index.html` y `cotizador/` | El hub de herramientas del equipo | 2026-08-23 |

Si alguno de los tres primeros acaba mandando también sobre el copy del sitio,
el camino es el de siempre y va al revés: se lleva primero al sitio y después
baja aquí. El hub es otra cosa: es interno, no lo ve ningún cliente y no tiene
por qué llegar al sitio nunca.

---

## Procedimiento

### Cuando cambia un precio

1. Actualiza **`datos/precios.json`** y su campo `verificadoContra.fecha`.
2. Corre `node herramientas/verificar.mjs`. Va a señalar cada `.md` que cite la
   cifra vieja.
3. Corrige los `.md` que señale. **Nunca al revés**: si un `.md` dice `$300` y el <!-- v: contraejemplo, $300 es la cifra equivocada que se ilustra -->
   JSON dice `$295`, el equivocado es el `.md`.

### Cuando cambia un color o una fuente

1. Actualiza **`datos/marca.json`**.
2. Corre el verificador: caza cualquier hex que ya no esté declarado.
3. Revisa a mano `adn/03-sistema-visual.md` y `prompts/bloques/estilo-visual.md`
   — el bloque de estilo lleva los hex escritos dentro y es el que se pega en
   todos los generadores.

### Cuando aparece o desaparece un producto

Es el cambio más caro. Toca:

1. `datos/precios.json`
2. Una ficha nueva en `catalogo/`, y el índice de `catalogo/README.md`
3. **`catalogo/08-fronteras.md`** — ¿se parece a algo que ya existe? Si sí, la
   frontera se escribe **antes** de publicar nada
4. `adn/04-audiencia.md` si trae un público nuevo
5. `prompts/README.md` — asignarle una escena canónica
6. Los enrutadores: `CLAUDE.md` y `orquestador/enrutador.md`

> El precedente está documentado: la capacidad «Respuestas automáticas con IA»
> ($250–$900) se retiró al publicarse eBot porque describían lo mismo. Publicar <!-- v: precio histórico de un producto retirado -->
> sin comprobar la frontera deja al catálogo ofreciendo dos precios para lo que
> el cliente lee como una sola cosa.

### Cuando cambia una regla del proyecto

`docs/convenciones.md` del sitio → `orquestador/reglas.md`. No todas las reglas
del sitio aplican aquí: las de rutas, `:global()` y CSS son de código y no viajan.

---

## Cada cuánto

**No hay calendario.** Se sincroniza cuando cambia algo, y se comprueba antes de
cualquier trabajo grande:

```bash
node herramientas/verificar.mjs
```

Antes de una campaña, de conectar una herramienta externa o de armar una
propuesta, ese comando y una mirada a [`deuda-conocida.md`](deuda-conocida.md).

---

## Lo que el verificador NO puede ver

Solo compara este repositorio consigo mismo. **No lee el repositorio del sitio.**

Si alguien cambia un precio en `plans.ts` y no lo trae aquí, `precios.json`
seguirá siendo internamente coherente y el verificador dirá que todo está bien —
mientras la marca entera anuncia una cifra vieja.

**Eso lo tiene que hacer una persona.** El campo `verificadoContra.fecha` de los
dos JSON está para eso: si lleva meses sin tocarse y el sitio ha cambiado, ya hay
divergencia.

Una comprobación rápida contra el sitio, cuando haya dudas:

```bash
# En el repositorio del sitio
grep -rn "price:" src/data/*.ts
grep -n "flash-orange\|ember-red\|deep-black" src/styles/global.css
```
