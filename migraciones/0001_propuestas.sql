-- El historial de propuestas.
--
-- `documento` es el JSON completo tal como lo arma el cotizador, y es la fuente
-- de verdad: de ahí se regenera el PDF idéntico al que recibió el cliente. Las
-- demás columnas son copias planas de datos que ya están dentro del JSON, y
-- existen solo para poder listar, buscar y filtrar sin abrirlo.
--
-- Esas copias las calcula el Worker con las mismas funciones puras que usa la
-- pantalla (`cotizador/src/dominio/propuesta.ts`), no el navegador que envía:
-- así el total del listado no puede discrepar del total del PDF.
--
-- ---------------------------------------------------------------------------
-- POR QUÉ NO HAY UNA COLUMNA `total`
--
-- Es la regla 2 de la marca, escrita en el esquema. Un importe de pago único y
-- uno mensual nunca se suman, y una columna llamada `total` es el sitio más
-- barato del mundo para sumarlos: nadie mira una base de datos, y en cuanto la
-- columna existe cualquier consulta futura la usa sin preguntar de qué está
-- hecha. Aquí hay cuatro columnas de dinero y ninguna es la suma de otras dos.
--
-- POR QUÉ CADA IMPORTE SON DOS COLUMNAS
--
-- PanaClaw publica precios con rango ($80–$150) y `datos/precios.json` obliga a
-- citarlos enteros. Un rango que se guarda como un solo número obliga a elegir
-- un extremo al guardarlo, y ese extremo acaba impreso en algún sitio como si
-- fuera el precio. Se guardan los dos: `min` y `max`. Un precio cerrado es el
-- rango donde los dos coinciden.
--
-- POR QUÉ EN CENTAVOS
--
-- Enteros, no decimales. La suma de un listado entero tiene que dar exactamente
-- lo mismo que la suma de sus filas, y con coma flotante no da.
-- ---------------------------------------------------------------------------

CREATE TABLE propuestas (
  numero            TEXT PRIMARY KEY,

  -- Fecha del documento, la que se imprime. La pone quien cotiza y puede no
  -- ser la de hoy.
  fecha             TEXT NOT NULL,
  -- Instante real de emisión. Es el que ordena el historial: la fecha del
  -- documento se puede retocar, ésta no.
  emitida_en        TEXT NOT NULL,
  -- Correo de quien emitió, tomado del token de Cloudflare Access. No se
  -- acepta del navegador.
  autor             TEXT NOT NULL,
  -- Nombre que firma la propuesta, del propio documento. Puede no coincidir
  -- con `autor`.
  asesor            TEXT NOT NULL DEFAULT '',

  -- La ficha del cliente a la que pertenece. Puede faltar: una propuesta que
  -- no se pudo enlazar sin suponer se guarda igual, y el enlace se hace a mano
  -- desde el panel. Enlazar mal es peor que no enlazar.
  cliente_codigo    TEXT,

  negocio           TEXT NOT NULL DEFAULT '',
  contacto          TEXT NOT NULL DEFAULT '',
  correo            TEXT NOT NULL DEFAULT '',
  -- El correo en minúsculas y el WhatsApp en sus ocho dígitos nacionales: son
  -- las columnas con las que se compara. Para la base, `+507 6123-4567` y
  -- `61234567` tienen que ser el mismo teléfono.
  correo_normal     TEXT NOT NULL DEFAULT '',
  whatsapp          TEXT NOT NULL DEFAULT '',
  whatsapp_normal   TEXT NOT NULL DEFAULT '',

  -- Los dos totales, cada uno con su rango, en centavos.
  unico_min         INTEGER NOT NULL DEFAULT 0,
  unico_max         INTEGER NOT NULL DEFAULT 0,
  mensual_min       INTEGER NOT NULL DEFAULT 0,
  mensual_max       INTEGER NOT NULL DEFAULT 0,

  lineas            INTEGER NOT NULL DEFAULT 0,

  estado            TEXT NOT NULL DEFAULT 'emitida'
                      CHECK (estado IN ('emitida', 'aceptada', 'perdida')),
  estado_nota       TEXT NOT NULL DEFAULT '',
  estado_en         TEXT,
  estado_por        TEXT,

  -- Versión de `datos/precios.json` con la que se calculó. Sirve para explicar
  -- por qué una propuesta vieja dice otra cifra que la de hoy.
  catalogo_version  TEXT NOT NULL DEFAULT '',
  documento         TEXT NOT NULL,

  -- La papelera. Se borra en dos tiempos, y no en uno, por lo que cuesta cada
  -- error: mandar a la papelera es reversible y borrar de verdad no lo es.
  eliminada_en      TEXT,
  -- Correo de quien la retiró, del token de Access. Borrar sin dejar
  -- constancia de quién borró convierte un descuido en un misterio.
  eliminada_por     TEXT
);

-- El historial se abre siempre por lo último emitido, y la papelera es la otra
-- mitad de todas sus consultas.
CREATE INDEX propuestas_papelera ON propuestas (eliminada_en, emitida_en DESC);
-- «Qué le hemos propuesto a este cliente» es la segunda pregunta que se hace.
CREATE INDEX propuestas_por_cliente ON propuestas (cliente_codigo, emitida_en DESC);
CREATE INDEX propuestas_por_estado ON propuestas (estado);

-- Consecutivo central, un contador por año.
--
-- Reemplaza al que vivía en el `localStorage` de cada navegador: con dos
-- personas cotizando el mismo día, aquel repetía números sin que nadie se
-- enterara hasta que dos clientes tenían la misma «PROP-2026-0007».
CREATE TABLE consecutivos (
  anio  TEXT PRIMARY KEY,
  valor INTEGER NOT NULL
);
