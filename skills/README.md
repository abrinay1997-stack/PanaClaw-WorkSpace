# Skills

Procedimientos empaquetados. Una skill es **el trabajo que hace un agente
cuando le piden algo concreto**, escrito paso a paso para que salga igual la
décima vez que la primera.

No son documentación de la marca: eso está en [`adn/`](../adn/) y
[`catalogo/`](../catalogo/). Una skill **usa** esos archivos.

---

## Las que hay

| Skill | Cuándo se dispara |
|---|---|
| [`contenido-instagram`](contenido-instagram/SKILL.md) | «El contenido de Instagram del mes», «planeamiento enfocado en eBot» |
| [`lote-visual`](lote-visual/SKILL.md) | «Genera N creativos», «un lote para el mes» |
| [`anuncio-pagado`](anuncio-pagado/SKILL.md) | «Anuncios para Meta», «copy para pauta» |
| [`propuesta-comercial`](propuesta-comercial/SKILL.md) | «Arma una propuesta», «cotiza esto» |
| [`blog-seo`](blog-seo/SKILL.md) | «Escribe un post del blog», «el próximo artículo para SEO» |
| [`candidatos-blog-seo`](candidatos-blog-seo/SKILL.md) | «Tengo el CSV de Search Console, dame candidatos de blog» |

Plantilla para crear una nueva: [`_plantilla/SKILL.md`](_plantilla/SKILL.md).

---

## Anatomía de una skill

Cinco secciones. Todas obligatorias.

```
1. CUÁNDO SE USA      Las frases del humano que la disparan. Y cuándo NO.
2. QUÉ SE LEE         Los archivos, en orden.
3. QUÉ SE PREGUNTA    Los datos sin los que no se puede empezar.
4. PROCEDIMIENTO      Los pasos, numerados.
5. VERIFICACIÓN       La lista de comprobación antes de entregar.
```

---

## Reglas al escribir una skill

### Una skill no repite datos

Si una skill lleva un precio escrito dentro, está mal. Manda leer
[`datos/precios.json`](../datos/precios.json). El día que cambie una cifra, no
puede haber tres skills anunciando la vieja.

Lo mismo con los hex, los nombres de producto y las descripciones de capacidades.
**Las skills apuntan, no copian.**

### Una skill dice qué preguntar

La sección 3 es la que evita el 90 % del trabajo rehecho. Si la skill puede
producir dos resultados muy distintos según un dato que el humano no dio, ese
dato va en la sección 3.

### Una skill dice cuándo NO usarse

Casi tan importante como cuándo sí. Sin ese apartado, dos skills se solapan y el
agente elige la primera que encuentra.

### Una skill termina en una verificación

La sección 5 no es un resumen: es una lista de casillas que se marcan una a una
mirando el entregable. Toda skill que produzca texto de cara al cliente incluye
la verificación de
[`orquestador/protocolo-entrega.md`](../orquestador/protocolo-entrega.md).

---

## Cómo se crea una skill nueva

1. Copia [`_plantilla/SKILL.md`](_plantilla/SKILL.md) a
   `skills/<nombre>/SKILL.md`.
2. Rellena las cinco secciones.
3. Añádela a la tabla de arriba.
4. Añádela al enrutador: la tabla de [`CLAUDE.md`](../CLAUDE.md) y la ruta
   correspondiente en
   [`orquestador/enrutador.md`](../orquestador/enrutador.md).

El paso 4 es el que se olvida, y sin él la skill existe pero nadie llega a ella.

---

## Cuándo NO hace falta una skill

Si el procedimiento cabe en tres pasos obvios, no es una skill: es una entrada en
el enrutador. Las skills existen para trabajos donde el orden importa y donde hay
decisiones que se pueden tomar mal.
