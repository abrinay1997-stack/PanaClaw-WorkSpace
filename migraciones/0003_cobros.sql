-- El libro de cobros.
--
-- Lo que un cliente va pagando de una propuesta aceptada. Es un LIBRO, no una
-- columna: el saldo se calcula sumando sus filas y no se guarda en ningún sitio.
-- Una columna `saldo` o `pagado` en `propuestas` es la forma más barata de que
-- la base diga una cosa y los cobros otra.
--
-- Igual que el libro de D'Casa, lo escrito no se edita ni se elimina. Un cobro
-- mal puesto se corrige con un asiento contrario (negativo, con motivo y
-- apuntando al que corrige), y los dos quedan a la vista. Dos disparadores lo
-- imponen en la base, para que no dependa de que cada consulta futura se
-- acuerde.
--
-- No hay una columna de total, y es a propósito (regla 2 de la marca): lo cobrado
-- es siempre de un solo bloque, el pago único. Lo mensual no pasa por aquí.
--
-- Centavos enteros, como en `propuestas`: la suma de un libro tiene que dar
-- exactamente lo que da la suma de sus filas.

CREATE TABLE cobros (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  propuesta      TEXT    NOT NULL REFERENCES propuestas (numero),

  -- Fecha en que el dinero entró (la que dice el comprobante), no la de hoy.
  fecha          TEXT    NOT NULL,
  -- Positivo es un cobro; negativo es la corrección de otro.
  centavos       INTEGER NOT NULL CHECK (centavos <> 0),
  metodo         TEXT    NOT NULL
                   CHECK (metodo IN ('yappy', 'transferencia', 'efectivo', 'tarjeta', 'cheque', 'otro')),
  -- Número de comprobante, de transferencia o de Yappy.
  referencia     TEXT    NOT NULL DEFAULT '',
  nota           TEXT    NOT NULL DEFAULT '',

  -- Solo en las correcciones: cuál corrigen y por qué.
  corrige_a      INTEGER REFERENCES cobros (id),
  motivo         TEXT    NOT NULL DEFAULT '',

  -- Del token de Cloudflare Access, nunca del cuerpo de la petición.
  registrado_por TEXT    NOT NULL,
  registrado_en  TEXT    NOT NULL
);

CREATE INDEX cobros_por_propuesta ON cobros (propuesta, fecha, id);
-- Un cobro se corrige una sola vez: para volver a cobrar, se registra otro.
CREATE UNIQUE INDEX cobros_una_correccion ON cobros (corrige_a) WHERE corrige_a IS NOT NULL;

CREATE TRIGGER cobros_no_se_editan
BEFORE UPDATE ON cobros
BEGIN
  SELECT RAISE(ABORT, 'El libro de cobros no se edita: se corrige con un asiento contrario.');
END;

CREATE TRIGGER cobros_no_se_eliminan
BEFORE DELETE ON cobros
BEGIN
  SELECT RAISE(ABORT, 'El libro de cobros no se elimina: se corrige con un asiento contrario.');
END;
