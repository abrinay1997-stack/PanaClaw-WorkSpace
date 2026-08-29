/**
 * Lo que Cloudflare le pasa al Worker: la base, los archivos y la puerta.
 *
 * En un archivo propio porque lo miran los dos módulos —el enrutador y los
 * clientes— y tenerlo dentro de uno obligaría al otro a importar de ahí solo
 * por un tipo.
 */

export interface Env {
  BASE: D1Database;
  ASSETS: Fetcher;
  /** El dominio del equipo en Access: `algo.cloudflareaccess.com`. */
  ACCESO_DOMINIO: string;
  /** El «Application Audience (AUD) Tag» de la aplicación en Access. */
  ACCESO_AUD: string;
  /**
   * `desarrollo` salta la comprobación de Access. **Nunca en producción**: sin
   * esa comprobación, el historial queda abierto a quien dé con la dirección.
   */
  MODO?: string;
  /** Con quién se firma lo que se emita en `npm run dev`. */
  CORREO_DESARROLLO?: string;
}
