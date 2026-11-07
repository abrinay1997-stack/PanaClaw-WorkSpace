/**
 * El código REAL del Worker —cobros, gastos, cierre de mes, purga— contra una
 * base SQLite de verdad con las migraciones del repositorio aplicadas.
 *
 * No es un simulacro de D1: las consultas, los disparadores, las restricciones y
 * las llaves foráneas son las que corren en producción (D1 es SQLite). Solo la
 * envoltura `prepare/bind/all/first/run` es un adaptador mínimo. Por eso estas
 * pruebas encuentran lo que las de funciones puras no pueden: una consulta con
 * una coma de menos, un disparador que no dispara, un mes cerrado que se deja
 * escribir por un camino que nadie recordó cerrar.
 */

import { beforeEach, describe, expect, it } from 'vitest';

import { itemDe } from '../cotizador/src/dominio/catalogo';
import { lineaDesde } from '../cotizador/src/dominio/propuesta';
import * as cobros from './cobros';
import * as contable from './contabilidad';
import * as propuestas from './propuestas';
import { baseNueva, peticion } from './pruebas/d1';

let db: ReturnType<typeof baseNueva>['db'];
let base: D1Database;

beforeEach(() => {
  ({ db, base } = baseNueva());
});

/** Una propuesta de un plan Start ($295 + 7 % = $315.65). */
function propuesta(numero: string, estado = 'aceptada', cambios: Record<string, unknown> = {}): void {
  const item = itemDe('web-start')!;
  const documento = { lineas: [lineaDesde(item, 'l1')] };
  db.prepare(
    `INSERT INTO propuestas (numero, fecha, emitida_en, autor, negocio, estado, estado_en, documento, eliminada_en)
     VALUES (?, '2026-10-01', '2026-10-01T10:00:00Z', 'ana@panaclaw.com', ?, ?, '2026-10-01T10:00:00Z', ?, ?)`,
  ).run(numero, (cambios.negocio as string) ?? 'Negocio de prueba', estado, JSON.stringify(documento), (cambios.eliminada_en as string) ?? null);
}

const DEBIDO = 31565;
const ANTICIPO = 15783;

describe('cobros contra la base real', () => {
  it('lo debido es el pago único con ITBMS, y se parte en dos etapas que suman exactamente eso', async () => {
    propuesta('P-1');
    const libro = await cobros.listar(base, 'P-1');
    expect(libro.resumen.debidoCentavos).toBe(DEBIDO);
    expect(libro.hitos?.map((h) => h.centavos)).toEqual([ANTICIPO, DEBIDO - ANTICIPO]);
    expect(libro.hitos!.reduce((s, h) => s + h.centavos, 0)).toBe(DEBIDO);
  });

  it('cobrar el anticipo cubre la primera etapa y deja la segunda pendiente', async () => {
    propuesta('P-1');
    const libro = await cobros.registrar(base, 'P-1', peticion({ centavos: ANTICIPO, metodo: 'yappy', fecha: '2026-10-05' }), 'ana@panaclaw.com');
    expect(libro.hitos?.map((h) => h.cubierto)).toEqual([true, false]);
    expect(libro.resumen.pendienteCentavos).toBe(DEBIDO - ANTICIPO);
  });

  it('no deja cobrar de más ni cobrar lo que no está aceptado', async () => {
    propuesta('P-1');
    propuesta('P-2', 'emitida');
    await expect(
      cobros.registrar(base, 'P-1', peticion({ centavos: DEBIDO + 1, metodo: 'yappy', fecha: '2026-10-05' }), 'a@x.com'),
    ).rejects.toThrow(/mayor que lo que falta/);
    await expect(
      cobros.registrar(base, 'P-2', peticion({ centavos: 100, metodo: 'yappy', fecha: '2026-10-05' }), 'a@x.com'),
    ).rejects.toThrow(/aceptadas/);
  });

  it('corregir añade un asiento contrario, una sola vez, y el original sigue en el libro', async () => {
    propuesta('P-1');
    await cobros.registrar(base, 'P-1', peticion({ centavos: ANTICIPO, metodo: 'yappy', fecha: '2026-10-05' }), 'a@x.com');
    await expect(cobros.corregir(base, 'P-1', 1, peticion({ motivo: '' }), 'a@x.com')).rejects.toThrow(/motivo/);

    const libro = await cobros.corregir(base, 'P-1', 1, peticion({ motivo: 'Se tecleó mal' }), 'a@x.com');
    expect(libro.cobros).toHaveLength(2);
    expect(libro.resumen.cobradoCentavos).toBe(0);
    await expect(cobros.corregir(base, 'P-1', 1, peticion({ motivo: 'otra vez' }), 'a@x.com')).rejects.toThrow(/ya fue corregido/);
  });

  it('la base impide editar o eliminar un asiento aunque alguien se salte el código', async () => {
    propuesta('P-1');
    await cobros.registrar(base, 'P-1', peticion({ centavos: 1000, metodo: 'yappy', fecha: '2026-10-05' }), 'a@x.com');
    expect(() => db.exec('UPDATE cobros SET centavos = 1 WHERE id = 1')).toThrow(/no se edita/);
    expect(() => db.exec('DELETE FROM cobros WHERE id = 1')).toThrow(/no se elimina/);
  });
});

describe('purgar la papelera', () => {
  it('no se lleva una propuesta que ya tiene cobros, y sí la que no', async () => {
    propuesta('CON', 'aceptada', { eliminada_en: '2026-10-10T00:00:00Z' });
    propuesta('SIN', 'aceptada', { eliminada_en: '2026-10-10T00:00:00Z' });
    // El cobro entra antes de que la propuesta se mande a la papelera.
    db.prepare(
      `INSERT INTO cobros (propuesta, fecha, centavos, metodo, registrado_por, registrado_en)
       VALUES ('CON', '2026-10-05', 1000, 'yappy', 'a@x.com', '2026-10-05T00:00:00Z')`,
    ).run();

    const r = await propuestas.purgar(base, { numeros: ['CON', 'SIN'] });
    expect(r.cuantas).toBe(1);
    expect(db.prepare('SELECT numero FROM propuestas').all()).toEqual([{ numero: 'CON' }]);
  });
});

describe('gastos y resumen contra la base real', () => {
  it('registra un gasto con su ITBMS y lo corrige con un asiento contrario', async () => {
    await contable.registrarGasto(
      base,
      peticion({ centavos: 2000, itbmsCentavos: 140, fecha: '2026-10-05', categoria: 'servidores', proveedor: 'Cloudflare' }),
      'a@x.com',
    );
    await contable.corregirGasto(base, 1, peticion({ motivo: 'Era otro proveedor' }), 'a@x.com');

    const r = await contable.contabilidad(base, '2026-10-01', '2026-10-31', '2026-11-15');
    expect(r.gastos).toHaveLength(2);
    expect(r.resumen.gastosCentavos).toBe(0);
    expect(r.resumen.itbmsPagadoCentavos).toBe(0);
  });

  it('rechaza un gasto sin proveedor, con categoría inventada o con el ITBMS mayor que el importe', async () => {
    const valido = { centavos: 2000, fecha: '2026-10-05', categoria: 'servidores', proveedor: 'Cloudflare' };
    await expect(contable.registrarGasto(base, peticion({ ...valido, proveedor: '' }), 'a@x.com')).rejects.toThrow(/a quién/);
    await expect(contable.registrarGasto(base, peticion({ ...valido, categoria: 'viajes' }), 'a@x.com')).rejects.toThrow(/categoría/);
    await expect(contable.registrarGasto(base, peticion({ ...valido, itbmsCentavos: 5000 }), 'a@x.com')).rejects.toThrow(/ITBMS/);
  });

  it('las cuentas por cobrar suman lo aceptado y no cobrado, con su antigüedad', async () => {
    propuesta('P-1');
    await cobros.registrar(base, 'P-1', peticion({ centavos: ANTICIPO, metodo: 'yappy', fecha: '2026-10-05' }), 'a@x.com');
    const r = await contable.contabilidad(base, '2026-10-01', '2026-10-31', '2026-11-15');
    expect(r.antiguedad.pendienteCentavos).toBe(DEBIDO - ANTICIPO);
    expect(r.antiguedad.cuentas[0]?.dias).toBe(45);
    expect(r.antiguedad.porTramo['31-60']).toBe(DEBIDO - ANTICIPO);
  });

  it('el resumen se compara con el mes anterior completo', async () => {
    propuesta('P-1');
    await cobros.registrar(base, 'P-1', peticion({ centavos: 10000, metodo: 'yappy', fecha: '2026-09-10' }), 'a@x.com');
    await cobros.registrar(base, 'P-1', peticion({ centavos: 5000, metodo: 'yappy', fecha: '2026-10-10' }), 'a@x.com');
    const r = await contable.contabilidad(base, '2026-10-01', '2026-10-31', '2026-11-15');
    expect(r.resumen.cobradoCentavos).toBe(5000);
    expect(r.anterior.cobradoCentavos).toBe(10000);
    expect(r.anterior.desde).toBe('2026-09-01');
  });
});

describe('cierre de mes contra la base real', () => {
  const HOY = '2026-11-15';

  async function mesConMovimiento(): Promise<void> {
    propuesta('P-1');
    await cobros.registrar(base, 'P-1', peticion({ centavos: ANTICIPO, metodo: 'yappy', fecha: '2026-10-20' }), 'a@x.com');
    await contable.registrarGasto(
      base,
      peticion({ centavos: 2000, itbmsCentavos: 140, fecha: '2026-10-05', categoria: 'servidores', proveedor: 'Cloudflare' }),
      'a@x.com',
    );
  }

  it('un mes en curso no se puede cerrar', async () => {
    await expect(contable.cerrarMes(base, peticion({ mes: '2026-11' }), 'a@x.com', HOY)).rejects.toThrow(/sigue en curso/);
  });

  it('cierra un mes terminado y guarda la foto de lo que decía', async () => {
    await mesConMovimiento();
    const estado = await contable.cerrarMes(base, peticion({ mes: '2026-10', nota: 'Revisado con la contadora' }), 'a@x.com', HOY);
    expect(estado.cerrado).toBe(true);
    expect(estado.resumenAlCerrar?.cobradoCentavos).toBe(ANTICIPO);
    expect(estado.resumenAlCerrar?.gastosCentavos).toBe(2000);
    await expect(contable.cerrarMes(base, peticion({ mes: '2026-10' }), 'a@x.com', HOY)).rejects.toThrow(/ya está cerrado/);
  });

  it('con el mes cerrado no entra nada por ningún camino: gastos, cobros ni sus correcciones', async () => {
    await mesConMovimiento();
    await contable.cerrarMes(base, peticion({ mes: '2026-10' }), 'a@x.com', HOY);

    const gasto = { centavos: 500, fecha: '2026-10-28', categoria: 'otros', proveedor: 'Alguien' };
    await expect(contable.registrarGasto(base, peticion(gasto), 'a@x.com')).rejects.toThrow(/cerrado/);
    await expect(contable.corregirGasto(base, 1, peticion({ motivo: 'x' }), 'a@x.com')).rejects.toThrow(/cerrado/);
    await expect(
      cobros.registrar(base, 'P-1', peticion({ centavos: 100, metodo: 'yappy', fecha: '2026-10-30' }), 'a@x.com'),
    ).rejects.toThrow(/cerrado/);
    await expect(cobros.corregir(base, 'P-1', 1, peticion({ motivo: 'x' }), 'a@x.com')).rejects.toThrow(/cerrado/);

    // Y un mes distinto sigue abierto.
    await expect(contable.registrarGasto(base, peticion({ ...gasto, fecha: '2026-11-02' }), 'a@x.com')).resolves.toBeDefined();
  });

  it('el periodo avisa de qué meses están cerrados', async () => {
    await mesConMovimiento();
    await contable.cerrarMes(base, peticion({ mes: '2026-10' }), 'a@x.com', HOY);
    const r = await contable.contabilidad(base, '2026-09-01', '2026-11-30', HOY);
    expect(r.mesesCerrados).toEqual(['2026-10']);
  });

  it('reabrir pide motivo, deja rastro y desbloquea; el historial no se puede tocar', async () => {
    await mesConMovimiento();
    await contable.cerrarMes(base, peticion({ mes: '2026-10' }), 'a@x.com', HOY);

    await expect(contable.reabrirMes(base, peticion({ mes: '2026-10', motivo: '' }), 'b@x.com', HOY)).rejects.toThrow(/por qué/);
    const estado = await contable.reabrirMes(base, peticion({ mes: '2026-10', motivo: 'Faltaba una factura' }), 'b@x.com', HOY);

    expect(estado.cerrado).toBe(false);
    expect(estado.historial.map((h) => [h.accion, h.por])).toEqual([
      ['cerrar', 'a@x.com'],
      ['reabrir', 'b@x.com'],
    ]);
    await expect(
      contable.registrarGasto(base, peticion({ centavos: 500, fecha: '2026-10-28', categoria: 'otros', proveedor: 'Alguien' }), 'a@x.com'),
    ).resolves.toBeDefined();

    expect(() => db.exec("UPDATE cierres_mes SET por = 'otro'")).toThrow(/no se edita/);
    expect(() => db.exec('DELETE FROM cierres_mes')).toThrow(/no se elimina/);
    await expect(contable.reabrirMes(base, peticion({ mes: '2026-10', motivo: 'x' }), 'b@x.com', HOY)).rejects.toThrow(/no está cerrado/);
  });

  it('la lista de chequeo avisa de lo que falta sin impedir el cierre', async () => {
    propuesta('P-1');
    const estado = await contable.estadoDeCierre(base, '2026-10', HOY);
    const porClave = Object.fromEntries(estado.chequeo.map((c) => [c.clave, c]));
    expect(porClave['mes-terminado']).toMatchObject({ ok: true, bloquea: true });
    expect(porClave['gastos-del-mes']).toMatchObject({ ok: false, bloquea: false });
    expect(porClave['aceptadas-sin-cobro']).toMatchObject({ ok: false, bloquea: false });

    // Con avisos pero sin impedimentos, se puede cerrar.
    await expect(contable.cerrarMes(base, peticion({ mes: '2026-10' }), 'a@x.com', HOY)).resolves.toMatchObject({ cerrado: true });
  });

  it('rechaza un mes que no es un mes', async () => {
    await expect(contable.estadoDeCierre(base, 'octubre', HOY)).rejects.toThrow(/2026-11/);
    await expect(contable.cerrarMes(base, peticion({ mes: '2026-13' }), 'a@x.com', HOY)).rejects.toThrow(/2026-11/);
  });
});
