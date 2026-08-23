/**
 * Qué le pide el cotizador al historial, sin decir quién lo cumple.
 *
 * Hoy lo cumple `almacenLocal.ts`, contra el navegador. Está separado de la
 * implementación porque el día que el historial pase a ser compartido —una
 * función de Netlify y un almacén detrás— la pantalla no tiene que enterarse:
 * cambia quién implementa esto y nada más. Escribir la pantalla contra
 * `localStorage` directamente es lo que obliga a reescribirla después.
 */

import type { Propuesta } from '../dominio/tipos';

/** En qué acabó una propuesta emitida. Es lo que hace que el historial se mire. */
export type Estado = 'emitida' | 'aceptada' | 'perdida';

export const ESTADOS: readonly Estado[] = ['emitida', 'aceptada', 'perdida'];

export interface PropuestaGuardada {
  readonly numero: string;
  readonly emitidaEn: string;
  readonly estado: Estado;
  readonly nota: string;
  /**
   * El documento entero, que es la fuente de verdad.
   *
   * Se guarda completo y no un resumen: al reabrirla se regenera un PDF
   * idéntico al que recibió el cliente, aunque `datos/precios.json` haya
   * cambiado diez veces desde entonces.
   */
  readonly documento: Propuesta;
}

export interface Resumen {
  readonly numero: string;
  readonly emitidaEn: string;
  readonly estado: Estado;
  readonly negocio: string;
  readonly contacto: string;
  /** Los dos totales, ya formateados. Nunca se funden en uno. */
  readonly unico: string;
  readonly mensual: string | null;
}

export interface Filtro {
  /** Número, negocio o contacto. */
  readonly busqueda?: string;
  readonly estado?: Estado | 'todas';
  readonly desde?: string;
  readonly hasta?: string;
}

export interface Almacen {
  /**
   * Guarda una propuesta emitida y devuelve su número.
   *
   * Sin número asignado, pide uno al consecutivo. Con número, actualiza la que
   * ya existe: bajar el PDF y después mandar el WhatsApp es una sola propuesta,
   * no dos.
   */
  registrar(propuesta: Propuesta): Promise<{ numero: string; emitidaEn: string }>;
  listar(filtro: Filtro): Promise<Resumen[]>;
  abrir(numero: string): Promise<PropuestaGuardada>;
  marcar(numero: string, estado: Estado, nota: string): Promise<void>;
  borrar(numero: string): Promise<void>;
}

/** Un fallo ya traducido a algo que se le puede enseñar a una persona. */
export class FalloHistorial extends Error {
  constructor(readonly mensaje: string) {
    super(mensaje);
    this.name = 'FalloHistorial';
  }
}
