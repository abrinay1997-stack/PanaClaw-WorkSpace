/**
 * Los textos del documento que se pueden cambiar sin tocar el código.
 *
 * El PDF y el mensaje llevan prosa fija —las condiciones, lo que pasa si se
 * cancela, cómo se explican las rondas de cambios— y hasta ahora cambiar una
 * coma obligaba a abrir `datos/textos.ts`. Este archivo es el registro de lo que
 * se puede editar desde la pantalla, con su texto de origen al lado.
 *
 * ── Tres reglas que sostienen que esto no se pueda romper ──────────────────
 *
 * 1. **El original nunca se pierde.** `defecto` es el texto de `datos/textos.ts`
 *    tal cual. Lo editado vive aparte (una plantilla del equipo en la base y,
 *    por propuesta, un retoque), y quitar la edición devuelve el original.
 *
 * 2. **Las cifras no se escriben a mano.** Lo que depende de un dato —lo que
 *    cuesta la ronda extra, el ITBMS, el nombre del plan— es una `{variable}`
 *    que el documento rellena desde `datos/precios.json`. Un importe tecleado en
 *    la frase («$40») se queda escrito el día que el catálogo cambie, y es la
 *    clase de cifra que `datos/precios.json` existe para impedir. `validarTexto`
 *    lo rechaza.
 *
 * 3. **Un texto nunca imprime un hueco.** Si por cualquier camino llegara una
 *    frase que pide una variable que no existe, se usa el original: `{extra}`
 *    impreso en un PDF que ya va al cliente es peor que la frase de siempre.
 *
 * El texto de una propuesta emitida se **congela dentro del documento**
 * (`congelarTextos`): editar la plantilla mañana no cambia el PDF que el cliente
 * ya tiene en la mano.
 */

import {
  CANCELACION,
  CANCELACION_MENSUAL,
  CODIGO_TUYO,
  FRONTERAS,
  NO_INCLUYE_POR_FAMILIA,
  NO_INCLUYE_SIEMPRE,
  NO_INCLUYE_SIN_PANEL,
  PLAZO_DESDE,
  QUE_NECESITAS_PARA_ARRANCAR,
  TRABAJO_REMOTO,
} from '../datos/textos';
import { catalogo, ITBMS } from './catalogo';
import { formato } from './dinero';
import type { Propuesta } from './tipos';

/** Los textos que alguien editó, por clave. Lo que falta vale su original. */
export type Textos = Readonly<Record<string, string>>;

export interface VariableDeTexto {
  nombre: string;
  /** Qué es, en palabras de quien edita. */
  que: string;
  /** Un valor de muestra, para que la vista previa se lea como se leerá de verdad. */
  ejemplo: string;
}

export interface TextoEditable {
  clave: string;
  grupo: string;
  titulo: string;
  /** Dónde aparece en el documento. */
  ayuda?: string;
  /** El original, literal de `datos/textos.ts`. */
  defecto: string;
  variables: readonly VariableDeTexto[];
}

/** Largo máximo de un texto: una frase o un párrafo, no una página. */
export const MAXIMO_TEXTO = 800;

const V_ITBMS: VariableDeTexto = { nombre: 'itbms', que: 'el impuesto, como «ITBMS 7 %»', ejemplo: ITBMS.texto };
const V_PLAN: VariableDeTexto = { nombre: 'plan', que: 'el nombre del plan web de la propuesta', ejemplo: 'Corporate' };
const V_RONDAS: VariableDeTexto = { nombre: 'rondas', que: 'cuántas rondas de cambios trae el plan', ejemplo: '3' };
const V_RONDAS_PALABRA: VariableDeTexto = {
  nombre: 'rondasPalabra',
  que: '«ronda» o «rondas», según la cantidad',
  ejemplo: 'rondas',
};
const V_EXTRA: VariableDeTexto = {
  nombre: 'extra',
  que: 'lo que cuesta una ronda extra',
  ejemplo: formato(catalogo.rondaExtra.precio),
};

const V_PRODUCTO: VariableDeTexto = { nombre: 'producto', que: 'el nombre del producto', ejemplo: 'PanaClaw Corporate' };
const V_PLAZO: VariableDeTexto = { nombre: 'plazo', que: 'el plazo publicado del producto', ejemplo: '8–12 días' };

export const GRUPO_NO_INCLUYE = 'Qué NO incluye (cada viñeta)';
export const GRUPO_FRONTERAS = 'Qué es cada cosa';
const GRUPO_PRECIO = 'Precio, plazos y cambios';
const GRUPO_CONDICIONES = 'Condiciones';
const GRUPO_CIERRE = 'Cierre del documento';
export const GRUPO_PRODUCTOS = 'Qué consigue el cliente con cada producto';

const PROSA: readonly TextoEditable[] = [
  {
    clave: 'noIncluyeIntro',
    grupo: GRUPO_PRECIO,
    titulo: 'Frase antes de la lista «Qué NO incluye»',
    ayuda: 'Va justo debajo del título «Qué NO incluye», antes de las viñetas.',
    defecto: 'Si algo de esto te hace falta, lo cotizamos aparte y lo sabes antes de firmar.',
    variables: [],
  },
  {
    clave: 'aTerceros',
    grupo: GRUPO_PRECIO,
    titulo: 'Explicación de los costos de terceros',
    ayuda: 'Solo sale cuando la propuesta lleva eBot, encima de la lista de cuentas que paga el cliente.',
    defecto:
      'Esto no lo cobra PanaClaw. Son las cuentas donde vive tu eBot y las pagas tú, directamente a quien presta el servicio. Se publican aquí porque callarlas sería exactamente la letra chica que no tenemos.',
    variables: [],
  },
  {
    clave: 'plazoDesde',
    grupo: GRUPO_PRECIO,
    titulo: 'Desde cuándo cuenta el plazo',
    ayuda: 'Sale debajo de los plazos de entrega, en el PDF y en el mensaje de WhatsApp.',
    defecto: PLAZO_DESDE,
    variables: [],
  },
  {
    clave: 'plazoLinea',
    grupo: GRUPO_PRECIO,
    titulo: 'Cada línea de plazo',
    ayuda: 'Una línea por producto en la sección «Plazo». El plazo en sí sale del catálogo y no se edita aquí.',
    defecto: '{producto}: {plazo}',
    variables: [V_PRODUCTO, V_PLAZO],
  },
  {
    clave: 'cambiosConRondas',
    grupo: GRUPO_PRECIO,
    titulo: 'Cambios: plan que incluye rondas',
    ayuda: 'Sección «Cambios» del PDF cuando el plan trae rondas de cambios incluidas.',
    defecto:
      '{plan} incluye {rondas} {rondasPalabra} de cambios. La ronda extra cuesta {extra}, sin discusión y sin mala cara.',
    variables: [V_PLAN, V_RONDAS, V_RONDAS_PALABRA, V_EXTRA],
  },
  {
    clave: 'cambiosSinRondas',
    grupo: GRUPO_PRECIO,
    titulo: 'Cambios: plan sin rondas incluidas',
    ayuda: 'Sección «Cambios» del PDF cuando el plan no trae rondas (por ejemplo Start).',
    defecto: '{plan} no trae rondas de cambios. Cada ronda extra cuesta {extra}, sin discusión y sin mala cara.',
    variables: [V_PLAN, V_EXTRA],
  },
  {
    clave: 'condArranque',
    grupo: GRUPO_CONDICIONES,
    titulo: 'Qué se necesita para arrancar',
    ayuda: 'Primera viñeta de «Condiciones».',
    defecto: QUE_NECESITAS_PARA_ARRANCAR,
    variables: [],
  },
  {
    clave: 'condCodigo',
    grupo: GRUPO_CONDICIONES,
    titulo: 'A quién pertenece el código',
    ayuda: 'Viñeta de «Condiciones».',
    defecto: CODIGO_TUYO,
    variables: [],
  },
  {
    clave: 'condCancelacion',
    grupo: GRUPO_CONDICIONES,
    titulo: 'Qué pasa si se cancela a mitad del trabajo',
    ayuda: 'Viñeta de «Condiciones».',
    defecto: CANCELACION,
    variables: [],
  },
  {
    clave: 'condCancelacionMensual',
    grupo: GRUPO_CONDICIONES,
    titulo: 'Cómo se cancela un plan mensual',
    ayuda: 'Viñeta de «Condiciones». Solo sale cuando la propuesta lleva algo mensual.',
    defecto: CANCELACION_MENSUAL,
    variables: [],
  },
  {
    clave: 'condRemoto',
    grupo: GRUPO_CONDICIONES,
    titulo: 'Cómo se trabaja',
    ayuda: 'Viñeta de «Condiciones».',
    defecto: TRABAJO_REMOTO,
    variables: [],
  },
  {
    clave: 'condItbms',
    grupo: GRUPO_CONDICIONES,
    titulo: 'Aviso del ITBMS',
    ayuda: 'Última viñeta de «Condiciones».',
    defecto:
      'Los precios de esta cotización no incluyen {itbms}: se suma aparte, sobre el pago único y sobre lo mensual por separado.',
    variables: [V_ITBMS],
  },
  {
    clave: 'aceptacion',
    grupo: GRUPO_CIERRE,
    titulo: 'Frase sobre la firma',
    ayuda: 'Encima de las líneas de nombre, firma y fecha, al final del PDF.',
    defecto: 'Firmar aquí es aceptar esta propuesta con lo que incluye y con lo que no incluye.',
    variables: [],
  },
];

/** Cómo se llama cada familia al titular una viñeta de «Qué NO incluye». */
const NOMBRE_FAMILIA: Record<string, string> = {
  web: 'un plan web',
  ebot: 'eBot',
  seguridad: 'Seguridad',
  auditoria: 'la Auditoría de Seguridad',
  care: 'Care',
  diagnostico: 'el Diagnóstico de Ventas',
};

const AYUDA_NO_INCLUYE =
  'Una viñeta de «Qué NO incluye», que va antes del precio. Es la firma de la marca: se puede cambiar cómo se dice, pero la viñeta sale siempre.';

/**
 * Las viñetas de «Qué NO incluye», una clave por viñeta.
 *
 * Salen de las mismas constantes que usa `noIncluyeDe`, así que una viñeta nueva
 * en `datos/textos.ts` tiene su clave editable sin tocar nada aquí. Solo se
 * edita cómo se dice: que la viñeta salga cuando toca lo decide el código, y no
 * hay forma de quitarla desde la pantalla.
 */
const TITULOS_SIEMPRE = ['Textos del negocio', 'Fotos y licencias', 'Posicionamiento en Google'];

const NO_INCLUYE: readonly TextoEditable[] = [
  ...NO_INCLUYE_SIEMPRE.map((defecto, i) => ({
    clave: `noInc.siempre.${i + 1}`,
    grupo: GRUPO_NO_INCLUYE,
    titulo: `Siempre: ${TITULOS_SIEMPRE[i] ?? `viñeta ${i + 1}`}`,
    ayuda: AYUDA_NO_INCLUYE,
    defecto,
    variables: [] as const,
  })),
  ...Object.entries(NO_INCLUYE_POR_FAMILIA).flatMap(([familia, puntos]) =>
    puntos.map((defecto, i) => ({
      clave: `noInc.${familia}.${i + 1}`,
      grupo: GRUPO_NO_INCLUYE,
      titulo: `Cuando lleva ${NOMBRE_FAMILIA[familia] ?? familia}${puntos.length > 1 ? ` (${i + 1})` : ''}`,
      ayuda: AYUDA_NO_INCLUYE,
      defecto,
      variables: [] as const,
    })),
  ),
  {
    clave: 'noInc.sinPanel',
    grupo: GRUPO_NO_INCLUYE,
    titulo: 'Cuando el plan no deja editar el contenido',
    ayuda: AYUDA_NO_INCLUYE,
    defecto: NO_INCLUYE_SIN_PANEL,
    variables: [],
  },
];

/** Las tres frases que explican en qué se diferencian los productos que se confunden. */
const FRONTERAS_EDITABLES: readonly TextoEditable[] = [
  { clave: 'frontera.careNoEsSeguridad', titulo: 'Care no es Seguridad', defecto: FRONTERAS.careNoEsSeguridad },
  {
    clave: 'frontera.auditoriaNoEsDiagnostico',
    titulo: 'Auditoría no es Diagnóstico',
    defecto: FRONTERAS.auditoriaNoEsDiagnostico,
  },
  { clave: 'frontera.auditoriaVaAparte', titulo: 'La Auditoría se paga aparte', defecto: FRONTERAS.auditoriaVaAparte },
].map((f) => ({
  ...f,
  grupo: GRUPO_FRONTERAS,
  ayuda: 'Sección «Qué es cada cosa»: sale cuando la propuesta lleva dos de los productos que se confunden.',
  variables: [] as const,
}));

/**
 * Lo que consigue el cliente con cada producto: la nota gris bajo su nombre en la
 * tabla del PDF. Salen del catálogo, así que si el catálogo suma un producto con
 * descripción, aparece aquí sin tocar nada.
 */
const PRODUCTOS: readonly TextoEditable[] = [...catalogo.items, catalogo.rondaExtra]
  .filter((i, pos, todos) => i.queConsigue && todos.findIndex((o) => o.id === i.id) === pos)
  .map((i) => ({
    clave: `item.${i.id}`,
    grupo: GRUPO_PRODUCTOS,
    titulo: i.nombre,
    ayuda: 'La nota bajo el nombre del producto en la tabla. Una nota escrita en la propia línea manda sobre esta.',
    defecto: i.queConsigue!,
    variables: [],
  }));

export const TEXTOS_EDITABLES: readonly TextoEditable[] = [...PROSA, ...NO_INCLUYE, ...FRONTERAS_EDITABLES, ...PRODUCTOS];

const porClave = new Map(TEXTOS_EDITABLES.map((t) => [t.clave, t]));

export const definicion = (clave: string): TextoEditable | undefined => porClave.get(clave);

/** Las claves, en el orden en que se enseñan. */
export const CLAVES_DE_TEXTO: readonly string[] = TEXTOS_EDITABLES.map((t) => t.clave);

const HUECO = /\{(\w+)\}/g;

/** Los nombres de variable que pide un texto. */
export const variablesDe = (texto: string): string[] => [...texto.matchAll(HUECO)].map((m) => m[1]!);

/** Sustituye cada `{nombre}` por su valor. Lo que no tenga valor se queda tal cual. */
export function rellenar(texto: string, valores: Readonly<Record<string, string | number>>): string {
  return texto.replace(HUECO, (hueco, nombre: string) => (nombre in valores ? String(valores[nombre]) : hueco));
}

/**
 * El texto de una clave para esta propuesta: el editado si lo hay, el original si
 * no, con las variables rellenas.
 *
 * Es la única puerta por la que el PDF y el mensaje leen estos textos.
 */
export function textoDe(
  clave: string,
  textos: Textos | undefined,
  valores: Readonly<Record<string, string | number>> = {},
): string {
  const def = definicion(clave);
  if (!def) throw new Error(`No existe el texto editable «${clave}».`);

  const propio = textos?.[clave]?.trim();
  if (propio) {
    // Regla 3: nunca se imprime un hueco. Un texto que pide algo que no llega
    // vuelve a su original.
    const faltan = variablesDe(propio).some((nombre) => !(nombre in valores));
    if (!faltan) return rellenar(propio, valores);
  }
  return rellenar(def.defecto, valores);
}

/** Cómo se leerá un texto con valores de muestra. Para la vista previa de la pantalla. */
export function vistaPrevia(def: TextoEditable, texto: string): string {
  const ejemplos = Object.fromEntries(def.variables.map((v) => [v.nombre, v.ejemplo]));
  return rellenar(texto, ejemplos);
}

/**
 * Por qué un texto no se puede guardar, o `null` si está bien.
 *
 * Las dos únicas cosas que se rechazan son las que dañan el documento: una cifra
 * tecleada a mano y una variable que no existe. Lo demás —el tono, la forma— es
 * de quien firma.
 */
export function validarTexto(clave: string, texto: string): string | null {
  const def = definicion(clave);
  if (!def) return 'Ese texto no existe.';

  const limpio = texto.trim();
  if (!limpio) return 'El texto está vacío. Para volver al original, usa «Restaurar».';
  if (limpio.length > MAXIMO_TEXTO) return `Es demasiado largo (${limpio.length} de ${MAXIMO_TEXTO} letras).`;

  if (/\$\s?\d/.test(limpio)) {
    const usables = def.variables.map((v) => `{${v.nombre}}`).join(', ');
    return (
      'No escribas un importe a mano: se queda fijo el día que el catálogo cambie. ' +
      (usables ? `Usa ${usables} para que se rellene solo.` : 'Este texto no lleva cifras.')
    );
  }

  const permitidas = new Set(def.variables.map((v) => v.nombre));
  const desconocida = variablesDe(limpio).find((nombre) => !permitidas.has(nombre));
  if (desconocida) {
    return permitidas.size
      ? `«{${desconocida}}» no existe en este texto. Puedes usar: ${[...permitidas].map((n) => `{${n}}`).join(', ')}.`
      : `Este texto no usa variables, y aparece «{${desconocida}}».`;
  }

  return null;
}

/**
 * La propuesta tal como se va a ver ahora: la plantilla del equipo con los
 * retoques de esta propuesta encima. Para la vista previa de un borrador.
 */
export function conPlantilla(propuesta: Propuesta, plantilla: Textos): Propuesta {
  return { ...propuesta, textos: { ...plantilla, ...propuesta.textos } };
}

/**
 * Todos los textos tal como valen hoy, escritos dentro de la propuesta.
 *
 * Se llama al emitir. Guarda el texto de TODAS las claves —el editado o, si no
 * hay, el original de hoy—, así el PDF que el cliente recibe se puede regenerar
 * idéntico dentro de un año aunque la plantilla, el catálogo o el código hayan
 * cambiado entre medias.
 */
export function congelarTextos(propuesta: Propuesta, plantilla: Textos): Propuesta {
  const vigentes = { ...plantilla, ...propuesta.textos };
  const congelados: Record<string, string> = {};
  for (const def of TEXTOS_EDITABLES) {
    const propio = vigentes[def.clave]?.trim();
    // Un texto guardado que ya no pasa la validación (porque se quitó una
    // variable, por ejemplo) no se congela: se congela el original.
    congelados[def.clave] = propio && !validarTexto(def.clave, propio) ? propio : def.defecto;
  }
  return { ...propuesta, textos: congelados };
}
