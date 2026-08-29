import { describe, expect, it } from 'vitest';

import type { Cliente } from '../../../compartido/clientes';
import { aCsv } from './exportar';

const cliente = (cambios: Partial<Cliente> = {}): Cliente => ({
  codigo: 'CLI-0001',
  negocio: 'Repuestos El Chorrillo',
  documento: '155-6461-23',
  tipo: 'empresa',
  contacto: 'Luis Ortega',
  cargo: 'Dueño',
  whatsapp: '+507 6123-4567',
  telefono: '',
  correo: 'luis@negocio.com',
  correosExtra: [],
  telefonosExtra: [],
  ciudad: 'Ciudad de Panamá',
  direccion: '',
  notas: '',
  asesor: 'Ana',
  estado: 'activo',
  creadoEn: '2026-08-23T15:00:00.000Z',
  actualizadoEn: '2026-08-23T15:00:00.000Z',
  eliminadoEn: null,
  eliminadoPor: null,
  ...cambios,
});

describe('la exportación', () => {
  it('empieza por la marca de orden de bytes, que es lo que hace que Excel lea las tildes', () => {
    expect(aCsv([cliente()]).startsWith('﻿')).toBe(true);
  });

  it('separa por punto y coma, que es lo que entiende Excel en español', () => {
    const [titulos] = aCsv([]).split('\r\n');
    expect(titulos).toContain('Código;Negocio;');
  });

  it('un teléfono que empieza por «+» no se abre como fórmula', () => {
    // Sin el apóstrofo delante, Excel intenta calcular «+507 6123-4567» y la
    // celda sale con un error en vez de con un número.
    expect(aCsv([cliente()])).toContain("'+507 6123-4567");
  });

  it('entrecomilla lo que lleve punto y coma dentro', () => {
    expect(aCsv([cliente({ notas: 'Pidió web; después eBot' })])).toContain(
      '"Pidió web; después eBot"',
    );
  });

  it('los correos adicionales van en una sola celda, separados', () => {
    expect(aCsv([cliente({ correosExtra: ['a@b.com', 'c@d.com'] })])).toContain('a@b.com | c@d.com');
  });
});
