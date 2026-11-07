/**
 * La contabilidad ligera del hub: gastos, resumen del periodo y cuentas por
 * cobrar. Qué viaja por el cable y las cuentas puras que comparten la pantalla y
 * el servidor.
 *
 * Es flujo de caja, no contabilidad devengada: cuenta lo que entró y lo que salió
 * en las fechas del periodo. Lo que dice cada cifra está escrito junto a ella,
 * porque un número de contabilidad sin su definición se lee como otro.
 *
 * Todo aquí es del pago único. Lo mensual no pasa por estos libros y no existe un
 * total que lo mezcle con el pago único (regla 2 de la marca).
 */

export const CATEGORIAS = ['servidores', 'herramientas', 'publicidad', 'terceros', 'impuestos', 'otros'] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export const NOMBRE_CATEGORIA: Record<Categoria, string> = {
  servidores: 'Servidores y dominios',
  herramientas: 'Herramientas y software',
  publicidad: 'Publicidad',
  terceros: 'Honorarios y terceros',
  impuestos: 'Impuestos y tasas',
  otros: 'Otros',
};

export function esCategoria(valor: unknown): valor is Categoria {
  return typeof valor === 'string' && (CATEGORIAS as readonly string[]).includes(valor);
}

/** Un asiento del libro de gastos. Un gasto es positivo; su corrección, negativa. */
export interface Gasto {
  id: number;
  fecha: string;
  /** Sin ITBMS. */
  centavos: number;
  itbmsCentavos: number;
  categoria: Categoria;
  proveedor: string;
  referencia: string;
  nota: string;
  corrigeA: number | null;
  motivo: string;
  registradoPor: string;
  registradoEn: string;
}

export interface NuevoGasto {
  centavos: number;
  itbmsCentavos?: number;
  fecha: string;
  categoria: Categoria;
  proveedor: string;
  referencia?: string;
  nota?: string;
}

/**
 * El ITBMS que viene dentro de un importe que ya lo incluye, al centavo.
 *
 * Un cobro se registra con impuesto. Para saber cuánto de él es ITBMS se divide
 * entre (1 + tasa). El redondeo es simétrico: la corrección de un cobro (su
 * importe en negativo) saca exactamente el mismo impuesto que el cobro metió, y
 * no uno distinto por un centavo.
 */
export function itbmsIncluido(centavosConImpuesto: number, tasa: number): number {
  const signo = centavosConImpuesto < 0 ? -1 : 1;
  return signo * Math.round((Math.abs(centavosConImpuesto) * tasa) / (1 + tasa));
}

/* ------------------------------------------------------------------ *
 * Antigüedad de las cuentas por cobrar
 * ------------------------------------------------------------------ */

export const TRAMOS = ['0-30', '31-60', '61-90', 'mas-90'] as const;
export type Tramo = (typeof TRAMOS)[number];

export const NOMBRE_TRAMO: Record<Tramo, string> = {
  '0-30': '0 a 30 días',
  '31-60': '31 a 60 días',
  '61-90': '61 a 90 días',
  'mas-90': 'Más de 90 días',
};

export const tramoDe = (dias: number): Tramo =>
  dias <= 30 ? '0-30' : dias <= 60 ? '31-60' : dias <= 90 ? '61-90' : 'mas-90';

/** Días enteros entre dos fechas ISO `yyyy-mm-dd`. Nunca negativo. */
export function diasEntre(desde: string, hasta: string): number {
  const ms = Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`);
  return Math.max(0, Math.round(ms / 86_400_000));
}

/** Una propuesta aceptada con saldo pendiente. */
export interface CuentaPorCobrar {
  numero: string;
  negocio: string;
  /** El día en que se aceptó: desde ahí corre la antigüedad. */
  desde: string;
  debidoCentavos: number;
  cobradoCentavos: number;
  pendienteCentavos: number;
  dias: number;
  tramo: Tramo;
}

export interface Antiguedad {
  cuentas: CuentaPorCobrar[];
  porTramo: Record<Tramo, number>;
  pendienteCentavos: number;
}

/** Ordena las cuentas, más viejas primero, y suma por tramo. Todo en centavos. */
export function antiguedadDe(
  entradas: readonly { numero: string; negocio: string; desde: string; debidoCentavos: number; cobradoCentavos: number }[],
  hoy: string,
): Antiguedad {
  const porTramo: Record<Tramo, number> = { '0-30': 0, '31-60': 0, '61-90': 0, 'mas-90': 0 };
  const cuentas: CuentaPorCobrar[] = [];

  for (const e of entradas) {
    const pendienteCentavos = e.debidoCentavos - e.cobradoCentavos;
    if (pendienteCentavos <= 0) continue;
    const dias = diasEntre(e.desde, hoy);
    const tramo = tramoDe(dias);
    porTramo[tramo] += pendienteCentavos;
    cuentas.push({ ...e, pendienteCentavos, dias, tramo });
  }

  cuentas.sort((a, b) => b.dias - a.dias || a.numero.localeCompare(b.numero));
  return { cuentas, porTramo, pendienteCentavos: cuentas.reduce((s, c) => s + c.pendienteCentavos, 0) };
}

/* ------------------------------------------------------------------ *
 * El resumen del periodo
 * ------------------------------------------------------------------ */

export interface ResumenContable {
  desde: string;
  hasta: string;
  /** Lo cobrado en el periodo, con ITBMS, neto de correcciones. */
  cobradoCentavos: number;
  /** De lo cobrado, lo que es ITBMS. */
  itbmsCobradoCentavos: number;
  /** Lo cobrado sin ITBMS: el ingreso. */
  ingresoCentavos: number;
  /** Gastos del periodo sin ITBMS, neto de correcciones. */
  gastosCentavos: number;
  /** ITBMS que traían las facturas de los gastos. */
  itbmsPagadoCentavos: number;
  /** Ingreso menos gastos. Flujo de caja: no es utilidad contable. */
  resultadoCentavos: number;
  /**
   * ITBMS cobrado menos ITBMS pagado. Positivo, se debe; negativo, está a favor.
   * Orientativo: lo que se declara lo decide la contadora.
   */
  itbmsPorPagarCentavos: number;
  cobradoPorMetodo: { metodo: string; centavos: number }[];
  gastosPorCategoria: { categoria: Categoria; centavos: number; itbmsCentavos: number }[];
}

/** Armar el resumen a partir de los asientos del periodo. Puro, y el servidor lo usa. */
export function resumirPeriodo(
  desde: string,
  hasta: string,
  cobros: readonly { centavos: number; metodo: string }[],
  gastos: readonly { centavos: number; itbmsCentavos: number; categoria: Categoria }[],
  tasa: number,
): ResumenContable {
  const cobradoCentavos = cobros.reduce((s, c) => s + c.centavos, 0);
  const itbmsCobradoCentavos = cobros.reduce((s, c) => s + itbmsIncluido(c.centavos, tasa), 0);
  const ingresoCentavos = cobradoCentavos - itbmsCobradoCentavos;

  const gastosCentavos = gastos.reduce((s, g) => s + g.centavos, 0);
  const itbmsPagadoCentavos = gastos.reduce((s, g) => s + g.itbmsCentavos, 0);

  const porMetodo = new Map<string, number>();
  for (const c of cobros) porMetodo.set(c.metodo, (porMetodo.get(c.metodo) ?? 0) + c.centavos);

  const porCategoria = new Map<Categoria, { centavos: number; itbmsCentavos: number }>();
  for (const g of gastos) {
    const actual = porCategoria.get(g.categoria) ?? { centavos: 0, itbmsCentavos: 0 };
    porCategoria.set(g.categoria, {
      centavos: actual.centavos + g.centavos,
      itbmsCentavos: actual.itbmsCentavos + g.itbmsCentavos,
    });
  }

  return {
    desde,
    hasta,
    cobradoCentavos,
    itbmsCobradoCentavos,
    ingresoCentavos,
    gastosCentavos,
    itbmsPagadoCentavos,
    resultadoCentavos: ingresoCentavos - gastosCentavos,
    itbmsPorPagarCentavos: itbmsCobradoCentavos - itbmsPagadoCentavos,
    cobradoPorMetodo: [...porMetodo].map(([metodo, centavos]) => ({ metodo, centavos })).filter((m) => m.centavos !== 0),
    gastosPorCategoria: CATEGORIAS.filter((c) => porCategoria.has(c))
      .map((categoria) => ({ categoria, ...porCategoria.get(categoria)! }))
      .filter((g) => g.centavos !== 0 || g.itbmsCentavos !== 0),
  };
}

/** Un cobro tal como se lista en el periodo: con el negocio al que pertenece. */
export interface CobroDelPeriodo {
  id: number;
  propuesta: string;
  negocio: string;
  fecha: string;
  centavos: number;
  metodo: string;
  referencia: string;
  corrigeA: number | null;
}

export interface ContabilidadDelPeriodo {
  resumen: ResumenContable;
  /** El periodo inmediatamente anterior, para ver si el mes va mejor o peor. */
  anterior: ResumenContable;
  antiguedad: Antiguedad;
  gastos: Gasto[];
  cobros: CobroDelPeriodo[];
  /** Los meses del periodo que están cerrados: ahí no se registra ni se corrige nada. */
  mesesCerrados: string[];
  /** La fecha que el servidor tomó por «hoy», en hora de Panamá. */
  hoy: string;
}

/* ------------------------------------------------------------------ *
 * Cierre de mes
 * ------------------------------------------------------------------ */

/** Una comprobación antes de cerrar. `bloquea` decide si impide el cierre o solo avisa. */
export interface Chequeo {
  clave: string;
  titulo: string;
  ok: boolean;
  bloquea: boolean;
  detalle: string;
}

/** Un asiento del historial de cierres. Se cierra y se reabre; nunca se borra. */
export interface AsientoDeCierre {
  id: number;
  mes: string;
  accion: 'cerrar' | 'reabrir';
  motivo: string;
  por: string;
  en: string;
}

export interface EstadoDeCierre {
  mes: string;
  cerrado: boolean;
  historial: AsientoDeCierre[];
  chequeo: Chequeo[];
  /** Con el mes cerrado, la foto del resumen tal como estaba al cerrar. */
  resumenAlCerrar: ResumenContable | null;
}

/** `2026-11` de `2026-11-07`. */
export const mesDeFecha = (fecha: string): string => fecha.slice(0, 7);

export const esMes = (valor: unknown): valor is string =>
  typeof valor === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(valor);

/* ------------------------------------------------------------------ *
 * Periodos
 * ------------------------------------------------------------------ */

const pad = (n: number): string => String(n).padStart(2, '0');

/** Del 1 al último día del mes de `fecha` (ISO). */
export function mesDe(fecha: string): { desde: string; hasta: string } {
  const [anio, mes] = fecha.split('-').map(Number) as [number, number];
  const ultimo = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  return { desde: `${anio}-${pad(mes)}-01`, hasta: `${anio}-${pad(mes)}-${pad(ultimo)}` };
}

/** El mes anterior al de `fecha`. */
export function mesAnteriorDe(fecha: string): { desde: string; hasta: string } {
  const [anio, mes] = fecha.split('-').map(Number) as [number, number];
  return mesDe(mes === 1 ? `${anio - 1}-12-01` : `${anio}-${pad(mes - 1)}-01`);
}

/** La fecha ISO `dias` días después (o antes, si es negativo). */
export function sumarDiasISO(fecha: string, dias: number): string {
  return new Date(Date.parse(`${fecha}T00:00:00Z`) + dias * 86_400_000).toISOString().slice(0, 10);
}

/**
 * El periodo con el que comparar uno dado.
 *
 * Un mes completo se compara con el mes anterior completo, que es lo que se
 * quiere ver: marzo contra febrero, no contra «los 31 días anteriores», que
 * empezarían a mitad de febrero. Cualquier otro periodo se compara con el tramo
 * de la misma duración que lo precede.
 */
export function periodoAnteriorDe(desde: string, hasta: string): { desde: string; hasta: string } {
  const mes = mesDe(desde);
  if (mes.desde === desde && mes.hasta === hasta) return mesAnteriorDe(desde);

  const duracion = diasEntre(desde, hasta) + 1;
  const fin = sumarDiasISO(desde, -1);
  return { desde: sumarDiasISO(fin, -(duracion - 1)), hasta: fin };
}

/** Cuánto cambió una cifra respecto a la anterior. `porcentaje` es `null` si antes era cero. */
export function variacion(actual: number, anterior: number): { diferencia: number; porcentaje: number | null } {
  return {
    diferencia: actual - anterior,
    porcentaje: anterior === 0 ? null : Math.round(((actual - anterior) / Math.abs(anterior)) * 1000) / 10,
  };
}

/** Del 1 de enero al 31 de diciembre del año de `fecha`. */
export const anioDe = (fecha: string): { desde: string; hasta: string } => ({
  desde: `${fecha.slice(0, 4)}-01-01`,
  hasta: `${fecha.slice(0, 4)}-12-31`,
});
