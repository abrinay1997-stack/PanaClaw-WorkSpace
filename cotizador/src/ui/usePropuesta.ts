/**
 * El estado de la propuesta en construcción.
 *
 * Un reductor y no un puñado de `useState`: casi todos los cambios tocan más de
 * una cosa a la vez —añadir una capacidad puede marcarla como incluida, cambiar
 * de plan puede dejar una capacidad huérfana— y con estados sueltos esas
 * consecuencias se escriben en el manejador de cada botón, o se olvidan en uno.
 *
 * El borrador se guarda solo. Cerrar la pestaña por accidente no puede costar
 * el trabajo hecho.
 */

import { useEffect, useMemo, useReducer } from 'react';

import { catalogo, itemDe } from '../dominio/catalogo';
import { hoyISO } from '../dominio/formato';
import { lineaDesde, planDe, totalesDe } from '../dominio/propuesta';
import { revisar } from '../dominio/revision';
import type { Item, Linea, Propuesta } from '../dominio/tipos';

const BORRADOR = 'panaclaw-cotizador:borrador';

export type Accion =
  | { tipo: 'agregar'; item: Item }
  | { tipo: 'quitar'; lineaId: string }
  | { tipo: 'editarLinea'; lineaId: string; cambios: Partial<Linea> }
  | { tipo: 'cliente'; cambios: Partial<Propuesta['cliente']> }
  | { tipo: 'necesita'; texto: string }
  | { tipo: 'asesor'; nombre: string }
  | { tipo: 'condiciones'; cambios: Partial<Propuesta['condiciones']> }
  | { tipo: 'numeroAsignado'; numero: string }
  | { tipo: 'cargar'; propuesta: Propuesta }
  | { tipo: 'reiniciar' };

export function propuestaVacia(): Propuesta {
  return {
    numero: '',
    fecha: hoyISO(),
    asesor: '',
    necesita: '',
    catalogoVersion: catalogo.version,
    cliente: { negocio: '', contacto: '', whatsapp: '', correo: '', ciudad: 'Ciudad de Panamá' },
    lineas: [],
    condiciones: { validezDias: 15, noIncluyeExtra: [], observaciones: '' },
  };
}

const nuevoId = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `l${Date.now()}${Math.random().toString(16).slice(2)}`;

function reducir(propuesta: Propuesta, accion: Accion): Propuesta {
  switch (accion.tipo) {
    case 'agregar': {
      // Un item que ya está no se duplica, salvo los repetibles: dos rondas
      // extra son dos rondas, dos «PanaClaw Corporate» son un error.
      const yaEsta = propuesta.lineas.some((l) => l.itemId === accion.item.id);
      if (yaEsta && !accion.item.repetible) return propuesta;
      return {
        ...propuesta,
        lineas: [
          ...propuesta.lineas,
          lineaDesde(accion.item, nuevoId(), planDe(propuesta.lineas)),
        ],
      };
    }

    case 'quitar':
      return { ...propuesta, lineas: propuesta.lineas.filter((l) => l.id !== accion.lineaId) };

    case 'editarLinea':
      return {
        ...propuesta,
        lineas: propuesta.lineas.map((l) =>
          l.id === accion.lineaId ? { ...l, ...accion.cambios } : l,
        ),
      };

    case 'cliente':
      return { ...propuesta, cliente: { ...propuesta.cliente, ...accion.cambios } };

    case 'necesita':
      return { ...propuesta, necesita: accion.texto };

    case 'asesor':
      return { ...propuesta, asesor: accion.nombre };

    case 'condiciones':
      return { ...propuesta, condiciones: { ...propuesta.condiciones, ...accion.cambios } };

    case 'numeroAsignado':
      return { ...propuesta, numero: accion.numero };

    case 'cargar':
      return accion.propuesta;

    case 'reiniciar':
      // El asesor se conserva: es de quien usa la herramienta, no de la
      // propuesta, y volver a escribirlo cada vez es la clase de fricción que
      // acaba dejándolo en blanco.
      return { ...propuestaVacia(), asesor: propuesta.asesor };
  }
}

function borradorGuardado(): Propuesta {
  try {
    const crudo = localStorage.getItem(BORRADOR);
    if (!crudo) return propuestaVacia();
    const guardado = JSON.parse(crudo) as Propuesta;
    // Se comprueba lo mínimo: un borrador de una versión vieja del formato no
    // puede dejar la herramienta en blanco al abrirla.
    if (!Array.isArray(guardado.lineas) || !guardado.cliente) return propuestaVacia();
    return { ...propuestaVacia(), ...guardado };
  } catch {
    return propuestaVacia();
  }
}

export function usePropuesta() {
  const [propuesta, despachar] = useReducer(reducir, undefined, borradorGuardado);

  useEffect(() => {
    try {
      localStorage.setItem(BORRADOR, JSON.stringify(propuesta));
    } catch {
      // Sin sitio para el borrador se sigue trabajando: lo que no se puede
      // perder es la propuesta emitida, y esa vive en el historial.
    }
  }, [propuesta]);

  const totales = useMemo(
    () => totalesDe(propuesta.lineas, catalogo.costosDeEbot),
    [propuesta.lineas],
  );
  const alertas = useMemo(() => revisar(propuesta), [propuesta]);
  const plan = useMemo(() => planDe(propuesta.lineas), [propuesta.lineas]);
  const itemsEnUso = useMemo(
    () => new Set(propuesta.lineas.map((l) => l.itemId)),
    [propuesta.lineas],
  );

  return { propuesta, despachar, totales, alertas, plan, itemsEnUso, itemDe };
}

export type EstadoPropuesta = ReturnType<typeof usePropuesta>;
