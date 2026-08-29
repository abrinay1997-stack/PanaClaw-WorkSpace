import { beforeEach, describe, expect, it } from 'vitest';

import { itemDe } from '../dominio/catalogo';
import { lineaDesde } from '../dominio/propuesta';
import type { Linea, Propuesta } from '../dominio/tipos';
import { FalloApi } from '../api/fallo';
import { almacenLocal } from './almacenLocal';

/** `localStorage` de mentira: las pruebas corren en Node, no en un navegador. */
const memoria = new Map<string, string>();
globalThis.localStorage = {
  getItem: (k: string) => memoria.get(k) ?? null,
  setItem: (k: string, v: string) => void memoria.set(k, v),
  removeItem: (k: string) => void memoria.delete(k),
  clear: () => memoria.clear(),
  key: (i: number) => [...memoria.keys()][i] ?? null,
  get length() {
    return memoria.size;
  },
} as Storage;

let n = 0;
const linea = (id: string): Linea => lineaDesde(itemDe(id)!, `l${++n}`);

const propuesta = (cambios: Partial<Propuesta> = {}): Propuesta => ({
  numero: '',
  fecha: '2026-08-23',
  asesor: 'Ana',
  necesita: 'Quiere vender sin depender de las redes.',
  catalogoVersion: 'prueba',
  cliente: {
    negocio: 'Repuestos El Chorrillo',
    contacto: 'Luis',
    whatsapp: '',
    correo: '',
    ciudad: 'Panamá',
  },
  lineas: [linea('web-corporate'), linea('care-base')],
  condiciones: { validezDias: 15, noIncluyeExtra: [], observaciones: '' },
  ...cambios,
});

beforeEach(() => memoria.clear());

describe('el consecutivo de la vista previa', () => {
  it('va marcado como demostración, para que ningún PDF se confunda', async () => {
    expect((await almacenLocal.registrar(propuesta())).numero).toBe('PROP-DEMO-0001');
    expect((await almacenLocal.registrar(propuesta())).numero).toBe('PROP-DEMO-0002');
  });

  it('reemitir la misma propuesta no gasta número', async () => {
    const { numero } = await almacenLocal.registrar(propuesta());
    const otra = await almacenLocal.registrar(propuesta({ numero }));
    expect(otra.numero).toBe(numero);
    expect((await almacenLocal.listar({})).cuantas).toBe(1);
  });
});

describe('el listado', () => {
  it('enseña los dos totales por separado, nunca sumados', async () => {
    await almacenLocal.registrar(propuesta());
    const [fila] = (await almacenLocal.listar({})).propuestas;
    // PanaClaw Corporate de una vez, Care cada mes. Los dos importes viajan
    // enteros y separados: no hay ningún campo donde quepa su suma.
    expect(fila?.unico).toEqual({ min: 850, max: 850 });
    expect(fila?.mensual).toEqual({ min: 35, max: 35 });
    expect(fila).not.toHaveProperty('total');
  });

  it('las sumas de la página también van en dos, y sin campo para juntarlas', async () => {
    await almacenLocal.registrar(propuesta());
    await almacenLocal.registrar(propuesta());
    const { sumas } = await almacenLocal.listar({});
    expect(sumas.unico).toEqual({ min: 1700, max: 1700 });
    expect(sumas.mensual).toEqual({ min: 70, max: 70 });
    expect(sumas).not.toHaveProperty('total');
  });

  it('una propuesta sin parte mensual la trae en cero, no la inventa', async () => {
    await almacenLocal.registrar(propuesta({ lineas: [linea('web-start')] }));
    const [fila] = (await almacenLocal.listar({})).propuestas;
    expect(fila?.mensual).toEqual({ min: 0, max: 0 });
  });

  it('busca por número, negocio y contacto', async () => {
    await almacenLocal.registrar(propuesta());
    expect((await almacenLocal.listar({ texto: 'chorrillo' })).cuantas).toBe(1);
    expect((await almacenLocal.listar({ texto: '0001' })).cuantas).toBe(1);
    expect((await almacenLocal.listar({ texto: 'nadie' })).cuantas).toBe(0);
  });

  it('filtra por estado', async () => {
    const { numero } = await almacenLocal.registrar(propuesta());
    await almacenLocal.marcar(numero, 'aceptada', 'Firmó el viernes.');
    expect((await almacenLocal.listar({ estado: 'aceptada' })).cuantas).toBe(1);
    expect((await almacenLocal.listar({ estado: 'perdida' })).cuantas).toBe(0);
  });
});

describe('la papelera', () => {
  it('eliminar la saca del historial pero no la borra', async () => {
    const { numero } = await almacenLocal.registrar(propuesta());

    await almacenLocal.eliminar({ numeros: [numero] });

    expect((await almacenLocal.listar({})).cuantas).toBe(0);
    expect((await almacenLocal.listar({ papelera: true })).cuantas).toBe(1);
    // El documento sigue entero: se puede volver a bajar su PDF.
    expect((await almacenLocal.abrir(numero)).documento.lineas).toHaveLength(2);
  });

  it('restaurar la devuelve tal como estaba', async () => {
    const { numero } = await almacenLocal.registrar(propuesta());
    await almacenLocal.eliminar({ numeros: [numero] });
    await almacenLocal.restaurar({ numeros: [numero] });
    expect((await almacenLocal.listar({})).cuantas).toBe(1);
  });

  it('purgar solo alcanza lo que ya está en la papelera', async () => {
    const { numero } = await almacenLocal.registrar(propuesta());

    // Sin pasar por la papelera, el borrado definitivo no toca nada. Es la
    // misma regla que impone el servidor, diga lo que diga quien llame.
    expect(await almacenLocal.purgar({ numeros: [numero] })).toEqual({ cuantas: 0 });
    expect((await almacenLocal.listar({})).cuantas).toBe(1);

    await almacenLocal.eliminar({ numeros: [numero] });
    expect(await almacenLocal.purgar({ numeros: [numero] })).toEqual({ cuantas: 1 });
    await expect(almacenLocal.abrir(numero)).rejects.toBeInstanceOf(FalloApi);
  });

  it('reemitir una propuesta retirada la saca de la papelera', async () => {
    const { numero } = await almacenLocal.registrar(propuesta());
    await almacenLocal.eliminar({ numeros: [numero] });

    await almacenLocal.registrar(propuesta({ numero }));

    expect((await almacenLocal.listar({})).cuantas).toBe(1);
    expect((await almacenLocal.listar({ papelera: true })).cuantas).toBe(0);
  });
});

describe('reabrir', () => {
  it('devuelve el documento entero, no un resumen', async () => {
    const { numero } = await almacenLocal.registrar(propuesta());
    const guardada = await almacenLocal.abrir(numero);
    expect(guardada.documento.lineas).toHaveLength(2);
    expect(guardada.documento.necesita).toContain('sin depender de las redes');
  });

  it('un número que no existe falla con un mensaje que se puede enseñar', async () => {
    await expect(almacenLocal.abrir('PROP-2026-9999')).rejects.toBeInstanceOf(FalloApi);
  });
});
