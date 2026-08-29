import { describe, expect, it } from 'vitest';

import {
  claveDe,
  claveUtil,
  coincidenciaFuerte,
  documentosParecidos,
  formatoCodigoCliente,
  nombreDocumento,
} from '../../../compartido/clientes';
import { whatsappNormal } from '../../../compartido/texto';

describe('cómo se compara un WhatsApp', () => {
  it('el mismo número escrito de cuatro formas es el mismo cliente', () => {
    const formas = ['6123-4567', '61234567', '+507 6123 4567', '507 6123-4567'];
    const normales = new Set(formas.map(whatsappNormal));
    expect(normales).toEqual(new Set(['61234567']));
  });

  it('dos números distintos siguen siendo distintos', () => {
    expect(whatsappNormal('6123-4567')).not.toBe(whatsappNormal('6123-4568'));
  });
});

describe('cómo se comparan dos documentos', () => {
  it('el RUC con y sin su DV se reconoce como parecido', () => {
    // La forma más común de acabar con dos fichas de la misma sociedad.
    expect(documentosParecidos('155646123', '155646123-4')).toBe(true);
    expect(documentosParecidos('155646123', '15564612345')).toBe(true);
  });

  it('parecerse no es serlo: nunca une solo', () => {
    // Es una coincidencia floja a propósito. Solo el documento exacto une sin
    // preguntar, porque fusionar dos clientes no se deshace.
    expect(coincidenciaFuerte('parecido')).toBe(false);
    expect(coincidenciaFuerte('whatsapp')).toBe(false);
    expect(coincidenciaFuerte('correo')).toBe(false);
    expect(coincidenciaFuerte('negocio')).toBe(false);
    expect(coincidenciaFuerte('documento')).toBe(true);
  });

  it('números cortos no se comparan: de un «12» y un «123» no sale nada', () => {
    expect(documentosParecidos('1234', '12345')).toBe(false);
  });

  it('tres dígitos de diferencia ya no es un DV', () => {
    expect(documentosParecidos('155646123', '155646123456')).toBe(false);
  });
});

describe('la clave de un cliente', () => {
  it('normaliza los cuatro datos antes de comparar', () => {
    expect(
      claveDe({
        documento: '155-6461-23',
        whatsapp: '+507 6123-4567',
        correo: '  Ventas@Cliente.COM ',
        negocio: '  Ávila, S.A. ',
      }),
    ).toEqual({
      documento: '155646123',
      whatsapp: '61234567',
      correo: 'ventas@cliente.com',
      negocio: 'avila, s.a.',
    });
  });

  it('sin ninguno de los cuatro no hay con qué buscar', () => {
    expect(claveUtil(claveDe({}))).toBe(false);
    expect(claveUtil(claveDe({ negocio: 'Algo' }))).toBe(true);
  });
});

describe('cómo se nombra el documento', () => {
  it('a una persona no se le pide el RUC', () => {
    expect(nombreDocumento('persona')).toBe('Cédula');
    expect(nombreDocumento('empresa')).toBe('RUC');
  });
});

describe('el código de cliente', () => {
  it('no lleva año: no se reinicia en enero', () => {
    expect(formatoCodigoCliente(1)).toBe('CLI-0001');
    expect(formatoCodigoCliente(500)).toBe('CLI-0500');
  });
});
