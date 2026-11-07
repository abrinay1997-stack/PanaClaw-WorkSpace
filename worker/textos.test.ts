/**
 * La plantilla de textos contra una base de verdad: el historial que no se edita,
 * lo que el servidor rechaza y lo que no deja emitir.
 */

import { beforeEach, describe, expect, it } from 'vitest';

import { itemDe } from '../cotizador/src/dominio/catalogo';
import { lineaDesde } from '../cotizador/src/dominio/propuesta';
import { definicion } from '../cotizador/src/dominio/textos';
import * as propuestas from './propuestas';
import { baseNueva, peticion } from './pruebas/d1';
import * as plantilla from './textos';

let db: ReturnType<typeof baseNueva>['db'];
let base: D1Database;

beforeEach(() => {
  ({ db, base } = baseNueva());
});

const NUEVO = '{plan} incluye {rondas} {rondasPalabra} de cambios; cada ronda adicional se cotiza en {extra}.';

describe('la plantilla de textos del equipo', () => {
  it('empieza vacía: todo vale su original', async () => {
    expect(await plantilla.listar(base)).toEqual({ textos: {}, ediciones: [] });
  });

  it('guarda un texto y dice quién y cuándo', async () => {
    const r = await plantilla.guardar(base, 'cambiosConRondas', peticion({ texto: NUEVO }), 'ana@panaclaw.com');
    expect(r.textos.cambiosConRondas).toBe(NUEVO);
    expect(r.ediciones).toHaveLength(1);
    expect(r.ediciones[0]).toMatchObject({ clave: 'cambiosConRondas', por: 'ana@panaclaw.com' });
  });

  it('el último asiento manda, y el historial conserva los anteriores', async () => {
    await plantilla.guardar(base, 'condCodigo', peticion({ texto: 'Primera versión.' }), 'a@x.com');
    await plantilla.guardar(base, 'condCodigo', peticion({ texto: 'Segunda versión.' }), 'b@x.com');
    expect((await plantilla.listar(base)).textos.condCodigo).toBe('Segunda versión.');
    expect(db.prepare('SELECT COUNT(*) AS n FROM textos_plantilla').get()).toEqual({ n: 2 });
  });

  it('guardar dos veces lo mismo no llena el historial de asientos iguales', async () => {
    await plantilla.guardar(base, 'condCodigo', peticion({ texto: 'Igual.' }), 'a@x.com');
    await plantilla.guardar(base, 'condCodigo', peticion({ texto: 'Igual.' }), 'a@x.com');
    expect(db.prepare('SELECT COUNT(*) AS n FROM textos_plantilla').get()).toEqual({ n: 1 });
  });

  it('restaurar es otro asiento con el texto vacío, y deja de aparecer como editado', async () => {
    await plantilla.guardar(base, 'condCodigo', peticion({ texto: 'Mi versión.' }), 'a@x.com');
    const r = await plantilla.guardar(base, 'condCodigo', peticion({ texto: '' }), 'a@x.com');
    expect(r.textos.condCodigo).toBeUndefined();
    expect(r.ediciones).toEqual([]);
    expect(db.prepare('SELECT COUNT(*) AS n FROM textos_plantilla').get()).toEqual({ n: 2 });
  });

  it('restaurar lo que nunca se editó no escribe nada', async () => {
    await plantilla.guardar(base, 'condCodigo', peticion({ texto: '' }), 'a@x.com');
    expect(db.prepare('SELECT COUNT(*) AS n FROM textos_plantilla').get()).toEqual({ n: 0 });
  });

  it('rechaza lo que la pantalla ya rechaza: un importe a mano, una variable inventada, una clave que no existe', async () => {
    await expect(
      plantilla.guardar(base, 'cambiosConRondas', peticion({ texto: 'La ronda extra cuesta $40.' }), 'a@x.com'),
    ).rejects.toThrow(/importe a mano/);
    await expect(
      plantilla.guardar(base, 'cambiosConRondas', peticion({ texto: 'Cuesta {inventada}' }), 'a@x.com'),
    ).rejects.toThrow(/no existe en este texto/);
    await expect(plantilla.guardar(base, 'nada', peticion({ texto: 'hola' }), 'a@x.com')).rejects.toMatchObject({ http: 404 });
    await expect(plantilla.guardar(base, 'condCodigo', peticion({}), 'a@x.com')).rejects.toThrow(/Falta el texto/);
  });

  it('la base impide editar o eliminar un asiento aunque alguien se salte el código', async () => {
    await plantilla.guardar(base, 'condCodigo', peticion({ texto: 'Mi versión.' }), 'a@x.com');
    expect(() => db.exec("UPDATE textos_plantilla SET texto = 'otra'")).toThrow(/no se edita/);
    expect(() => db.exec('DELETE FROM textos_plantilla')).toThrow(/no se elimina/);
  });

  it('no sirve un texto guardado que el código de hoy ya no sabría rellenar', async () => {
    // Un asiento viejo, escrito antes de que una variable dejara de existir.
    db.prepare("INSERT INTO textos_plantilla (clave, texto, por, en) VALUES ('cambiosSinRondas', 'Cuesta {ya_no_existe}', 'a@x.com', 'x')").run();
    expect((await plantilla.listar(base)).textos.cambiosSinRondas).toBeUndefined();
  });
});

describe('un documento emitido con textos editados', () => {
  const documento = (textos?: unknown) => ({
    numero: '',
    fecha: '2026-11-07',
    asesor: 'Ana',
    necesita: '',
    catalogoVersion: 'prueba',
    cliente: { negocio: 'Cliente de prueba', contacto: '', whatsapp: '', correo: 'c@x.com', ciudad: '' },
    lineas: [lineaDesde(itemDe('web-start')!, 'l1')],
    condiciones: { validezDias: 15, noIncluyeExtra: [], observaciones: '' },
    ...(textos === undefined ? {} : { textos }),
  });

  it('guarda los textos dentro del documento, para regenerar el mismo PDF', async () => {
    const textos = { cambiosSinRondas: definicion('cambiosSinRondas')!.defecto, condCodigo: 'El código es tuyo al pagar el resto.' };
    const { numero } = await propuestas.registrar(base, peticion(documento(textos)), 'ana@panaclaw.com', null);
    const guardada = await propuestas.abrir(base, numero);
    expect(guardada.documento.textos).toEqual(textos);
  });

  it('rechaza textos con una clave inventada, un importe a mano o una forma rara', async () => {
    const intentar = (textos: unknown) => propuestas.registrar(base, peticion(documento(textos)), 'a@x.com', null);
    await expect(intentar({ inventada: 'hola' })).rejects.toThrow(/no existe/);
    await expect(intentar({ cambiosSinRondas: 'Cuesta $40' })).rejects.toThrow(/importe a mano/);
    await expect(intentar({ cambiosSinRondas: 'Cuesta {extra} y {nada}' })).rejects.toThrow(/no es válido/);
    await expect(intentar(['a'])).rejects.toThrow(/forma esperada/);
    await expect(intentar({ condCodigo: 7 })).rejects.toThrow(/no existe/);
  });

  it('un documento sin textos (de antes de esta función, o sin editar) se sigue aceptando', async () => {
    await expect(propuestas.registrar(base, peticion(documento()), 'a@x.com', null)).resolves.toMatchObject({ numero: expect.any(String) });
  });
});
