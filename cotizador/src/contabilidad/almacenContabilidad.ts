/**
 * La contabilidad contra el Worker del hub. Solo hay versión de servidor, por la
 * misma razón que los cobros: un libro guardado en el navegador de alguien no es
 * un libro.
 */

import type { ContabilidadDelPeriodo, NuevoGasto } from '../../../compartido/contabilidad';
import { BASE, consulta, pedir } from '../api/pedir';

export const almacenContabilidad = {
  periodo: (desde: string, hasta: string): Promise<ContabilidadDelPeriodo> =>
    pedir<ContabilidadDelPeriodo>(`${BASE}/contabilidad${consulta({ desde, hasta })}`),

  registrarGasto: (gasto: NuevoGasto): Promise<unknown> =>
    pedir(`${BASE}/gastos`, { method: 'POST', body: JSON.stringify(gasto) }),

  corregirGasto: (id: number, motivo: string): Promise<unknown> =>
    pedir(`${BASE}/gastos/${id}/corregir`, { method: 'POST', body: JSON.stringify({ motivo }) }),
};
