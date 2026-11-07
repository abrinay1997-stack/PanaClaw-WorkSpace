import { describe, expect, it } from 'vitest';

import type { CobroDelPeriodo, Gasto } from '../../../compartido/contabilidad';
import { cobrosACsv, gastosACsv, importeCsv } from './exportar';

const gasto = (cambios: Partial<Gasto> = {}): Gasto => ({
  id: 1,
  fecha: '2026-10-05',
  centavos: 2000,
  itbmsCentavos: 140,
  categoria: 'servidores',
  proveedor: 'Cloudflare',
  referencia: 'F-100',
  nota: '',
  corrigeA: null,
  motivo: '',
  registradoPor: 'ana@panaclaw.com',
  registradoEn: '2026-10-05T12:30:45.000Z',
  ...cambios,
});

describe('los libros, a un archivo', () => {
  it('los importes salen con dos decimales y punto, sin símbolo', () => {
    expect(importeCsv(2000)).toBe('20.00');
    expect(importeCsv(90950)).toBe('909.50');
    expect(importeCsv(5)).toBe('0.05');
    expect(importeCsv(-45475)).toBe('-454.75');
  });

  it('empieza con la marca de orden de bytes, separa con punto y coma y termina cada fila con salto', () => {
    const csv = gastosACsv([gasto()]);
    expect(csv.startsWith('﻿Fecha;')).toBe(true);
    const filas = csv.trimEnd().split('\r\n');
    expect(filas).toHaveLength(2);
    expect(filas[1]).toBe('2026-10-05;Cloudflare;Servidores y dominios;20.00;1.40;F-100;;;;ana@panaclaw.com;2026-10-05 12:30:45');
  });

  it('las correcciones salen como filas aparte y en negativo, igual que en el libro', () => {
    const csv = gastosACsv([gasto(), gasto({ id: 2, centavos: -2000, itbmsCentavos: -140, corrigeA: 1, motivo: 'Era otro' })]);
    const filas = csv.trimEnd().split('\r\n');
    expect(filas).toHaveLength(3);
    expect(filas[2]).toContain(';-20.00;-1.40;');
    expect(filas[2]).toContain(';1;Era otro;');
  });

  it('un número negativo sigue siendo un número: Excel tiene que poder sumarlo', () => {
    const fila = gastosACsv([gasto({ centavos: -2000, itbmsCentavos: -140, corrigeA: 1, motivo: 'x' })]).trimEnd().split('\r\n')[1]!;
    expect(fila.split(';').slice(3, 5)).toEqual(['-20.00', '-1.40']);
    expect(fila).not.toContain("'-");
  });

  it('un texto que Excel leería como fórmula no se ejecuta, y uno con punto y coma se entrecomilla', () => {
    const csv = gastosACsv([gasto({ proveedor: '=HYPERLINK("x")', nota: 'uno; dos' })]);
    expect(csv).toContain(`'=HYPERLINK`);
    expect(csv).toContain('"uno; dos"');
  });

  it('los cobros llevan el cliente, el método en palabras y el importe con ITBMS', () => {
    const cobro: CobroDelPeriodo = {
      id: 1,
      propuesta: 'PROP-2026-0001',
      negocio: 'Repuestos El Chorrillo',
      fecha: '2026-10-20',
      centavos: 15783,
      metodo: 'yappy',
      referencia: 'Y-77',
      corrigeA: null,
    };
    expect(cobrosACsv([cobro]).trimEnd().split('\r\n')[1]).toBe(
      '2026-10-20;PROP-2026-0001;Repuestos El Chorrillo;157.83;Yappy;Y-77;',
    );
  });
});
