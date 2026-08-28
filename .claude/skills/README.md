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

## Quién manda sobre qué

Hay dos sitios con procedimientos y conviene no dudar nunca. **La línea no está entre
«genérico» y «PanaClaw»: está entre quién los lee.**

`CLAUDE.md` dice que este repositorio existe para que **cualquier agente** —Claude,
Grok, Gemini, Pomelli, el que sea— entienda la marca en una lectura. Esa carpeta,
`.claude/skills/`, solo la lee Claude Code. De ahí sale la regla:

| | Quién lo lee | Qué contiene |
|---|---|---|
| **`skills/`, `prompts/`, `adn/`, `datos/`** | Cualquier agente | La verdad de PanaClaw. **Manda siempre** |
| **`.claude/skills/`** | Solo Claude Code | Lo que el repositorio no puede tener: el procedimiento para **otras marcas** y los **tres scripts** |

**Para un encargo de PanaClaw:**

- El procedimiento es `skills/contenido-instagram/`. No lo sustituye nada.
- El contrato del HTML es `prompts/plataformas/meta-ai.md` — 579 líneas, con el
  símbolo literal, la tira del carrusel y la tabla de qué revisar. El
  `contrato-html.md` de la skill es un resumen de 237 líneas para marcas que no
  tienen el suyo escrito: **si los dos dicen algo distinto, manda el del repo.**
- Las cifras salen de `datos/precios.json`, los tokens de `datos/marca.json` y la
  interlínea de ahí también. La ficha de la skill es un espejo.

**Lo que sí aportan estas skills, y el repositorio no tenía:** los tres scripts.
`skills/contenido-instagram/` los llama en su paso 8, y `prompts/plataformas/meta-ai.md`
llama al auditor cuando vuelve el documento. Eso es lo que había que conectar.

**Para otro cliente:** `prompt-maestro` sola, más su ficha. Ahí no hay repositorio que
mande y la skill es la única fuente.

> **Por qué no se fusionan.** Fusionarlas obligaría a meter en el repositorio material
> que solo sirve a Claude Code, o a sacar del repositorio material que otros agentes
> necesitan leer. Las dos cosas rompen para qué existe cada carpeta. Lo que sí había
> que arreglar era que no se conocieran, y eso ya está hecho.
