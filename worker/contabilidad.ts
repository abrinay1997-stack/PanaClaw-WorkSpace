/**
 * La contabilidad ligera: el libro de gastos, el resumen del periodo, las cuentas
 * por cobrar y el cierre de mes.
 *
 * Todo sale de los libros —cobros y gastos— sumando asientos. No hay cifras
 * guardadas aparte, y por eso el resumen no puede discrepar de los asientos que
 * lo componen. Las cuentas puras (`resumirPeriodo`, `antiguedadDe`) viven en
 * `compartido/` y las usa también la pantalla.
 *
 * El libro de gastos se rige como el de cobros: lo escrito no se edita ni se
 * elimina (la base lo impide) y un error se corrige con un asiento contrario.
 * Y en un mes cerrado no se escribe nada en ninguno de los dos.
 */

import {
  antiguedadDe,
  esCategoria,
  esMes,
  mesDe,
  mesDeFecha,
  periodoAnteriorDe,
  resumirPeriodo,
  type AsientoDeCierre,
  type Chequeo,
  type CobroDelPeriodo,
  type ContabilidadDelPeriodo,
  type EstadoDeCierre,
  type Gasto,
  type NuevoGasto,
  type ResumenContable,
} from '../compartido/contabilidad';
import { ITBMS } from '../cotizador/src/dominio/catalogo';
import { debidoCentavos } from '../cotizador/src/dominio/propuesta';
import type { Propuesta } from '../cotizador/src/dominio/tipos';
import { cuerpoJson, ErrorPeticion, texto } from './http';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
/** Un gasto de más de diez millones de dólares es un cero de más, no un gasto. */
const MAXIMO_CENTAVOS = 1_000_000_000;

const fechaValida = (valor: string): boolean => FECHA.test(valor) && !Number.isNaN(Date.parse(valor));

/** La fecha de hoy en Panamá (UTC−5, sin horario de verano). */
export function hoyEnPanama(ahora = new Date()): string {
  return new Date(ahora.getTime() - 5 * 3_600_000).toISOString().slice(0, 10);
}

function aGasto(fila: Record<string, unknown>): Gasto {
  return {
    id: Number(fila.id),
    fecha: String(fila.fecha),
    centavos: Number(fila.centavos),
    itbmsCentavos: Number(fila.itbms_centavos),
    categoria: String(fila.categoria) as Gasto['categoria'],
    proveedor: String(fila.proveedor),
    referencia: String(fila.referencia ?? ''),
    nota: String(fila.nota ?? ''),
    corrigeA: fila.corrige_a === null || fila.corrige_a === undefined ? null : Number(fila.corrige_a),
    motivo: String(fila.motivo ?? ''),
    registradoPor: String(fila.registrado_por),
    registradoEn: String(fila.registrado_en),
  };
}

/** El periodo pedido en la dirección, o el mes en curso. Rechaza fechas que no lo son. */
export function periodoDeUrl(url: URL, hoy: string): { desde: string; hasta: string } {
  const mes = mesDe(hoy);
  const desde = url.searchParams.get('desde') || mes.desde;
  const hasta = url.searchParams.get('hasta') || mes.hasta;
  if (!fechaValida(desde) || !fechaValida(hasta)) {
    throw new ErrorPeticion(400, 'invalida', 'Las fechas del periodo no son válidas.');
  }
  if (desde > hasta) {
    throw new ErrorPeticion(400, 'invalida', 'La fecha «desde» no puede ser posterior a «hasta».');
  }
  return { desde, hasta };
}

/* ------------------------------------------------------------------ *
 * Cierre de mes
 * ------------------------------------------------------------------ */

/** Los meses cuyo último asiento es «cerrar». */
export async function mesesCerrados(base: D1Database): Promise<Set<string>> {
  const { results } = await base
    .prepare('SELECT mes, accion FROM cierres_mes ORDER BY id')
    .all<{ mes: string; accion: string }>();
  const cerrados = new Set<string>();
  for (const { mes, accion } of results) {
    if (accion === 'cerrar') cerrados.add(mes);
    else cerrados.delete(mes);
  }
  return cerrados;
}

/**
 * Rechaza escribir en un mes cerrado.
 *
 * Lo llaman todos los caminos que escriben en un libro —registrar y corregir,
 * cobros y gastos—, con la fecha del asiento. Una corrección lleva la fecha del
 * original, así que corregir algo de un mes cerrado también exige reabrirlo.
 */
export async function exigirMesAbierto(base: D1Database, fecha: string): Promise<void> {
  const mes = mesDeFecha(fecha);
  if ((await mesesCerrados(base)).has(mes)) {
    throw new ErrorPeticion(
      400,
      'invalida',
      `El mes ${mes} está cerrado, así que no admite cambios. Reábrelo en Contabilidad si de verdad hace falta.`,
    );
  }
}

/** Los meses que toca un periodo, de `2026-10` a `2026-12`. Con tope, por si alguien pide veinte años. */
function mesesEntre(desde: string, hasta: string): string[] {
  const meses: string[] = [];
  let [anio, mes] = desde.split('-').map(Number) as [number, number];
  const [anioFin, mesFin] = hasta.split('-').map(Number) as [number, number];
  while ((anio < anioFin || (anio === anioFin && mes <= mesFin)) && meses.length < 36) {
    meses.push(`${anio}-${String(mes).padStart(2, '0')}`);
    mes += 1;
    if (mes > 12) {
      mes = 1;
      anio += 1;
    }
  }
  return meses;
}

async function historialDeCierres(base: D1Database, mes: string): Promise<AsientoDeCierre[]> {
  const { results } = await base
    .prepare('SELECT id, mes, accion, motivo, por, en FROM cierres_mes WHERE mes = ? ORDER BY id')
    .bind(mes)
    .all<AsientoDeCierre>();
  return results;
}

/**
 * La lista de chequeo de un mes, con datos reales.
 *
 * Solo una comprobación impide el cierre: que el mes haya terminado. Las demás
 * avisan. Cerrar es reversible (se reabre, con motivo), pero un aviso ignorado
 * a ciegas no lo es, y por eso se enseñan todos.
 */
async function chequeoDelMes(base: D1Database, mes: string, hoy: string, cerrados: Set<string>): Promise<Chequeo[]> {
  const { desde, hasta } = mesDe(`${mes}-01`);
  const chequeo: Chequeo[] = [];

  const terminado = mes < mesDeFecha(hoy);
  chequeo.push({
    clave: 'mes-terminado',
    titulo: 'El mes ya terminó',
    ok: terminado,
    bloquea: true,
    detalle: terminado ? `${mes} ya pasó.` : 'Un mes que sigue en curso todavía recibe cobros y gastos: se cierra cuando termina.',
  });

  const anterior = periodoAnteriorDe(desde, hasta);
  const mesAnterior = mesDeFecha(anterior.desde);
  const huboAntes = (await historialDeCierres(base, mesAnterior)).length > 0;
  const anteriorOk = cerrados.has(mesAnterior) || !huboAntes;
  chequeo.push({
    clave: 'mes-anterior',
    titulo: 'El mes anterior está cerrado',
    ok: anteriorOk,
    bloquea: false,
    detalle: anteriorOk
      ? 'En orden.'
      : `${mesAnterior} se cerró alguna vez y hoy está abierto: conviene cerrar los meses en orden.`,
  });

  const { results: gastos } = await base
    .prepare('SELECT COUNT(*) AS n FROM gastos WHERE fecha BETWEEN ? AND ? AND corrige_a IS NULL')
    .bind(desde, hasta)
    .all<{ n: number }>();
  const nGastos = Number(gastos[0]?.n ?? 0);
  chequeo.push({
    clave: 'gastos-del-mes',
    titulo: 'Hay gastos registrados',
    ok: nGastos > 0,
    bloquea: false,
    detalle:
      nGastos > 0
        ? `${nGastos} ${nGastos === 1 ? 'gasto' : 'gastos'} en el mes.`
        : 'No hay ningún gasto en el mes. Si pagaste servidores, dominio o herramientas, falta registrarlos.',
  });

  const { results: aceptadas } = await base
    .prepare(
      `SELECT p.numero, p.negocio, p.documento,
              COALESCE((SELECT SUM(c.centavos) FROM cobros c WHERE c.propuesta = p.numero), 0) AS cobrado
         FROM propuestas p
        WHERE p.estado = 'aceptada' AND p.eliminada_en IS NULL
          AND substr(COALESCE(p.estado_en, p.emitida_en), 1, 10) BETWEEN ? AND ?`,
    )
    .bind(desde, hasta)
    .all<{ numero: string; negocio: string; documento: string; cobrado: number }>();
  const sinCobro = aceptadas.filter((p) => {
    const debido = debidoCentavos((JSON.parse(p.documento) as Propuesta).lineas);
    return debido !== null && debido > 0 && Number(p.cobrado) === 0;
  });
  chequeo.push({
    clave: 'aceptadas-sin-cobro',
    titulo: 'Lo aceptado este mes tiene algún cobro',
    ok: sinCobro.length === 0,
    bloquea: false,
    detalle: sinCobro.length
      ? `Sin ningún cobro todavía: ${sinCobro.map((p) => p.negocio || p.numero).join(', ')}.`
      : 'Todo lo aceptado en el mes tiene al menos un cobro.',
  });

  return chequeo;
}

export async function estadoDeCierre(base: D1Database, mes: string, hoy: string): Promise<EstadoDeCierre> {
  if (!esMes(mes)) {
    throw new ErrorPeticion(400, 'invalida', 'El mes tiene que ser como 2026-11.');
  }
  const cerrados = await mesesCerrados(base);
  const historial = await historialDeCierres(base, mes);
  const ultimoCierre = [...historial].reverse().find((h) => h.accion === 'cerrar');

  let resumenAlCerrar: ResumenContable | null = null;
  if (cerrados.has(mes) && ultimoCierre) {
    const fila = await base.prepare('SELECT resumen FROM cierres_mes WHERE id = ?').bind(ultimoCierre.id).first<{ resumen: string | null }>();
    resumenAlCerrar = fila?.resumen ? (JSON.parse(fila.resumen) as ResumenContable) : null;
  }

  return {
    mes,
    cerrado: cerrados.has(mes),
    historial,
    chequeo: await chequeoDelMes(base, mes, hoy, cerrados),
    resumenAlCerrar,
  };
}

export async function cerrarMes(base: D1Database, peticion: Request, correo: string, hoy: string): Promise<EstadoDeCierre> {
  const cuerpo = await cuerpoJson<{ mes?: unknown; nota?: unknown }>(peticion);
  if (!esMes(cuerpo.mes)) {
    throw new ErrorPeticion(400, 'invalida', 'El mes tiene que ser como 2026-11.');
  }
  const mes = cuerpo.mes;

  const estado = await estadoDeCierre(base, mes, hoy);
  if (estado.cerrado) {
    throw new ErrorPeticion(400, 'invalida', `El mes ${mes} ya está cerrado.`);
  }
  const impide = estado.chequeo.find((c) => c.bloquea && !c.ok);
  if (impide) {
    throw new ErrorPeticion(400, 'invalida', impide.detalle);
  }

  // La foto del mes tal como está ahora, para poder compararla después.
  const { desde, hasta } = mesDe(`${mes}-01`);
  const { resumen } = await librosDe(base, desde, hasta);

  await base
    .prepare('INSERT INTO cierres_mes (mes, accion, motivo, resumen, por, en) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(mes, 'cerrar', texto(cuerpo.nota, 500), JSON.stringify(resumen), correo, new Date().toISOString())
    .run();

  return estadoDeCierre(base, mes, hoy);
}

export async function reabrirMes(base: D1Database, peticion: Request, correo: string, hoy: string): Promise<EstadoDeCierre> {
  const cuerpo = await cuerpoJson<{ mes?: unknown; motivo?: unknown }>(peticion);
  if (!esMes(cuerpo.mes)) {
    throw new ErrorPeticion(400, 'invalida', 'El mes tiene que ser como 2026-11.');
  }
  const mes = cuerpo.mes;
  const motivo = texto(cuerpo.motivo, 500);
  if (!motivo) {
    throw new ErrorPeticion(400, 'invalida', 'Escribe por qué se reabre el mes. Queda escrito en el historial.');
  }
  if (!(await mesesCerrados(base)).has(mes)) {
    throw new ErrorPeticion(400, 'invalida', `El mes ${mes} no está cerrado.`);
  }

  await base
    .prepare('INSERT INTO cierres_mes (mes, accion, motivo, por, en) VALUES (?, ?, ?, ?, ?)')
    .bind(mes, 'reabrir', motivo, correo, new Date().toISOString())
    .run();

  return estadoDeCierre(base, mes, hoy);
}

/* ------------------------------------------------------------------ *
 * El resumen del periodo
 * ------------------------------------------------------------------ */

async function gastosDelPeriodo(base: D1Database, desde: string, hasta: string): Promise<Gasto[]> {
  const { results } = await base
    .prepare('SELECT * FROM gastos WHERE fecha BETWEEN ? AND ? ORDER BY fecha DESC, id DESC')
    .bind(desde, hasta)
    .all<Record<string, unknown>>();
  return results.map(aGasto);
}

async function cobrosDelPeriodo(base: D1Database, desde: string, hasta: string): Promise<CobroDelPeriodo[]> {
  const { results } = await base
    .prepare(
      `SELECT c.id, c.propuesta, p.negocio, c.fecha, c.centavos, c.metodo, c.referencia, c.corrige_a
         FROM cobros c JOIN propuestas p ON p.numero = c.propuesta
        WHERE c.fecha BETWEEN ? AND ?
        ORDER BY c.fecha DESC, c.id DESC`,
    )
    .bind(desde, hasta)
    .all<Record<string, unknown>>();
  return results.map((f) => ({
    id: Number(f.id),
    propuesta: String(f.propuesta),
    negocio: String(f.negocio ?? ''),
    fecha: String(f.fecha),
    centavos: Number(f.centavos),
    metodo: String(f.metodo),
    referencia: String(f.referencia ?? ''),
    corrigeA: f.corrige_a === null || f.corrige_a === undefined ? null : Number(f.corrige_a),
  }));
}

async function librosDe(base: D1Database, desde: string, hasta: string) {
  const [gastos, cobros] = await Promise.all([gastosDelPeriodo(base, desde, hasta), cobrosDelPeriodo(base, desde, hasta)]);
  return { gastos, cobros, resumen: resumirPeriodo(desde, hasta, cobros, gastos, ITBMS.tasa) };
}

/** El resumen, la comparación, las cuentas por cobrar y los asientos de un periodo. */
export async function contabilidad(base: D1Database, desde: string, hasta: string, hoy: string): Promise<ContabilidadDelPeriodo> {
  const { gastos, cobros, resumen } = await librosDe(base, desde, hasta);
  const previo = periodoAnteriorDe(desde, hasta);
  const { resumen: anterior } = await librosDe(base, previo.desde, previo.hasta);

  const cerrados = await mesesCerrados(base);

  // Las cuentas por cobrar son lo aceptado que todavía no se ha cobrado entero,
  // sin importar el periodo: una deuda de hace tres meses sigue siéndolo.
  const { results: aceptadas } = await base
    .prepare(
      `SELECT numero, negocio, estado_en, emitida_en, documento
         FROM propuestas
        WHERE estado = 'aceptada' AND eliminada_en IS NULL`,
    )
    .all<{ numero: string; negocio: string; estado_en: string | null; emitida_en: string; documento: string }>();

  const { results: sumas } = await base
    .prepare('SELECT propuesta, SUM(centavos) AS cobrado FROM cobros GROUP BY propuesta')
    .all<{ propuesta: string; cobrado: number }>();
  const cobrado = new Map(sumas.map((s) => [s.propuesta, Number(s.cobrado)]));

  const entradas = aceptadas.flatMap((p) => {
    const debido = debidoCentavos((JSON.parse(p.documento) as Propuesta).lineas);
    // Sin cifra debida (un rango abierto) no hay cuenta por cobrar que medir.
    if (debido === null) return [];
    return [
      {
        numero: p.numero,
        negocio: p.negocio,
        desde: (p.estado_en ?? p.emitida_en).slice(0, 10),
        debidoCentavos: debido,
        cobradoCentavos: cobrado.get(p.numero) ?? 0,
      },
    ];
  });

  return {
    resumen,
    anterior,
    antiguedad: antiguedadDe(entradas, hoy),
    gastos,
    cobros,
    mesesCerrados: mesesEntre(mesDeFecha(desde), mesDeFecha(hasta)).filter((m) => cerrados.has(m)),
    hoy,
  };
}

/* ------------------------------------------------------------------ *
 * Gastos
 * ------------------------------------------------------------------ */

export async function registrarGasto(base: D1Database, peticion: Request, correo: string): Promise<Gasto[]> {
  const cuerpo = await cuerpoJson<Partial<NuevoGasto>>(peticion);

  const centavos = cuerpo.centavos;
  if (typeof centavos !== 'number' || !Number.isInteger(centavos) || centavos <= 0 || centavos > MAXIMO_CENTAVOS) {
    throw new ErrorPeticion(400, 'invalida', 'El importe del gasto tiene que ser mayor que cero.');
  }
  const itbms = cuerpo.itbmsCentavos ?? 0;
  if (typeof itbms !== 'number' || !Number.isInteger(itbms) || itbms < 0 || itbms > centavos) {
    throw new ErrorPeticion(400, 'invalida', 'El ITBMS del gasto no es válido.');
  }
  if (!esCategoria(cuerpo.categoria)) {
    throw new ErrorPeticion(400, 'invalida', 'Esa categoría no existe.');
  }
  const fecha = texto(cuerpo.fecha, 10);
  if (!fechaValida(fecha)) {
    throw new ErrorPeticion(400, 'invalida', 'La fecha del gasto no es válida.');
  }
  const proveedor = texto(cuerpo.proveedor, 120);
  if (!proveedor) {
    throw new ErrorPeticion(400, 'invalida', 'Escribe a quién se le pagó.');
  }
  await exigirMesAbierto(base, fecha);

  await base
    .prepare(
      `INSERT INTO gastos
         (fecha, centavos, itbms_centavos, categoria, proveedor, referencia, nota, registrado_por, registrado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      fecha,
      centavos,
      itbms,
      cuerpo.categoria,
      proveedor,
      texto(cuerpo.referencia, 120),
      texto(cuerpo.nota, 500),
      correo,
      new Date().toISOString(),
    )
    .run();

  return gastosDelPeriodo(base, fecha, fecha);
}

/** Corrige un gasto con un asiento contrario. El original no se toca. */
export async function corregirGasto(base: D1Database, id: number, peticion: Request, correo: string): Promise<{ hecho: true }> {
  const cuerpo = await cuerpoJson<{ motivo?: unknown }>(peticion);
  const motivo = texto(cuerpo.motivo, 500);
  if (!motivo) {
    throw new ErrorPeticion(400, 'invalida', 'Escribe el motivo de la corrección.');
  }

  const fila = await base.prepare('SELECT * FROM gastos WHERE id = ?').bind(id).first<Record<string, unknown>>();
  if (!fila) {
    throw new ErrorPeticion(404, 'no-encontrada', 'Ese gasto no existe.');
  }
  const gasto = aGasto(fila);
  if (gasto.corrigeA !== null || gasto.centavos < 0) {
    throw new ErrorPeticion(400, 'invalida', 'Una corrección no se corrige: registra el gasto de nuevo.');
  }
  await exigirMesAbierto(base, gasto.fecha);

  try {
    await base
      .prepare(
        `INSERT INTO gastos
           (fecha, centavos, itbms_centavos, categoria, proveedor, referencia, nota, corrige_a, motivo, registrado_por, registrado_en)
         VALUES (?, ?, ?, ?, ?, ?, '', ?, ?, ?, ?)`,
      )
      .bind(
        gasto.fecha,
        -gasto.centavos,
        -gasto.itbmsCentavos,
        gasto.categoria,
        gasto.proveedor,
        gasto.referencia,
        gasto.id,
        motivo,
        correo,
        new Date().toISOString(),
      )
      .run();
  } catch {
    // El índice único: ese gasto ya tiene su corrección.
    throw new ErrorPeticion(400, 'invalida', 'Ese gasto ya fue corregido.');
  }

  return { hecho: true };
}
