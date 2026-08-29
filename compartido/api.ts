/**
 * Lo que el servidor responde cuando algo se rechaza, valga para lo que valga.
 *
 * Una sola forma de error en toda la API es lo que permite que la pantalla
 * decida qué botón ofrecer —«restaurar», «abrir la ficha que ya existe»—
 * mirando un solo campo, en vez de leer el texto del mensaje y adivinar.
 */

export interface ErrorApi {
  /**
   * Para la pantalla: decide qué ofrecer.
   *
   * - `sin-acceso`        la sesión de Access caducó; recargar vuelve a entrar.
   * - `numero-ocupado`    ese número de propuesta ya es de otro cliente.
   * - `cliente-duplicado` ese documento ya es de otra ficha.
   * - `no-encontrada`     no existe.
   * - `invalida`          lo que llegó no se puede guardar, y `mensaje` dice por qué.
   * - `fallo`             algo se rompió por dentro; no es culpa de quien llama.
   */
  codigo:
    | 'sin-acceso'
    | 'numero-ocupado'
    | 'cliente-duplicado'
    | 'no-encontrada'
    | 'invalida'
    | 'fallo';
  /** Para la persona, ya redactado en español y listo para pintar tal cual. */
  mensaje: string;
  /**
   * Dato suelto que la pantalla necesita para ofrecer la salida.
   *
   * Hoy solo lo usa `cliente-duplicado`, que manda el código de la ficha con la
   * que se chocó para poder ofrecer «abrir la que ya existe» en vez de dejar a
   * quien escribe adivinando cuál era.
   */
  detalle?: string;
}
