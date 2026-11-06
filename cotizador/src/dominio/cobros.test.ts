import { describe, expect, it } from 'vitest';

import { aCentavos, dolares, resumenDeCobros, type Cobro } from '../../../compartido/cobros';
import { itemDe } from './catalogo';
import { debidoCentavos, lineaDesde } from './propuesta';
import type { Linea } from './tipos';

let n = 0;
const linea = (id: string, cambios: Partial<Linea> = {}): Linea => {
  const item = itemDe(id);
  if (!item) throw new Error(`No existe el item ${id}`);
  return { ...lineaDesde(item, `c${++n}`), ...cambios };
};

const cobro = (id: number, centavos: number, corrigeA: number | null = null): Cobro => ({
  id,
  propuesta: 'PROP-2026-0001',
  fecha: '2026-11-06',
  centavos,
  metodo: 'yappy',
  referencia: '',
  nota: '',
  corrigeA,
  motivo: corrigeA ? 'error de tecleo' : '',
  registradoPor: 'ana@panaclaw.com',
  registradoEn: '2026-11-06T12:00:00.000Z',
});

describe('lo debido: la misma cuenta que el PDF', () => {
  it('es el pago único con ITBMS, en centavos', () => {
    // $850 + 7 % ($59.50) = $909.50
    expect(debidoCentavos([linea('web-corporate')])).toBe(90950);
  });

  it('lo mensual no entra: nunca se mezcla con el pago único', () => {
    expect(debidoCentavos([linea('web-corporate'), linea('care-base')])).toBe(90950);
    // Solo mensual: no hay pago único que cobrar.
    expect(debidoCentavos([linea('care-base')])).toBe(0);
  });

  it('con un rango sin cerrar no hay cifra: no se escoge un extremo', () => {
    // Hoy ningún item de pago único trae rango, pero el catálogo puede cambiar:
    // la regla tiene que seguir en pie cuando pase.
    const abierta = { ...linea('web-start'), precio: { min: 80, max: 150 } };
    expect(debidoCentavos([abierta])).toBeNull();
  });

  it('con el rango cerrado a una cifra sí', () => {
    const cerrada = { ...linea('web-start'), precio: { min: 100, max: 100 } };
    expect(debidoCentavos([cerrada])).toBe(10700);
  });
});

describe('el libro: el saldo es la suma, y las correcciones restan solas', () => {
  it('suma lo cobrado y calcula lo que falta', () => {
    const r = resumenDeCobros(90950, [cobro(1, 45475), cobro(2, 20000)]);
    expect(r).toEqual({ debidoCentavos: 90950, cobradoCentavos: 65475, pendienteCentavos: 25475 });
  });

  it('un cobro corregido deja de contar, y los dos asientos siguen en el libro', () => {
    const libro = [cobro(1, 45475), cobro(2, -45475, 1)];
    expect(resumenDeCobros(90950, libro).cobradoCentavos).toBe(0);
    expect(libro).toHaveLength(2);
  });

  it('sin cifra debida no hay pendiente', () => {
    expect(resumenDeCobros(null, []).pendienteCentavos).toBeNull();
  });

  it('el pendiente nunca es negativo', () => {
    expect(resumenDeCobros(1000, [cobro(1, 1500)]).pendienteCentavos).toBe(0);
  });
});

describe('importes de teclado', () => {
  it('lee dólares con o sin centavos y con separadores', () => {
    expect(aCentavos('425')).toBe(42500);
    expect(aCentavos('$1,234.50')).toBe(123450);
    expect(aCentavos('0.05')).toBe(5);
  });

  it('rechaza lo que no es un importe', () => {
    for (const malo of ['', 'abc', '-5', '0', '12.345', '1.2.3']) expect(aCentavos(malo), malo).toBeNull();
  });

  it('muestra siempre dos decimales', () => {
    expect(dolares(90950)).toBe('$909.50');
    expect(dolares(5)).toBe('$0.05');
    expect(dolares(-45475)).toBe('-$454.75');
  });
});
