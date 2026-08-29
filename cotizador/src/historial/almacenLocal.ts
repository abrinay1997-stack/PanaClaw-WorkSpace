/**
 * El historial de la vista previa: el navegador de quien mira.
 *
 * **No es un historial compartido y no pretende serlo.** Cada persona ve lo que
 * ella misma emitió y el consecutivo lo lleva su propio equipo. Existe para que
 * la vista previa —que no tiene servidor detrás— se pueda enseñar entera sin
 * montar antes la base de datos ni Cloudflare Access.
 *
 * En el hub publicado no entra: `almacen.ts` elige `almacenApi` en cuanto no
 * está la marca `VITE_DEMO`, así que este archivo ni siquiera llega al paquete.
 * Es lo que impide que una propuesta de verdad acabe guardada solo aquí
 * creyendo que quedó registrada.
 *
 * Por eso los números salen como `PROP-DEMO-0001`: ningún PDF de éstos se puede
 * confundir con uno de verdad si acaba en manos de alguien.
 */

import { catalogo } from '../dominio/catalogo';
import { totalesDe } from '../dominio/propuesta';
import type { Propuesta } from '../dominio/tipos';
import { FalloApi } from '../api/fallo';
import {
  POR_PAGINA,
  type Almacen,
  type Cuantas,
  type Emitida,
  type Estado,
  type FiltroHistorial,
  type Importe,
  type PaginaHistorial,
  type PropuestaGuardada,
  type ResumenPropuesta,
  type Seleccion,
} from './contrato';

const CLAVE = 'panaclaw-cotizador:historial';

/** El prefijo de la vista previa. Ver la cabecera. */
const PREFIJO = 'PROP-DEMO-';

type Guardadas = Record<string, PropuestaGuardada<Propuesta>>;

function leer(): Guardadas {
  try {
    const crudo = localStorage.getItem(CLAVE);
    return crudo ? (JSON.parse(crudo) as Guardadas) : {};
  } catch {
    // Un JSON corrupto no puede dejar la herramienta inservible: se empieza de
    // cero y se sigue trabajando.
    return {};
  }
}

function escribir(guardadas: Guardadas): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(guardadas));
  } catch {
    throw new FalloApi(
      'fallo',
      'El navegador no deja guardar más. Descarga las propuestas que necesites y borra las viejas del historial.',
    );
  }
}

/** `PROP-DEMO-0007`, uno más que el mayor que haya. */
function siguienteNumero(guardadas: Guardadas): string {
  const mayor = Object.keys(guardadas).reduce((alto, numero) => {
    if (!numero.startsWith(PREFIJO)) return alto;
    const cifras = Number(numero.slice(PREFIJO.length));
    return Number.isFinite(cifras) && cifras > alto ? cifras : alto;
  }, 0);
  return `${PREFIJO}${`${mayor + 1}`.padStart(4, '0')}`;
}

/**
 * El resumen de una propuesta guardada.
 *
 * Se calcula desde el documento y con las mismas funciones que usa la pantalla
 * —y que el Worker—, para que el total del historial no pueda discrepar del
 * total del PDF que tiene el cliente delante.
 */
function resumir(guardada: PropuestaGuardada<Propuesta>): ResumenPropuesta {
  const totales = totalesDe(guardada.documento.lineas, catalogo.costosDeEbot);
  return { ...guardada, unico: totales.unico, mensual: totales.mensual };
}

const sumar = (a: Importe, b: Importe): Importe => ({ min: a.min + b.min, max: a.max + b.max });

const CERO: Importe = { min: 0, max: 0 };

const enRango = (fecha: string, desde?: string, hasta?: string): boolean =>
  (!desde || fecha >= desde) && (!hasta || fecha <= hasta);

/** Las que cumplen el filtro, ya ordenadas. La paginación viene después. */
function filtrar(filtro: FiltroHistorial): ResumenPropuesta[] {
  const busqueda = filtro.texto?.trim().toLowerCase() ?? '';

  return Object.values(leer())
    .map(resumir)
    .filter((fila) => {
      if (filtro.papelera ? !fila.eliminadaEn : fila.eliminadaEn) return false;
      if (filtro.estado && fila.estado !== filtro.estado) return false;
      if (!enRango(fila.emitidaEn.slice(0, 10), filtro.desde, filtro.hasta)) return false;
      if (!busqueda) return true;
      return [fila.numero, fila.negocio, fila.contacto, fila.correo, fila.whatsapp]
        .join(' ')
        .toLowerCase()
        .includes(busqueda);
    })
    .sort((a, b) => b.emitidaEn.localeCompare(a.emitidaEn));
}

/** A qué números llega una operación en bloque, resuelto aquí mismo. */
function alcanceDe(seleccion: Seleccion, papelera: boolean): Set<string> {
  if ('todas' in seleccion) {
    return new Set(filtrar({ ...seleccion.filtro, papelera }).map((f) => f.numero));
  }
  const enPapelera = new Set(filtrar({ papelera }).map((f) => f.numero));
  return new Set(seleccion.numeros.filter((numero) => enPapelera.has(numero)));
}

export const almacenLocal: Almacen = {
  async registrar(propuesta: Propuesta): Promise<Emitida> {
    const guardadas = leer();
    const ahora = new Date().toISOString();
    const numero = propuesta.numero || siguienteNumero(guardadas);
    const previa = guardadas[numero];
    const documento = { ...propuesta, numero };
    const totales = totalesDe(documento.lineas, catalogo.costosDeEbot);

    guardadas[numero] = {
      numero,
      fecha: documento.fecha,
      // Reemitir conserva la fecha de la primera emisión: es la que el cliente
      // tiene delante en el PDF.
      emitidaEn: previa?.emitidaEn ?? ahora,
      autor: 'vista previa',
      asesor: documento.asesor,
      negocio: documento.cliente.negocio,
      contacto: documento.cliente.contacto,
      correo: documento.cliente.correo,
      whatsapp: documento.cliente.whatsapp,
      clienteCodigo: null,
      unico: totales.unico,
      mensual: totales.mensual,
      lineas: documento.lineas.length,
      estado: previa?.estado ?? 'emitida',
      estadoNota: previa?.estadoNota ?? '',
      estadoEn: previa?.estadoEn ?? null,
      estadoPor: previa?.estadoPor ?? null,
      // Volver a emitir una propuesta retirada la saca de la papelera, igual
      // que en el servidor.
      eliminadaEn: null,
      eliminadaPor: null,
      documento,
    };

    escribir(guardadas);

    return {
      numero,
      emitidaEn: guardadas[numero]!.emitidaEn,
      enlace: {
        codigo: null,
        como: 'ambigua',
        aviso:
          'Esta es la vista previa: no tiene panel de clientes detrás, así que la propuesta no se enlazó con ninguna ficha.',
      },
    };
  },

  async listar(filtro: FiltroHistorial): Promise<PaginaHistorial> {
    const todas = filtrar(filtro);
    const pagina = Math.max(1, filtro.pagina ?? 1);
    const desde = (pagina - 1) * POR_PAGINA;

    return {
      propuestas: todas.slice(desde, desde + POR_PAGINA),
      cuantas: todas.length,
      pagina,
      porPagina: POR_PAGINA,
      // Dos sumas y no una, igual que en el servidor: sumar el pago único con
      // la mensualidad daría una cifra que no es dinero de ninguna clase.
      sumas: {
        unico: todas.reduce((acc, f) => sumar(acc, f.unico), CERO),
        mensual: todas.reduce((acc, f) => sumar(acc, f.mensual), CERO),
      },
    };
  },

  async abrir(numero: string): Promise<PropuestaGuardada<Propuesta>> {
    const guardada = leer()[numero];
    if (!guardada) {
      throw new FalloApi('no-encontrada', `No hay ninguna propuesta ${numero}.`);
    }
    return { ...resumir(guardada), documento: guardada.documento };
  },

  async marcar(numero: string, estado: Estado, nota: string): Promise<void> {
    const guardadas = leer();
    const guardada = guardadas[numero];
    if (!guardada) {
      throw new FalloApi('no-encontrada', `No hay ninguna propuesta ${numero}.`);
    }
    guardadas[numero] = {
      ...guardada,
      estado,
      estadoNota: nota,
      estadoEn: new Date().toISOString(),
      estadoPor: 'vista previa',
    };
    escribir(guardadas);
  },

  async eliminar(seleccion: Seleccion): Promise<Cuantas> {
    const guardadas = leer();
    const alcance = alcanceDe(seleccion, false);
    const ahora = new Date().toISOString();

    for (const numero of alcance) {
      const guardada = guardadas[numero];
      if (guardada) {
        guardadas[numero] = { ...guardada, eliminadaEn: ahora, eliminadaPor: 'vista previa' };
      }
    }

    escribir(guardadas);
    return { cuantas: alcance.size };
  },

  async restaurar(seleccion: Seleccion): Promise<Cuantas> {
    const guardadas = leer();
    const alcance = alcanceDe(seleccion, true);

    for (const numero of alcance) {
      const guardada = guardadas[numero];
      if (guardada) guardadas[numero] = { ...guardada, eliminadaEn: null, eliminadaPor: null };
    }

    escribir(guardadas);
    return { cuantas: alcance.size };
  },

  async purgar(seleccion: Seleccion): Promise<Cuantas> {
    const guardadas = leer();
    // Solo alcanza lo que ya está en la papelera, igual que el servidor: el
    // paso previo es lo que convierte un descuido en algo que se deshace.
    const alcance = alcanceDe(seleccion, true);

    for (const numero of alcance) delete guardadas[numero];

    escribir(guardadas);
    return { cuantas: alcance.size };
  },
};
