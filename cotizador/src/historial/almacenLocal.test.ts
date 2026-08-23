import { beforeEach, describe, expect, it } from 'vitest';

import { itemDe } from '../dominio/catalogo';
import { lineaDesde } from '../dominio/propuesta';
import type { Linea, Propuesta } from '../dominio/tipos';
import { almacenLocal } from './almacenLocal';
import { FalloHistorial } from './contrato';

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
  cliente: { negocio: 'Repuestos El Chorrillo', contacto: 'Luis', whatsapp: '', correo: '', ciudad: 'Panamá' },
  lineas: [linea('web-corporate'), linea('care-base')],
  condiciones: { validezDias: 15, noIncluyeExtra: [], observaciones: '' },
  ...cambios,
});

beforeEach(() => memoria.clear());

describe('el consecutivo', () => {
  it('empieza en 0001 y avanza', async () => {
    expect((await almacenLocal.registrar(propuesta())).numero).toBe('PROP-2026-0001');
    expect((await almacenLocal.registrar(propuesta())).numero).toBe('PROP-2026-0002');
  });

  it('reemitir la misma propuesta no gasta número', async () => {
    const { numero } = await almacenLocal.registrar(propuesta());
    const otra = await almacenLocal.registrar(propuesta({ numero }));
    expect(otra.numero).toBe(numero);
    expect(await almacenLocal.listar({})).toHaveLength(1);
  });

  it('cada año arranca su propia serie', async () => {
    await almacenLocal.registrar(propuesta());
    expect((await almacenLocal.registrar(propuesta({ fecha: '2027-01-04' }))).numero).toBe(
      'PROP-2027-0001',
    );
  });
});

describe('el listado', () => {
  it('enseña los dos totales por separado, nunca sumados', async () => {
    await almacenLocal.registrar(propuesta());
    const [fila] = await almacenLocal.listar({});
    expect(fila?.unico).toBe('$850');
    expect(fila?.mensual).toBe('$35/mes');
  });

  it('una propuesta sin parte mensual no tiene mensual, no tiene un cero', async () => {
    await almacenLocal.registrar(propuesta({ lineas: [linea('web-start')] }));
    expect((await almacenLocal.listar({}))[0]?.mensual).toBeNull();
  });

  it('busca por número, negocio y contacto', async () => {
    await almacenLocal.registrar(propuesta());
    expect(await almacenLocal.listar({ busqueda: 'chorrillo' })).toHaveLength(1);
    expect(await almacenLocal.listar({ busqueda: '0001' })).toHaveLength(1);
    expect(await almacenLocal.listar({ busqueda: 'nadie' })).toHaveLength(0);
  });

  it('filtra por estado', async () => {
    const { numero } = await almacenLocal.registrar(propuesta());
    await almacenLocal.marcar(numero, 'aceptada', 'Firmó el viernes.');
    expect(await almacenLocal.listar({ estado: 'aceptada' })).toHaveLength(1);
    expect(await almacenLocal.listar({ estado: 'perdida' })).toHaveLength(0);
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
    await expect(almacenLocal.abrir('PROP-2026-9999')).rejects.toBeInstanceOf(FalloHistorial);
  });
});
