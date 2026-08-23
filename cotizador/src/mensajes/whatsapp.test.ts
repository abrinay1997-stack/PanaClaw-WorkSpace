import { describe, expect, it } from 'vitest';

import { itemDe } from '../dominio/catalogo';
import { lineaDesde } from '../dominio/propuesta';
import type { Linea, Propuesta } from '../dominio/tipos';
import { enlaceWhatsapp, mensajeWhatsapp, numeroPanameno } from './whatsapp';

let n = 0;
const linea = (id: string, cambios: Partial<Linea> = {}): Linea => ({
  ...lineaDesde(itemDe(id)!, `l${++n}`),
  ...cambios,
});

const propuesta = (lineas: Linea[], cambios: Partial<Propuesta> = {}): Propuesta => ({
  numero: 'PROP-2026-0042',
  fecha: '2026-08-23',
  asesor: 'Ana',
  necesita: 'Quiere dejar de mandar clientes a un perfil de Instagram.',
  catalogoVersion: 'prueba',
  cliente: { negocio: 'Repuestos El Chorrillo', contacto: 'Luis', whatsapp: '', correo: '', ciudad: 'Panamá' },
  lineas,
  condiciones: { validezDias: 15, noIncluyeExtra: [], observaciones: '' },
  ...cambios,
});

describe('regla 2 · tampoco en el chat se suman', () => {
  const texto = mensajeWhatsapp(propuesta([linea('web-corporate'), linea('care-base')]));

  it('saca los dos totales en bloques distintos', () => {
    expect(texto).toContain('*PAGO ÚNICO: $850*');
    expect(texto).toContain('*CADA MES: $35/mes*');
  });

  it('no escribe la suma por ningún lado', () => {
    expect(texto).not.toContain('$885');
  });

  it('los separa con una línea en blanco, no con una coma', () => {
    expect(texto).toMatch(/\*PAGO ÚNICO: \$850\*[^*]*\n\n\*CADA MES/);
  });
});

describe('el mensaje lleva lo mismo que el PDF', () => {
  it('el «qué NO incluye» va antes del precio', () => {
    const texto = mensajeWhatsapp(propuesta([linea('web-start')]));
    expect(texto.indexOf('QUÉ NO INCLUYE')).toBeLessThan(texto.indexOf('PAGO ÚNICO'));
  });

  it('con eBot publica los costos de terceros y de quién son', () => {
    const texto = mensajeWhatsapp(propuesta([linea('ebot')]));
    expect(texto).toContain('A TERCEROS');
    expect(texto).toContain('$5 al mes a Cloudflare');
  });

  it('el plazo dice desde cuándo cuenta', () => {
    expect(mensajeWhatsapp(propuesta([linea('web-launch')]))).toContain(
      'El reloj empieza cuando recibimos tu material',
    );
  });

  it('una línea mensual se etiqueta como mensual también en el desglose', () => {
    expect(mensajeWhatsapp(propuesta([linea('care-pro')]))).toContain('$75/mes');
  });

  it('una línea incluida dice «incluido» y no un cero', () => {
    const texto = mensajeWhatsapp(
      propuesta([linea('web-commerce'), linea('cap-inventario', { incluida: true })]),
    );
    expect(texto).toContain('— incluido');
    expect(texto).not.toContain('— $0');
  });
});

describe('el número', () => {
  it('acepta el formato que la gente escribe', () => {
    expect(numeroPanameno('6531-0721')).toBe('50765310721');
    expect(numeroPanameno('6531 0721')).toBe('50765310721');
    expect(numeroPanameno('+507 6531-0721')).toBe('50765310721');
  });

  it('descarta un fijo, en vez de mandar la propuesta a un desconocido', () => {
    expect(numeroPanameno('263-1234')).toBeNull();
    expect(numeroPanameno('')).toBeNull();
  });

  it('sin número del cliente, el enlace abre el chat de PanaClaw', () => {
    expect(enlaceWhatsapp(propuesta([linea('web-start')]))).toContain('wa.me/50765310721');
  });

  it('con número del cliente, abre el suyo', () => {
    const p = propuesta([linea('web-start')]);
    p.cliente.whatsapp = '6000-0000';
    expect(enlaceWhatsapp(p)).toContain('wa.me/50760000000');
  });
});
