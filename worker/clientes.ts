/**
 * El panel de clientes por dentro.
 *
 * Está aparte del enrutador porque son dos cosas que no comparten nada salvo la
 * base y la forma de rechazar: una guarda documentos de propuesta y la otra
 * fichas de cliente.
 *
 * Las dos reglas que gobiernan este archivo:
 *
 * 1. **La ficha manda.** Nada de aquí se pisa desde una propuesta. Emitir puede
 *    CREAR una ficha que no existía —no hay nada que perder al llenar un
 *    hueco— pero nunca cambia una que ya está escrita. Corregir un teléfono es
 *    un acto deliberado y se hace en el panel.
 *
 * 2. **El cliente se reconoce, no se numera.** El código `CLI-0001` es lo que
 *    sale de haberlo reconocido, nunca la forma de reconocerlo. Ver
 *    `COINCIDENCIA` en `compartido/clientes.ts`.
 */

import {
  CLIENTES_POR_PAGINA,
  MAXIMO_SELECCION_CLIENTES,
  MINIMO_DIGITOS_DOCUMENTO,
  claveDe,
  claveUtil,
  coincidenciaFuerte,
  esEstadoCliente,
  esTipoCliente,
  formatoCodigoCliente,
  nombreDocumento,
  type ClaseCoincidencia,
  type Cliente,
  type Coincidencia,
  type CuantosClientes,
  type DatosCliente,
  type FiltroClientes,
  type PaginaClientes,
  type SeleccionClientes,
} from '../compartido/clientes';
import {
  ACTIVIDAD_POR_FICHA,
  type ActividadCliente,
  type Cifra,
  type TotalesCliente,
} from '../compartido/actividad';
import {
  IMPORTE_CERO,
  deCentavos,
  type Enlace,
  type Enlazada,
  type Importe,
} from '../compartido/propuestas';
import { correoNormal, pareceCorreo, sinTildes, soloDigitos, whatsappNormal } from '../compartido/texto';
import { COLUMNAS_RESUMEN, aResumen } from './filas';
import { cuerpoJson, ErrorPeticion, texto } from './http';
import type { Propuesta } from '../cotizador/src/dominio/tipos';

/** Ninguna ficha necesita más de esto, y más huele a pegado por error. */
const MAXIMO_EXTRA = 10;
const MAXIMO_NOTAS = 4000;

// --- Consultar --------------------------------------------------------------

export function filtroDeUrl(url: URL): FiltroClientes {
  const p = url.searchParams;
  return filtroSeguro({
    texto: p.get('texto') ?? undefined,
    estado: (p.get('estado') ?? undefined) as FiltroClientes['estado'],
    asesor: p.get('asesor') ?? undefined,
    pagina: Number(p.get('pagina')) || 1,
    papelera: p.get('papelera') === '1',
  });
}

/**
 * Deja un filtro en algo que se pueda meter en una consulta.
 *
 * Existe aparte porque el filtro llega por dos caminos —la dirección del
 * listado y el cuerpo de una operación en bloque— y del segundo puede venir
 * cualquier cosa. Los valores se acaban pasando enlazados y nunca concatenados,
 * pero un estado inventado tampoco debe llegar a la consulta.
 */
function filtroSeguro(crudo: Partial<FiltroClientes> | null | undefined): FiltroClientes {
  return {
    texto:
      typeof crudo?.texto === 'string' ? crudo.texto.trim().slice(0, 120) || undefined : undefined,
    estado: esEstadoCliente(crudo?.estado) ? crudo.estado : undefined,
    asesor:
      typeof crudo?.asesor === 'string' ? crudo.asesor.trim().slice(0, 120) || undefined : undefined,
    pagina: Math.max(1, Number(crudo?.pagina) || 1),
    papelera: crudo?.papelera === true,
  };
}

/**
 * El `WHERE` de un filtro, con sus valores enlazados.
 *
 * Lo comparten el listado y las operaciones en bloque: «eliminar todos los que
 * cumplen el filtro» tiene que alcanzar exactamente las fichas que la persona
 * está viendo, y la única forma de garantizarlo es armar las dos consultas con
 * el mismo código.
 */
function dondeDe(filtro: FiltroClientes): { donde: string; valores: unknown[] } {
  // La papelera nunca es opcional: o se listan las fichas a la vista o las
  // retiradas, jamás las dos mezcladas.
  const condiciones: string[] = [
    filtro.papelera ? 'eliminado_en IS NOT NULL' : 'eliminado_en IS NULL',
  ];
  const valores: unknown[] = [];

  if (filtro.texto) {
    // Se busca por el texto tal cual y además por sus formas normalizadas, para
    // que «avila» encuentre a «Ávila» y «6123-4567» encuentre al WhatsApp
    // guardado con el prefijo del país.
    const patron = `%${filtro.texto}%`;
    const patronNormal = `%${sinTildes(filtro.texto)}%`;
    const patronDigitos = soloDigitos(filtro.texto);
    condiciones.push(
      `(codigo LIKE ? OR negocio LIKE ? OR negocio_normal LIKE ? OR documento LIKE ?
        OR contacto LIKE ? OR correo LIKE ? OR whatsapp LIKE ? OR ciudad LIKE ?
        ${patronDigitos ? 'OR documento_digitos LIKE ? OR whatsapp_normal LIKE ?' : ''})`,
    );
    valores.push(patron, patron, patronNormal, patron, patron, patron, patron, patron);
    if (patronDigitos) valores.push(`%${patronDigitos}%`, `%${patronDigitos}%`);
  }
  if (filtro.estado) {
    condiciones.push('estado = ?');
    valores.push(filtro.estado);
  }
  if (filtro.asesor) {
    condiciones.push('asesor = ?');
    valores.push(filtro.asesor);
  }

  return { donde: `WHERE ${condiciones.join(' AND ')}`, valores };
}

export async function listar(base: D1Database, filtro: FiltroClientes): Promise<PaginaClientes> {
  const { donde, valores } = dondeDe(filtro);
  const pagina = Math.max(1, filtro.pagina ?? 1);

  const [resumen, filas] = await base.batch<Record<string, unknown>>([
    base.prepare(`SELECT COUNT(*) AS cuantos FROM clientes ${donde}`).bind(...valores),
    base
      .prepare(
        // Por nombre y no por fecha de alta: el panel se recorre buscando a
        // alguien, no mirando qué entró último. `negocio_normal` existe justo
        // para que «Ávila» no acabe detrás de «Zapata».
        `SELECT * FROM clientes ${donde} ORDER BY negocio_normal ASC LIMIT ? OFFSET ?`,
      )
      .bind(...valores, CLIENTES_POR_PAGINA, (pagina - 1) * CLIENTES_POR_PAGINA),
  ]);

  return {
    clientes: (filas?.results ?? []).map(aCliente),
    cuantos: Number(resumen?.results[0]?.cuantos ?? 0),
    pagina,
    porPagina: CLIENTES_POR_PAGINA,
  };
}

export async function abrir(base: D1Database, codigo: string): Promise<Cliente> {
  const fila = await base
    .prepare('SELECT * FROM clientes WHERE codigo = ?')
    .bind(codigo)
    .first<Record<string, unknown>>();

  if (!fila) throw new ErrorPeticion(404, 'no-encontrada', `No hay ningún cliente ${codigo}.`);
  return aCliente(fila);
}

/**
 * «¿A éste ya lo tengo?».
 *
 * Recorre la escalera de `COINCIDENCIA` y devuelve el primer peldaño que
 * responda, diciendo por cuál fue. Quien llama decide qué hacer con eso: el
 * documento basta para dar por hecho que es el mismo, y los demás obligan a
 * preguntar. Aquí no se decide nada, solo se busca.
 *
 * Alcanza también a las fichas de la papelera, a propósito: callar que el
 * cliente existe pero está retirado deja a quien lo busca creyendo que puede
 * crearlo, y luego chocando contra el índice único sin entender por qué.
 */
export async function coincidencia(
  base: D1Database,
  datos: { documento?: string; whatsapp?: string; correo?: string; negocio?: string },
): Promise<{ coincidencia: Coincidencia | null }> {
  const clave = claveDe(datos);
  if (!claveUtil(clave)) return { coincidencia: null };

  const fila = await primeraCoincidencia(base, clave);
  if (!fila) return { coincidencia: null };

  return {
    coincidencia: {
      cliente: aCliente(fila.fila),
      clase: fila.clase,
      fuerte: coincidenciaFuerte(fila.clase),
    },
  };
}

/** La escalera, peldaño a peldaño, parando en el primero que responda. */
async function primeraCoincidencia(
  base: D1Database,
  clave: ReturnType<typeof claveDe>,
): Promise<{ fila: Record<string, unknown>; clase: ClaseCoincidencia } | null> {
  const intentos: { clase: ClaseCoincidencia; sql: string; valores: unknown[] }[] = [];

  if (clave.documento) {
    intentos.push({
      clase: 'documento',
      sql: 'documento_digitos = ?',
      valores: [clave.documento],
    });
    // Y, justo detrás, el mismo número con uno o dos dígitos de más: el RUC
    // escrito con y sin su DV. `substr` recorta la cola por los dos lados, para
    // que dé igual cuál de las dos formas esté guardada y cuál se escriba ahora.
    intentos.push({
      clase: 'parecido',
      sql: `documento_digitos <> '' AND length(documento_digitos) >= ${MINIMO_DIGITOS_DOCUMENTO}
            AND (documento_digitos = substr(?, 1, length(?) - 1)
                 OR documento_digitos = substr(?, 1, length(?) - 2)
                 OR ? = substr(documento_digitos, 1, length(documento_digitos) - 1)
                 OR ? = substr(documento_digitos, 1, length(documento_digitos) - 2))`,
      valores: Array(6).fill(clave.documento),
    });
  }
  if (clave.whatsapp) {
    intentos.push({
      clase: 'whatsapp',
      sql: "whatsapp_normal <> '' AND whatsapp_normal = ?",
      valores: [clave.whatsapp],
    });
  }
  if (clave.correo) {
    // El correo principal o cualquiera de los adicionales. La lista es un JSON
    // corto y se busca con LIKE sobre el texto entrecomillado: con cientos de
    // fichas es de sobra, y evita una tabla aparte para un dato que siempre se
    // lee junto al cliente.
    intentos.push({
      clase: 'correo',
      sql: '(correo_normal = ? OR correos_extra LIKE ?)',
      valores: [clave.correo, `%"${clave.correo}"%`],
    });
  }
  if (clave.negocio) {
    intentos.push({ clase: 'negocio', sql: 'negocio_normal = ?', valores: [clave.negocio] });
  }

  for (const intento of intentos) {
    const fila = await base
      .prepare(`SELECT * FROM clientes WHERE ${intento.sql} LIMIT 1`)
      .bind(...intento.valores)
      .first<Record<string, unknown>>();

    if (fila) return { fila, clase: intento.clase };
  }

  return null;
}

/**
 * Todo lo que ha pasado con un cliente.
 *
 * Dos consultas: sus cifras y sus últimas propuestas. Son suyas las que llevan
 * su código y solo ésas —ver `ActividadCliente`—; buscarlas además por nombre
 * parecido haría que una ficha se atribuyera propuestas ajenas, y eso no se
 * nota nunca.
 */
export async function actividad(base: D1Database, codigo: string): Promise<ActividadCliente> {
  // Que la ficha exista se comprueba antes de contar nada: preguntar por la
  // actividad de un código inventado tiene que responder 404, no cuatro ceros.
  await abrir(base, codigo);

  const donde = 'WHERE eliminada_en IS NULL AND cliente_codigo = ?';

  const [resumen, filas] = await base.batch<Record<string, unknown>>([
    base
      .prepare(
        `SELECT estado,
                COUNT(*) AS cuantas,
                COALESCE(SUM(unico_min), 0)   AS unico_min,
                COALESCE(SUM(unico_max), 0)   AS unico_max,
                COALESCE(SUM(mensual_min), 0) AS mensual_min,
                COALESCE(SUM(mensual_max), 0) AS mensual_max
           FROM propuestas ${donde} GROUP BY estado`,
      )
      .bind(codigo),
    base
      .prepare(
        `SELECT ${COLUMNAS_RESUMEN} FROM propuestas ${donde}
          ORDER BY emitida_en DESC LIMIT ?`,
      )
      .bind(codigo, ACTIVIDAD_POR_FICHA),
  ]);

  return {
    totales: totalesDe(resumen?.results ?? []),
    propuestas: (filas?.results ?? []).map(aResumen),
  };
}

/** Una cifra en cero: dos importes, nunca uno. */
const cifraCero = (): Cifra => ({ unico: IMPORTE_CERO, mensual: IMPORTE_CERO });

function sumarImportes(a: Importe, b: Importe): Importe {
  return { min: a.min + b.min, max: a.max + b.max };
}

function sumarCifras(a: Cifra, b: Cifra): Cifra {
  return {
    unico: sumarImportes(a.unico, b.unico),
    mensual: sumarImportes(a.mensual, b.mensual),
  };
}

/** La cifra de una fila agrupada, en dólares. */
function cifraDe(fila: Record<string, unknown>): Cifra {
  return {
    unico: {
      min: deCentavos(Number(fila.unico_min ?? 0)),
      max: deCentavos(Number(fila.unico_max ?? 0)),
    },
    mensual: {
      min: deCentavos(Number(fila.mensual_min ?? 0)),
      max: deCentavos(Number(fila.mensual_max ?? 0)),
    },
  };
}

/**
 * Las cuatro cifras de la ficha, a partir del recuento por estado.
 *
 * Cada una es un par y ninguna se funde con otra. «Este cliente vale tanto» no
 * se puede decir con una sola cifra, y por eso no hay una sola cifra.
 */
function totalesDe(filas: readonly Record<string, unknown>[]): TotalesCliente {
  const totales: TotalesCliente = {
    propuesto: cifraCero(),
    ganado: cifraCero(),
    pendiente: cifraCero(),
    perdido: cifraCero(),
    cuantas: 0,
  };

  for (const fila of filas) {
    const cifra = cifraDe(fila);
    totales.propuesto = sumarCifras(totales.propuesto, cifra);
    totales.cuantas += Number(fila.cuantas ?? 0);

    if (fila.estado === 'aceptada') totales.ganado = sumarCifras(totales.ganado, cifra);
    else if (fila.estado === 'perdida') totales.perdido = sumarCifras(totales.perdido, cifra);
    else totales.pendiente = sumarCifras(totales.pendiente, cifra);
  }

  return totales;
}

// --- Escribir ---------------------------------------------------------------

export async function crear(base: D1Database, peticion: Request): Promise<Cliente> {
  return crearConDatos(base, await cuerpoJson<Partial<DatosCliente>>(peticion));
}

/**
 * El alta, a partir de datos que ya están en memoria.
 *
 * La usa `resolverFicha`, que crea la ficha al emitir una propuesta y no tiene
 * una petición HTTP por cliente. Las comprobaciones son exactamente las mismas
 * —pasa por `datosSeguros` y por `comprobarLibre` igual que el alta a mano—
 * porque una ficha creada de paso no merece menos cuidado que un formulario.
 */
export async function crearConDatos(
  base: D1Database,
  crudo: Partial<DatosCliente>,
): Promise<Cliente> {
  const datos = datosSeguros(crudo);
  await comprobarLibre(base, datos, null);

  const codigo = await siguienteCodigo(base);
  const ahora = new Date().toISOString();

  await base
    .prepare(
      `INSERT INTO clientes (
         codigo, negocio, documento, documento_digitos, tipo, contacto, cargo,
         whatsapp, whatsapp_normal, telefono, correo, correo_normal,
         correos_extra, telefonos_extra,
         ciudad, direccion, notas, asesor, estado, negocio_normal,
         creado_en, actualizado_en
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(...valoresDe(codigo, datos), ahora, ahora)
    .run();

  return {
    ...datos,
    codigo,
    creadoEn: ahora,
    actualizadoEn: ahora,
    eliminadoEn: null,
    eliminadoPor: null,
  };
}

export async function actualizar(
  base: D1Database,
  codigo: string,
  peticion: Request,
): Promise<Cliente> {
  const antes = await abrir(base, codigo);
  const datos = datosSeguros(await cuerpoJson<Partial<DatosCliente>>(peticion));
  await comprobarLibre(base, datos, codigo);

  const ahora = new Date().toISOString();

  await base
    .prepare(
      `UPDATE clientes SET
         negocio = ?, documento = ?, documento_digitos = ?, tipo = ?, contacto = ?, cargo = ?,
         whatsapp = ?, whatsapp_normal = ?, telefono = ?, correo = ?, correo_normal = ?,
         correos_extra = ?, telefonos_extra = ?,
         ciudad = ?, direccion = ?, notas = ?, asesor = ?, estado = ?, negocio_normal = ?,
         actualizado_en = ?
       WHERE codigo = ?`,
    )
    // `valoresDe` empieza por el código y aquí va al final, así que se descarta
    // el primero en vez de escribir la lista dos veces.
    .bind(...valoresDe(codigo, datos).slice(1), ahora, codigo)
    .run();

  return { ...antes, ...datos, actualizadoEn: ahora };
}

/**
 * Rechaza un documento que ya sea de otra ficha.
 *
 * El índice único lo impediría igual, pero lo haría con un error de base de
 * datos que la pantalla no sabe explicar. Aquí se comprueba antes para poder
 * decir **de quién** es —y para que la pantalla ofrezca abrir esa ficha en vez
 * de dejar a quien escribe adivinando.
 *
 * El correo y el WhatsApp no llevan índice único a propósito: dos negocios
 * pueden compartir el correo del mismo contador, o el teléfono de quien los
 * atiende, y eso es legítimo. Se avisan como coincidencia, y quien escribe
 * decide.
 */
async function comprobarLibre(
  base: D1Database,
  datos: DatosCliente,
  codigoPropio: string | null,
): Promise<void> {
  const digitos = soloDigitos(datos.documento);
  if (!digitos) return;

  const fila = await base
    .prepare('SELECT codigo, negocio, eliminado_en FROM clientes WHERE documento_digitos = ? LIMIT 1')
    .bind(digitos)
    .first<Record<string, unknown>>();

  if (!fila || String(fila.codigo) === codigoPropio) return;

  const negocio = String(fila.negocio ?? '').trim();
  const donde = fila.eliminado_en ? ' Está en la papelera: se puede restaurar.' : '';
  throw new ErrorPeticion(
    409,
    'cliente-duplicado',
    `Ese ${nombreDocumento(datos.tipo)} ya es de ${negocio || 'otra ficha'} ` +
      `(${String(fila.codigo)}).${donde}`,
    String(fila.codigo),
  );
}

/**
 * Gasta un código del contador y lo devuelve.
 *
 * Una sola sentencia, igual que el consecutivo de propuestas: dos personas
 * dando de alta a la vez no pueden llevarse el mismo código porque SQLite
 * serializa la escritura y cada una ve el contador ya incrementado por la otra.
 */
async function siguienteCodigo(base: D1Database): Promise<string> {
  const fila = await base
    .prepare(
      `INSERT INTO contadores (nombre, valor) VALUES ('clientes', 1)
       ON CONFLICT(nombre) DO UPDATE SET valor = valor + 1
       RETURNING valor`,
    )
    .first<{ valor: number }>();

  if (!fila) throw new Error('El contador de clientes no devolvió valor.');
  return formatoCodigoCliente(fila.valor);
}

// --- El enlace al emitir ----------------------------------------------------

/**
 * A qué ficha pertenece una propuesta que se acaba de emitir.
 *
 * Es la única puerta por la que el cotizador toca el panel de clientes, y hace
 * exactamente tres cosas —enlazar, crear, o no hacer nada y decirlo—. Lo que no
 * hace nunca es **cambiar** una ficha que ya existe: si la propuesta trae un
 * teléfono distinto al de la ficha, gana la ficha y no se avisa siquiera. El
 * momento de corregir un dato del cliente es cuando alguien lo mira, no cuando
 * tiene una propuesta a medio mandar.
 *
 * Y no lanza nunca. Emitir y enlazar son dos cosas que pueden fallar por
 * separado: el cliente está esperando su propuesta, y una ficha sin enlazar se
 * arregla en diez segundos desde el panel.
 */
export async function resolverFicha(base: D1Database, documento: Propuesta): Promise<Enlace> {
  const elegida = documento.clienteCodigo?.trim();

  if (elegida) {
    const fila = await base
      .prepare('SELECT codigo, eliminado_en FROM clientes WHERE codigo = ?')
      .bind(elegida)
      .first<Record<string, unknown>>();

    if (fila) {
      return {
        codigo: String(fila.codigo),
        como: 'elegida',
        ...(fila.eliminado_en
          ? { aviso: `La ficha ${String(fila.codigo)} está en la papelera. Restáurala para verla en el panel.` }
          : {}),
      };
    }
    // El código llegó pero la ficha ya no está. Se sigue como si no lo hubiera
    // traído: reconocer o crear es mejor respuesta que dejarla suelta.
  }

  const cliente = documento.cliente;
  const clave = claveDe({
    correo: cliente?.correo,
    whatsapp: cliente?.whatsapp,
    negocio: cliente?.negocio,
  });

  if (!claveUtil(clave)) {
    return {
      codigo: null,
      como: 'ambigua',
      aviso:
        'La propuesta no quedó enlazada a ninguna ficha: no trae nombre, ni WhatsApp, ni correo con el que reconocer al cliente.',
    };
  }

  const encontrada = await primeraCoincidencia(base, clave);

  if (encontrada) {
    const codigo = String(encontrada.fila.codigo);
    const negocio = String(encontrada.fila.negocio ?? '').trim();

    // El nombre solo no enlaza. «Distribuidora Central» hay varias, y una ficha
    // que se atribuye propuestas ajenas se equivoca en silencio para siempre.
    if (encontrada.clase === 'negocio') {
      return {
        codigo: null,
        como: 'ambigua',
        aviso:
          `No se enlazó a ninguna ficha: ${codigo} se llama igual (${negocio}) pero no coincide ` +
          'ni el WhatsApp ni el correo. Enlázala desde el panel de clientes si es el mismo.',
      };
    }

    return {
      codigo,
      como: 'reconocida',
      aviso: `Se enlazó con ${codigo}${negocio ? ` (${negocio})` : ''}, que ${
        encontrada.clase === 'whatsapp' ? 'contesta en ese mismo WhatsApp' : 'tiene ese mismo correo'
      }.`,
    };
  }

  try {
    const nueva = await crearConDatos(base, {
      negocio: cliente?.negocio ?? '',
      contacto: cliente?.contacto ?? '',
      whatsapp: cliente?.whatsapp ?? '',
      correo: cliente?.correo ?? '',
      ciudad: cliente?.ciudad ?? '',
      asesor: documento.asesor ?? '',
      estado: 'prospecto',
    });

    return {
      codigo: nueva.codigo,
      como: 'creada',
      aviso: `Se creó la ficha ${nueva.codigo} con los datos de la propuesta.`,
    };
  } catch (error) {
    // Lo más probable: la propuesta no trae nombre de negocio. Se dice y ya —lo
    // que no puede pasar es que la propuesta no salga por esto.
    return {
      codigo: null,
      como: 'ambigua',
      aviso: `La propuesta se emitió, pero no se pudo crear su ficha: ${
        error instanceof ErrorPeticion ? error.message : 'fallo al guardarla.'
      }`,
    };
  }
}

/** Qué propuestas apuntan a una ficha. Lo usa el panel para enlazar a mano. */
export async function enlazar(
  base: D1Database,
  codigo: string,
  numero: string,
): Promise<Enlazada> {
  await abrir(base, codigo);

  const resultado = await base
    .prepare('UPDATE propuestas SET cliente_codigo = ? WHERE numero = ?')
    .bind(codigo, numero)
    .run();

  if (!resultado.meta.changes) {
    throw new ErrorPeticion(404, 'no-encontrada', `No hay ninguna propuesta ${numero}.`);
  }

  return { numero, clienteCodigo: codigo };
}

// --- Papelera ---------------------------------------------------------------

export async function leerSeleccion(peticion: Request): Promise<SeleccionClientes> {
  const cuerpo = await cuerpoJson<{ codigos?: unknown; todos?: unknown; filtro?: unknown }>(
    peticion,
  );

  if (cuerpo.todos === true) {
    return { todos: true, filtro: filtroSeguro(cuerpo.filtro as Partial<FiltroClientes>) };
  }

  const codigos = Array.isArray(cuerpo.codigos)
    ? cuerpo.codigos.filter((c): c is string => typeof c === 'string' && c.trim() !== '')
    : [];

  if (codigos.length === 0) {
    throw new ErrorPeticion(400, 'invalida', 'No se indicó ningún cliente.');
  }
  if (codigos.length > MAXIMO_SELECCION_CLIENTES) {
    throw new ErrorPeticion(
      400,
      'invalida',
      `No se pueden tocar más de ${MAXIMO_SELECCION_CLIENTES} clientes de una vez por código. ` +
        'Usa el filtro y «seleccionar todos».',
    );
  }

  return { codigos };
}

/**
 * A qué fichas llega la operación.
 *
 * `papelera` no lo decide quien llama: lo decide la operación. Eliminar solo
 * alcanza lo que está a la vista, y restaurar o purgar solo lo que ya está
 * retirado —diga lo que diga el cuerpo de la petición—.
 */
function alcanceDe(
  seleccion: SeleccionClientes,
  papelera: boolean,
): { donde: string; valores: unknown[] } {
  if ('todos' in seleccion) return dondeDe({ ...seleccion.filtro, papelera });

  const huecos = seleccion.codigos.map(() => '?').join(', ');
  return {
    donde: `WHERE ${
      papelera ? 'eliminado_en IS NOT NULL' : 'eliminado_en IS NULL'
    } AND codigo IN (${huecos})`,
    valores: [...seleccion.codigos],
  };
}

/**
 * Manda fichas a la papelera.
 *
 * **No toca ninguna propuesta.** Es la promesa que hace que esto se pueda usar
 * sin miedo: quitar de en medio a un cliente que ya no contesta no puede costar
 * el historial de lo que se le propuso.
 */
export async function eliminar(
  base: D1Database,
  seleccion: SeleccionClientes,
  correo: string,
): Promise<CuantosClientes> {
  const { donde, valores } = alcanceDe(seleccion, false);
  const resultado = await base
    .prepare(`UPDATE clientes SET eliminado_en = ?, eliminado_por = ? ${donde}`)
    .bind(new Date().toISOString(), correo, ...valores)
    .run();

  return { cuantos: resultado.meta.changes ?? 0 };
}

export async function restaurar(
  base: D1Database,
  seleccion: SeleccionClientes,
): Promise<CuantosClientes> {
  const { donde, valores } = alcanceDe(seleccion, true);
  const resultado = await base
    .prepare(`UPDATE clientes SET eliminado_en = NULL, eliminado_por = NULL ${donde}`)
    .bind(...valores)
    .run();

  return { cuantos: resultado.meta.changes ?? 0 };
}

/**
 * Borra de verdad, y solo lo que ya está en la papelera.
 *
 * El paso previo por la papelera no es una molestia inventada: es lo que
 * convierte «seleccioné treinta sin querer» en algo que se deshace. Aquí ya no
 * —de esto no se vuelve— y por eso `alcanceDe` fuerza que la ficha esté
 * retirada aunque quien llame diga otra cosa.
 */
export async function purgar(
  base: D1Database,
  seleccion: SeleccionClientes,
): Promise<CuantosClientes> {
  const { donde, valores } = alcanceDe(seleccion, true);
  const resultado = await base.prepare(`DELETE FROM clientes ${donde}`).bind(...valores).run();

  return { cuantos: resultado.meta.changes ?? 0 };
}

// --- Traducciones -----------------------------------------------------------

/**
 * Lo que llega de fuera, dejado en una ficha que se puede guardar.
 *
 * Nada se acepta tal cual: todo pasa por `texto` —que recorta y limita el
 * largo— y los dos campos cerrados se comprueban contra su lista. El correo mal
 * escrito se rechaza aquí y no tres días después, cuando rebote.
 */
function datosSeguros(crudo: Partial<DatosCliente>): DatosCliente {
  const negocio = texto(crudo.negocio);
  if (!negocio) throw new ErrorPeticion(400, 'invalida', 'La ficha necesita al menos el nombre.');

  const correo = correoNormal(texto(crudo.correo));
  if (correo && !pareceCorreo(correo)) {
    throw new ErrorPeticion(400, 'invalida', `«${correo}» no es un correo válido.`);
  }

  return {
    negocio,
    documento: texto(crudo.documento, 40),
    tipo: esTipoCliente(crudo.tipo) ? crudo.tipo : 'empresa',
    contacto: texto(crudo.contacto),
    cargo: texto(crudo.cargo, 120),
    whatsapp: texto(crudo.whatsapp, 60),
    telefono: texto(crudo.telefono, 60),
    correo,
    correosExtra: listaSegura(crudo.correosExtra, (v) => {
      const limpio = correoNormal(v);
      if (limpio && !pareceCorreo(limpio)) {
        throw new ErrorPeticion(400, 'invalida', `«${limpio}» no es un correo válido.`);
      }
      return limpio;
    }).filter((v) => v !== correo),
    telefonosExtra: listaSegura(crudo.telefonosExtra, (v) => texto(v, 60)),
    ciudad: texto(crudo.ciudad, 120),
    direccion: texto(crudo.direccion, 300),
    notas: texto(crudo.notas, MAXIMO_NOTAS),
    asesor: texto(crudo.asesor, 120),
    estado: esEstadoCliente(crudo.estado) ? crudo.estado : 'prospecto',
  };
}

/** Una lista de textos de fuera: limpia, sin vacíos, sin repetidos y con tope. */
function listaSegura(crudo: unknown, limpiar: (valor: string) => string): string[] {
  if (!Array.isArray(crudo)) return [];
  const vistos = new Set<string>();
  for (const bruto of crudo) {
    if (typeof bruto !== 'string') continue;
    const limpio = limpiar(bruto);
    if (limpio) vistos.add(limpio);
    if (vistos.size >= MAXIMO_EXTRA) break;
  }
  return [...vistos];
}

/** Los valores del INSERT, en el orden de sus columnas. */
function valoresDe(codigo: string, d: DatosCliente): unknown[] {
  return [
    codigo,
    d.negocio,
    d.documento,
    soloDigitos(d.documento),
    d.tipo,
    d.contacto,
    d.cargo,
    d.whatsapp,
    whatsappNormal(d.whatsapp),
    d.telefono,
    d.correo,
    correoNormal(d.correo),
    JSON.stringify(d.correosExtra),
    JSON.stringify(d.telefonosExtra),
    d.ciudad,
    d.direccion,
    d.notas,
    d.asesor,
    d.estado,
    sinTildes(d.negocio),
  ];
}

/** Una fila de la base, vuelta ficha. */
function aCliente(fila: Record<string, unknown>): Cliente {
  return {
    codigo: String(fila.codigo),
    negocio: String(fila.negocio ?? ''),
    documento: String(fila.documento ?? ''),
    tipo: esTipoCliente(fila.tipo) ? fila.tipo : 'empresa',
    contacto: String(fila.contacto ?? ''),
    cargo: String(fila.cargo ?? ''),
    whatsapp: String(fila.whatsapp ?? ''),
    telefono: String(fila.telefono ?? ''),
    correo: String(fila.correo ?? ''),
    correosExtra: listaGuardada(fila.correos_extra),
    telefonosExtra: listaGuardada(fila.telefonos_extra),
    ciudad: String(fila.ciudad ?? ''),
    direccion: String(fila.direccion ?? ''),
    notas: String(fila.notas ?? ''),
    asesor: String(fila.asesor ?? ''),
    estado: esEstadoCliente(fila.estado) ? fila.estado : 'prospecto',
    creadoEn: String(fila.creado_en ?? ''),
    actualizadoEn: String(fila.actualizado_en ?? ''),
    eliminadoEn: fila.eliminado_en ? String(fila.eliminado_en) : null,
    eliminadoPor: fila.eliminado_por ? String(fila.eliminado_por) : null,
  };
}

/**
 * Una lista guardada como JSON, vuelta arreglo.
 *
 * Nunca revienta: una fila con el JSON estropeado —por una carga a mano, por
 * una migración futura— deja la ficha sin sus correos adicionales, que es
 * molesto, en vez de tumbar el listado entero, que sería grave.
 */
function listaGuardada(crudo: unknown): string[] {
  if (typeof crudo !== 'string' || !crudo.trim()) return [];
  try {
    const leido: unknown = JSON.parse(crudo);
    return Array.isArray(leido) ? leido.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}
