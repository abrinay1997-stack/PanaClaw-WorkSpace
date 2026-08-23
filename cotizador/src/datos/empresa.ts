/**
 * Quién emite la propuesta.
 *
 * Todo lo de aquí sale de `datos/marca.json` —la fuente única de tokens de la
 * marca— y se lee, no se copia: si cambia el WhatsApp allí, cambia aquí, en el
 * PDF y en el mensaje a la vez.
 */

import marca from '../../../datos/marca.json';

export const EMPRESA = {
  nombre: marca.identidad.nombre,
  tagline: marca.identidad.tagline,
  sitio: marca.identidad.sitio,
  mercado: marca.identidad.mercado,
  /**
   * El número SÍ se imprime en la propuesta, y no contradice la regla de marca.
   *
   * `marca.json → contacto.$regla` dice que el número no se enseña en la UI
   * pública: los botones dicen «WhatsApp» sin dígitos, porque el número como
   * reclamo publicitario abarata la marca. Una propuesta con nombre y apellido
   * es lo contrario de un reclamo — es un documento donde el cliente tiene que
   * poder ver a quién le está contestando.
   */
  whatsapp: marca.contacto.whatsappLegible,
  whatsappCrudo: marca.contacto.whatsappCrudo,
  horario: marca.contacto.horario,
  zona: marca.contacto.zona,
} as const;

/** El símbolo de la marca, trazado. Seis figuras, regla de relleno par-impar. */
export const LOGO = {
  path: marca.logo.pathSVG,
  viewBox: marca.logo.viewBox,
  fillRule: marca.logo.fillRule as 'evenodd',
} as const;
