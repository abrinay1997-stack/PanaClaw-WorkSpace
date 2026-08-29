/**
 * La lista de clientes, bajada a un archivo.
 *
 * Separado por punto y coma y con marca de orden de bytes delante. Las dos
 * cosas son por Excel en español, que es dónde va a acabar el archivo: con
 * comas mete todo en una columna, y sin la marca convierte «Bocas del Toro» en
 * «Bocas del Toro» mal acentuado y ya no hay quien lo arregle.
 */

import type { Cliente } from '../../../compartido/clientes';
import { NOMBRE_ESTADO_CLIENTE } from '../../../compartido/clientes';

/** Los títulos, en el orden en que salen. */
const COLUMNAS: { titulo: string; de: (c: Cliente) => string }[] = [
  { titulo: 'Código', de: (c) => c.codigo },
  { titulo: 'Negocio', de: (c) => c.negocio },
  { titulo: 'Tipo', de: (c) => (c.tipo === 'persona' ? 'Persona' : 'Empresa') },
  { titulo: 'RUC o cédula', de: (c) => c.documento },
  { titulo: 'Contacto', de: (c) => c.contacto },
  { titulo: 'Cargo', de: (c) => c.cargo },
  { titulo: 'WhatsApp', de: (c) => c.whatsapp },
  { titulo: 'Teléfono', de: (c) => c.telefono },
  { titulo: 'Correo', de: (c) => c.correo },
  { titulo: 'Correos adicionales', de: (c) => c.correosExtra.join(' | ') },
  { titulo: 'Teléfonos adicionales', de: (c) => c.telefonosExtra.join(' | ') },
  { titulo: 'Ciudad', de: (c) => c.ciudad },
  { titulo: 'Dirección', de: (c) => c.direccion },
  { titulo: 'Estado', de: (c) => NOMBRE_ESTADO_CLIENTE[c.estado] },
  { titulo: 'Atiende', de: (c) => c.asesor },
  { titulo: 'Notas', de: (c) => c.notas },
  { titulo: 'Alta', de: (c) => c.creadoEn.slice(0, 10) },
];

/**
 * Una celda, escapada.
 *
 * Se entrecomilla siempre que haya punto y coma, comillas o salto de línea.
 * Y se antepone un apóstrofo a lo que empiece por `=`, `+`, `-` o `@`: son los
 * cuatro caracteres con los que Excel entiende que una celda es una fórmula, y
 * un teléfono escrito «+507…» abre una hoja con un error en vez de un número.
 */
function celda(valor: string): string {
  const conFormula = /^[=+\-@]/.test(valor) ? `'${valor}` : valor;
  return /[";\n\r]/.test(conFormula) ? `"${conFormula.replace(/"/g, '""')}"` : conFormula;
}

export function aCsv(lista: readonly Cliente[]): string {
  const filas = [
    COLUMNAS.map((c) => celda(c.titulo)).join(';'),
    ...lista.map((cliente) => COLUMNAS.map((c) => celda(c.de(cliente))).join(';')),
  ];
  // La marca de orden de bytes va delante del todo, antes del primer título.
  return `﻿${filas.join('\r\n')}\r\n`;
}

/** Baja el archivo. `document` solo se toca aquí, para poder probar `aCsv`. */
export function descargarCsv(lista: readonly Cliente[], nombre: string): void {
  const url = URL.createObjectURL(new Blob([aCsv(lista)], { type: 'text/csv;charset=utf-8' }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
}
