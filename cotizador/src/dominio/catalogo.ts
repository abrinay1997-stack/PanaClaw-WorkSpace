/**
 * El catálogo, derivado de `datos/precios.json`.
 *
 * **Este archivo no contiene ni una sola cifra.** Es la regla 1 de la marca
 * —«ninguna cifra que no esté en datos/precios.json»— resuelta de la única
 * forma que no depende de que nadie se acuerde: el cotizador IMPORTA el JSON de
 * la raíz del repositorio y compone el catálogo con lo que encuentre. Cambiar
 * un precio allí lo cambia en la pantalla, en el PDF y en el WhatsApp a la vez,
 * y no hay ningún paso manual entre medias que se pueda olvidar.
 *
 * Lo que sí vive aquí son las RELACIONES entre productos, que `precios.json` no
 * declara porque no son cifras: qué capacidad exige qué plan, qué mensual exige
 * la Auditoría antes, y qué viene ya dentro de qué. Cada una lleva encima el
 * archivo de `catalogo/` que la publica.
 */

import { leer, type Dinero } from './dinero';
import type { Catalogo, CostoTercero, Familia, Item, PlanSlug } from './tipos';
import { QUE_CONSIGUE, QUE_CONSIGUE_PLAN } from '../datos/textos';
import preciosJson from '../../../datos/precios.json';

/* ------------------------------------------------------------------ *
 * La forma de precios.json
 *
 * Se declara para poder leerlo con tipos, y se comprueba de verdad en
 * `catalogo.test.ts`: un JSON que cambie de forma tiene que romper una prueba,
 * no producir `undefined` dentro de una propuesta que va camino del cliente.
 * ------------------------------------------------------------------ */

interface PlanWeb {
  slug: string;
  nombre: string;
  precioTexto: string;
  entrega: string;
  rondasCambios: number;
  secciones: string;
  editablePorCliente: boolean;
  paraQuien: string;
  destacado?: boolean;
}

interface PreciosJson {
  version: string;
  moneda: string;
  webs: {
    cobro: string;
    planes: PlanWeb[];
    rondaExtra: { precioTexto: string; unidad: string };
  };
  capacidades: { items: { slug: string; nombre: string; precioTexto: string }[] };
  ebot: {
    nombre: string;
    precioTexto: string;
    cobro: string;
    entrega: string;
    canales: string[];
    costosDeTerceros: { concepto: string; precioTexto: string; aQuien: string }[];
  };
  seguridad: {
    auditoria: {
      nombre: string;
      cobro: string;
      entrega: string;
      tramos: { slug: string; label: string; precioTexto: string }[];
    };
    mensuales: { slug: string; nombre: string; precioTexto: string; requisito: string }[];
  };
  care: {
    planes: { slug: string; nombre: string; precioTexto: string; horasCambios: string }[];
    descuentoAnual: string;
  };
  diagnostico: { nombre: string; precioTexto: string; cobro: string; entrega: string };
}

const precios = preciosJson as unknown as PreciosJson;

/* ------------------------------------------------------------------ *
 * Las relaciones entre productos
 * ------------------------------------------------------------------ */

/**
 * Capacidades que obligan a subir de plan.
 *
 * `catalogo/02-capacidades.md`: «Reservas, portal de clientes o panel interno →
 * mínimo Corporate». Un anuncio que ofrezca «reservas desde $600» sin decir que
 * hace falta un plan debajo está anunciando un precio imposible, y una
 * propuesta que lo haga está prometiendo uno.
 */
const PLAN_MINIMO: Record<string, PlanSlug> = {
  reservas: 'corporate',
  portal: 'corporate',
  panel: 'corporate',
};

/**
 * Capacidades que un plan ya trae dentro.
 *
 * Commerce es la tienda, y el control de inventario es parte de tener tienda:
 * cobrarlo aparte sobre Commerce sería cobrar dos veces lo mismo. Sale del
 * cotizador del sitio (`src/data/quote.ts` → `CAPABILITIES.inventario`,
 * `includedFrom: 'commerce'`), que es donde esta regla está publicada.
 */
const INCLUIDO_DESDE: Record<string, PlanSlug> = {
  inventario: 'commerce',
};

/* ------------------------------------------------------------------ *
 * Composición
 * ------------------------------------------------------------------ */

const item = (
  id: string,
  familia: Familia,
  nombre: string,
  precioTexto: string,
  recurrencia: 'unico' | 'mensual',
  cobro: string,
  extra: Partial<Item> = {},
): Item => ({
  id,
  familia,
  nombre,
  precio: leer(precioTexto),
  precioTexto,
  recurrencia,
  cobro,
  ...extra,
});

const planesWeb: Item[] = precios.webs.planes.map((plan) =>
  item(`web-${plan.slug}`, 'web', plan.nombre, plan.precioTexto, 'unico', precios.webs.cobro, {
    entrega: plan.entrega,
    rondas: plan.rondasCambios,
    editablePorCliente: plan.editablePorCliente,
    queConsigue: QUE_CONSIGUE_PLAN[plan.slug],
    paraQuien: plan.paraQuien,
    notas: [`${plan.secciones} · ${rondasEnPalabras(plan.rondasCambios)}`],
  }),
);

const capacidades: Item[] = precios.capacidades.items.map((cap) =>
  item(
    `cap-${cap.slug}`,
    'capacidad',
    cap.nombre,
    cap.precioTexto,
    'unico',
    'Con el plan al que se suma',
    {
      queConsigue: QUE_CONSIGUE[cap.slug],
      ...(PLAN_MINIMO[cap.slug] ? { planMinimo: PLAN_MINIMO[cap.slug] } : {}),
      ...(INCLUIDO_DESDE[cap.slug] ? { incluidoDesde: INCLUIDO_DESDE[cap.slug] } : {}),
    },
  ),
);

const eBot: Item = item(
  'ebot',
  'ebot',
  precios.ebot.nombre,
  precios.ebot.precioTexto,
  'unico',
  precios.ebot.cobro,
  {
    entrega: precios.ebot.entrega,
    queConsigue: `Contesta tus mensajes de ${precios.ebot.canales.join(', ')} a cualquier hora`,
    notas: [`Canales: ${precios.ebot.canales.join(' · ')}`],
  },
);

/**
 * La Auditoría, un item por tramo.
 *
 * `precios.json` publica el rango completo ($80–$150) y además los tres tramos
 * cerrados. En una propuesta para un cliente concreto ya se sabe cuál de los
 * tres es —el tamaño del sitio no es una incógnita cuando lo tienes delante—,
 * así que se cotiza el tramo. El rango entero es para el catálogo, no para el
 * documento.
 */
const auditorias: Item[] = precios.seguridad.auditoria.tramos.map((tramo) =>
  item(
    `aud-${tramo.slug}`,
    'auditoria',
    precios.seguridad.auditoria.nombre,
    tramo.precioTexto,
    'unico',
    precios.seguridad.auditoria.cobro,
    {
      entrega: precios.seguridad.auditoria.entrega,
      queConsigue: tramo.label,
    },
  ),
);

const seguridadMensual: Item[] = precios.seguridad.mensuales.map((plan) =>
  item(
    `seg-${plan.slug}`,
    'seguridad',
    plan.nombre,
    plan.precioTexto,
    'mensual',
    'Mensual, sin permanencia',
    {
      queConsigue: 'Quién entra a tu sitio, por dónde, y qué se hace para impedirlo',
      requiere: { familia: 'auditoria', porQue: plan.requisito },
    },
  ),
);

const care: Item[] = precios.care.planes.map((plan) =>
  item(`care-${plan.slug}`, 'care', plan.nombre, plan.precioTexto, 'mensual', 'Mensual, sin permanencia', {
    queConsigue: `Que tu sitio siga en pie · ${plan.horasCambios} de cambios`,
  }),
);

const diagnostico: Item = item(
  'diagnostico',
  'diagnostico',
  precios.diagnostico.nombre,
  precios.diagnostico.precioTexto,
  'unico',
  precios.diagnostico.cobro,
  {
    entrega: precios.diagnostico.entrega,
    queConsigue: 'Por qué tu sitio no vende y cómo hacer que convierta',
  },
);

const rondaExtra: Item = item(
  'ronda-extra',
  'ronda',
  'Ronda extra de cambios',
  precios.webs.rondaExtra.precioTexto,
  'unico',
  precios.webs.rondaExtra.unidad,
  { repetible: true, queConsigue: 'Una vuelta más de correcciones, sin discusión y sin mala cara' },
);

const costosDeEbot: CostoTercero[] = precios.ebot.costosDeTerceros.map((costo) => ({
  concepto: costo.concepto,
  precio: leer(costo.precioTexto),
  precioTexto: costo.precioTexto,
  aQuien: costo.aQuien,
}));

export const catalogo: Catalogo = {
  version: precios.version,
  moneda: precios.moneda,
  items: [
    ...planesWeb,
    ...capacidades,
    ...auditorias,
    ...seguridadMensual,
    ...care,
    eBot,
    diagnostico,
    rondaExtra,
  ],
  rondaExtra,
  costosDeEbot,
  descuentoAnualCare: precios.care.descuentoAnual,
};

/* ------------------------------------------------------------------ *
 * Consultas
 * ------------------------------------------------------------------ */

const porId = new Map(catalogo.items.map((i) => [i.id, i]));

export const itemDe = (id: string): Item | undefined => porId.get(id);

export const itemsDe = (familia: Familia): Item[] =>
  catalogo.items.filter((i) => i.familia === familia);

/** El precio de catálogo de un item, para comparar contra el de una línea. */
export const precioDeCatalogo = (itemId: string): Dinero | undefined => porId.get(itemId)?.precio;

function rondasEnPalabras(rondas: number): string {
  if (rondas === 0) return 'sin rondas de cambios';
  return rondas === 1 ? '1 ronda de cambios' : `${rondas} rondas de cambios`;
}
