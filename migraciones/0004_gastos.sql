-- El libro de gastos.
--
-- Lo que PanaClaw paga: servidores y dominios, herramientas, publicidad,
-- honorarios de terceros, impuestos. Es el otro lado del libro de cobros
-- (`0003_cobros.sql`) y se rige por las mismas reglas, las del libro de D'Casa:
--
--   · Lo escrito no se edita ni se elimina. Dos disparadores lo imponen aquí, en
--     la base, para que no dependa de que cada consulta futura se acuerde.
--   · Un gasto mal puesto se corrige con un asiento contrario (negativo, con
--     motivo y apuntando al que corrige). Se corrige una sola vez.
--   · No hay una columna de saldo ni de total: todo se calcula sumando filas.
--
-- Centavos enteros, igual que en `propuestas` y `cobros`.
--
-- POR QUÉ EL ITBMS VA EN SU PROPIA COLUMNA
--
-- `centavos` es el importe SIN impuesto y `itbms_centavos` es el ITBMS que la
-- factura del proveedor trae aparte. Separados porque el impuesto pagado en un
-- gasto se descuenta del cobrado a los clientes, y el gasto de verdad —lo que
-- cuesta el negocio— es el importe sin él. Mezclarlos en una sola cifra obliga a
-- deshacer la mezcla cada vez que se mira un reporte.

CREATE TABLE gastos (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Fecha de la factura o del pago, la que dice el comprobante.
  fecha          TEXT    NOT NULL,
  -- Importe sin ITBMS. Positivo es un gasto; negativo, la corrección de otro.
  centavos       INTEGER NOT NULL CHECK (centavos <> 0),
  -- ITBMS de la factura del proveedor. Mismo signo que `centavos`, o cero.
  itbms_centavos INTEGER NOT NULL DEFAULT 0,
  categoria      TEXT    NOT NULL
                   CHECK (categoria IN ('servidores', 'herramientas', 'publicidad', 'terceros', 'impuestos', 'otros')),
  proveedor      TEXT    NOT NULL,
  -- Número de factura o de comprobante.
  referencia     TEXT    NOT NULL DEFAULT '',
  nota           TEXT    NOT NULL DEFAULT '',

  -- Solo en las correcciones: cuál corrigen y por qué.
  corrige_a      INTEGER REFERENCES gastos (id),
  motivo         TEXT    NOT NULL DEFAULT '',

  -- Del token de Cloudflare Access, nunca del cuerpo de la petición.
  registrado_por TEXT    NOT NULL,
  registrado_en  TEXT    NOT NULL,

  CHECK ((centavos > 0 AND itbms_centavos >= 0) OR (centavos < 0 AND itbms_centavos <= 0))
);

CREATE INDEX gastos_por_fecha ON gastos (fecha, id);
-- Un gasto se corrige una sola vez: para volver a registrarlo, se escribe otro.
CREATE UNIQUE INDEX gastos_una_correccion ON gastos (corrige_a) WHERE corrige_a IS NOT NULL;

CREATE TRIGGER gastos_no_se_editan
BEFORE UPDATE ON gastos
BEGIN
  SELECT RAISE(ABORT, 'El libro de gastos no se edita: se corrige con un asiento contrario.');
END;

CREATE TRIGGER gastos_no_se_eliminan
BEFORE DELETE ON gastos
BEGIN
  SELECT RAISE(ABORT, 'El libro de gastos no se elimina: se corrige con un asiento contrario.');
END;
