-- La libreta de clientes.
--
-- Hasta ahora los datos de un cliente vivían **dentro** de cada propuesta, y
-- solo ahí: el WhatsApp de un negocio al que se le cotizó cinco veces estaba
-- escrito cinco veces, con cinco oportunidades de teclearlo distinto, y borrar
-- la última propuesta se llevaba por delante lo único que quedaba de él.
--
-- Esta tabla invierte la relación: el cliente pasa a existir por su cuenta y la
-- propuesta lo referencia (`propuestas.cliente_codigo`). Lo que se guarda
-- dentro del documento de cada propuesta **no cambia** —el PDF que el cliente
-- tiene en la mano dice el nombre que decía ese día— pero deja de ser el único
-- sitio donde vive el dato.
--
-- La regla que gobierna todo lo demás: **la ficha manda y la propuesta toma
-- prestado**. Ningún dato de aquí se pisa desde una propuesta.

CREATE TABLE clientes (
  -- `CLI-0001`. Lo asigna el servidor. No sirve para reconocer a un cliente
  -- que llega —cuando llega, todavía no tiene código— sino para nombrarlo y
  -- enlazarlo una vez existe.
  codigo            TEXT PRIMARY KEY,

  negocio           TEXT NOT NULL,
  -- RUC o cédula, tal como se tecleó, con sus guiones.
  documento         TEXT NOT NULL DEFAULT '',
  -- El documento en solo dígitos. Es la columna con la que se compara: para la
  -- base, `155-2148-99` y `155214899` tienen que ser el mismo cliente.
  documento_digitos TEXT NOT NULL DEFAULT '',
  tipo              TEXT NOT NULL DEFAULT 'empresa'
                      CHECK (tipo IN ('empresa', 'persona')),

  contacto          TEXT NOT NULL DEFAULT '',
  cargo             TEXT NOT NULL DEFAULT '',
  whatsapp          TEXT NOT NULL DEFAULT '',
  -- Los ocho dígitos del número nacional, sin el `+507`. Es el segundo peldaño
  -- para reconocer a un cliente, y en PanaClaw el más usado: casi todo entra
  -- por WhatsApp y el RUC aparece al firmar, no al preguntar precios.
  whatsapp_normal   TEXT NOT NULL DEFAULT '',
  telefono          TEXT NOT NULL DEFAULT '',
  correo            TEXT NOT NULL DEFAULT '',
  correo_normal     TEXT NOT NULL DEFAULT '',

  -- Los correos y teléfonos que se fueron sumando, como listas JSON.
  --
  -- Van como JSON y no como tabla aparte porque son listas cortas que siempre
  -- se leen enteras junto al cliente, nunca por su cuenta. El día que haya que
  -- buscar por ellas o darles nombre propio, se normalizan.
  correos_extra     TEXT NOT NULL DEFAULT '[]',
  telefonos_extra   TEXT NOT NULL DEFAULT '[]',

  ciudad            TEXT NOT NULL DEFAULT '',
  direccion         TEXT NOT NULL DEFAULT '',
  notas             TEXT NOT NULL DEFAULT '',

  asesor            TEXT NOT NULL DEFAULT '',

  estado            TEXT NOT NULL DEFAULT 'prospecto'
                      CHECK (estado IN ('prospecto', 'activo', 'inactivo')),

  -- El nombre sin tildes ni mayúsculas. Peldaño de reconocimiento, y de paso el
  -- orden alfabético del listado: ordenar por `negocio` a secas pondría «Ávila»
  -- detrás de «Zapata».
  negocio_normal    TEXT NOT NULL DEFAULT '',

  creado_en         TEXT NOT NULL,
  actualizado_en    TEXT NOT NULL,

  -- La papelera, igual que en propuestas y por lo mismo. Borrar un cliente
  -- **no borra sus propuestas**; son cosas distintas.
  eliminado_en      TEXT,
  eliminado_por     TEXT
);

-- Dos clientes con el mismo documento son el mismo cliente, y la base lo impone
-- en vez de confiar en que el código se acuerde de comprobarlo. Es parcial
-- —solo donde hay documento— porque los prospectos que aún no lo han dado son
-- legítimos y son la mayoría.
--
-- El índice alcanza también a los de la papelera, a propósito: dar de alta a
-- alguien que está retirado tiene que decir «está en la papelera» y ofrecer
-- restaurarlo, no crear un segundo con el mismo RUC.
CREATE UNIQUE INDEX clientes_documento
  ON clientes (documento_digitos) WHERE documento_digitos <> '';

CREATE INDEX clientes_whatsapp ON clientes (whatsapp_normal) WHERE whatsapp_normal <> '';
CREATE INDEX clientes_correo ON clientes (correo_normal) WHERE correo_normal <> '';
-- El listado se abre en orden alfabético, y la papelera es la otra mitad de
-- todas sus consultas.
CREATE INDEX clientes_papelera ON clientes (eliminado_en, negocio_normal);

-- Contadores con nombre, para lo que necesite numerarse y no dependa del año.
--
-- `consecutivos` no vale: aquélla es «un contador por año» y su clave es el
-- año, porque la numeración de propuestas se reinicia cada enero. Los códigos
-- de cliente no se reinician nunca —`CLI-0500` es el quinientos de siempre, no
-- el quinientos de 2027— así que es otro contador, no otra fila de aquél.
CREATE TABLE contadores (
  nombre TEXT PRIMARY KEY,
  valor  INTEGER NOT NULL
);
