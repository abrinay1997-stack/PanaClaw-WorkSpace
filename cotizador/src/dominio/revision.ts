/**
 * Lo que la propuesta tiene mal antes de que salga.
 *
 * Es la lista de verificación de `skills/propuesta-comercial/SKILL.md` §5,
 * ejecutada en vez de recordada. Cada comprobación de aquí existe porque
 * fallarla no produce un documento feo: produce un compromiso que después no se
 * puede cumplir, o un cliente que cree estar cubierto y no lo está.
 *
 * Un `grave` bloquea el envío. Un `aviso` no: hay casos legítimos para casi
 * todos, y una herramienta que impide trabajar acaba puenteada.
 */

import { esRango, formato } from './dinero';
import { catalogo, itemDe, precioDeCatalogo } from './catalogo';
import { planDe, planCorto, slugDe, tieneFamilia } from './propuesta';
import { PLANES, type PlanSlug, type Propuesta } from './tipos';

export type Gravedad = 'grave' | 'aviso';

export interface Alerta {
  readonly gravedad: Gravedad;
  /** La línea señalada, si la alerta es de una línea concreta. */
  readonly lineaId?: string;
  readonly texto: string;
  /** Qué hacer. Una alerta que no dice cómo se arregla es una alerta que estorba. */
  readonly comoSeArregla: string;
}

const rango = (slug: PlanSlug): number => PLANES.indexOf(slug);

export function revisar(propuesta: Propuesta): Alerta[] {
  const { lineas } = propuesta;
  const alertas: Alerta[] = [];
  const plan = planDe(lineas);
  const items = lineas.map((l) => ({ linea: l, item: itemDe(l.itemId) }));

  /* --- El plan y lo que cuelga de él ----------------------------- */

  const planes = items.filter(({ item }) => item?.familia === 'web');
  if (planes.length > 1) {
    alertas.push({
      gravedad: 'grave',
      texto: `La propuesta lleva ${planes.length} planes web a la vez.`,
      comoSeArregla: 'Deja uno solo. Un sitio es un plan; dos sitios son dos propuestas.',
    });
  }

  for (const { linea, item } of items) {
    if (!item) continue;

    /* --- Capacidades: se suman a un plan, no lo sustituyen -------- */

    if (item.familia === 'capacidad' && !plan) {
      alertas.push({
        gravedad: 'grave',
        lineaId: linea.id,
        texto: `${item.nombre} necesita un plan web debajo.`,
        comoSeArregla:
          'Las capacidades avanzadas se suman a un plan, no lo sustituyen. Añade el plan que corresponda.',
      });
    }

    if (item.planMinimo && plan && rango(slugDe(plan)) < rango(item.planMinimo)) {
      const minimo = itemDe(`web-${item.planMinimo}`);
      alertas.push({
        gravedad: 'grave',
        lineaId: linea.id,
        texto: `${item.nombre} necesita como mínimo ${minimo ? planCorto(minimo) : item.planMinimo}, y la propuesta lleva ${planCorto(plan)}.`,
        comoSeArregla: `Sube el plan a ${minimo ? planCorto(minimo) : item.planMinimo} o quita esta capacidad. Cotizarla sobre un plan que no la aguanta es prometer un precio imposible.`,
      });
    }

    if (item.incluidoDesde && plan && rango(slugDe(plan)) >= rango(item.incluidoDesde) && !linea.incluida) {
      alertas.push({
        gravedad: 'grave',
        lineaId: linea.id,
        texto: `${item.nombre} ya viene dentro de ${planCorto(plan)} y se está cobrando aparte.`,
        comoSeArregla: 'Márcala como incluida: se enseña en la propuesta, pero no suma. Cobrarla sería cobrar dos veces lo mismo.',
      });
    }

    /* --- Precio: dentro del rango, y al día ---------------------- */

    const catalogo = precioDeCatalogo(linea.itemId);
    if (catalogo && (linea.precio.min < catalogo.min || linea.precio.max > catalogo.max)) {
      alertas.push({
        gravedad: 'grave',
        lineaId: linea.id,
        texto: `${item.nombre} va a ${formato(linea.precio)} y el catálogo publica ${formato(catalogo)}.`,
        comoSeArregla:
          'El precio solo se puede cerrar dentro del rango publicado. Fuera de él es una cifra que la marca no publica, y la marca no regatea.',
      });
    }

    if (item.repetible === false && linea.cantidad !== 1) {
      alertas.push({
        gravedad: 'grave',
        lineaId: linea.id,
        texto: `${item.nombre} no se cotiza por cantidad.`,
        comoSeArregla: 'Déjalo en 1.',
      });
    }
  }

  /* --- Frontera 3: la Auditoría va antes y aparte ---------------- */

  if (tieneFamilia(lineas, 'seguridad') && !tieneFamilia(lineas, 'auditoria')) {
    alertas.push({
      gravedad: 'grave',
      texto: 'Hay un plan mensual de seguridad sin la Auditoría de Seguridad delante.',
      comoSeArregla:
        'Añade el tramo de Auditoría que corresponda. Ningún plan mensual la incluye: proteger sin haber revisado es proteger a ciegas.',
    });
  }

  /* --- Avisos --------------------------------------------------- */

  if (propuesta.catalogoVersion && propuesta.catalogoVersion !== catalogo.version) {
    alertas.push({
      gravedad: 'aviso',
      texto: `Esta propuesta se armó con la versión ${propuesta.catalogoVersion} del listado de precios y la vigente es la ${catalogo.version}.`,
      comoSeArregla: 'Revisa los importes antes de enviarla: alguno puede haber cambiado.',
    });
  }

  if (tieneFamilia(lineas, 'ebot') && !plan) {
    alertas.push({
      gravedad: 'aviso',
      texto: 'La propuesta lleva eBot y ningún plan web.',
      comoSeArregla:
        'Está bien si el cliente ya tiene sitio. Si no lo tiene, díselo: eBot atiende tus mensajes, no reemplaza tu sitio.',
    });
  }

  if (tieneFamilia(lineas, 'ronda') && !plan) {
    alertas.push({
      gravedad: 'aviso',
      texto: 'Hay rondas extra sin un plan web al que pertenezcan.',
      comoSeArregla: 'Añade el plan, o quita las rondas.',
    });
  }

  const conRango = items.filter(({ linea }) => esRango(linea.precio));
  if (conRango.length) {
    alertas.push({
      gravedad: 'aviso',
      texto:
        conRango.length === 1
          ? 'Una línea sale con su rango de precio entero, sin cerrar.'
          : `${conRango.length} líneas salen con su rango de precio entero, sin cerrar.`,
      comoSeArregla:
        'Es correcto si todavía no sabes en qué tramo cae. Si ya lo sabes, ciérralo: el cliente decide mejor con una cifra que con una horquilla.',
    });
  }

  if (tieneFamilia(lineas, 'care')) {
    alertas.push({
      gravedad: 'aviso',
      texto: 'La propuesta lleva Care.',
      comoSeArregla:
        'Recuérdale el único descuento que existe en todo el catálogo: pago anual adelantado, dos meses gratis.',
    });
  }

  if (!propuesta.necesita.trim()) {
    alertas.push({
      gravedad: 'aviso',
      texto: 'Falta «qué necesitas», que es lo primero que lee el cliente.',
      comoSeArregla:
        'Escribe su situación en sus palabras. Una propuesta que empieza por el precio se lee como un presupuesto; una que empieza por el problema se lee como una respuesta.',
    });
  }

  if (!propuesta.cliente.negocio.trim()) {
    alertas.push({
      gravedad: 'aviso',
      texto: 'La propuesta no dice a qué negocio va dirigida.',
      comoSeArregla: 'Rellena el nombre del negocio antes de enviarla.',
    });
  }

  return alertas;
}

export const hayGraves = (alertas: readonly Alerta[]): boolean =>
  alertas.some((a) => a.gravedad === 'grave');

export const alertasDe = (alertas: readonly Alerta[], lineaId: string): Alerta[] =>
  alertas.filter((a) => a.lineaId === lineaId);
