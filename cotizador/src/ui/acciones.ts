/**
 * Las salidas: el PDF, el mensaje y el portapapeles.
 *
 * jsPDF se carga sólo cuando hace falta. Pesa más que toda la aplicación, y
 * quien entra a mirar el historial no tiene por qué esperar a que se analice.
 */

import { enlaceWhatsapp, mensajeWhatsapp } from '../mensajes/whatsapp';
import type { Propuesta } from '../dominio/tipos';

const construir = async (propuesta: Propuesta) => {
  const { generarPdf, nombreDeArchivo } = await import('../pdf/propuestaPdf');
  return { doc: generarPdf(propuesta), nombre: nombreDeArchivo(propuesta) };
};

export async function descargarPdf(propuesta: Propuesta): Promise<void> {
  const { doc, nombre } = await construir(propuesta);
  doc.save(nombre);
}

/** Abre el PDF en una pestaña para revisarlo. No emite ni gasta número. */
export async function verPdf(propuesta: Propuesta): Promise<void> {
  const { doc } = await construir(propuesta);
  const url = URL.createObjectURL(doc.output('blob'));
  open(url, '_blank', 'noopener');
  // El objeto se suelta cuando la pestaña ya lo tiene cargado.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function abrirWhatsapp(propuesta: Propuesta): void {
  open(enlaceWhatsapp(propuesta), '_blank', 'noopener');
}

export async function copiarMensaje(propuesta: Propuesta): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(mensajeWhatsapp(propuesta));
    return true;
  } catch {
    return false;
  }
}
