import { describe, expect, it } from 'vitest';

import { CERO, desde, esRango, fijo, formato, formatoMensual, leer, multiplicar, sumar, sumarTodos } from './dinero';

describe('leer', () => {
  it('lee un importe cerrado', () => {
    expect(leer('$295')).toEqual({ min: 295, max: 295 });
  });

  it('lee un importe con separador de miles', () => {
    expect(leer('$1,200')).toEqual({ min: 1200, max: 1200 });
  });

  it('lee un rango con guion largo', () => {
    expect(leer('$80–$150')).toEqual({ min: 80, max: 150 });
  });

  it('lee un rango donde el máximo no repite el símbolo', () => {
    expect(leer('$1–2 al mes')).toEqual({ min: 1, max: 2 });
  });

  it('revienta con un texto sin cifras, en vez de devolver cero', () => {
    expect(() => leer('a convenir')).toThrow();
  });
});

describe('formato', () => {
  it('escribe el rango entero, con guion largo y sin espacios', () => {
    expect(formato({ min: 80, max: 150 })).toBe('$80–$150');
  });

  it('no inventa un rango donde no lo hay', () => {
    expect(formato(fijo(295))).toBe('$295');
  });

  it('pone el separador de miles', () => {
    expect(formato(fijo(1200))).toBe('$1,200');
  });

  it('devuelve exactamente lo que declara precios.json', () => {
    // Ida y vuelta: lo que se lee del listado se vuelve a escribir igual. Es
    // lo que permite que `herramientas/verificar.mjs` reconozca el importe.
    for (const texto of ['$295', '$1,200', '$80–$150', '$35']) {
      expect(formato(leer(texto))).toBe(texto);
    }
  });

  it('el sufijo mensual lo pone una sola función', () => {
    expect(formatoMensual({ min: 30, max: 60 })).toBe('$30–$60/mes');
  });

  it('«desde» solo acorta lo que es rango', () => {
    expect(desde({ min: 80, max: 150 })).toBe('desde $80');
    expect(desde(fijo(295))).toBe('$295');
  });
});

describe('aritmética', () => {
  it('suma rangos por los dos extremos', () => {
    expect(sumar({ min: 80, max: 150 }, { min: 30, max: 60 })).toEqual({ min: 110, max: 210 });
  });

  it('multiplica los dos extremos', () => {
    expect(multiplicar({ min: 40, max: 40 }, 3)).toEqual({ min: 120, max: 120 });
  });

  it('suma una lista vacía a cero', () => {
    expect(sumarTodos([])).toEqual(CERO);
  });

  it('sumar un cerrado y un rango deja un rango', () => {
    expect(esRango(sumar(fijo(850), { min: 30, max: 60 }))).toBe(true);
  });
});
