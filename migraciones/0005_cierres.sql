-- El cierre de mes.
--
-- Cuando un mes se cierra, en él no se registra ni se corrige nada: ni cobros ni
-- gastos. Es lo que hace D'Casa con la fecha de bloqueo de Odoo, y por lo mismo:
-- un reporte que se mandó a la contadora no puede cambiar debajo de ella.
--
-- Es un historial y no una bandera. Un mes se cierra y se reabre, y cada vez
-- queda escrito quién, cuándo y —al reabrir— por qué. El mes está cerrado si su
-- último asiento es `cerrar`. Dos disparadores impiden editar o eliminar el
-- historial, para que el rastro de quién reabrió un mes no se pueda borrar.
--
-- Al cerrar se guarda también una FOTO del resumen (`resumen`, en JSON): lo que
-- el mes decía el día que se cerró. Con los libros bloqueados no debería cambiar,
-- y si alguna vez no coincide con lo que se calcula hoy, esa diferencia es lo
-- primero que hay que mirar.

CREATE TABLE cierres_mes (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  -- `2026-11`.
  mes     TEXT NOT NULL CHECK (mes GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]'),
  accion  TEXT NOT NULL CHECK (accion IN ('cerrar', 'reabrir')),
  -- Obligatorio al reabrir; en un cierre puede ir vacío.
  motivo  TEXT NOT NULL DEFAULT '',
  -- La foto del resumen. Solo en los cierres.
  resumen TEXT,
  -- Del token de Cloudflare Access, nunca del cuerpo de la petición.
  por     TEXT NOT NULL,
  en      TEXT NOT NULL,

  CHECK (accion = 'cerrar' OR motivo <> '')
);

CREATE INDEX cierres_mes_por_mes ON cierres_mes (mes, id);

CREATE TRIGGER cierres_no_se_editan
BEFORE UPDATE ON cierres_mes
BEGIN
  SELECT RAISE(ABORT, 'El historial de cierres no se edita.');
END;

CREATE TRIGGER cierres_no_se_eliminan
BEFORE DELETE ON cierres_mes
BEGIN
  SELECT RAISE(ABORT, 'El historial de cierres no se elimina.');
END;
