/**
 * La plantilla de textos del equipo: lo reescrito sobre los originales del PDF y
 * del mensaje.
 *
 * Es un historial (`migraciones/0006_textos.sql`): cada cambio es un asiento nuevo
 * y lo vigente de una clave es el último. Qué se puede escribir lo decide
 * `validarTexto`, la misma función que usa la pantalla, así que el servidor no
 * acepta lo que la pantalla ya rechazó aunque alguien se salte la pantalla.
 */

import type { EdicionDeTexto, PlantillaDeTextos } from '../compartido/textos';
import { definicion, validarTexto } from '../cotizador/src/dominio/textos';
import { cuerpoJson, ErrorPeticion } from './http';

/** El texto vigente de cada clave, y quién lo cambió. */
export async function listar(base: D1Database): Promise<PlantillaDeTextos> {
  const { results } = await base
    .prepare(
      `SELECT t.clave, t.texto, t.por, t.en
         FROM textos_plantilla t
         JOIN (SELECT clave, MAX(id) AS id FROM textos_plantilla GROUP BY clave) ultimo
           ON ultimo.id = t.id`,
    )
    .all<{ clave: string; texto: string; por: string; en: string }>();

  const textos: Record<string, string> = {};
  const ediciones: EdicionDeTexto[] = [];

  for (const fila of results) {
    // Un texto vacío es «volver al original». Y uno que ya no pasa la validación
    // —porque el código cambió y una variable dejó de existir— no se sirve: el
    // original es mejor que un texto que el PDF no sabría rellenar.
    if (!fila.texto || validarTexto(fila.clave, fila.texto)) continue;
    textos[fila.clave] = fila.texto;
    ediciones.push({ clave: fila.clave, por: fila.por, en: fila.en });
  }

  return { textos, ediciones };
}

/**
 * Cambia un texto de la plantilla, o lo restaura si llega vacío.
 *
 * No escribe nada cuando no cambia nada: guardar dos veces lo mismo no debe llenar
 * el historial de asientos iguales.
 */
export async function guardar(
  base: D1Database,
  clave: string,
  peticion: Request,
  correo: string,
): Promise<PlantillaDeTextos> {
  if (!definicion(clave)) {
    throw new ErrorPeticion(404, 'no-encontrada', 'Ese texto no existe.');
  }

  const cuerpo = await cuerpoJson<{ texto?: unknown }>(peticion);
  if (typeof cuerpo.texto !== 'string') {
    throw new ErrorPeticion(400, 'invalida', 'Falta el texto.');
  }
  const texto = cuerpo.texto.trim();

  if (texto) {
    const problema = validarTexto(clave, texto);
    if (problema) throw new ErrorPeticion(400, 'invalida', problema);
  }

  const vigente = (await listar(base)).textos[clave] ?? '';
  if (texto === vigente) return listar(base);

  await base
    .prepare('INSERT INTO textos_plantilla (clave, texto, por, en) VALUES (?, ?, ?, ?)')
    .bind(clave, texto, correo, new Date().toISOString())
    .run();

  return listar(base);
}
