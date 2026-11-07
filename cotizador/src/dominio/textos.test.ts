import { describe, expect, it } from 'vitest';

import {
  CLAVES_DE_TEXTO,
  congelarTextos,
  conPlantilla,
  definicion,
  MAXIMO_TEXTO,
  rellenar,
  TEXTOS_EDITABLES,
  textoDe,
  validarTexto,
  variablesDe,
  vistaPrevia,
} from './textos';
import { itemDe } from './catalogo';
import { fronterasDe, lineaDesde, noIncluyeDe, plazosDe } from './propuesta';
import type { Linea, Propuesta } from './tipos';

let n = 0;
const linea = (id: string): Linea => lineaDesde(itemDe(id)!, `t${++n}`);

const propuesta = (lineas: Linea[], textos?: Record<string, string>): Propuesta => ({
  numero: '',
  fecha: '2026-11-07',
  asesor: 'Ana',
  necesita: '',
  catalogoVersion: 'prueba',
  cliente: { negocio: 'X', contacto: '', whatsapp: '', correo: '', ciudad: '' },
  lineas,
  condiciones: { validezDias: 15, noIncluyeExtra: [], observaciones: '' },
  ...(textos ? { textos } : {}),
});

describe('el registro de textos editables', () => {
  it('cada original pasa su propia validación: lo que sale hoy se puede guardar mañana', () => {
    for (const def of TEXTOS_EDITABLES) expect(validarTexto(def.clave, def.defecto), def.clave).toBeNull();
  });

  it('las claves no se repiten', () => {
    expect(new Set(CLAVES_DE_TEXTO).size).toBe(CLAVES_DE_TEXTO.length);
  });

  it('cada variable que usa un original está declarada en ese texto', () => {
    for (const def of TEXTOS_EDITABLES) {
      const declaradas = new Set(def.variables.map((v) => v.nombre));
      for (const usada of variablesDe(def.defecto)) expect(declaradas.has(usada), `${def.clave}: {${usada}}`).toBe(true);
    }
  });

  it('cubre las tres secciones que se piden: qué no incluye, plazo y cambios', () => {
    const claves = new Set(CLAVES_DE_TEXTO);
    for (const clave of ['noInc.siempre.1', 'noInc.web.1', 'noInc.sinPanel', 'plazoLinea', 'plazoDesde', 'cambiosConRondas', 'cambiosSinRondas']) {
      expect(claves.has(clave), clave).toBe(true);
    }
  });

  it('una descripción de producto por cada producto del catálogo que la tiene', () => {
    expect(definicion('item.ronda-extra')?.defecto).toContain('sin discusión');
    expect(definicion('item.web-start')).toBeDefined();
  });
});

describe('leer un texto', () => {
  it('sin edición vale su original, con las variables rellenas', () => {
    expect(textoDe('cambiosConRondas', undefined, { plan: 'Corporate', rondas: 3, rondasPalabra: 'rondas', extra: '$40' })).toBe(
      'Corporate incluye 3 rondas de cambios. La ronda extra cuesta $40, sin discusión y sin mala cara.',
    );
  });

  it('con edición vale la edición', () => {
    const t = { cambiosConRondas: '{plan} incluye {rondas} {rondasPalabra} de cambios; cada ronda adicional se cotiza en {extra}.' };
    expect(textoDe('cambiosConRondas', t, { plan: 'Corporate', rondas: 1, rondasPalabra: 'ronda', extra: '$40' })).toBe(
      'Corporate incluye 1 ronda de cambios; cada ronda adicional se cotiza en $40.',
    );
  });

  it('un texto vacío o en blanco vuelve al original', () => {
    expect(textoDe('plazoDesde', { plazoDesde: '   ' })).toContain('El reloj empieza');
  });

  it('nunca imprime un hueco: si el texto pide algo que no llega, vuelve al original', () => {
    const roto = textoDe('cambiosSinRondas', { cambiosSinRondas: 'Cuesta {inventada}' }, { plan: 'Start', extra: '$40' });
    expect(roto).not.toContain('{');
    expect(roto).toContain('Start no trae rondas de cambios');
  });

  it('una clave que no existe es un error de programación, no un texto vacío', () => {
    expect(() => textoDe('nada', undefined)).toThrow(/No existe/);
  });

  it('rellenar deja intacto lo que no conoce', () => {
    expect(rellenar('a {x} b {y}', { x: 1 })).toBe('a 1 b {y}');
  });
});

describe('qué se puede guardar', () => {
  it('rechaza un importe tecleado a mano, y dice cómo hacerlo bien', () => {
    const problema = validarTexto('cambiosConRondas', 'La ronda extra cuesta $40.');
    expect(problema).toMatch(/importe a mano/);
    expect(problema).toContain('{extra}');
  });

  it('rechaza cifras sueltas también en un texto sin variables', () => {
    expect(validarTexto('condCodigo', 'Pagas $100 y el código es tuyo.')).toMatch(/no lleva cifras/);
  });

  it('rechaza una variable que no existe en ese texto, listando las que sí', () => {
    const problema = validarTexto('cambiosConRondas', 'Cuesta {precio}');
    expect(problema).toMatch(/\{precio\}/);
    expect(problema).toContain('{extra}');
  });

  it('rechaza un texto vacío (para volver al original está «Restaurar») y uno larguísimo', () => {
    expect(validarTexto('condCodigo', '   ')).toMatch(/vacío/);
    expect(validarTexto('condCodigo', 'a'.repeat(MAXIMO_TEXTO + 1))).toMatch(/demasiado largo/);
    expect(validarTexto('condCodigo', 'a'.repeat(MAXIMO_TEXTO))).toBeNull();
  });

  it('acepta cambiar solo el tono: es lo que se quería poder hacer', () => {
    expect(
      validarTexto(
        'cambiosConRondas',
        '{plan} incluye {rondas} {rondasPalabra} de cambios. Las rondas adicionales se cotizan a {extra} cada una.',
      ),
    ).toBeNull();
  });

  it('una clave inexistente no se guarda', () => {
    expect(validarTexto('nada', 'hola')).toMatch(/no existe/);
  });
});

describe('la vista previa', () => {
  it('usa valores de muestra para que se lea como se leerá', () => {
    const def = definicion('cambiosConRondas')!;
    expect(vistaPrevia(def, def.defecto)).toBe(
      'Corporate incluye 3 rondas de cambios. La ronda extra cuesta $40, sin discusión y sin mala cara.',
    );
  });
});

describe('las secciones leen los textos editados', () => {
  const t = (cambios: Record<string, string>) => cambios;

  it('«Qué NO incluye»: cada viñeta se puede reescribir, y la viñeta sigue saliendo', () => {
    const base = noIncluyeDe([linea('web-start')]);
    const editado = noIncluyeDe([linea('web-start')], [], t({ 'noInc.siempre.1': 'Redacción de los textos de tu negocio' }));
    expect(editado).toHaveLength(base.length);
    expect(editado).toContain('Redacción de los textos de tu negocio');
    expect(editado).not.toContain(base[0]);
  });

  it('la exclusión del panel sale sola y también se puede reescribir', () => {
    const editado = noIncluyeDe([linea('web-start')], [], t({ 'noInc.sinPanel': 'Edición de contenido por tu cuenta' }));
    expect(editado).toContain('Edición de contenido por tu cuenta');
  });

  it('«Plazo»: la línea de cada producto se reescribe y el plazo sale del catálogo', () => {
    const [plazo] = plazosDe([linea('web-corporate')], t({ plazoLinea: 'Entrega de {producto}: {plazo}' }));
    expect(plazo?.linea).toBe(`Entrega de ${plazo?.que}: ${plazo?.cuando}`);
    expect(plazo?.cuando).toMatch(/días/);
  });

  it('«Qué es cada cosa»: las frases de frontera se reescriben', () => {
    const lineas = [linea('care-base'), linea('aud-chico'), linea('seg-protegida')];
    const editado = fronterasDe(lineas, t({ 'frontera.careNoEsSeguridad': 'Care cuida el sitio; Seguridad cuida los accesos.' }));
    expect(editado).toContain('Care cuida el sitio; Seguridad cuida los accesos.');
  });
});

describe('congelar los textos al emitir', () => {
  it('guarda TODAS las claves, con el texto de hoy', () => {
    const congelada = congelarTextos(propuesta([linea('web-start')]), { plazoDesde: 'El plazo empieza al recibir el material y el anticipo.' });
    expect(Object.keys(congelada.textos!).sort()).toEqual([...CLAVES_DE_TEXTO].sort());
    expect(congelada.textos!.plazoDesde).toBe('El plazo empieza al recibir el material y el anticipo.');
    // Lo que no se editó queda con su original de hoy.
    expect(congelada.textos!.condCodigo).toBe(definicion('condCodigo')!.defecto);
  });

  it('los retoques de la propuesta mandan sobre la plantilla', () => {
    const congelada = congelarTextos(propuesta([linea('web-start')], { condRemoto: 'Retoque de esta propuesta.' }), {
      condRemoto: 'Plantilla del equipo.',
    });
    expect(congelada.textos!.condRemoto).toBe('Retoque de esta propuesta.');
  });

  it('lo congelado no cambia aunque la plantilla cambie después', () => {
    const emitida = congelarTextos(propuesta([linea('web-start')]), { condRemoto: 'Como estaba el día que se emitió.' });
    // Mañana el equipo reescribe la plantilla…
    const mañana = conPlantilla(emitida, { condRemoto: 'Texto nuevo de la plantilla.' });
    // …y el documento emitido sigue diciendo lo de ese día.
    expect(textoDe('condRemoto', mañana.textos)).toBe('Como estaba el día que se emitió.');
  });

  it('un texto guardado que ya no es válido se congela como su original, nunca roto', () => {
    const congelada = congelarTextos(propuesta([linea('web-start')]), { cambiosSinRondas: 'Cuesta {ya_no_existe}' });
    expect(congelada.textos!.cambiosSinRondas).toBe(definicion('cambiosSinRondas')!.defecto);
  });
});
