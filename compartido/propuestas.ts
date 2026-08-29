/**
 * El contrato entre el cotizador y el servidor: qué viaja por el cable.
 *
 * Vive fuera de los dos a propósito. Si un día el historial deja de estar en
 * Cloudflare, este archivo es lo que la otra implementación tiene que cumplir,
 * y el cotizador no se entera del cambio.
 *
 * El documento de la propuesta viaja como JSON opaco: el servidor no interpreta
 * su interior salvo para calcular las columnas del listado, y por eso aquí es
 * genérico. Quien lo recibe decide de qué tipo es.
 *
 * ------------------------------------------------------------------
 * LA REGLA 2 DE LA MARCA, ESCRITA EN EL CABLE
 *
 * Un importe de pago único y uno mensual NUNCA se suman. Aquí eso significa que
 * ni `ResumenPropuesta` ni `PaginaHistorial` tienen un campo `total`: tienen
 * `unico` y `mensual`, y punto. Mientras no exista dónde guardar la suma
 * prohibida, ninguna pantalla, ningún listado y ninguna consulta del servidor
 * puede enseñarla por descuido.
 *
 * Es la misma decisión que ya estaba tomada en `Totales`
 * (`cotizador/src/dominio/tipos.ts`), extendida al servidor: el sitio donde más
 * barato sale fundir dos cifras es una columna de base de datos llamada
 * `total`, porque ahí nadie la mira.
 * ------------------------------------------------------------------
 */

import { correoNormal, sinTildes, whatsappNormal } from './texto';

export type { ErrorApi } from './api';

/** En qué acabó una propuesta emitida. Es lo que hace que el historial se mire. */
export type Estado = 'emitida' | 'aceptada' | 'perdida';

export const ESTADOS: readonly Estado[] = ['emitida', 'aceptada', 'perdida'];

/** Cómo se llama cada estado en pantalla. */
export const NOMBRE_ESTADO: Record<Estado, string> = {
  emitida: 'Emitida',
  aceptada: 'Aceptada',
  perdida: 'Perdida',
};

export function esEstado(valor: unknown): valor is Estado {
  return valor === 'emitida' || valor === 'aceptada' || valor === 'perdida';
}

/** Quién está usando el hub, según Cloudflare Access. */
export interface Identidad {
  correo: string;
}

/**
 * Un importe, con su rango.
 *
 * Es la misma forma que `Dinero` del cotizador y está escrita aquí otra vez
 * para que este contrato no dependa de la aplicación: quien implemente el otro
 * lado no tiene por qué compilar el cotizador entero para saber qué viaja.
 *
 * Que sea un par y no una cifra no es un lujo: PanaClaw publica precios con
 * rango ($80–$150) y la regla `rangosSeRespetan` de `datos/precios.json` obliga
 * a citarlos enteros. Un contrato con un solo número obligaría a elegir un
 * extremo en algún punto del camino, y ese punto sería el listado.
 */
export interface Importe {
  readonly min: number;
  readonly max: number;
}

export const IMPORTE_CERO: Importe = { min: 0, max: 0 };

/**
 * Dinero en centavos, que es como se guarda.
 *
 * En la base los importes van como enteros de centavos y no como decimales: la
 * suma de un listado entero tiene que dar exactamente lo mismo que la suma de
 * sus filas, y con decimales de coma flotante no da —$35.10 más $70.20 sale
 * $105.30000000000001 y esa cifra acaba impresa en algún sitio.
 */
export const aCentavos = (valor: number): number => Math.round(valor * 100);
export const deCentavos = (centavos: number): number => centavos / 100;

/**
 * Una fila del historial: lo justo para pintar la tabla.
 *
 * No trae el documento. Un listado de cien propuestas con el JSON completo de
 * cada una son varios megas para enseñar seis columnas.
 */
export interface ResumenPropuesta {
  numero: string;
  /** Fecha del documento, la que se imprime. */
  fecha: string;
  /** Instante real de emisión. Es el que ordena el historial. */
  emitidaEn: string;
  /** Correo de quien emitió, del token de Access. No se acepta del navegador. */
  autor: string;
  /** Nombre que firma la propuesta, del propio documento. */
  asesor: string;

  negocio: string;
  contacto: string;
  correo: string;
  whatsapp: string;

  /**
   * La ficha del cliente, cuando la propuesta quedó enlazada a una.
   *
   * `null` cuando no se pudo enlazar sin suponer. No es un fallo: es el
   * historial diciendo que ahí hace falta una persona.
   */
  clienteCodigo: string | null;

  /** Los dos totales del documento. Nunca se funden en uno: ver la cabecera. */
  unico: Importe;
  mensual: Importe;

  /** Cuántas líneas lleva. Da idea del tamaño sin abrir el documento. */
  lineas: number;

  estado: Estado;
  estadoNota: string;
  estadoEn: string | null;
  estadoPor: string | null;

  /**
   * Cuándo se mandó a la papelera, y quién.
   *
   * `null` en todo lo que está a la vista. Solo las filas de la papelera lo
   * traen, y es lo que se enseña ahí: borrar sin dejar constancia de quién
   * borró convierte un descuido en un misterio.
   */
  eliminadaEn: string | null;
  eliminadaPor: string | null;
}

/** Una propuesta con su documento, para reabrirla o regenerar el PDF. */
export interface PropuestaGuardada<Documento = unknown> extends ResumenPropuesta {
  documento: Documento;
}

export interface FiltroHistorial {
  /** Busca en número, negocio, contacto, correo y WhatsApp. */
  texto?: string;
  estado?: Estado;
  /** Fechas de emisión, inclusivas, en formato `YYYY-MM-DD`. */
  desde?: string;
  hasta?: string;
  pagina?: number;
  /** `true` lista la papelera en vez de lo que está a la vista. */
  papelera?: boolean;
}

export interface PaginaHistorial {
  propuestas: ResumenPropuesta[];
  /** Cuántas cumplen el filtro en total, no cuántas trae esta página. */
  cuantas: number;
  pagina: number;
  porPagina: number;
  /**
   * Las dos sumas de todo lo que cumple el filtro. **Dos, y no una.**
   *
   * «Cotizamos $4,200 este mes» y «tenemos $180 al mes comprometidos» son dos
   * frases distintas y ninguna de las dos se puede decir con la otra dentro.
   */
  sumas: {
    unico: Importe;
    mensual: Importe;
  };
}

export const POR_PAGINA = 25;

/**
 * Qué propuestas alcanza una operación en bloque.
 *
 * Dos formas, y la segunda es la que existe por el caso real: con cientos de
 * propuestas en el historial, marcar una por una no es una forma de borrar.
 * `{ todas: true, filtro }` manda el mismo filtro que la persona tiene puesto
 * en pantalla y el servidor resuelve el conjunto de una vez, sin que los
 * números lleguen a viajar.
 *
 * Que el filtro se mande otra vez —y no un «todo lo que enseñaste antes»— es a
 * propósito: lo que se borra es lo que cumple el filtro AHORA, y así la cifra
 * que confirma la persona se calcula contra lo mismo que se va a tocar.
 */
export type Seleccion =
  | { readonly numeros: readonly string[] }
  | { readonly todas: true; readonly filtro: FiltroHistorial };

/**
 * Cuántos números caben en una selección explícita.
 *
 * Es el tamaño de una página por veinte: nadie marca más a mano. Pasarse no es
 * un caso legítimo que haya que soportar, sino la señal de que quien llama
 * debería estar usando `{ todas: true }`.
 */
export const MAXIMO_SELECCION = 500;

/** Cuántas propuestas tocó una operación en bloque. */
export interface Cuantas {
  cuantas: number;
}

/** `PROP-2026-0007`. El año sale de la fecha del documento, no del reloj. */
export function formatoNumero(anio: string, valor: number): string {
  return `PROP-${anio}-${String(valor).padStart(4, '0')}`;
}

/** Lo mínimo para saber a quién va una propuesta. */
export interface ClienteIdentificable {
  negocio: string;
  correo: string;
  whatsapp: string;
}

/**
 * Si dos propuestas van al mismo cliente.
 *
 * Es lo que separa reemitir la propia —bajar el PDF y luego mandar el
 * WhatsApp— de escribir a mano un número que ya es de otro. Vive en el contrato
 * y no en cada lado porque las dos implementaciones del historial tienen que
 * responder igual: si el historial del navegador dejara pasar lo que el
 * servidor rechaza, estaría enseñando algo que no va a ocurrir.
 *
 * Manda el correo, después el WhatsApp y por último el nombre. En una propuesta
 * de PanaClaw no hay documento de identidad —el RUC se pide al contratar, no al
 * cotizar— así que no existe aquí el peldaño fuerte que sí tiene la ficha del
 * cliente. Por eso esto solo se usa para NO pisar una propuesta ajena, que es
 * una decisión reversible, y nunca para fusionar dos fichas, que no lo es.
 */
export function mismoCliente(a: ClienteIdentificable, b: ClienteIdentificable): boolean {
  const correoA = correoNormal(a.correo);
  const correoB = correoNormal(b.correo);
  if (correoA && correoB) return correoA === correoB;

  const waA = whatsappNormal(a.whatsapp);
  const waB = whatsappNormal(b.whatsapp);
  if (waA && waB) return waA === waB;

  return sinTildes(a.negocio) === sinTildes(b.negocio);
}

// --- El enlace con la ficha del cliente -------------------------------------

/**
 * Cómo acabó enlazada una propuesta con la ficha de su cliente.
 *
 * Emitir y enlazar son dos cosas distintas y pueden salir bien por separado: el
 * cliente está esperando su propuesta, y una ficha sin enlazar se arregla
 * después desde el panel; una propuesta que no salió, no.
 *
 * Por eso `ambigua` existe y no es un error. Es el servidor diciendo que hay
 * una ficha que se parece pero que enlazarla sería suponer, y que ahí hace
 * falta una persona. Enlazar mal es peor que no enlazar: la ficha equivocada se
 * atribuye un dinero que no es suyo y nadie vuelve a mirarlo.
 */
export type ComoSeEnlazo =
  /** Quien cotizaba eligió la ficha en el buscador. No hubo que adivinar. */
  | 'elegida'
  /** No había ninguna que se le pareciera, así que se creó con estos datos. */
  | 'creada'
  /** Se reconoció por el correo o por el WhatsApp, que son datos de una sola persona. */
  | 'reconocida'
  /** Hay una que se llama igual. No se enlaza: eso lo decide alguien. */
  | 'ambigua';

export interface Enlace {
  /** La ficha, o `null` cuando quedó `ambigua`. */
  codigo: string | null;
  como: ComoSeEnlazo;
  /** Qué decirle a quien acaba de emitir. Solo cuando hay algo que decir. */
  aviso?: string;
}

/** Lo que devuelve emitir: el número que salió y qué pasó con la ficha. */
export interface Emitida {
  numero: string;
  emitidaEn: string;
  enlace: Enlace;
}

/** Lo que devuelve enlazar una propuesta con una ficha desde el panel. */
export interface Enlazada {
  numero: string;
  clienteCodigo: string;
}
