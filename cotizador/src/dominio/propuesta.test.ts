import { describe, expect, it } from 'vitest';

import { catalogo, itemDe } from './catalogo';
import { NO_INCLUYE_SIEMPRE } from '../datos/textos';
import { formato, formatoMensual } from './dinero';
import {
  fronterasDe,
  lineaDesde,
  noIncluyeDe,
  planDe,
  plazosDe,
  rondasDe,
  totalesDe,
} from './propuesta';
import type { Item, Linea } from './tipos';

let n = 0;
const linea = (id: string, cambios: Partial<Linea> = {}): Linea => {
  const item = itemDe(id);
  if (!item) throw new Error(`No existe el item ${id}`);
  return { ...lineaDesde(item, `l${++n}`), ...cambios };
};

const totales = (lineas: Linea[]) => totalesDe(lineas, catalogo.costosDeEbot);

describe('regla 2 · un pago único y uno mensual nunca se suman', () => {
  const lineas = [linea('web-corporate'), linea('care-base')];

  it('devuelve los dos totales por separado', () => {
    const t = totales(lineas);
    expect(formato(t.unico)).toBe('$850');
    expect(formatoMensual(t.mensual)).toBe('$35/mes');
  });

  it('no existe ningún campo donde quepa la suma', () => {
    // La regla escrita en el sistema de tipos: mientras `Totales` no tenga un
    // `total`, ninguna pantalla puede enseñar $885 por descuido.
    expect(Object.keys(totales(lineas)).sort()).toEqual(['mensual', 'terceros', 'unico']);
  });

  it('un plan con capacidad suma en el único y deja el mensual a cero', () => {
    const t = totales([linea('web-corporate'), linea('cap-reservas')]);
    expect(formato(t.unico)).toBe('$1,450');
    expect(t.mensual).toEqual({ min: 0, max: 0 });
  });

  it('los rangos sobreviven a la suma, enteros', () => {
    const t = totales([linea('seg-protegida'), linea('care-pro')]);
    // $30–$60 + $75 = $105–$135. Ni «$105» ni «desde $105»: el rango entero.
    expect(formatoMensual(t.mensual)).toBe('$105–$135/mes');
  });
});

describe('los costos de terceros', () => {
  it('aparecen solo si la propuesta lleva eBot', () => {
    expect(totales([linea('web-start')]).terceros).toHaveLength(0);
    expect(totales([linea('ebot')]).terceros.length).toBeGreaterThan(0);
  });

  it('no entran en ninguno de los dos totales de PanaClaw', () => {
    const t = totales([linea('ebot')]);
    expect(formato(t.unico)).toBe('$499');
    expect(t.mensual).toEqual({ min: 0, max: 0 });
  });
});

describe('las líneas incluidas', () => {
  it('se enseñan pero no suman', () => {
    const t = totales([linea('web-commerce'), linea('cap-inventario', { incluida: true })]);
    expect(formato(t.unico)).toBe('$1,200');
  });

  it('el inventario entra marcado solo si el plan ya lo trae', () => {
    const commerce = itemDe('web-commerce') as Item;
    const corporate = itemDe('web-corporate') as Item;
    const inventario = itemDe('cap-inventario') as Item;
    expect(lineaDesde(inventario, 'x', commerce).incluida).toBe(true);
    expect(lineaDesde(inventario, 'x', corporate).incluida).toBe(false);
  });
});

describe('el plan', () => {
  it('con dos planes manda el mayor', () => {
    expect(planDe([linea('web-start'), linea('web-corporate')])?.id).toBe('web-corporate');
  });

  it('sin plan web no hay plan', () => {
    expect(planDe([linea('ebot')])).toBeUndefined();
  });
});

describe('plazos y rondas', () => {
  it('web y eBot dan dos plazos, no uno fundido', () => {
    const plazos = plazosDe([linea('web-corporate'), linea('ebot')]);
    expect(plazos).toHaveLength(2);
    expect(plazos.map((p) => p.cuando)).toEqual(['8–12 días', '3–5 días']);
  });

  it('los mensuales no tienen plazo: empiezan, no se entregan', () => {
    expect(plazosDe([linea('care-pro')])).toHaveLength(0);
  });

  it('las rondas salen del plan y la extra del listado', () => {
    expect(rondasDe([linea('web-corporate')])).toEqual({
      incluidas: 3,
      plan: 'Corporate',
      extra: '$40',
    });
  });

  it('Start no trae rondas, y lo dice con un cero, no con un hueco', () => {
    expect(rondasDe([linea('web-start')])?.incluidas).toBe(0);
  });
});

describe('el «qué NO incluye»', () => {
  it('lleva siempre las tres exclusiones del catálogo entero', () => {
    const lista = noIncluyeDe([linea('web-corporate')]);
    for (const punto of NO_INCLUYE_SIEMPRE) expect(lista).toContain(punto);
  });

  it('en Start y Launch avisa sola de que no hay panel de edición', () => {
    const conPanel = (lineas: Linea[]) =>
      noIncluyeDe(lineas).some((p) => p.includes('panel para editar'));
    expect(conPanel([linea('web-start')])).toBe(true);
    expect(conPanel([linea('web-launch')])).toBe(true);
    expect(conPanel([linea('web-corporate')])).toBe(false);
  });

  it('eBot arrastra que no reemplaza un sitio', () => {
    expect(noIncluyeDe([linea('ebot')]).join(' ')).toContain('no reemplaza tu sitio');
  });

  it('no repite una viñeta porque haya dos capacidades', () => {
    const lista = noIncluyeDe([linea('web-corporate'), linea('cap-reservas'), linea('cap-portal')]);
    expect(new Set(lista).size).toBe(lista.length);
  });

  it('el «no» de Google viene con su «sí», que es la regla de adn/06-claridad.md', () => {
    const google = noIncluyeDe([linea('web-corporate')]).find((p) =>
      p.startsWith('Posicionamiento en Google'),
    );
    expect(google).toBeDefined();
    expect(google).toContain('listo para que Google lo entienda');
  });

  it('lo que añade el asesor va al final y sin duplicar', () => {
    const yaEstaba = NO_INCLUYE_SIEMPRE[0]!;
    const lista = noIncluyeDe([linea('web-start')], ['Traducción al inglés', yaEstaba]);
    expect(lista.at(-1)).toBe('Traducción al inglés');
    expect(lista.filter((p) => p === yaEstaba)).toHaveLength(1);
  });
});

describe('las fronteras', () => {
  it('Care junto a Seguridad dispara la frase oficial', () => {
    const frases = fronterasDe([linea('care-base'), linea('seg-protegida'), linea('aud-medio')]);
    expect(frases.join(' ')).toContain('Care mantiene la infraestructura');
  });

  it('Diagnóstico junto a Auditoría dispara la suya', () => {
    const frases = fronterasDe([linea('diagnostico'), linea('aud-chico')]);
    expect(frases.join(' ')).toContain('Se parecen en la forma y en nada más');
  });

  it('un mensual de seguridad siempre recuerda que la Auditoría va aparte', () => {
    expect(fronterasDe([linea('seg-blindada'), linea('aud-tienda')]).join(' ')).toContain(
      'se paga siempre, y aparte',
    );
  });

  it('una propuesta de solo web no lleva ninguna: el relleno no se lee', () => {
    expect(fronterasDe([linea('web-corporate')])).toHaveLength(0);
  });
});
