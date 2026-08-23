/**
 * Las reglas que convierten un puñado de líneas en una propuesta.
 *
 * Todo lo de este archivo son funciones puras: es la parte del cotizador que
 * decide qué se cobra, qué se promete y qué se advierte, y la que conviene
 * poder probar sin abrir un navegador (`propuesta.test.ts`).
 *
 * El procedimiento que implementa está publicado en
 * `skills/propuesta-comercial/SKILL.md`. Cada bloque de aquí abajo lleva el
 * paso al que corresponde.
 */

import { CERO, multiplicar, sumar, type Dinero } from './dinero';
import { itemDe } from './catalogo';
import { PLANES, type Familia, type Item, type Linea, type PlanSlug, type Totales } from './tipos';
import {
  FRONTERAS,
  NO_INCLUYE_POR_FAMILIA,
  NO_INCLUYE_SIEMPRE,
  NO_INCLUYE_SIN_PANEL,
} from '../datos/textos';

/* ------------------------------------------------------------------ *
 * Paso 3 del procedimiento — separar los dos totales
 * ------------------------------------------------------------------ */

/** Lo que cuesta una línea: su precio por la cantidad, o nada si va incluida. */
export function importeDeLinea(linea: Linea): Dinero {
  return linea.incluida ? CERO : multiplicar(linea.precio, linea.cantidad);
}

/**
 * Los totales de la propuesta.
 *
 * **Aquí es donde se rompe una propuesta.** Un importe de pago único y uno
 * mensual nunca se suman: $850 de Corporate y $35 de Care no son $885, son dos
 * compromisos distintos con dos duraciones distintas. Esta función devuelve los
 * dos por separado porque `Totales` no tiene dónde guardar la suma.
 *
 * Los costos de terceros de eBot van en su tercer bloque por la misma razón
 * invertida: son dinero que el cliente paga, pero no a PanaClaw.
 */
export function totalesDe(lineas: readonly Linea[], terceros: Totales['terceros']): Totales {
  let unico = CERO;
  let mensual = CERO;

  for (const linea of lineas) {
    const item = itemDe(linea.itemId);
    if (!item) continue;
    const importe = importeDeLinea(linea);
    if (item.recurrencia === 'mensual') mensual = sumar(mensual, importe);
    else unico = sumar(unico, importe);
  }

  return {
    unico,
    mensual,
    // Los costos de terceros solo existen si la propuesta lleva eBot: es lo
    // único del catálogo que los arrastra, y publicarlos junto al precio es la
    // diferencia entre un precio claro y la letra chica que la marca dice no
    // tener.
    terceros: lineas.some((l) => itemDe(l.itemId)?.familia === 'ebot') ? terceros : [],
  };
}

/* ------------------------------------------------------------------ *
 * Paso 1 — el plan, y lo que arrastra
 * ------------------------------------------------------------------ */

const rango = (slug: PlanSlug): number => PLANES.indexOf(slug);

/** El plan web de la propuesta. Si hay dos, manda el mayor. */
export function planDe(lineas: readonly Linea[]): Item | undefined {
  const planes = lineas
    .map((l) => itemDe(l.itemId))
    .filter((i): i is Item => i?.familia === 'web');
  if (!planes.length) return undefined;
  return planes.reduce((alto, plan) => (rango(slugDe(plan)) > rango(slugDe(alto)) ? plan : alto));
}

/** 'web-corporate' → 'corporate'. */
export const slugDe = (item: Item): PlanSlug => item.id.replace('web-', '') as PlanSlug;

/** 'PanaClaw Corporate' → 'Corporate'. Dentro de la propuesta la marca sobra. */
export const planCorto = (item: Item): string => item.nombre.replace('PanaClaw ', '');

export const tieneFamilia = (lineas: readonly Linea[], familia: Familia): boolean =>
  lineas.some((l) => itemDe(l.itemId)?.familia === familia);

/* ------------------------------------------------------------------ *
 * Paso 4 — plazo y rondas
 * ------------------------------------------------------------------ */

export interface Plazo {
  readonly que: string;
  readonly cuando: string;
}

/**
 * Los plazos de la propuesta, uno por producto que tenga plazo publicado.
 *
 * No se funden en un solo número. Una propuesta de web + eBot son dos trabajos
 * con dos relojes, y anunciar «12 días» para los dos sería prometer el más
 * corto para el más largo o al revés. Los mensuales no aparecen: no se
 * entregan, empiezan.
 */
export function plazosDe(lineas: readonly Linea[]): Plazo[] {
  const vistos = new Set<string>();
  const plazos: Plazo[] = [];

  for (const linea of lineas) {
    const item = itemDe(linea.itemId);
    if (!item?.entrega || vistos.has(item.nombre)) continue;
    vistos.add(item.nombre);
    plazos.push({ que: item.nombre, cuando: item.entrega });
  }

  return plazos;
}

export interface Rondas {
  readonly incluidas: number;
  readonly plan: string;
  readonly extra: string;
}

/** Las rondas que trae el plan, y lo que cuesta una más. */
export function rondasDe(lineas: readonly Linea[]): Rondas | null {
  const plan = planDe(lineas);
  if (!plan || plan.rondas === undefined) return null;
  const extra = itemDe('ronda-extra');
  return {
    incluidas: plan.rondas,
    plan: planCorto(plan),
    extra: extra ? extra.precioTexto : '',
  };
}

/* ------------------------------------------------------------------ *
 * Paso 5 — el «qué NO incluye»
 *
 * Obligatorio, y va arriba, no en una nota al pie. Es la firma de la marca:
 * el argumento entero es la ausencia de trampa, y una lista de exclusiones
 * publicada es la única forma de demostrarla antes de cobrar.
 * ------------------------------------------------------------------ */

export function noIncluyeDe(lineas: readonly Linea[], extra: readonly string[] = []): string[] {
  const lista = [...NO_INCLUYE_SIEMPRE];

  // Una viñeta por familia presente, no una por línea: dos capacidades
  // avanzadas no producen dos veces la misma frase.
  const familias = new Set(
    lineas.map((l) => itemDe(l.itemId)?.familia).filter((f): f is Familia => !!f),
  );
  for (const familia of familias) {
    for (const punto of NO_INCLUYE_POR_FAMILIA[familia] ?? []) {
      if (!lista.includes(punto)) lista.push(punto);
    }
  }

  // Prometer panel de edición en Start o Launch es, según el procedimiento, lo
  // que más caro sale prometer de más. Aquí no se puede prometer por descuido:
  // si el plan no lo lleva, la exclusión se escribe sola.
  const plan = planDe(lineas);
  if (plan && plan.editablePorCliente === false) lista.push(NO_INCLUYE_SIN_PANEL);

  for (const punto of extra) {
    const limpio = punto.trim();
    if (limpio && !lista.includes(limpio)) lista.push(limpio);
  }

  return lista;
}

/* ------------------------------------------------------------------ *
 * Paso 6 — las fronteras
 * ------------------------------------------------------------------ */

/** Los cuatro productos que `catalogo/08-fronteras.md` declara confundibles. */
const CONFUNDIBLES: readonly Familia[] = ['care', 'seguridad', 'auditoria', 'diagnostico'];

/**
 * Las frases de frontera que toca imprimir.
 *
 * Se disparan por pares concretos y no por «hay dos o más»: soltar las tres
 * frases en toda propuesta las convertiría en relleno, y el relleno no se lee.
 */
export function fronterasDe(lineas: readonly Linea[]): string[] {
  const presentes = new Set(CONFUNDIBLES.filter((f) => tieneFamilia(lineas, f)));
  const frases: string[] = [];

  if (presentes.has('care') && (presentes.has('seguridad') || presentes.has('auditoria'))) {
    frases.push(FRONTERAS.careNoEsSeguridad);
  }
  if (presentes.has('diagnostico') && presentes.has('auditoria')) {
    frases.push(FRONTERAS.auditoriaNoEsDiagnostico);
  }
  if (presentes.has('seguridad')) {
    frases.push(FRONTERAS.auditoriaVaAparte);
  }

  return frases;
}

/* ------------------------------------------------------------------ *
 * Fábricas
 * ------------------------------------------------------------------ */

/**
 * Una línea nueva a partir de un item del catálogo.
 *
 * Arranca con el precio del catálogo intacto —rango incluido— y con el nombre
 * oficial como descripción. Las dos cosas se pueden editar después, pero el
 * punto de partida nunca es un hueco en blanco que alguien tenga que rellenar
 * de memoria.
 */
export function lineaDesde(item: Item, id: string, planActual?: Item): Linea {
  return {
    id,
    itemId: item.id,
    descripcion: item.nombre,
    cantidad: 1,
    precio: item.precio,
    precioAjustado: false,
    // Si el plan que ya está en la propuesta la trae dentro, entra marcada
    // como incluida: cobrarla sería cobrar dos veces lo mismo, y esperar a que
    // el asesor lo note es esperar a que alguien se acuerde.
    incluida: Boolean(
      item.incluidoDesde && planActual && rango(slugDe(planActual)) >= rango(item.incluidoDesde),
    ),
    nota: '',
  };
}
