import { describe, expect, it } from 'vitest';

import {
  anioDe,
  antiguedadDe,
  diasEntre,
  esMes,
  itbmsIncluido,
  mesAnteriorDe,
  mesDe,
  mesDeFecha,
  periodoAnteriorDe,
  resumirPeriodo,
  sumarDiasISO,
  tramoDe,
  variacion,
} from '../../../compartido/contabilidad';
import { ITBMS } from './catalogo';

const TASA = ITBMS.tasa;

describe('el ITBMS que viene dentro de un cobro', () => {
  it('lo separa del importe con impuesto, al centavo', () => {
    // $909.50 = $850.00 + $59.50
    expect(itbmsIncluido(90950, TASA)).toBe(5950);
    // $37.45 = $35.00 + $2.45
    expect(itbmsIncluido(3745, TASA)).toBe(245);
  });

  it('la corrección de un cobro saca exactamente el mismo impuesto que metió', () => {
    for (const centavos of [1, 5, 107, 3745, 90950, 123457]) {
      expect(itbmsIncluido(-centavos, TASA), String(centavos)).toBe(-itbmsIncluido(centavos, TASA));
    }
  });
});

describe('el resumen del periodo', () => {
  const resumen = resumirPeriodo(
    '2026-11-01',
    '2026-11-30',
    [
      { centavos: 45475, metodo: 'yappy' },
      { centavos: 45475, metodo: 'transferencia' },
      // Un cobro corregido: el asiento contrario lo anula entero.
      { centavos: 10700, metodo: 'efectivo' },
      { centavos: -10700, metodo: 'efectivo' },
    ],
    [
      { centavos: 2000, itbmsCentavos: 140, categoria: 'servidores' },
      { centavos: 5000, itbmsCentavos: 0, categoria: 'publicidad' },
      { centavos: -5000, itbmsCentavos: 0, categoria: 'publicidad' },
    ],
    TASA,
  );

  it('suma lo cobrado, neto de correcciones', () => {
    expect(resumen.cobradoCentavos).toBe(90950);
  });

  it('separa el ingreso del impuesto', () => {
    expect(resumen.itbmsCobradoCentavos).toBe(5950);
    expect(resumen.ingresoCentavos).toBe(85000);
    expect(resumen.ingresoCentavos + resumen.itbmsCobradoCentavos).toBe(resumen.cobradoCentavos);
  });

  it('los gastos corregidos no cuentan y su categoría desaparece', () => {
    expect(resumen.gastosCentavos).toBe(2000);
    expect(resumen.gastosPorCategoria.map((g) => g.categoria)).toEqual(['servidores']);
  });

  it('el resultado es ingreso menos gastos, sin impuesto de por medio', () => {
    expect(resumen.resultadoCentavos).toBe(83000);
  });

  it('el ITBMS por pagar es lo cobrado menos lo pagado, y puede quedar a favor', () => {
    expect(resumen.itbmsPorPagarCentavos).toBe(5950 - 140);
    const aFavor = resumirPeriodo('a', 'b', [], [{ centavos: 10000, itbmsCentavos: 700, categoria: 'otros' }], TASA);
    expect(aFavor.itbmsPorPagarCentavos).toBe(-700);
  });

  it('el cobrado por método no incluye los que quedaron en cero', () => {
    expect(resumen.cobradoPorMetodo.map((m) => m.metodo).sort()).toEqual(['transferencia', 'yappy']);
  });

  it('sin asientos todo es cero', () => {
    const vacio = resumirPeriodo('a', 'b', [], [], TASA);
    expect(vacio.cobradoCentavos + vacio.gastosCentavos + vacio.resultadoCentavos + vacio.itbmsPorPagarCentavos).toBe(0);
  });
});

describe('antigüedad de las cuentas por cobrar', () => {
  it('los tramos cortan en 30, 60 y 90 días', () => {
    expect(tramoDe(0)).toBe('0-30');
    expect(tramoDe(30)).toBe('0-30');
    expect(tramoDe(31)).toBe('31-60');
    expect(tramoDe(60)).toBe('31-60');
    expect(tramoDe(61)).toBe('61-90');
    expect(tramoDe(90)).toBe('61-90');
    expect(tramoDe(91)).toBe('mas-90');
  });

  it('cuenta días enteros y nunca negativos', () => {
    expect(diasEntre('2026-10-01', '2026-11-01')).toBe(31);
    expect(diasEntre('2026-11-05', '2026-11-01')).toBe(0);
  });

  const hoy = '2026-11-07';
  const a = antiguedadDe(
    [
      { numero: 'P-1', negocio: 'Nueva', desde: '2026-11-01', debidoCentavos: 90950, cobradoCentavos: 45475 },
      { numero: 'P-2', negocio: 'Vieja', desde: '2026-07-01', debidoCentavos: 50000, cobradoCentavos: 0 },
      { numero: 'P-3', negocio: 'Saldada', desde: '2026-09-01', debidoCentavos: 10000, cobradoCentavos: 10000 },
    ],
    hoy,
  );

  it('solo entra lo que todavía se debe', () => {
    expect(a.cuentas.map((c) => c.numero)).toEqual(['P-2', 'P-1']);
  });

  it('va de la más vieja a la más nueva', () => {
    expect(a.cuentas[0]!.dias).toBeGreaterThan(a.cuentas[1]!.dias);
  });

  it('suma por tramo, y la suma de los tramos es el pendiente', () => {
    expect(a.porTramo['0-30']).toBe(45475);
    expect(a.porTramo['mas-90']).toBe(50000);
    const suma = Object.values(a.porTramo).reduce((s, v) => s + v, 0);
    expect(suma).toBe(a.pendienteCentavos);
    expect(a.pendienteCentavos).toBe(95475);
  });
});

describe('comparar con el periodo anterior', () => {
  it('un mes completo se compara con el mes anterior completo, no con «los 30 días de antes»', () => {
    expect(periodoAnteriorDe('2026-03-01', '2026-03-31')).toEqual({ desde: '2026-02-01', hasta: '2026-02-28' });
    expect(periodoAnteriorDe('2026-01-01', '2026-01-31')).toEqual({ desde: '2025-12-01', hasta: '2025-12-31' });
  });

  it('cualquier otro periodo se compara con el tramo de la misma duración que lo precede', () => {
    // 10 al 19 de noviembre (10 días) → 31 de octubre al 9 de noviembre... los 10 días anteriores.
    expect(periodoAnteriorDe('2026-11-10', '2026-11-19')).toEqual({ desde: '2026-10-31', hasta: '2026-11-09' });
    expect(periodoAnteriorDe('2026-11-01', '2026-11-15')).toEqual({ desde: '2026-10-17', hasta: '2026-10-31' });
  });

  it('el año completo se compara con el tramo de 365 días anterior', () => {
    expect(periodoAnteriorDe('2026-01-01', '2026-12-31')).toEqual({ desde: '2025-01-01', hasta: '2025-12-31' });
  });

  it('suma días cruzando meses y años', () => {
    expect(sumarDiasISO('2026-12-31', 1)).toBe('2027-01-01');
    expect(sumarDiasISO('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('la variación es la diferencia y su porcentaje, y sin base no inventa un porcentaje', () => {
    expect(variacion(120, 100)).toEqual({ diferencia: 20, porcentaje: 20 });
    expect(variacion(80, 100)).toEqual({ diferencia: -20, porcentaje: -20 });
    expect(variacion(50, 0)).toEqual({ diferencia: 50, porcentaje: null });
    expect(variacion(-50, -100).porcentaje).toBe(50);
  });
});

describe('meses', () => {
  it('reconoce un mes bien escrito y rechaza lo demás', () => {
    for (const bueno of ['2026-01', '2026-12']) expect(esMes(bueno), bueno).toBe(true);
    for (const malo of ['2026-13', '2026-00', '2026-1', 'octubre', '2026-10-01', '', 7, null]) expect(esMes(malo), String(malo)).toBe(false);
  });

  it('saca el mes de una fecha', () => {
    expect(mesDeFecha('2026-11-07')).toBe('2026-11');
  });
});

describe('periodos', () => {
  it('el mes de una fecha, con sus días reales', () => {
    expect(mesDe('2026-11-07')).toEqual({ desde: '2026-11-01', hasta: '2026-11-30' });
    expect(mesDe('2028-02-10')).toEqual({ desde: '2028-02-01', hasta: '2028-02-29' });
  });

  it('el mes anterior cruza el año', () => {
    expect(mesAnteriorDe('2026-01-15')).toEqual({ desde: '2025-12-01', hasta: '2025-12-31' });
    expect(mesAnteriorDe('2026-11-07')).toEqual({ desde: '2026-10-01', hasta: '2026-10-31' });
  });

  it('el año completo', () => {
    expect(anioDe('2026-11-07')).toEqual({ desde: '2026-01-01', hasta: '2026-12-31' });
  });
});
