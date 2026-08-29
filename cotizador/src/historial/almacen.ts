/**
 * Cuál de los dos historiales hay detrás.
 *
 * Se decide al construir y no en marcha. El hub de Cloudflare no define
 * `VITE_DEMO`, así que el historial del navegador ni siquiera entra en el
 * paquete que se publica; y la vista previa, que no tiene servidor, no puede
 * intentar hablar con uno.
 *
 * Es comprobable: `grep PROP-DEMO publico/` después de un `npm run build`
 * normal no encuentra nada.
 */

import { ES_DEMOSTRACION } from '../api/pedir';
import type { Almacen } from './contrato';
import { almacenApi } from './almacenApi';
import { almacenLocal } from './almacenLocal';

export const almacen: Almacen = ES_DEMOSTRACION ? almacenLocal : almacenApi;
