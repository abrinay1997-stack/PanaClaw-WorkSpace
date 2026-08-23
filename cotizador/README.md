# Cotizador · PanaClaw

Arma la propuesta de un cliente concreto, saca el PDF que se le manda y el
mensaje de WhatsApp que lo acompaña, y guarda lo emitido.

Vive dentro del hub y se sirve en `/cotizador/`. Se abre desde la portada.

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

## El historial vive en este navegador

Cada persona ve lo que ella misma emitió y el consecutivo lo lleva su propio
equipo. Con una persona cotizando funciona; con dos, cada navegador tiene su
contador y dos clientes distintos pueden recibir el mismo `PROP-2026-0007`.

Está elegido a sabiendas y **se dice en pantalla**, que es la diferencia entre
una limitación y una trampa.

Cuando haga falta compartirlo, lo que cambia es quién implementa `Almacen`
(`src/historial/contrato.ts`) —una función de servidor con un almacén detrás— y
no la pantalla. Por eso el contrato está en su propio archivo desde el principio.

---

## Trabajar en él

```bash
npm install     # desde esta carpeta, o `npm run instalar` desde la raíz
npm run dev     # la pantalla, en :5173
npm test        # las reglas de precio, el PDF y el mensaje
npm run tipos   # comprobación de tipos
```

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
  historial/    contrato · almacenLocal · PantallaHistorial
  ui/           los paneles, el reductor y las salidas
```

`dominio/` es todo funciones puras y es donde viven las reglas de la marca. Se
prueba sin abrir un navegador, y es donde hay que mirar primero cuando una cifra
no cuadra.

---

## Lo que NO hace

- **No factura.** Saca una propuesta, no un documento fiscal.
- **No cobra.** No hay pasarela de pago ni enlace de cobro.
- **No manda correos.** Sale por WhatsApp o como archivo, y lo manda una persona.
- **No inventa un plan.** Si el caso no encaja en ninguno, eso lo decide quien
  vende, y la respuesta oficial de la marca es decirlo.
