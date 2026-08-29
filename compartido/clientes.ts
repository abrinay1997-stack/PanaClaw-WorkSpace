/**
 * El contrato del panel de clientes: qué es un cliente y qué viaja por el cable.
 *
 * Vive fuera del cotizador y del Worker por lo mismo que `propuestas.ts`: si un
 * día las fichas dejan de estar en Cloudflare, este archivo es lo que la otra
 * implementación tiene que cumplir.
 *
 * La decisión que explica casi todo lo de abajo es **cómo se reconoce a un
 * cliente que llega**. Ver `COINCIDENCIA` y `claveDe`.
 */

import { correoNormal, sinTildes, soloDigitos, whatsappNormal } from './texto';

/** En qué punto de la relación está. */
export type EstadoCliente = 'prospecto' | 'activo' | 'inactivo';

export const ESTADOS_CLIENTE: readonly EstadoCliente[] = ['prospecto', 'activo', 'inactivo'];

export const NOMBRE_ESTADO_CLIENTE: Record<EstadoCliente, string> = {
  prospecto: 'Prospecto',
  activo: 'Cliente activo',
  inactivo: 'Inactivo',
};

export function esEstadoCliente(valor: unknown): valor is EstadoCliente {
  return valor === 'prospecto' || valor === 'activo' || valor === 'inactivo';
}

/**
 * Empresa o persona natural.
 *
 * No es cosmético: decide si el documento se llama RUC o cédula. En Panamá
 * contratarle a un emprendedor por su cédula es tan corriente como hacerlo con
 * el RUC de una sociedad, y llamarle RUC a una cédula en la ficha de alguien es
 * el tipo de detalle que hace que la herramienta parezca prestada de otro país.
 */
export type TipoCliente = 'empresa' | 'persona';

export function esTipoCliente(valor: unknown): valor is TipoCliente {
  return valor === 'empresa' || valor === 'persona';
}

/** Cómo se llama el documento de identidad de cada uno. */
export function nombreDocumento(tipo: TipoCliente): string {
  return tipo === 'persona' ? 'Cédula' : 'RUC';
}

/**
 * Lo que se puede escribir de un cliente.
 *
 * Separado de `Cliente` a propósito: esto es lo que viaja al crear o editar, y
 * lo de allá lleva además lo que pone el servidor —el código, las fechas, la
 * papelera— que nunca se acepta de quien llama.
 */
export interface DatosCliente {
  /** El nombre del negocio, o el de la persona. Es lo único obligatorio. */
  negocio: string;
  /** RUC o cédula, tal como lo escribió quien lo tecleó. */
  documento: string;
  tipo: TipoCliente;
  contacto: string;
  cargo: string;
  whatsapp: string;
  telefono: string;
  correo: string;
  /** Los que se fueron sumando. El principal es `correo` y no está aquí. */
  correosExtra: string[];
  telefonosExtra: string[];
  /** Provincia o ciudad. PanaClaw vende en todo Panamá y también fuera. */
  ciudad: string;
  direccion: string;
  notas: string;
  /** Quién lo atiende. */
  asesor: string;
  estado: EstadoCliente;
}

export interface Cliente extends DatosCliente {
  /** `CLI-0001`. Lo asigna el servidor y no cambia nunca. */
  codigo: string;
  creadoEn: string;
  actualizadoEn: string;
  /** Solo las fichas de la papelera lo traen. */
  eliminadoEn: string | null;
  eliminadoPor: string | null;
}

/** Una ficha vacía, para el formulario de «cliente nuevo». */
export function clienteVacio(): DatosCliente {
  return {
    negocio: '',
    documento: '',
    tipo: 'empresa',
    contacto: '',
    cargo: '',
    whatsapp: '',
    telefono: '',
    correo: '',
    correosExtra: [],
    telefonosExtra: [],
    ciudad: '',
    direccion: '',
    notas: '',
    asesor: '',
    estado: 'prospecto',
  };
}

export interface FiltroClientes {
  /** Busca en código, negocio, documento, contacto, correo, WhatsApp y ciudad. */
  texto?: string;
  estado?: EstadoCliente;
  asesor?: string;
  pagina?: number;
  /** `true` lista la papelera en vez de las fichas a la vista. */
  papelera?: boolean;
}

export interface PaginaClientes {
  clientes: Cliente[];
  /** Cuántos cumplen el filtro en total, no cuántos trae esta página. */
  cuantos: number;
  pagina: number;
  porPagina: number;
}

export const CLIENTES_POR_PAGINA = 25;

/**
 * A qué fichas alcanza una operación en bloque. El gemelo de `Seleccion` del
 * historial, y por las mismas razones: cientos de códigos no viajan por el
 * cable para borrarse.
 */
export type SeleccionClientes =
  | { readonly codigos: readonly string[] }
  | { readonly todos: true; readonly filtro: FiltroClientes };

export const MAXIMO_SELECCION_CLIENTES = 500;

/** Cuántas fichas tocó una operación en bloque. */
export interface CuantosClientes {
  cuantos: number;
}

/** `CLI-0007`. Sin año: los códigos de cliente no se reinician en enero. */
export function formatoCodigoCliente(valor: number): string {
  return `CLI-${String(valor).padStart(4, '0')}`;
}

// --- Cómo se reconoce a un cliente ------------------------------------------

/**
 * Por qué el código de cliente **no** sirve para reconocerlo.
 *
 * Es la pregunta que más se repite y conviene dejarla escrita. Cuando llega una
 * propuesta hay que decidir «¿a éste ya lo tengo?», y en ese momento el código
 * todavía no existe: generarlo respondería «es nuevo» siempre, y así es como se
 * llena una base de duplicados. El código es el resultado de haber reconocido
 * al cliente, no la forma de reconocerlo.
 *
 * Lo que sí reconoce es esta escalera, en orden, y gana el primer peldaño que
 * dé respuesta:
 *
 * 1. **RUC o cédula**, comparando solo los dígitos. Es lo único que no se
 *    repite y no cambia.
 * 2. **Un documento que se le parece**: el mismo número con uno o dos dígitos
 *    de más al final. Es el RUC escrito con y sin su DV —`155646123-2-2015` y
 *    el mismo con `DV 45` pegado detrás—, que es como se acaba con dos fichas
 *    de la misma sociedad.
 * 3. **WhatsApp**, comparando los ocho dígitos del número nacional. En PanaClaw
 *    es el dato que de verdad existe: casi todo entra por ahí, y el RUC aparece
 *    al firmar, no al preguntar precios.
 * 4. **Correo**, en minúsculas.
 * 5. **Nombre del negocio**, sin tildes ni mayúsculas. Último recurso.
 *
 * Solo el peldaño 1 puede unir solo. Los otros cuatro son flojos —dos negocios
 * comparten el correo del mismo contador, el WhatsApp que contesta es el del
 * primo que monta la web, y «Distribuidora Central» hay varias— así que quien
 * los use tiene que **preguntar antes de unir dos fichas**, nunca fusionar en
 * silencio. Esa diferencia es la que lleva `fuerte`.
 */
export const COINCIDENCIA = ['documento', 'parecido', 'whatsapp', 'correo', 'negocio'] as const;

export type ClaseCoincidencia = (typeof COINCIDENCIA)[number];

/** Si una coincidencia basta para unir sin preguntar. Solo el documento exacto. */
export function coincidenciaFuerte(clase: ClaseCoincidencia): boolean {
  return clase === 'documento';
}

/**
 * Cuántos dígitos hacen falta para que valga la pena comparar dos documentos.
 *
 * Por debajo de esto la comparación deja de significar algo: un «12» y un «123»
 * se parecerían, y de eso no se puede sacar ninguna conclusión.
 */
export const MINIMO_DIGITOS_DOCUMENTO = 8;

/** Cuántos dígitos de cola puede añadir un DV panameño. */
export const MAXIMO_DIGITOS_DV = 2;

/**
 * Si dos documentos se diferencian solo en la cola del DV.
 *
 * El RUC panameño se escribe de las dos formas —con su dígito verificador
 * detrás y sin él— y quien teclea una hoy y la otra mañana acaba con dos fichas
 * de la misma sociedad. Esto lo detecta.
 *
 * **No es prueba de que sean el mismo**: una cédula puede parecerse a un RUC
 * más su DV sin tener nada que ver. Por eso es una coincidencia floja, que se
 * pregunta y no se aplica sola.
 */
export function documentosParecidos(a: string, b: string): boolean {
  const uno = soloDigitos(a);
  const otro = soloDigitos(b);
  if (!uno || !otro || uno === otro) return false;

  const [corto, largo] = uno.length < otro.length ? [uno, otro] : [otro, uno];

  if (corto.length < MINIMO_DIGITOS_DOCUMENTO) return false;
  const sobran = largo.length - corto.length;
  return sobran >= 1 && sobran <= MAXIMO_DIGITOS_DV && largo.startsWith(corto);
}

/** Por qué se parecen, dicho para que lo lea una persona. */
export const MOTIVO_COINCIDENCIA: Record<ClaseCoincidencia, string> = {
  documento: 'tiene el mismo RUC o cédula',
  parecido: 'tiene un documento casi igual: el mismo número con el DV de diferencia',
  whatsapp: 'contesta en ese mismo WhatsApp',
  correo: 'tiene ese mismo correo',
  negocio: 'se llama igual',
};

/** Lo mínimo para buscar a un cliente que llega. */
export interface ClaveCliente {
  documento: string;
  whatsapp: string;
  correo: string;
  negocio: string;
}

/**
 * Deja los cuatro datos listos para comparar: dígitos, minúsculas y sin tildes.
 *
 * Lo usan los dos lados —el servidor para consultar y la pantalla para decidir
 * si hace falta preguntar— y por eso está aquí y no en ninguno de los dos.
 */
export function claveDe(datos: Partial<ClaveCliente> | null | undefined): ClaveCliente {
  return {
    documento: soloDigitos(datos?.documento),
    whatsapp: whatsappNormal(datos?.whatsapp),
    correo: correoNormal(datos?.correo),
    negocio: sinTildes(datos?.negocio),
  };
}

/** Si esa clave tiene con qué buscar algo. Sin nada de esto no hay cliente. */
export function claveUtil(clave: ClaveCliente): boolean {
  return Boolean(clave.documento || clave.whatsapp || clave.correo || clave.negocio);
}

/** Lo que responde el servidor al preguntar «¿a éste ya lo tengo?». */
export interface Coincidencia {
  cliente: Cliente;
  /** Por cuál de los peldaños se encontró. */
  clase: ClaseCoincidencia;
  /** `true` solo con el documento: se puede dar por hecho sin preguntar. */
  fuerte: boolean;
}
