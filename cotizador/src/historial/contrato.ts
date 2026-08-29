/**
 * Qué le pide el cotizador al historial, sin decir quién lo cumple.
 *
 * Lo cumplen dos: `almacenApi.ts`, contra el Worker y la base compartida, y
 * `almacenLocal.ts`, contra el navegador, que es lo que usa la vista previa sin
 * servidor. La pantalla llama a `almacen.registrar(...)` y no sabe cuál de los
 * dos hay detrás.
 *
 * La forma de lo que viaja está en `compartido/propuestas.ts`, fuera del
 * cotizador, porque el servidor tiene que cumplir exactamente lo mismo. Aquí
 * solo se declara qué operaciones existen.
 */

import type {
  Cuantas,
  Emitida,
  Estado,
  FiltroHistorial,
  PaginaHistorial,
  PropuestaGuardada,
  Seleccion,
} from '../../../compartido/propuestas';
import type { Propuesta } from '../dominio/tipos';

// Se reexportan para que las pantallas importen de un solo sitio y no tengan
// que saber que media forma vive tres carpetas más arriba.
export type {
  Cuantas,
  Emitida,
  Enlace,
  Estado,
  FiltroHistorial,
  Importe,
  PaginaHistorial,
  PropuestaGuardada,
  ResumenPropuesta,
  Seleccion,
} from '../../../compartido/propuestas';
export { ESTADOS, NOMBRE_ESTADO, POR_PAGINA } from '../../../compartido/propuestas';

export interface Almacen {
  /**
   * Guarda una propuesta emitida y devuelve su número.
   *
   * Sin número asignado, pide uno al consecutivo. Con número, actualiza la que
   * ya existe: bajar el PDF y después mandar el WhatsApp es una sola propuesta,
   * no dos.
   */
  registrar(propuesta: Propuesta): Promise<Emitida>;
  listar(filtro: FiltroHistorial): Promise<PaginaHistorial>;
  abrir(numero: string): Promise<PropuestaGuardada<Propuesta>>;
  marcar(numero: string, estado: Estado, nota: string): Promise<void>;
  /** A la papelera. Reversible, y con constancia de quién la retiró. */
  eliminar(seleccion: Seleccion): Promise<Cuantas>;
  restaurar(seleccion: Seleccion): Promise<Cuantas>;
  /** Borrado de verdad, y solo desde la papelera. De esto no se vuelve. */
  purgar(seleccion: Seleccion): Promise<Cuantas>;
}
