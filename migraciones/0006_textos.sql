-- La plantilla de textos del equipo.
--
-- Los textos del PDF y del mensaje —condiciones, plazos, rondas de cambios, la
-- lista de «Qué NO incluye»— tienen un original en `cotizador/src/datos/textos.ts`
-- y se pueden reescribir desde la pantalla «Textos». Lo reescrito vive aquí y vale
-- para todas las propuestas NUEVAS; el original nunca se toca ni se pierde.
--
-- Es un historial y no una tabla de valores, con la misma regla de los libros de
-- cobros, gastos y cierres: lo escrito no se edita ni se elimina. Cada cambio es un
-- asiento nuevo con quién y cuándo, y «restaurar el original» es otro asiento con
-- el texto vacío. El texto vigente de una clave es el de su último asiento.
--
-- ESTO NO CAMBIA LOS DOCUMENTOS YA EMITIDOS. Al emitir, la propuesta guarda dentro
-- de su propio JSON todos los textos tal como valían ese día (`documento.textos`),
-- y de ahí se regenera el PDF. Editar la plantilla mañana no mueve una coma del
-- PDF que el cliente ya tiene en la mano.
--
-- Qué se puede escribir lo decide el código (`validarTexto`), no esta tabla: ni
-- cifras tecleadas a mano ni variables que no existan. Aquí solo hay una barrera
-- de largo, por si algo se salta la pantalla.

CREATE TABLE textos_plantilla (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  -- `cambiosConRondas`, `noInc.web.1`, `item.web-start`…
  clave TEXT NOT NULL CHECK (length(clave) BETWEEN 1 AND 80),
  -- Vacío = se volvió al original.
  texto TEXT NOT NULL CHECK (length(texto) <= 800),
  -- Del token de Cloudflare Access, nunca del cuerpo de la petición.
  por   TEXT NOT NULL,
  en    TEXT NOT NULL
);

CREATE INDEX textos_plantilla_por_clave ON textos_plantilla (clave, id);

CREATE TRIGGER textos_no_se_editan
BEFORE UPDATE ON textos_plantilla
BEGIN
  SELECT RAISE(ABORT, 'El historial de textos no se edita: cada cambio es un asiento nuevo.');
END;

CREATE TRIGGER textos_no_se_eliminan
BEFORE DELETE ON textos_plantilla
BEGIN
  SELECT RAISE(ABORT, 'El historial de textos no se elimina: restaurar es otro asiento.');
END;
