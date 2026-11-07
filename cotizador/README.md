# Cotizador · PanaClaw

Arma la propuesta de un cliente concreto, saca el PDF que se le manda y el
mensaje de WhatsApp que lo acompaña, guarda lo emitido y lleva la libreta de a
quién se le propuso qué.

Vive dentro del hub y se sirve en `/cotizador/`. Se abre desde la portada. Son
cuatro pantallas y una sola aplicación:

```
/cotizador/            armar la propuesta
/cotizador/#historial  lo emitido, su estado y su papelera
/cotizador/#clientes   la libreta
/cotizador/#cliente/CLI-0007   la ficha de uno
```

---

## No es el cotizador del sitio

En `panaclaw.com/cotizador/` hay otro, y hacen cosas distintas a propósito:

| | El del sitio | Este |
|---|---|---|
| Para quién | El cliente, solo | Quien vende |
| Qué pregunta | Cuatro respuestas | Producto por producto |
| Qué devuelve | Una cifra en pantalla | Un documento con nombre y fecha |
| Qué promete | Un orden de magnitud | Un compromiso |

El del sitio existe para que nadie tenga que escribir «hola, precios?». Este
existe porque después de esa conversación hace falta mandar algo por escrito, y
escribirlo a mano cada vez es como se acaba prometiendo un panel de edición en
un plan que no lo lleva.

---

## De dónde salen las cifras

De [`datos/precios.json`](../datos/precios.json), y de ningún otro sitio.

`src/dominio/catalogo.ts` **importa el archivo de la raíz del repositorio** y
compone el catálogo con lo que encuentre. No hay copia, no hay archivo generado
y no hay paso manual entre medias: cambiar un precio allí lo cambia en la
pantalla, en el PDF y en el mensaje a la vez.

Lo único que vive en el código son las **relaciones** entre productos, que
`precios.json` no declara porque no son cifras: qué capacidad exige qué plan,
qué mensual exige la Auditoría delante y qué viene ya dentro de qué. Cada una
lleva encima el archivo de [`catalogo/`](../catalogo/) que la publica.

---

## Las dos reglas que están escritas en el código

**1 · Un pago único y uno mensual nunca se suman.** El tipo `Totales` tiene
`unico`, `mensual` y `terceros`, y **no tiene un campo `total`**. Mientras no lo
tenga, ninguna pantalla, ningún PDF y ningún mensaje puede enseñar la suma por
descuido. Hay pruebas que comprueban que la suma prohibida no aparece dentro del
PDF ni dentro del texto de WhatsApp.

**2 · Un precio cerrado no se puede tocar.** En la pantalla no hay dónde
escribir un importe. Lo único editable es un **rango publicado**, y solo hacia
dentro: cerrar $80–$150 en $110 es elegir el tramo que corresponde; escribir una
cifra fuera del rango sería inventarse un precio que la marca no publica, y la
marca no regatea. Si el rango se sale, la revisión lo bloquea.

---

## Lo que revisa antes de dejar emitir

Es la lista de verificación de
[`skills/propuesta-comercial/SKILL.md`](../skills/propuesta-comercial/SKILL.md),
ejecutada en vez de recordada. Bloquea el envío:

- Una capacidad avanzada sin plan web debajo
- Reservas, portal o panel sobre un plan que no los aguanta
- El control de inventario cobrado encima de Commerce, que ya lo trae
- Un plan mensual de seguridad sin la Auditoría delante
- Un precio fuera del rango publicado
- Dos planes web en la misma propuesta

Y avisa, sin bloquear, de los rangos sin cerrar, de eBot sin sitio web, del
descuento anual de Care y de que falta el «qué necesitas».

---

## Lo que el documento dice solo

El PDF y el mensaje llevan las mismas secciones y en el mismo orden, y el orden
es el que publica el procedimiento:

```
QUÉ NECESITAS · QUÉ INCLUYE · QUÉ NO INCLUYE · PAGO ÚNICO ·
CADA MES · A TERCEROS · PLAZO · CAMBIOS · CONDICIONES
```

**«Qué NO incluye» va antes del precio.** No es maquetación: el argumento entero
de la marca es la ausencia de trampa, y una lista de exclusiones puesta antes de
la cifra es la única forma de demostrarla en vez de afirmarla.

La lista se arma sola según lo que lleve la propuesta. Si el plan no deja al
cliente editar su contenido, la exclusión del panel se escribe sola: prometerlo
de más es, según el procedimiento, lo que más caro sale.

También salen solas las frases de
[`catalogo/08-fronteras.md`](../catalogo/08-fronteras.md) cuando la propuesta
lleva dos de los cuatro productos confundibles, y los dos costos de terceros de
eBot en su propio bloque cuando lleva eBot.

---

## El ITBMS, aparte y bloque por bloque

Ningún precio publicado incluye el ITBMS. La tasa vive en
[`datos/precios.json`](../datos/precios.json) → `impuestos.itbms` y se aplica con
`conImpuesto` **sobre cada bloque por separado**: el pago único lleva su impuesto
y lo mensual el suyo. Es la regla 1 llevada al impuesto: no existe un total que
mezcle los dos, con impuesto ni sin él. En un rango se calcula en los dos
extremos. El PDF, la pantalla y el mensaje de WhatsApp enseñan lo publicado, el
impuesto y el total con impuesto, y declaran que los precios no lo incluyen.

El PDF es un documento de oficina, no una pieza de campaña: papel blanco, el
logo en su color, una franja con fecha, vigencia y moneda, «preparada para» y
«preparada por» a dos columnas, una tabla ligera, y los totales en dos tarjetas
claras separadas. El naranja queda para el símbolo y un filete corto sobre cada
sección; el resto es tinta y gris. Pensado para que lo firme un despacho de
abogados, un arquitecto o un consultorio sin que parezca publicidad.

El PDF también lleva el RUC o la cédula del cliente cuando se escribe, el detalle
con cantidad, precio e importe por renglón, y un espacio para firmar y fechar.

---

## Los cobros

Una propuesta **aceptada** tiene su libro de cobros (botón «Cobros» en el
historial). Es el mismo criterio del libro de D'Casa:

- **El saldo es la suma del libro**, no una columna. Lo debido sale del documento
  guardado con la misma cuenta del PDF (`debidoCentavos`: el pago único más su
  ITBMS); lo cobrado, de sumar los asientos.
- **Lo escrito no se edita ni se elimina.** Dos disparadores de la base
  (`migraciones/0003_cobros.sql`) lo impiden. Un cobro mal puesto se corrige con
  un asiento contrario con motivo; los dos quedan a la vista y cada cobro se
  corrige una sola vez.
- **Solo el pago único.** Lo mensual no pasa por el libro, y no existe un total
  que lo mezcle (regla 2).
- **Con un rango sin cerrar no hay cifra que cobrar**, y el libro no deja
  registrar nada hasta emitir la versión definitiva.
- **Etapas del pago.** Si todo lo que se cobra dice «50 % al empezar», el panel
  enseña las dos etapas y cuál ya está cubierta; las dos suman exactamente lo
  debido (la segunda se queda con el centavo que sobre). Si la propuesta mezcla
  formas de cobro —un plan web con un diagnóstico «completo por adelantado»—, no
  hay etapas: no existe una regla única que la parta, y no se inventa un calendario
  de pagos que ningún documento publica.
- No se cobra de más (un saldo a favor es una decisión que este libro todavía no
  lleva), ni una propuesta que no esté aceptada, ni una que esté en la papelera.
- Una propuesta con cobros no se puede purgar de la papelera.
- Quién registró cada asiento sale del token de Access, nunca del cuerpo.

Para activarlo en producción hay que aplicar la migración: `npm run migrar`.

---

## La contabilidad ligera

Pantalla `#contabilidad`. Es **flujo de caja**: lo que entró y lo que salió en las
fechas del periodo, y la pantalla lo dice junto a cada cifra. No es una utilidad
contable ni una declaración: lo que va a la DGI lo decide la contadora.

- **Gastos** (`migraciones/0004_gastos.sql`): un libro como el de cobros. No se
  edita ni se elimina, se corrige con un asiento contrario con motivo, una sola
  vez por gasto. El importe va **sin ITBMS** y el ITBMS de la factura del
  proveedor, en su propia columna.
- **Resumen del periodo**, sumando los libros: ingreso (lo cobrado sin ITBMS),
  gastos, resultado de caja y el ITBMS por pagar o a favor (cobrado menos
  pagado, orientativo). Cobrado por método y gastos por categoría.
- **Cuentas por cobrar con antigüedad**: lo aceptado que no se ha cobrado entero,
  en tramos de 0–30, 31–60, 61–90 y más de 90 días desde que se aceptó. No
  depende del periodo elegido: una deuda de hace tres meses sigue siéndolo.
- Todo es del **pago único**. Lo mensual no entra, y no existe un total que lo
  mezcle (regla 2). Las cuentas puras viven en `compartido/contabilidad.ts` y las
  usan la pantalla y el servidor, así que no pueden discrepar.

- **Comparación**: cada cifra del resumen se enseña frente al periodo anterior. Un
  mes completo se compara con el mes anterior completo (marzo contra febrero, no
  contra «los 31 días de antes»); cualquier otro periodo, con el tramo de la misma
  duración que lo precede.
- **Exportar a CSV** los gastos y los cobros del periodo, para la contadora: una
  fila por asiento, con las correcciones como filas aparte y en negativo, igual que
  en el libro. Separado por punto y coma y con marca de orden de bytes (Excel en
  español). Los importes negativos salen como números, no como texto.

### Cierre de mes

Pestaña «Cierre de mes» de la pantalla, y es lo que hace D'Casa con la fecha de
bloqueo de Odoo: con el mes cerrado **no se registra ni se corrige nada** en cobros
ni en gastos —una corrección lleva la fecha del original, así que también exige
reabrir—, y lo que se mandó a la contadora no cambia debajo de ella.

- Una **lista de chequeo con datos reales**. Solo una comprobación impide cerrar:
  que el mes ya haya terminado. Las demás avisan (mes anterior cerrado, gastos
  registrados, lo aceptado en el mes con algún cobro).
- Es un **historial**, no una bandera: se cierra y se reabre, y cada vez queda
  escrito quién, cuándo y —al reabrir— por qué. La base impide editar o borrar ese
  rastro (`migraciones/0005_cierres.sql`).
- Al cerrar se guarda una **foto del resumen** tal como estaba ese día.
- El bloqueo lo imponen los caminos que escriben (`exigirMesAbierto` en
  `worker/contabilidad.ts`), y `worker/libros.test.ts` comprueba cada uno.
- Cualquiera con acceso al hub puede cerrar y reabrir: hoy no hay roles. Es la
  diferencia con D'Casa, donde solo lo hace la gerencia contable.

Para activarlo en producción: `npm run migrar` (aplica `0003`, `0004` y `0005`).

## Cómo pagar

La cotización imprime «Cómo pagar» solo si `datos/marca.json` →
`contacto.formasDePago.lista` tiene al menos una cuenta (método, titular y dato).
Hoy está vacía a propósito: una cotización que dice «paga a este número» con un
dato inventado es peor que una que no lo dice. Se llena con las cuentas reales de
PanaClaw y el PDF las recoge solo.

---

## Los textos del documento se pueden cambiar

**Se editan donde se ven.** Cada sección de la propuesta (Qué incluye, Qué NO incluye,
Plazo, Cambios, Condiciones, Aceptación) enseña su texto con un botón «Editar» al
lado; al pulsarlo se abre ahí mismo el campo con la vista de cómo se leerá en el
PDF, y se elige si vale «Solo en esta propuesta» o «En todas las propuestas nuevas»
(`src/textos/TextoEnLugar.tsx`). La pantalla `#textos` queda para ver y restaurar
toda la plantilla de una vez. El catálogo completo ya no ocupa un lado: se abre con
«Incluir algo más» (`HojaDeCatalogo`). El tema es claro por defecto, con un botón
para el oscuro (`ui/tema.ts`); los colores del claro viven en `datos/marca.json`
(`color.temaClaro`) y tienen contraste medido (texto 16:1, secundario 5.8:1).

Pantalla `#textos` («Textos» en la cabecera del cotizador). El PDF y el mensaje
dicen cosas fijas —las condiciones, lo que pasa si se cancela, cómo se explican
las rondas de cambios, cada viñeta de «Qué NO incluye»— y se pueden reescribir sin
tocar el código. El **original queda como valor por defecto**: sin editar nada, el
documento sale exactamente igual que antes.

- **Qué se puede cambiar** (`src/dominio/textos.ts`, el registro): cada viñeta de
  «Qué NO incluye», la frase que la precede, la línea de cada plazo y «desde cuándo
  cuenta», los dos textos de «Cambios», los costos de terceros, las condiciones, la
  frase de la firma, «Qué es cada cosa» y la descripción de cada producto.
- **Dos niveles.** La **plantilla del equipo** (pantalla «Textos») vale para las
  propuestas nuevas; el **retoque de una propuesta** (el «Editar» de cada sección) vale solo para ese cliente y no toca la plantilla.
- **El original nunca se pierde.** «Restaurar» lo devuelve. La plantilla es un
  historial (`migraciones/0006_textos.sql`): cada cambio es un asiento con quién y
  cuándo, que no se edita ni se elimina.
- **Lo ya emitido no cambia.** Al emitir, la propuesta guarda dentro de sí **todos**
  los textos tal como valían ese día (`documento.textos`), y de ahí se regenera el
  PDF. Editar la plantilla mañana no mueve una coma del PDF que el cliente tiene.
  `worker/textos.test.ts` y la prueba de punta a punta lo comprueban.
- **Las cifras no se escriben a mano.** Lo que depende de un dato —lo que cuesta la
  ronda extra, el ITBMS, el nombre del plan— es una `{variable}` que el documento
  rellena desde `datos/precios.json`. Un importe tecleado («$40») se queda fijo el
  día que el catálogo cambie, así que `validarTexto` lo rechaza, igual que una
  variable que no exista. El servidor aplica la misma validación al documento que
  recibe.
- **Nunca se imprime un hueco.** Si un texto pidiera una variable que no llega, se
  usa el original: `{extra}` impreso en un PDF para un cliente es peor que la frase
  de siempre.
- **Lo que no se puede hacer desde la pantalla:** quitar una viñeta de «Qué NO
  incluye» —se puede cambiar cómo se dice, no que salga—, ni cambiar los plazos y
  los precios, que son datos de `datos/precios.json`.
- Al emitir se vuelve a pedir la plantilla al servidor. Si falla, no se emite:
  congelar los originales porque la red falló un momento, cuando el equipo tiene
  otra redacción, sacaría un documento distinto sin avisar.

Los originales siguen siendo citas literales de `catalogo/` (`src/datos/textos.ts`).
Esta capa es solo para los documentos; el sitio y los archivos de `catalogo/` no
cambian, y si se quiere cambiar la redacción de la marca en todas partes, se hace
también allí.

Para activarlo en producción: `npm run migrar` (aplica `0006`).

---

## El historial es del equipo, y el número lo da el servidor

`PROP-2026-0001` lo llevaba el navegador de cada quien. Con una persona
cotizando funcionaba; con dos, cada navegador tenía su propio contador y dos
clientes distintos podían recibir la misma «PROP-2026-0007» sin que nadie se
enterara hasta cruzar los dos PDF.

Ahora el número lo da la base, en una sola sentencia SQL que dos personas
emitiendo a la vez no pueden desordenar. La contrapartida es que **ya no se
puede saber por adelantado**: depende de quién emita primero, y por eso la
pantalla dice «se asigna al emitir» en vez de enseñar un número que podría
cambiar delante de quien lo está leyendo.

De ahí salen tres cosas:

- **Sin conexión no se emite.** Armar la propuesta sigue funcionando entero en
  el navegador —el catálogo, los precios, la vista previa del PDF— y el borrador
  se sigue guardando solo. Lo único que necesita red es emitir. La alternativa
  sería inventarse un número provisional, y entonces el PDF que ya está en manos
  del cliente diría un número y el historial otro.
- **El número no se recupera.** El consecutivo se gasta al emitir y no
  retrocede: si se borra la PROP-2026-0007, la siguiente sigue siendo la 0008.
  Un hueco en la numeración se explica; dos propuestas distintas con el mismo
  número, no.
- **Se borra en dos tiempos.** Eliminar manda a la **papelera** —reversible, y
  con constancia de quién retiró—; eliminar definitivamente, ya dentro de la
  papelera, borra la fila de verdad. El servidor lo impone por su cuenta: el
  borrado definitivo solo alcanza filas que ya estén retiradas, diga lo que diga
  quien lo llame.

Y una cosa que no cambió: **el documento manda**. De cada propuesta se guarda el
JSON completo, y las columnas del listado las calcula el servidor a partir de él
con las mismas funciones puras que usa la pantalla, para que el total del
historial no pueda discrepar del total del PDF.

### Las dos sumas del historial

Arriba del listado hay dos cifras y no una: lo de una vez y lo de cada mes.
Es la regla 2 llevada hasta el final —hasta la base de datos, donde la tabla
`propuestas` tiene cuatro columnas de dinero y ninguna es la suma de otras dos—.
Ver la sección 7 de [`CLAUDE.md`](../CLAUDE.md).

---

## El panel de clientes

Hasta ahora los datos de un cliente vivían **dentro** de cada propuesta, y solo
ahí: el WhatsApp de un negocio al que se le cotizó cinco veces estaba escrito
cinco veces, con cinco oportunidades de teclearlo distinto, y borrar la última
propuesta se llevaba por delante lo único que quedaba de él.

Ahora el cliente existe por su cuenta. De cada uno se guarda quién es (nombre,
RUC o cédula, si es empresa o persona), cómo se le escribe (contacto, cargo,
WhatsApp, teléfono, correo, y los correos y teléfonos **adicionales** que se
vayan sumando), dónde está, quién lo atiende y en qué punto está la relación:
prospecto, activo o inactivo.

Abrir una ficha responde de una vez lo que antes obligaba a mirar en dos sitios:
**cuánto se le ha propuesto, cuánto aceptó, cuánto está pendiente y cuánto se
perdió** —cada cifra en su par, lo de una vez y lo de cada mes, porque «este
cliente vale tanto» no se puede decir con un solo número sin mentir— y la lista
de sus propuestas con su estado.

### Cómo se reconoce a un cliente

El código `CLI-0001` **no** sirve para reconocerlo: cuando el cliente llega,
todavía no existe. Lo que reconoce es una escalera, y gana el primer peldaño que
dé respuesta:

| | Se compara | ¿Basta para unir solo? |
| --- | --- | --- |
| 1 | **RUC o cédula**, solo los dígitos | **Sí** |
| 2 | **Un documento parecido**: el mismo número con el DV pegado detrás | No, pregunta |
| 3 | **WhatsApp**, por los ocho dígitos del número nacional | No, pregunta |
| 4 | **Correo** en minúsculas, incluidos los adicionales de la ficha | No, pregunta |
| 5 | **Nombre del negocio**, sin tildes ni mayúsculas | No, pregunta |

El peldaño 3 es el que más trabaja en PanaClaw: casi todo entra por WhatsApp y
el RUC aparece al firmar, no al preguntar precios. Por eso `+507 6123-4567` y
`6123-4567` tienen que ser el mismo cliente, y lo son.

Lo único que se rechaza de plano es el **documento idéntico**: ése no es una
duda, es un choque, y el índice único de la base lo impide aunque el código se
olvidara de comprobarlo. El mensaje dice de quién es y con qué código, para que
quien lo escribió no se quede adivinando.

### Qué pasa al emitir

El cotizador pregunta para quién: se escriben tres letras en «Buscar en la
libreta», se elige, y los campos del cliente se llenan solos. **No es
obligatorio** —se puede seguir escribiendo a mano, que es lo que se hace en la
propuesta de afán— y al emitir ocurre una de tres:

| Situación | Qué pasa |
| --- | --- |
| Se eligió una ficha en el buscador | La propuesta se enlaza con ella. |
| No se eligió, pero el WhatsApp o el correo son de una ficha | Se enlaza y se dice cuál. |
| No se eligió y no hay nada parecido | Se **crea** la ficha con los datos de la propuesta. |

Y una cuarta, que es la interesante: **si lo único que coincide es el nombre, no
se enlaza**. «Distribuidora Central» hay varias, y una ficha que se atribuye
propuestas ajenas se equivoca en silencio para siempre. La propuesta sale igual,
se dice en pantalla, y se enlaza a mano desde el panel.

> **La ficha manda. La propuesta solo toma prestado.** Emitir puede crear una
> ficha que no existía —no hay nada que perder al llenar un hueco— pero **nunca
> cambia** una que ya está escrita. Si la propuesta trae un teléfono distinto al
> de la ficha, gana la ficha. Corregir un dato del cliente es un acto deliberado
> y se hace en el panel, no de paso con una propuesta a medio mandar.

Emitir y enlazar pueden fallar por separado, y es a propósito: el cliente está
esperando su propuesta, y una ficha sin enlazar se arregla en diez segundos
desde el panel; una propuesta que no salió, no.

### Borrar un cliente no borra sus propuestas

Es la promesa que hace que esto se pueda usar sin miedo. Y como en el historial,
se borra en dos tiempos: a la papelera primero y borrado de verdad después,
desde dentro de ella.

De la lista se puede bajar un archivo con **Exportar**, que se lleva todo lo que
cumple el filtro puesto —no la página que se está viendo— separado por punto y
coma y con marca de orden de bytes, que es lo que hace que Excel en español lo
abra en columnas y no estropee las tildes.

---

## Trabajar en él

```bash
npm install     # desde esta carpeta, o `npm run instalar` desde la raíz
npm run dev     # la pantalla, en :5173
npm test        # las reglas de precio, el PDF, el mensaje, el contrato y los libros
npm run tipos   # comprobación de tipos
```

`npm test` también corre `worker/libros.test.ts`: el código real del Worker (cobros,
gastos, cierre de mes, purga) contra una base SQLite de verdad con las migraciones
del repositorio aplicadas. D1 es SQLite, así que las consultas, los disparadores y
las llaves foráneas son las de producción; solo la envoltura de D1 es un adaptador.
Usa `node:sqlite`, que pide Node 22 o más.

La pantalla sola no tiene historial ni clientes: eso lo atiende el Worker. Desde
la raíz del repositorio, en otra terminal:

```bash
npm run dev     # el Worker, en :8787 — la pantalla le manda /api
```

Hace falta un `.dev.vars` en la raíz —que no se versiona— con `MODO=desarrollo`
y `CORREO_DESARROLLO=…`; está explicado en el [README de la
raíz](../README.md). Y la primera vez, `npm run migrar:local` para crear las
tablas de la base de pruebas.

Para revisar el diseño del PDF a ojo, que es lo único que detecta un bloque
descuadrado:

```bash
MUESTRA_PDF=1 npm test    # deja los PDF en muestras/
```

---

## El árbol

```
src/
  datos/        empresa.ts (de marca.json) · textos.ts (citas literales de catalogo/)
  dominio/      dinero · catalogo · propuesta · revision · formato
  pdf/          marca · documento · logo · propuestaPdf
  mensajes/     whatsapp
  api/          pedir · fallo — la única forma de hablar con el servidor
  historial/    contrato · almacen · almacenApi · almacenLocal · PantallaHistorial
  clientes/     almacen · exportar · PantallaClientes · FichaCliente · BuscadorCliente
  ui/           los paneles, el reductor y las salidas

../compartido/  el contrato con el Worker: propuestas · clientes · actividad
../worker/      quien lo cumple, en Cloudflare
```

`dominio/` es todo funciones puras y es donde viven las reglas de la marca. Se
prueba sin abrir un navegador, y es donde hay que mirar primero cuando una cifra
no cuadra. **El Worker importa de ahí**: los totales que guarda el historial los
calcula con `totalesDe`, la misma función que pinta la pantalla.

`historial/contrato.ts` es la interfaz `Almacen`, y detrás hay dos: el servidor
(`almacenApi`) y el navegador (`almacenLocal`, solo para la vista previa sin
servidor). La pantalla llama a `almacen.registrar(...)` y no sabe cuál hay
detrás; el día que convenga mudarse de Cloudflare, se escribe otra
implementación y el resto de la aplicación no se entera.

---

## Lo que NO hace

- **No factura.** Saca una propuesta, no un documento fiscal.
- **No cobra.** No hay pasarela de pago ni enlace de cobro. Sí **registra** lo que el cliente ya pagó (ver «Los cobros») y lleva una contabilidad ligera de caja (ver «La contabilidad ligera»).
- **No es contabilidad devengada ni declara impuestos.** No emite factura fiscal ni lleva plan de cuentas; eso lo hace la contadora.
- **No manda correos.** Sale por WhatsApp o como archivo, y lo manda una persona.
- **No inventa un plan.** Si el caso no encaja en ninguno, eso lo decide quien
  vende, y la respuesta oficial de la marca es decirlo.
- **No carga clientes desde un archivo.** La libreta se llena sola al emitir, o
  a mano con «Cliente nuevo». Subir una hoja de cálculo con doscientos contactos
  de golpe todavía no está: es una operación que se equivoca en grande y en
  silencio, y necesita su propia pantalla de revisión antes de escribir nada.
- **No fusiona dos fichas.** Si acaban existiendo dos del mismo cliente, se
  corrige a mano: se enlazan sus propuestas a la que se quede y la otra se manda
  a la papelera. Unir dos fichas de un clic es de las pocas cosas que no se
  deshacen.
