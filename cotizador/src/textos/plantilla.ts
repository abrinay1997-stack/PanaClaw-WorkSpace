/**
 * La plantilla de textos del equipo, en memoria.
 *
 * Se pide una vez al abrir el cotizador y se guarda aquí, para que el PDF, el
 * mensaje y las listas de la pantalla la lean sin esperar a la red cada vez. Si el
 * servidor no contesta, la plantilla queda vacía y todo vale su original: un fallo
 * de red nunca puede dejar una propuesta sin condiciones.
 */

import { useSyncExternalStore } from 'react';

import type { PlantillaDeTextos } from '../../../compartido/textos';
import { ES_DEMOSTRACION } from '../api/pedir';
import type { Textos } from '../dominio/textos';
import { almacenTextos } from './almacenTextos';

const VACIA: Textos = {};
let actual: Textos = VACIA;
let ediciones: PlantillaDeTextos['ediciones'] = [];
const oyentes = new Set<() => void>();

const avisar = () => oyentes.forEach((oyente) => oyente());

/** La plantilla de ahora mismo, sin esperar. Para las salidas (PDF, mensaje). */
export const plantillaActual = (): Textos => actual;

export function fijarPlantilla(datos: PlantillaDeTextos): void {
  actual = datos.textos;
  ediciones = datos.ediciones;
  avisar();
}

/** Pide la plantilla al servidor. Si falla, se queda con lo que había (los originales). */
export async function cargarPlantilla(): Promise<void> {
  if (ES_DEMOSTRACION) return;
  try {
    fijarPlantilla(await almacenTextos.listar());
  } catch {
    // Sin plantilla se trabaja con los originales.
  }
}

/**
 * Lo mismo, pero sin tragarse el fallo.
 *
 * Se usa justo antes de emitir: congelar la propuesta con los originales porque la
 * red falló un momento —cuando el equipo tiene una plantilla distinta— sacaría un
 * documento con otra redacción sin avisar. Emitir ya necesita red, así que fallar
 * aquí no quita nada que no se fuera a perder igual.
 */
export async function refrescarPlantilla(): Promise<void> {
  if (ES_DEMOSTRACION) return;
  fijarPlantilla(await almacenTextos.listar());
}

const suscribir = (oyente: () => void) => {
  oyentes.add(oyente);
  return () => void oyentes.delete(oyente);
};

/** La plantilla, y la pantalla se vuelve a dibujar cuando cambia. */
export const usePlantilla = (): Textos => useSyncExternalStore(suscribir, plantillaActual);

/** Quién cambió cada texto de la plantilla y cuándo. */
export const useEdiciones = (): PlantillaDeTextos['ediciones'] =>
  useSyncExternalStore(suscribir, () => ediciones);
