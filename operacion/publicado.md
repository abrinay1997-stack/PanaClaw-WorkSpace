# Lo publicado

**Un índice en negativo: lo que ya salió, para que no vuelva a salir igual.**

Se lee **antes** de escribir un calendario y se actualiza **después** de
entregarlo. Es obligatorio: sin este archivo, cada lote de contenido vuelve a
caer en las mismas frases, y ese fallo ya se produjo.

---

## Por qué existe, que no es obvio

`CLAUDE.md` §8 dice que este repositorio **no es un histórico** y que no guarda
copys esperando a ser reutilizados. Eso sigue en pie y este archivo no lo
contradice, porque **no guarda texto para volver a usarlo: guarda texto para
prohibirlo.** Es lo contrario de un almacén.

Hace falta porque el problema estaba diagnosticado al revés. La queja que lo
provocó, del dueño de la marca el 2026-08-26, fue exacta:

> *«Siento que siempre me generas las mismas ideas, pero el problema no son las
> ideas sino que creo que me escribes los mismos textos.»*

**Y tenía razón en la distinción.** Las ideas se repiten poco: el inventario de
[`campanas/plantillas/calendario.md`](../campanas/plantillas/calendario.md) tiene
más de cincuenta piezas verificables. Lo que se repite es **la redacción**, y
tiene tres causas mecánicas, ninguna de ellas «falta de creatividad»:

1. **El corpus es cerrado a propósito.** Toda cifra sale de
   [`datos/precios.json`](../datos/precios.json) y toda afirmación de
   [`catalogo/`](../catalogo/). Eso es la regla 1 y la regla 4, y no se toca. La
   consecuencia inevitable es que el material de partida es siempre el mismo.

2. **El ADN trae frases modelo que se leen como copy aprobado.** «Sin discusión
   y sin mala cara», «no una entrega a ciegas al final», «el reloj empieza
   cuando…», «te digo cuál encaja, o que no te hace falta ninguno». Están ahí
   como **formas**, y [`adn/06-claridad.md`](../adn/06-claridad.md) §2 lo avisa
   en una línea que es fácil pasar por alto. En la práctica, cualquiera que
   busque cómo decir algo encuentra la frase canónica ya escrita y la copia. No
   es pereza: es lo que hace un archivo bien escrito.

3. **No había memoria de lo entregado.** Cada lote arrancaba del mismo corpus,
   con las mismas instrucciones y sin saber qué se había dicho el mes anterior.
   Dos ejecuciones idénticas dan resultados idénticos, y eso no es un defecto
   del que escribe: es que faltaba la entrada que las diferenciara.

**Este archivo tapa la tercera, que es la única de las tres que se puede tapar
sin romper la marca.** Las otras dos son el precio de no inventar datos, y ese
precio se paga.

---

## Las tres reglas

### 1 · Ningún titular se repite. Nunca

No «parecido»: **ninguno**. Si un titular ya está en la tabla de abajo, no
vuelve a salir aunque el mes sea otro y el público sea otro. Un titular
publicado está gastado.

### 2 · Ninguna puerta de entrada se repite más de dos veces por calendario

La puerta es **por dónde entra la pieza al argumento**, y las ocho están en
[`adn/07-redaccion.md`](../adn/07-redaccion.md) §4:

`situación` · `cifra` · `límite` · `mecanismo` · `objeción` · `proceso` ·
`comparación` · `lo que pasa si no hace nada`

Se anota una por pieza. En un calendario de doce, ninguna puede aparecer más de
dos veces, y **al menos cinco de las ocho tienen que aparecer**. Esa es la
regla que rompe el parecido entre lotes, más que el tema: dos calendarios sobre
productos distintos escritos los dos por la puerta de la situación suenan igual.

### 3 · Ninguna frase del ADN se copia literal

Las frases de ejemplo de [`adn/`](../adn/) son **formas, no guiones**. Si una
aparece palabra por palabra en un entregable, es un fallo de producción, no una
cita. La prueba es mecánica: busca la frase en `adn/` antes de entregarla; si
está, reescríbela.

**La única excepción es la tagline**, que está declarada en
[`datos/marca.json`](../datos/marca.json) y se dice siempre igual a propósito.

---

## Cómo se usa

**Antes de escribir un calendario:** lee la tabla entera. Es corta y se lee en
un minuto.

**Al entregar:** añade las filas del lote nuevo, con su fecha. Sin esto el
archivo miente en el siguiente lote, y un índice en negativo que miente es peor
que no tenerlo.

**Qué se anota, y nada más:** fecha, publicación, puerta, titular en una línea y
escena. No se anota la descripción entera — esto es un índice, no un archivo de
copy.

**Qué se borra:** nada. Es el único archivo del repositorio que crece y no se
poda, porque su valor está justamente en acordarse. Cuando pase de unas cien
filas, se parte por año.

---

## Lo publicado

### 2026-08 · Semana «Experiencia del cliente»

Público: el que no tiene sitio · Producto: los cuatro planes web ·
Firma: `PanaClaw — sitios rápidos, código tuyo.`

| # | Puerta | Titular | Escena |
|---|---|---|---|
| 01 | situación | TE BUSCAN / Y SOLO VEN / TU INSTAGRAM. / TE HACEMOS / TU PÁGINA WEB. | cintas entrando y trenzándose |
| 02 | situación | PREGUNTASTE / POR UNA WEB / Y TE DIJERON / UN MES Y MEDIO. / VAN TRES. | cinta que se estira y se apaga |
| 03 | objeción | NO ES UNA ENTREGA / A CIEGAS / EL ÚLTIMO DÍA. / VES CÓMO VA / DESDE LOS / PRIMEROS DÍAS. | tres cintas, cada una más trenzada |
| 04 | cifra | UN CAMBIO MÁS / DESPUÉS DE LAS / RONDAS INCLUIDAS / YA TIENE PRECIO. | cinta que se sale del trenzado y vuelve |
| 05 | situación | EL DÍA QUE QUIERAS / CAMBIAR DE AGENCIA, / TE LLEVAS TU PÁGINA. | nudo que se suelta |
| 06 | límite | SÍ, 72 HORAS. / EL RELOJ EMPIEZA / CUANDO NOS MANDAS / TU MATERIAL / Y LA MITAD DEL PAGO. | cintas quietas, una encendiéndose |
| 07 | cifra | CUATRO PLANES, / CUATRO PRECIOS, / Y LO QUE TRAE / CADA UNO. | cuatro cintas paralelas de largo creciente |
| 08 | límite | DOS COSAS / QUE SE CONFUNDEN / Y CUESTAN DISTINTO. / LAS RONDAS VAN / ANTES DE PUBLICAR. | trenzándose a la izquierda, quietas a la derecha |
| 09 | proceso | QUÉ ENTRA Y QUÉ NO / SE MANDA POR ESCRITO / ANTES DE QUE / PAGUES NADA. | trazado grabado en la piedra, sin encender |
| 10 | objeción | NO TIENES QUE DARNOS / NINGUNA CLAVE. / SE CREA TODO / A TU NOMBRE / Y TÚ LAS GUARDAS. | dos losas separadas, sin tocarse |
| 11 | proceso | NO SE PAGA TODO / POR ADELANTADO. / LA MITAD / AL EMPEZAR. | cinta partida en dos mitades limpias |
| 12 | mecanismo | ABRE ESTA PÁGINA / EN TU CELULAR / Y CUÉNTANOS / CUÁNTO TARDÓ. | cinta corta y brillante, un instante |

**Puertas usadas:** situación 3 · cifra 2 · límite 2 · objeción 2 · proceso 2 ·
mecanismo 1. Seis de las ocho, ninguna por encima de tres.

> **Nota sobre este lote.** Se produjo antes de que existiera este archivo, así
> que la puerta se anotó a posteriori leyendo las piezas. La «situación» aparece
> tres veces, una por encima del tope de la regla 2: el siguiente calendario que
> hable de este mismo público no la puede usar más de dos, y le faltan por
> estrenar `comparación` y `lo que pasa si no hace nada`.

**Escena madre de la semana:** cintas de luz roja trenzándose sobre obsidiana
pulida. No se repite en el siguiente lote de este público — la tabla de escenas
por producto está en [`prompts/README.md`](../prompts/README.md).
