# Las skills del repositorio

**Si clonaste este repositorio, no tienes que instalar nada.** Claude Code lee esta
carpeta solo, y las dos skills de aquí se activan cuando el encargo las necesita.

Son dos y están partidas a propósito:

| Skill | Qué es |
|---|---|
| **`prompt-maestro`** | El procedimiento. Agnóstico de marca: sirve para PanaClaw y para cualquier cliente que tenga su ADN declarado |
| **`prompt-maestro-panaclaw`** | Los datos de PanaClaw: el logo como código, la ficha, el mapa del repositorio y las reglas duras |

La segunda **no repite el método**. Si viviera en dos sitios, el día que se mejore
uno el otro se queda viejo y nadie se entera.

---

## Cómo se usa

Pide lo que quieras en lenguaje normal y se cargan solas:

```
dame el contenido de Instagram del mes, enfocado en eBot
12 publicaciones para esta semana sobre la experiencia del cliente
audita el HTML que me devolvió Meta
```

Y si quieres forzarlas, `/prompt-maestro` o `/prompt-maestro-panaclaw`.

---

## Los tres scripts

Viven en `prompt-maestro/scripts/` y **necesitan Node y Playwright**. Sin eso, todo
lo demás de las skills funciona igual — solo pierdes las comprobaciones a máquina.

```bash
npm i -D playwright && npx playwright install chromium
```

**Medir la tipografía de una marca** (las holguras de interlínea dependen de la
fuente y no se copian de otra marca):

```bash
node .claude/skills/prompt-maestro/scripts/medir-fuente.mjs \
  --familia "Antonio" --peso 700 --comprobar
```

**Verificar un prompt maestro antes de entregarlo:**

```bash
node .claude/skills/prompt-maestro/scripts/verificar-lote.mjs prompt.txt \
  --marca .claude/skills/prompt-maestro-panaclaw/assets/ficha-panaclaw.json \
  --adn adn --indice operacion/publicado.md
```

**Auditar el HTML que devolvió Meta AI:**

```bash
node .claude/skills/prompt-maestro/scripts/auditar-documento.mjs documento.html \
  --prompt prompt.txt --png ./auditoria
```

---

## Para llevárselas a otro cliente

`prompt-maestro` sola, más una ficha rellena. La plantilla en blanco está en
`prompt-maestro/assets/ficha-de-marca.json` y es lo que se le pide a un cliente
nuevo: dieciséis datos, y los tres primeros son los que siempre faltan.

**Nunca copies la tabla de interlínea de una marca a otra.** Depende de la
tipografía de titular: se mide con `medir-fuente.mjs` y se pega en la ficha.

---

## Su relación con `skills/` de la raíz

Los dos sitios contienen procedimientos, y conviene saber cuál manda:

- **`skills/` de la raíz** es el catálogo de la marca — `contenido-instagram`,
  `blog-seo`, `propuesta-comercial`, `anuncio-pagado`, `lote-visual`. Lo enruta
  `CLAUDE.md` y es la fuente para cualquier agente, sea Claude o no.
- **`.claude/skills/`** es lo que Claude Code carga solo.

**`prompt-maestro` y `skills/contenido-instagram/` se solapan**: los dos producen
el prompt maestro de un lote de Instagram. La diferencia es el alcance —
`contenido-instagram` sabe de PanaClaw y da por hecho su repositorio;
`prompt-maestro` no sabe de ninguna marca y exige una ficha.

Mientras convivan, **manda `skills/contenido-instagram/` para un encargo de
PanaClaw**: es el que conoce los cinco tipos de publicación, la mezcla del mes y el
enrutador. `prompt-maestro` aporta lo que aquel no tiene — el contrato del HTML, las
nueve trampas del exportador y los tres scripts.

> Si la duplicación molesta, la salida limpia es dejar `contenido-instagram` como el
> procedimiento de PanaClaw y que apunte a `prompt-maestro` para la parte del
> documento HTML. Es una decisión del dueño del repositorio, no de quien produce.
