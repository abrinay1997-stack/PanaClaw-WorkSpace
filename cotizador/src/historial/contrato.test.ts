import { describe, expect, it } from 'vitest';

import {
  aCentavos,
  deCentavos,
  formatoNumero,
  mismoCliente,
} from '../../../compartido/propuestas';

describe('el número de propuesta', () => {
  it('lleva el año y cuatro cifras', () => {
    expect(formatoNumero('2026', 7)).toBe('PROP-2026-0007');
    expect(formatoNumero('2027', 1)).toBe('PROP-2027-0001');
  });
});

describe('el dinero que se guarda', () => {
  it('va en centavos enteros, para que las sumas cuadren', () => {
    expect(aCentavos(35.1)).toBe(3510);
    expect(deCentavos(3510)).toBe(35.1);
  });

  it('sumar en centavos no arrastra decimales inventados', () => {
    // En coma flotante, 35.10 + 70.20 da 105.30000000000001, y esa cifra acaba
    // impresa en algún sitio. En centavos, no.
    const suma = aCentavos(35.1) + aCentavos(70.2);
    expect(deCentavos(suma)).toBe(105.3);
  });
});

describe('si dos propuestas van al mismo cliente', () => {
  const cliente = (cambios: Partial<Parameters<typeof mismoCliente>[0]> = {}) => ({
    negocio: 'Repuestos El Chorrillo',
    correo: 'luis@negocio.com',
    whatsapp: '6123-4567',
    ...cambios,
  });

  it('manda el correo cuando los dos lo traen', () => {
    // Corregir una errata en el nombre antes de reemitir no puede leerse como
    // un choque de números.
    expect(mismoCliente(cliente(), cliente({ negocio: 'Repuestos el Chorillo' }))).toBe(true);
    expect(mismoCliente(cliente(), cliente({ correo: 'otro@negocio.com' }))).toBe(false);
  });

  it('sin correo, decide el WhatsApp escrito como sea', () => {
    expect(
      mismoCliente(cliente({ correo: '' }), cliente({ correo: '', whatsapp: '+507 6123 4567' })),
    ).toBe(true);
  });

  it('sin correo ni WhatsApp, queda el nombre sin tildes ni mayúsculas', () => {
    const sinContacto = { correo: '', whatsapp: '' };
    expect(
      mismoCliente(
        cliente({ ...sinContacto, negocio: 'Ávila, S.A.' }),
        cliente({ ...sinContacto, negocio: 'avila, s.a.' }),
      ),
    ).toBe(true);
    expect(
      mismoCliente(
        cliente({ ...sinContacto }),
        cliente({ ...sinContacto, negocio: 'Otro negocio' }),
      ),
    ).toBe(false);
  });
});
