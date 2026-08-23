/**
 * Fechas y textos de formato. Sin dependencias, para que las pruebas no
 * necesiten navegador.
 */

import { catalogo } from './catalogo';

/**
 * Que el `$` no sea ambiguo.
 *
 * En Panamá el balboa va a la par con el dólar y el símbolo se usa para los
 * dos, así que un documento que solo diga «$850» no está mintiendo pero
 * tampoco está diciendo la verdad entera. Se declara una vez, abajo, en el PDF
 * y en el mensaje.
 */
export const MONEDA_DECLARADA = `Todos los importes en ${catalogo.moneda}.`;

/** `2026-08-23`, en hora local. */
export function hoyISO(): string {
  const ahora = new Date();
  const mes = `${ahora.getMonth() + 1}`.padStart(2, '0');
  const dia = `${ahora.getDate()}`.padStart(2, '0');
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/**
 * `2026-08-23` → `23 de agosto de 2026`.
 *
 * Se parte la cadena a mano en vez de pasarla por `new Date()`: una fecha ISO
 * sin hora se interpreta como UTC, y al pintarla en Panamá (GMT-5) sale el día
 * anterior. Una propuesta fechada un día antes de su fecha es un documento con
 * un error visible.
 */
export function fechaLarga(iso: string): string {
  const [ano, mes, dia] = iso.split('-').map(Number);
  if (!ano || !mes || !dia) return iso;
  return `${dia} de ${MESES[mes - 1]} de ${ano}`;
}

/** `2026-08-23` + 15 → `2026-09-07`. Sin tocar husos horarios. */
export function sumarDias(iso: string, dias: number): string {
  const [ano, mes, dia] = iso.split('-').map(Number);
  if (!ano || !mes || !dia) return iso;
  const fecha = new Date(Date.UTC(ano, mes - 1, dia + dias));
  return fecha.toISOString().slice(0, 10);
}

/** `1` → `una`, para que el texto no diga «1 ronda extra». */
export function enPalabras(n: number): string {
  const palabras = ['cero', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'];
  return palabras[n] ?? `${n}`;
}
