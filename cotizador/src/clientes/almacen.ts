/**
 * La libreta de clientes, contra el Worker del hub.
 *
 * Aquí no hay una implementación de mentira para la vista previa, y es
 * deliberado: el panel de clientes existe para que dos personas vean la misma
 * lista. Un panel que guardara las fichas en el navegador de cada quien
 * enseñaría exactamente lo contrario de lo que promete, y sería la clase de
 * demostración que se confunde con la herramienta. Sin servidor, la pantalla lo
 * dice y no ofrece nada.
 */

import type {
  Cliente,
  Coincidencia,
  CuantosClientes,
  DatosCliente,
  FiltroClientes,
  PaginaClientes,
  SeleccionClientes,
} from '../../../compartido/clientes';
import type { ActividadCliente } from '../../../compartido/actividad';
import type { Enlazada } from '../../../compartido/propuestas';
import { BASE, consulta, pedir } from '../api/pedir';

export const clientes = {
  listar(filtro: FiltroClientes): Promise<PaginaClientes> {
    return pedir<PaginaClientes>(`${BASE}/clientes${consulta({ ...filtro })}`);
  },

  abrir(codigo: string): Promise<Cliente> {
    return pedir<Cliente>(`${BASE}/clientes/${encodeURIComponent(codigo)}`);
  },

  crear(datos: DatosCliente): Promise<Cliente> {
    return pedir<Cliente>(`${BASE}/clientes`, { method: 'POST', body: JSON.stringify(datos) });
  },

  actualizar(codigo: string, datos: DatosCliente): Promise<Cliente> {
    return pedir<Cliente>(`${BASE}/clientes/${encodeURIComponent(codigo)}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
  },

  /**
   * «¿A éste ya lo tengo?».
   *
   * Se pregunta ANTES de guardar una ficha nueva. Lo que responde no decide
   * nada: el documento exacto basta para dar por hecho que es el mismo, y todo
   * lo demás obliga a preguntarle a quien está escribiendo.
   */
  coincidencia(clave: {
    documento?: string;
    whatsapp?: string;
    correo?: string;
    negocio?: string;
  }): Promise<{ coincidencia: Coincidencia | null }> {
    return pedir<{ coincidencia: Coincidencia | null }>(
      `${BASE}/clientes/coincidencia${consulta({ ...clave })}`,
    );
  },

  actividad(codigo: string): Promise<ActividadCliente> {
    return pedir<ActividadCliente>(`${BASE}/clientes/${encodeURIComponent(codigo)}/actividad`);
  },

  /** Enlaza a mano una propuesta que el servidor no quiso adivinar de quién era. */
  enlazar(codigo: string, numero: string): Promise<Enlazada> {
    return pedir<Enlazada>(`${BASE}/clientes/${encodeURIComponent(codigo)}/propuestas`, {
      method: 'POST',
      body: JSON.stringify({ numero }),
    });
  },

  eliminar(seleccion: SeleccionClientes): Promise<CuantosClientes> {
    return pedir<CuantosClientes>(`${BASE}/clientes/eliminar`, {
      method: 'POST',
      body: JSON.stringify(seleccion),
    });
  },

  restaurar(seleccion: SeleccionClientes): Promise<CuantosClientes> {
    return pedir<CuantosClientes>(`${BASE}/clientes/restaurar`, {
      method: 'POST',
      body: JSON.stringify(seleccion),
    });
  },

  purgar(seleccion: SeleccionClientes): Promise<CuantosClientes> {
    return pedir<CuantosClientes>(`${BASE}/clientes/purgar`, {
      method: 'POST',
      body: JSON.stringify(seleccion),
    });
  },
};
