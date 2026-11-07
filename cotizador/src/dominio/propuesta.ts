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

import type { Hito } from '../../../compartido/cobros';
import { CERO, conImpuesto, multiplicar, sumar, type Dinero } from './dinero';
import { ITBMS, itemDe } from './catalogo';
import { textoDe, type Textos } from './textos';
import { PLANES, type Familia, type Item, type Linea, type PlanSlug, type Totales } from './tipos';
import { NO_INCLUYE_POR_FAMILIA, NO_INCLUYE_SIEMPRE } from '../datos/textos';

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
/**
 * Lo que el cliente debe por el pago único, con ITBMS, en centavos.
 *
 * `null` cuando el pago único es un rango sin cerrar: no hay una cifra que
 * cobrar, y elegir un extremo sería inventarla. Es la misma cuenta que enseña el
 * PDF (`conImpuesto` sobre `totalesDe`), para que el saldo no pueda discrepar del
 * documento que el cliente tiene en la mano. Lo mensual no entra.
 */
/**
 * Si el pago único se cobra por etapas, en qué etapas.
 *
 * Solo cuando TODO lo que se cobra dice «50 % al empezar»: una propuesta que
 * mezcla un plan web (50 y 50) con un diagnóstico «completo por adelantado» no
 * tiene una regla única que la parta, y inventar una sería prometerle al cliente
 * un calendario de pagos que ningún documento publica. Con más de una forma de
 * cobro, no hay etapas y se registra lo que vaya entrando.
 *
 * La primera etapa es la mitad al centavo; la segunda, lo que falta, para que
 * las dos sumen exactamente lo debido.
 */
export function hitosDe(lineas: readonly Linea[], debido: number | null, cobrado: number): Hito[] | null {
  if (debido === null || debido <= 0) return null;

  const cobrables = lineas
    .filter((l) => !l.incluida)
    .map((l) => itemDe(l.itemId))
    .filter((i): i is Item => i !== undefined && i.recurrencia === 'unico');
  if (!cobrables.length || !cobrables.every((i) => /^50\s?% al empezar/i.test(i.cobro))) return null;

  const anticipo = Math.round(debido / 2);
  return [
    { nombre: '50 % al empezar', centavos: anticipo, cubierto: cobrado >= anticipo },
    { nombre: '50 % al entregar', centavos: debido - anticipo, cubierto: cobrado >= debido },
  ];
}

export function debidoCentavos(lineas: readonly Linea[]): number | null {
  const { unico } = totalesDe(lineas, []);
  if (unico.min !== unico.max) return null;
  return Math.round(conImpuesto(unico, ITBMS.tasa).total.min * 100);
}

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
  /** La línea ya escrita, con el texto editable de «cada línea de plazo». */
  readonly linea: string;
}

/**
 * Los plazos de la propuesta, uno por producto que tenga plazo publicado.
 *
 * No se funden en un solo número. Una propuesta de web + eBot son dos trabajos
 * con dos relojes, y anunciar «12 días» para los dos sería prometer el más
 * corto para el más largo o al revés. Los mensuales no aparecen: no se
 * entregan, empiezan.
 */
export function plazosDe(lineas: readonly Linea[], textos?: Textos): Plazo[] {
  const vistos = new Set<string>();
  const plazos: Plazo[] = [];

  for (const linea of lineas) {
    const item = itemDe(linea.itemId);
    if (!item?.entrega || vistos.has(item.nombre)) continue;
    vistos.add(item.nombre);
    plazos.push({
      que: item.nombre,
      cuando: item.entrega,
      linea: textoDe('plazoLinea', textos, { producto: item.nombre, plazo: item.entrega }),
    });
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

export function noIncluyeDe(
  lineas: readonly Linea[],
  extra: readonly string[] = [],
  textos?: Textos,
): string[] {
  const lista = NO_INCLUYE_SIEMPRE.map((_, i) => textoDe(`noInc.siempre.${i + 1}`, textos));

  // Una viñeta por familia presente, no una por línea: dos capacidades
  // avanzadas no producen dos veces la misma frase.
  const familias = new Set(
    lineas.map((l) => itemDe(l.itemId)?.familia).filter((f): f is Familia => !!f),
  );
  for (const familia of familias) {
    (NO_INCLUYE_POR_FAMILIA[familia] ?? []).forEach((_, i) => {
      const punto = textoDe(`noInc.${familia}.${i + 1}`, textos);
      if (!lista.includes(punto)) lista.push(punto);
    });
  }

  // Prometer panel de edición en Start o Launch es, según el procedimiento, lo
  // que más caro sale prometer de más. Aquí no se puede prometer por descuido:
  // si el plan no lo lleva, la exclusión se escribe sola.
  const plan = planDe(lineas);
  if (plan && plan.editablePorCliente === false) lista.push(textoDe('noInc.sinPanel', textos));

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
export function fronterasDe(lineas: readonly Linea[], textos?: Textos): string[] {
  const presentes = new Set(CONFUNDIBLES.filter((f) => tieneFamilia(lineas, f)));
  const frases: string[] = [];

  if (presentes.has('care') && (presentes.has('seguridad') || presentes.has('auditoria'))) {
    frases.push(textoDe('frontera.careNoEsSeguridad', textos));
  }
  if (presentes.has('diagnostico') && presentes.has('auditoria')) {
    frases.push(textoDe('frontera.auditoriaNoEsDiagnostico', textos));
  }
  if (presentes.has('seguridad')) {
    frases.push(textoDe('frontera.auditoriaVaAparte', textos));
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
