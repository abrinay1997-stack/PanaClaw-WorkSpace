/**
 * Los cobros contra el Worker del hub. Solo hay versión de servidor: un libro
 * de cobros guardado en el navegador de alguien no es un libro, es un recuerdo.
 */

import type { LibroDeCobros, NuevoCobro } from '../../../compartido/cobros';
import { BASE, pedir } from '../api/pedir';

const base = (numero: string): string => `${BASE}/propuestas/${encodeURIComponent(numero)}/cobros`;

export const almacenCobros = {
  listar: (numero: string): Promise<LibroDeCobros> => pedir<LibroDeCobros>(base(numero)),

  registrar: (numero: string, cobro: NuevoCobro): Promise<LibroDeCobros> =>
    pedir<LibroDeCobros>(base(numero), { method: 'POST', body: JSON.stringify(cobro) }),

  corregir: (numero: string, id: number, motivo: string): Promise<LibroDeCobros> =>
    pedir<LibroDeCobros>(`${base(numero)}/${id}/corregir`, {
      method: 'POST',
      body: JSON.stringify({ motivo }),
    }),
};
