# Herramientas

## `verificar.mjs`

```bash
node herramientas/verificar.mjs
```

Sin dependencias. Node 18+. Sale con código 1 si hay errores; los avisos no
rompen la ejecución.

---

## Qué vigila

Las cuatro reglas de [`orquestador/reglas.md`](../orquestador/reglas.md) que se
pueden comprobar mecánicamente:

| Regla | Comprobación |
|---|---|
| **1 · Ninguna cifra fuera de `precios.json`** | Todo `$N` en prosa existe en el JSON |
| **3 · Cero jerga** | `Jamstack`, `CDN`, `LCP`, `SSG`, `headless`, `Lighthouse`, `pipeline`… |
| **5 · Un solo acento cromático** | Todo hex existe en `marca.json` |
| **8 · Los rangos se citan enteros** | El mínimo de un rango sin «desde» delante → aviso |

Y cuatro más, propias del repositorio:

- **Enlaces internos rotos** — un enrutador que apunta a un archivo que no existe
  deja al agente sin salida
- **Huecos sin resolver** — `[completa aquí]`, `<tu negocio>`, `TODO`, `TBD` <!-- v: contraejemplos: son los marcadores que la comprobación busca -->
- **Ningún hex del hub fuera de `marca.json`** — se revisan `index.html` y todo
  `cotizador/src`. Desde que el repositorio publica algo, hay código de cara al
  cliente que también se puede desincronizar de la paleta, y el código no se
  revisa leyéndolo
- **El logo de la portada sigue siendo el de `marca.json`** — `index.html` lleva
  el trazado pegado a mano porque esa página no se construye, y una copia sin
  vigilancia es una divergencia esperando su turno

Las ocho reglas restantes son de criterio y las revisa quien entrega
([`orquestador/protocolo-entrega.md`](../orquestador/protocolo-entrega.md)).

---

## Qué NO puede ver

**Solo compara este repositorio consigo mismo.** No lee
`abrinay1997-stack/PanaClaw`.

Si alguien cambia un precio en el sitio y no lo trae aquí, `precios.json` seguirá
siendo internamente coherente y esto dirá que todo está bien — mientras la marca
entera anuncia una cifra vieja. Esa comprobación la hace una persona; el
procedimiento está en
[`operacion/sincronizacion.md`](../operacion/sincronizacion.md).

---

## Las zonas exentas

Tres, y cada una existe por un motivo:

**1 · Bloques de código.** Los importes y la jerga dentro de ` ``` ` no cuentan:
son prompts y ejemplos. Los **hex sí se comprueban** también ahí — un prompt con
el naranja equivocado es exactamente el fallo que hay que cazar.

**2 · `skills/_plantilla/`.** Es una plantilla, sus marcadores son a propósito.
Y las pruebas del cotizador (`*.test.ts`), donde un hex equivocado es justo lo
que se está comprobando que no pase.

**3 · Escape explícito por línea.** Una línea que termine en
`<!-- v: motivo -->` queda exenta de todo.

```markdown
Dos totales separados, siempre. «$375 de una vez y $45 al mes», no
«$420». <!-- v: contraejemplo, $420 es la suma prohibida -->
```

Existe porque este repositorio **enseña con contraejemplos**: «nunca escribas
$420», «no uses #FF5500». Sin una salida declarada habría que elegir entre no <!-- v: contraejemplos citados al explicar el escape -->
poder enseñar o apagar el cepo entero.

**El motivo es obligatorio.** Un escape sin explicación es un escape que nadie
puede revisar dentro de seis meses. `<!-- v: -->` a secas no exime.

---

## Al añadir una comprobación

> **Rompe lo que vigila y comprueba que salta.**

Es la regla heredada del repositorio del sitio, y no es retórica: un cepo que
también pasa con la función desactivada no vigila nada, y le pasó a dos de las
comprobaciones que hay allí.

Comprobado así la última vez, sobre `catalogo/01-webs.md`:

| Se introdujo | Saltó |
|---|---|
| `$299` donde el plan cuesta `$295` | `Importe $299 no existe en datos/precios.json` | <!-- v: contraejemplo de la prueba de rotura -->
| «4–5 secciones, servidas por CDN» | `Jerga prohibida: «CDN»` |
| `Acento #FF6A00` | `Color #FF6A00 no está en datos/marca.json` | <!-- v: contraejemplo de la prueba de rotura -->
| Enlace a `07-inexistente.md` | `Enlace roto: 07-inexistente.md` |

Código de salida 1 en los cuatro casos.
