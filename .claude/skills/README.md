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

## Cómo se instala

**No hay ningún botón que diga «guardar skill».** Un `.skill` es un zip, y
instalarlo es descomprimirlo en la carpeta correcta. Hay tres sitios donde puede
aterrizar, y cuál te toca depende de dónde vayas a trabajar.

### 1 · Si tienes este repositorio: no instalas nada

Ya están dentro, en `.claude/skills/`. Claude Code lee esa carpeta al abrir la
sesión.

```bash
git pull
```

Y ya. Compruébalo con `/skills`: tienen que salir `prompt-maestro` y
`prompt-maestro-panaclaw`. **Esta es la vía recomendada para todo lo de
PanaClaw**, porque la skill y el repositorio que la alimenta van juntos y no se
pueden desincronizar.

Las sesiones en la nube de Claude Code también leen `.claude/skills/` del
repositorio clonado, así que ahí tampoco hay que hacer nada.

### 2 · Si NO tienes el repositorio: descomprimir en la carpeta personal

Es la vía para un compañero que solo quiere el método, o para llevarse
`prompt-maestro` a otro cliente. La carpeta personal es `~/.claude/skills/` y
vale para todos tus proyectos.

En macOS o Linux:

```bash
mkdir -p ~/.claude/skills
unzip prompt-maestro.zip -d ~/.claude/skills/
unzip prompt-maestro-panaclaw.zip -d ~/.claude/skills/
```

En Windows, PowerShell:

```powershell
mkdir -Force "$HOME\.claude\skills"
Expand-Archive prompt-maestro.zip -DestinationPath "$HOME\.claude\skills\"
Expand-Archive prompt-maestro-panaclaw.zip -DestinationPath "$HOME\.claude\skills\"
```

Tiene que quedar así, con el `SKILL.md` un nivel dentro:

```
~/.claude/skills/prompt-maestro/SKILL.md
~/.claude/skills/prompt-maestro-panaclaw/SKILL.md
```

Si el archivo te llegó con extensión `.skill` y tu descompresor no lo reconoce,
renómbralo a `.zip`. Es el mismo archivo: la extensión es lo único que cambia.

**Si la carpeta `~/.claude/skills/` no existía antes de abrir la sesión**, cierra
Claude Code y vuelve a abrirlo. Si ya existía, las coge al vuelo sin reiniciar.

### 3 · Para claude.ai en el navegador o la app de escritorio

Ahí no valen ni el repositorio ni la carpeta del disco: hay que subir la skill a
la cuenta. Se gestiona desde **Customize**, en la barra lateral de la app de
escritorio, o desde los ajustes de skills de claude.ai — **no desde el chat.**
Sube el `.zip`.

**Lo que pierdes por esta vía:** los tres scripts. Necesitan Node y Playwright, y
en el navegador no hay ni lo uno ni lo otro. Te llevas el método, el contrato del
HTML y el logo; no te llevas las comprobaciones a máquina.

### Cuál elegir

| Dónde trabajas | Vía |
|---|---|
| Claude Code, con el repositorio clonado | 1 — `git pull` y nada más |
| Claude Code, sin el repositorio | 2 — descomprimir en `~/.claude/skills/` |
| claude.ai en el navegador, o la app de escritorio | 3 — subir el zip desde **Customize** |

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
