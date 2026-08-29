/**
 * La única forma en que esta aplicación habla con su servidor.
 *
 * Distingue las dos cosas que se confunden siempre: «no hay red» y «el servidor
 * dijo que no». La primera se arregla esperando y la segunda no, y una pantalla
 * que las junta manda a quien vende a reintentar algo que nunca va a funcionar.
 */

import type { ErrorApi } from '../../../compartido/api';
import { FalloApi } from './fallo';

export const BASE = '/api';

/**
 * La vista previa no tiene servidor detrás.
 *
 * Se decide al construir y no en marcha: el despliegue de Cloudflare nunca
 * define `VITE_DEMO`, así que el historial de mentira ni siquiera llega al
 * paquete. Es lo que impide que una propuesta de verdad acabe guardada solo en
 * el navegador de alguien creyendo que quedó registrada.
 */
export const ES_DEMOSTRACION = import.meta.env.VITE_DEMO === '1';

export async function pedir<T>(url: string, opciones: RequestInit = {}): Promise<T> {
  let respuesta: Response;

  try {
    respuesta = await fetch(url, {
      ...opciones,
      headers: { 'Content-Type': 'application/json', ...opciones.headers },
    });
  } catch {
    // `fetch` solo lanza cuando la petición no llegó a salir: sin red, DNS
    // caído, servidor inalcanzable. Un 500 no pasa por aquí.
    throw new FalloApi(
      'sin-conexion',
      'Sin conexión con el hub. Revisa la red y vuelve a intentarlo.',
    );
  }

  if (!respuesta.ok) {
    const problema = (await respuesta.json().catch(() => null)) as ErrorApi | null;
    throw new FalloApi(
      problema?.codigo ?? 'fallo',
      problema?.mensaje ?? `El servidor respondió ${respuesta.status}.`,
      problema?.detalle,
    );
  }

  return (await respuesta.json()) as T;
}

/** Los parámetros de una dirección, saltándose los vacíos. */
export function consulta(campos: Record<string, string | number | boolean | undefined>): string {
  const partes = new URLSearchParams();
  for (const [clave, valor] of Object.entries(campos)) {
    if (valor === undefined || valor === '' || valor === false) continue;
    partes.set(clave, valor === true ? '1' : String(valor));
  }
  const texto = partes.toString();
  return texto ? `?${texto}` : '';
}
