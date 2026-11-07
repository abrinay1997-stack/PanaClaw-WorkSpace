/**
 * La plantilla de textos contra el Worker del hub. Solo hay versión de servidor:
 * una plantilla guardada en el navegador de una persona no es del equipo.
 */

import type { PlantillaDeTextos } from '../../../compartido/textos';
import { BASE, pedir } from '../api/pedir';

export const almacenTextos = {
  listar: (): Promise<PlantillaDeTextos> => pedir<PlantillaDeTextos>(`${BASE}/textos`),

  /** Cambia un texto de la plantilla; con el texto vacío, vuelve al original. */
  guardar: (clave: string, texto: string): Promise<PlantillaDeTextos> =>
    pedir<PlantillaDeTextos>(`${BASE}/textos/${encodeURIComponent(clave)}`, {
      method: 'PUT',
      body: JSON.stringify({ texto }),
    }),
};
