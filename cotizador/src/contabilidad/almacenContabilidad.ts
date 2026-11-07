/**
 * La contabilidad contra el Worker del hub. Solo hay versión de servidor, por la
 * misma razón que los cobros: un libro guardado en el navegador de alguien no es
 * un libro.
 */

import type { ContabilidadDelPeriodo, EstadoDeCierre, NuevoGasto } from '../../../compartido/contabilidad';
import { BASE, consulta, pedir } from '../api/pedir';

export const almacenContabilidad = {
  periodo: (desde: string, hasta: string): Promise<ContabilidadDelPeriodo> =>
    pedir<ContabilidadDelPeriodo>(`${BASE}/contabilidad${consulta({ desde, hasta })}`),

  registrarGasto: (gasto: NuevoGasto): Promise<unknown> =>
    pedir(`${BASE}/gastos`, { method: 'POST', body: JSON.stringify(gasto) }),

  cierre: (mes: string): Promise<EstadoDeCierre> =>
    pedir<EstadoDeCierre>(`${BASE}/contabilidad/cierre${consulta({ mes })}`),

  cerrarMes: (mes: string, nota: string): Promise<EstadoDeCierre> =>
    pedir<EstadoDeCierre>(`${BASE}/contabilidad/cerrar`, { method: 'POST', body: JSON.stringify({ mes, nota }) }),

  reabrirMes: (mes: string, motivo: string): Promise<EstadoDeCierre> =>
    pedir<EstadoDeCierre>(`${BASE}/contabilidad/reabrir`, { method: 'POST', body: JSON.stringify({ mes, motivo }) }),

  corregirGasto: (id: number, motivo: string): Promise<unknown> =>
    pedir(`${BASE}/gastos/${id}/corregir`, { method: 'POST', body: JSON.stringify({ motivo }) }),
};
