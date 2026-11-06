/**
 * Los cobros de una propuesta: qué viaja por el cable y cómo se suma.
 *
 * El saldo no se guarda: es la suma del libro. Y solo existe para el pago
 * único. Lo mensual no pasa por aquí, y no hay un «total» que lo mezcle
 * (regla 2 de la marca).
 */

export const METODOS = ['yappy', 'transferencia', 'efectivo', 'tarjeta', 'cheque', 'otro'] as const;
export type Metodo = (typeof METODOS)[number];

export const NOMBRE_METODO: Record<Metodo, string> = {
  yappy: 'Yappy',
  transferencia: 'Transferencia',
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  cheque: 'Cheque',
  otro: 'Otro',
};

export function esMetodo(valor: unknown): valor is Metodo {
  return typeof valor === 'string' && (METODOS as readonly string[]).includes(valor);
}

/** Un asiento del libro. Un cobro es positivo; su corrección, negativa y con `corrigeA`. */
export interface Cobro {
  id: number;
  propuesta: string;
  /** ISO `yyyy-mm-dd`. */
  fecha: string;
  centavos: number;
  metodo: Metodo;
  referencia: string;
  nota: string;
  corrigeA: number | null;
  motivo: string;
  registradoPor: string;
  registradoEn: string;
}

/** Lo que se envía para registrar un cobro. */
export interface NuevoCobro {
  centavos: number;
  metodo: Metodo;
  fecha: string;
  referencia?: string;
  nota?: string;
}

export interface ResumenCobros {
  /**
   * Lo que el cliente debe por el pago único, con ITBMS, en centavos. `null`
   * cuando la propuesta tiene un rango sin cerrar: no hay cifra que cobrar, y
   * escoger un extremo sería inventarla.
   */
  debidoCentavos: number | null;
  cobradoCentavos: number;
  /** `null` cuando no hay cifra debida. Nunca negativo. */
  pendienteCentavos: number | null;
}

export interface LibroDeCobros {
  cobros: Cobro[];
  resumen: ResumenCobros;
}

/** Suma el libro. Las correcciones restan solas porque van en negativo. */
export function resumenDeCobros(debidoCentavos: number | null, cobros: readonly Cobro[]): ResumenCobros {
  const cobradoCentavos = cobros.reduce((suma, c) => suma + c.centavos, 0);
  return {
    debidoCentavos,
    cobradoCentavos,
    pendienteCentavos: debidoCentavos === null ? null : Math.max(0, debidoCentavos - cobradoCentavos),
  };
}

/** De «1,234.50» o «85» a centavos. `null` si no es un importe. */
export function aCentavos(texto: string): number | null {
  const limpio = texto.trim().replace(/[$\s,]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(limpio)) return null;
  const centavos = Math.round(Number(limpio) * 100);
  return centavos > 0 ? centavos : null;
}

/** Centavos como dólares, siempre con dos decimales: un libro no redondea. */
export const dolares = (centavos: number): string =>
  `${centavos < 0 ? '-' : ''}$${(Math.abs(centavos) / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
