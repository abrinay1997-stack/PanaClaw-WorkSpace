import { describe, expect, it } from 'vitest';

import { catalogo, itemDe } from './catalogo';
import { lineaDesde } from './propuesta';
import { hayGraves, revisar, type Alerta } from './revision';
import type { Linea, Propuesta } from './tipos';

let n = 0;
const linea = (id: string, cambios: Partial<Linea> = {}): Linea => {
  const item = itemDe(id);
  if (!item) throw new Error(`No existe el item ${id}`);
  return { ...lineaDesde(item, `l${++n}`), ...cambios };
};

const propuesta = (lineas: Linea[], cambios: Partial<Propuesta> = {}): Propuesta => ({
  numero: 'PROP-2026-0001',
  fecha: '2026-08-23',
  asesor: 'Ana',
  necesita: 'Vende por Instagram y quiere dejar de mandar clientes a un perfil.',
  catalogoVersion: catalogo.version,
  cliente: { negocio: 'Panadería La Espiga', contacto: 'Luis', whatsapp: '', correo: '', ciudad: 'Panamá' },
  lineas,
  condiciones: { validezDias: 15, noIncluyeExtra: [], observaciones: '' },
  ...cambios,
});

const textos = (alertas: Alerta[]) => alertas.map((a) => a.texto).join(' | ');
const graves = (p: Propuesta) => revisar(p).filter((a) => a.gravedad === 'grave');

describe('lo que bloquea el envío', () => {
  it('una capacidad avanzada sin plan web debajo', () => {
    expect(textos(graves(propuesta([linea('cap-reservas')])))).toContain('necesita un plan web');
  });

  it('reservas sobre Launch, que no la aguanta', () => {
    const g = graves(propuesta([linea('web-launch'), linea('cap-reservas')]));
    expect(textos(g)).toContain('necesita como mínimo Corporate');
  });

  it('pero reservas sobre Corporate pasa', () => {
    expect(graves(propuesta([linea('web-corporate'), linea('cap-reservas')]))).toHaveLength(0);
  });

  it('cobrar el inventario encima de Commerce, que ya lo trae', () => {
    const g = graves(propuesta([linea('web-commerce'), linea('cap-inventario', { incluida: false })]));
    expect(textos(g)).toContain('ya viene dentro de Commerce');
  });

  it('un mensual de seguridad sin la Auditoría delante', () => {
    expect(textos(graves(propuesta([linea('seg-protegida')])))).toContain('sin la Auditoría de Seguridad');
  });

  it('con la Auditoría delante, deja de bloquear', () => {
    expect(graves(propuesta([linea('aud-medio'), linea('seg-protegida')]))).toHaveLength(0);
  });

  it('un precio por debajo del rango publicado', () => {
    const g = graves(propuesta([linea('aud-medio', { precio: { min: 50, max: 50 }, precioAjustado: true })]));
    expect(textos(g)).toContain('el catálogo publica');
  });

  it('un precio dentro del rango, no', () => {
    // La Auditoría del tramo medio es $110; cerrarla ahí es exactamente lo que
    // se espera del asesor.
    expect(graves(propuesta([linea('aud-medio', { precioAjustado: true })]))).toHaveLength(0);
  });

  it('dos planes web a la vez', () => {
    expect(textos(graves(propuesta([linea('web-start'), linea('web-commerce')])))).toContain(
      '2 planes web a la vez',
    );
  });
});

describe('lo que solo advierte', () => {
  it('eBot sin plan web se avisa, pero no bloquea', () => {
    const p = propuesta([linea('ebot')]);
    expect(hayGraves(revisar(p))).toBe(false);
    expect(textos(revisar(p))).toContain('eBot y ningún plan web');
  });

  it('Care recuerda el único descuento que existe', () => {
    const consejo = revisar(propuesta([linea('web-start'), linea('care-base')]))
      .map((a) => a.comoSeArregla)
      .join(' ');
    expect(consejo).toContain('dos meses gratis');
  });

  it('un rango sin cerrar se señala', () => {
    expect(textos(revisar(propuesta([linea('seg-blindada'), linea('aud-tienda')])))).toContain(
      'rango de precio entero',
    );
  });

  it('falta el «qué necesitas»', () => {
    expect(textos(revisar(propuesta([linea('web-start')], { necesita: '  ' })))).toContain(
      'Falta «qué necesitas»',
    );
  });

  it('el listado de precios cambió desde que se armó', () => {
    expect(textos(revisar(propuesta([linea('web-start')], { catalogoVersion: '0.9.0' })))).toContain(
      'listado de precios',
    );
  });
});

describe('una propuesta limpia', () => {
  it('no tiene nada grave', () => {
    const p = propuesta([linea('web-corporate'), linea('cap-reservas'), linea('ronda-extra')]);
    expect(hayGraves(revisar(p))).toBe(false);
  });

  it('toda alerta dice cómo se arregla', () => {
    for (const alerta of revisar(propuesta([linea('cap-reservas')]))) {
      expect(alerta.comoSeArregla.length, alerta.texto).toBeGreaterThan(10);
    }
  });
});
