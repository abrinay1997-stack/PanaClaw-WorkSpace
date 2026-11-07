/**
 * CSV para Excel en español, compartido por todo lo que se baja a un archivo.
 *
 * Separado por punto y coma y con marca de orden de bytes delante. Las dos cosas
 * son por Excel en español, que es dónde va a acabar el archivo: con comas mete
 * todo en una columna, y sin la marca estropea las tildes.
 */

/**
 * Una celda, escapada.
 *
 * Se entrecomilla siempre que haya punto y coma, comillas o salto de línea. Y se
 * antepone un apóstrofo a lo que empiece por `=`, `+`, `-` o `@`: son los cuatro
 * caracteres con los que Excel entiende que una celda es una fórmula, y un
 * teléfono escrito «+507…» abre una hoja con un error en vez de un número.
 *
 * Un número puro como `-20.00` NO se protege: no puede ser una fórmula, y con el
 * apóstrofo Excel lo leería como texto y dejaría de sumarlo. Importa en el libro
 * de gastos, donde las correcciones van en negativo.
 */
const NUMERO = /^-?\d+(\.\d+)?$/;

export function celda(valor: string): string {
  const conFormula = /^[=+\-@]/.test(valor) && !NUMERO.test(valor) ? `'${valor}` : valor;
  return /[";\n\r]/.test(conFormula) ? `"${conFormula.replace(/"/g, '""')}"` : conFormula;
}

/** Títulos y filas a un archivo CSV, con la marca de orden de bytes delante del todo. */
export function filasACsv(titulos: readonly string[], filas: readonly (readonly string[])[]): string {
  return `﻿${[titulos, ...filas].map((fila) => fila.map(celda).join(';')).join('\r\n')}\r\n`;
}

/** Baja el archivo. `document` solo se toca aquí, para poder probar lo demás. */
export function descargarTexto(csv: string, nombre: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
}
