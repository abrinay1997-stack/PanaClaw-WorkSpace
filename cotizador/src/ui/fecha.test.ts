import { describe, expect, it } from 'vitest';

import { propuestaVacia, reducir } from './usePropuesta';

describe('La fecha de emisión', () => {
  it('sigue a hoy mientras la propuesta no ha salido', () => {
    const borrador = { ...propuestaVacia(), fecha: '2026-11-01' };
    expect(reducir(borrador, { tipo: 'fecha', fecha: '2026-11-07' }).fecha).toBe('2026-11-07');
  });

  it('no se mueve una vez emitida: es la que el cliente tiene en el PDF', () => {
    const emitida = { ...propuestaVacia(), fecha: '2026-11-01', numero: 'PC-2026-0001' };
    expect(reducir(emitida, { tipo: 'fecha', fecha: '2026-11-07' }).fecha).toBe('2026-11-01');
  });
});
