/**
 * El historial compartido: el Worker del hub y su base.
 *
 * Es el que se usa en el hub publicado. Todo lo que hace es traducir las
 * operaciones del contrato a direcciones; quien decide qué se guarda y qué
 * número toca es el servidor, y a propósito: el consecutivo tiene que ser uno
 * solo para todo el equipo.
 */

import type { Propuesta } from '../dominio/tipos';
import { BASE, consulta, pedir } from '../api/pedir';
import type {
  Almacen,
  Cuantas,
  Emitida,
  Estado,
  FiltroHistorial,
  PaginaHistorial,
  PropuestaGuardada,
  Seleccion,
} from './contrato';

export const almacenApi: Almacen = {
  async registrar(propuesta: Propuesta): Promise<Emitida> {
    // Con número es una reemisión y va por PUT; sin número, el consecutivo lo
    // asigna la base. El número **no se puede saber por adelantado**: depende
    // de quién emita primero.
    const tiene = propuesta.numero.trim();
    return pedir<Emitida>(
      tiene ? `${BASE}/propuestas/${encodeURIComponent(tiene)}` : `${BASE}/propuestas`,
      { method: tiene ? 'PUT' : 'POST', body: JSON.stringify(propuesta) },
    );
  },

  listar(filtro: FiltroHistorial): Promise<PaginaHistorial> {
    return pedir<PaginaHistorial>(`${BASE}/propuestas${consulta({ ...filtro })}`);
  },

  abrir(numero: string): Promise<PropuestaGuardada<Propuesta>> {
    return pedir<PropuestaGuardada<Propuesta>>(`${BASE}/propuestas/${encodeURIComponent(numero)}`);
  },

  async marcar(numero: string, estado: Estado, nota: string): Promise<void> {
    await pedir(`${BASE}/propuestas/${encodeURIComponent(numero)}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado, nota }),
    });
  },

  eliminar(seleccion: Seleccion): Promise<Cuantas> {
    return pedir<Cuantas>(`${BASE}/propuestas/eliminar`, {
      method: 'POST',
      body: JSON.stringify(seleccion),
    });
  },

  restaurar(seleccion: Seleccion): Promise<Cuantas> {
    return pedir<Cuantas>(`${BASE}/propuestas/restaurar`, {
      method: 'POST',
      body: JSON.stringify(seleccion),
    });
  },

  purgar(seleccion: Seleccion): Promise<Cuantas> {
    return pedir<Cuantas>(`${BASE}/propuestas/purgar`, {
      method: 'POST',
      body: JSON.stringify(seleccion),
    });
  },
};
