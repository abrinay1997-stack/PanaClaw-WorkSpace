import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { catalogo, itemDe, itemsDe } from './catalogo';
import { formato } from './dinero';

/**
 * El listado, en crudo. Se lee del disco a propósito y no por `import`: la
 * comprobación que importa es que el TEXTO que el cotizador puede llegar a
 * imprimir esté literalmente en el archivo, y para eso hace falta el archivo,
 * no el objeto ya interpretado.
 */
const crudo = readFileSync(new URL('../../../datos/precios.json', import.meta.url), 'utf8');

describe('regla 1 · ninguna cifra que no esté en datos/precios.json', () => {
  it('todo importe del catálogo aparece literal en el listado', () => {
    for (const item of catalogo.items) {
      expect(crudo, `${item.nombre} (${item.id})`).toContain(`"${item.precioTexto}"`);
    }
  });

  it('lo que el cotizador escribe coincide con lo que el listado declara', () => {
    // Si estos dos textos se separan, el PDF diría una cifra y el listado
    // otra, y `herramientas/verificar.mjs` marcaría la del PDF como inventada.
    for (const item of catalogo.items) {
      expect(formato(item.precio), item.nombre).toBe(item.precioTexto);
    }
  });

  it('los costos de terceros de eBot también salen del listado', () => {
    expect(catalogo.costosDeEbot.length).toBeGreaterThan(0);
    for (const costo of catalogo.costosDeEbot) {
      expect(crudo).toContain(`"${costo.precioTexto}"`);
    }
  });
});

describe('la forma del listado', () => {
  it('trae los cuatro planes web, con rondas y con plazo', () => {
    const planes = itemsDe('web');
    expect(planes).toHaveLength(4);
    for (const plan of planes) {
      expect(plan.entrega, plan.nombre).toBeTruthy();
      expect(typeof plan.rondas, plan.nombre).toBe('number');
      expect(typeof plan.editablePorCliente, plan.nombre).toBe('boolean');
    }
  });

  it('trae las seis capacidades avanzadas, cada una con qué consigue el cliente', () => {
    const capacidades = itemsDe('capacidad');
    expect(capacidades).toHaveLength(6);
    for (const capacidad of capacidades) {
      expect(capacidad.queConsigue, capacidad.nombre).toBeTruthy();
    }
  });

  it('trae los tres tramos de la Auditoría y los dos mensuales de seguridad', () => {
    expect(itemsDe('auditoria')).toHaveLength(3);
    expect(itemsDe('seguridad')).toHaveLength(2);
  });

  it('trae los tres planes de Care, todos mensuales', () => {
    const care = itemsDe('care');
    expect(care).toHaveLength(3);
    for (const plan of care) expect(plan.recurrencia).toBe('mensual');
  });

  it('ningún item se queda sin precio', () => {
    for (const item of catalogo.items) {
      expect(item.precio.min, item.nombre).toBeGreaterThan(0);
      expect(item.precio.max, item.nombre).toBeGreaterThanOrEqual(item.precio.min);
    }
  });

  it('ningún id se repite', () => {
    const ids = catalogo.items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('las relaciones entre productos', () => {
  it('reservas, portal y panel exigen Corporate', () => {
    for (const id of ['cap-reservas', 'cap-portal', 'cap-panel']) {
      expect(itemDe(id)?.planMinimo, id).toBe('corporate');
    }
  });

  it('el control de inventario viene dentro de Commerce', () => {
    expect(itemDe('cap-inventario')?.incluidoDesde).toBe('commerce');
  });

  it('los dos mensuales de seguridad exigen la Auditoría', () => {
    for (const plan of itemsDe('seguridad')) {
      expect(plan.requiere?.familia, plan.nombre).toBe('auditoria');
    }
  });

  it('Start y Launch no dejan al cliente editar; Corporate y Commerce sí', () => {
    expect(itemDe('web-start')?.editablePorCliente).toBe(false);
    expect(itemDe('web-launch')?.editablePorCliente).toBe(false);
    expect(itemDe('web-corporate')?.editablePorCliente).toBe(true);
    expect(itemDe('web-commerce')?.editablePorCliente).toBe(true);
  });

  it('el único descuento del catálogo es el anual de Care', () => {
    expect(catalogo.descuentoAnualCare).toContain('dos meses gratis');
  });
});

describe('el idioma de cada texto', () => {
  it('cada plan web dice qué consigue el cliente, y no se queda en blanco', () => {
    for (const plan of itemsDe('web')) {
      expect(plan.queConsigue, plan.nombre).toBeTruthy();
    }
  });

  it('el posicionamiento interno va aparte y no se cuela en lo que ve el cliente', () => {
    // `paraQuien` cita el precio de la competencia. Es útil para elegir el plan
    // y sería un despropósito impreso en una propuesta con el nombre del
    // negocio arriba, así que no puede ser lo mismo que `queConsigue`.
    for (const plan of itemsDe('web')) {
      expect(plan.paraQuien, plan.nombre).toBeTruthy();
      expect(plan.queConsigue, plan.nombre).not.toBe(plan.paraQuien);
    }
    expect(itemDe('web-corporate')?.queConsigue).not.toContain('WordPress');
  });
});
