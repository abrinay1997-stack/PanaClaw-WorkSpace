/**
 * El historial, en el navegador de quien cotiza.
 *
 * **No es un historial compartido y no pretende serlo.** Cada persona ve lo que
 * ella misma emitió, y el consecutivo lo lleva su propio navegador. Con una
 * persona cotizando funciona; el día que sean dos, dos clientes distintos
 * pueden recibir la misma «PROP-2026-0007» sin que nadie se entere hasta cruzar
 * los dos PDF.
 *
 * Está elegido a sabiendas y se dice en pantalla, que es la diferencia entre
 * una limitación y una trampa. Cuando haga falta compartirlo, lo que cambia es
 * quién implementa `Almacen` —una función de Netlify con un almacén detrás—, no
 * la pantalla: por eso el contrato está en su propio archivo.
 */

import { catalogo } from '../dominio/catalogo';
import { esCero, formato, formatoMensual } from '../dominio/dinero';
import { totalesDe } from '../dominio/propuesta';
import type { Propuesta } from '../dominio/tipos';
import {
  FalloHistorial,
  type Almacen,
  type Estado,
  type Filtro,
  type PropuestaGuardada,
  type Resumen,
} from './contrato';

const CLAVE = 'panaclaw-cotizador:historial';

type Guardadas = Record<string, PropuestaGuardada>;

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
    throw new FalloHistorial(
      'El navegador no deja guardar más. Descarga las propuestas que necesites y borra las viejas del historial.',
    );
  }
}

/** `PROP-2026-0007`, uno más que el mayor de este año. */
function siguienteNumero(guardadas: Guardadas, ano: number): string {
  const prefijo = `PROP-${ano}-`;
  const mayor = Object.keys(guardadas).reduce((alto, numero) => {
    if (!numero.startsWith(prefijo)) return alto;
    const cifras = Number(numero.slice(prefijo.length));
    return Number.isFinite(cifras) && cifras > alto ? cifras : alto;
  }, 0);
  return `${prefijo}${`${mayor + 1}`.padStart(4, '0')}`;
}

/**
 * El resumen que se ve en el listado.
 *
 * Se calcula desde el documento guardado y con las mismas funciones que usa la
 * pantalla, para que el total del historial no pueda discrepar del total del
 * PDF que tiene el cliente delante.
 */
function resumir(guardada: PropuestaGuardada): Resumen {
  const totales = totalesDe(guardada.documento.lineas, catalogo.costosDeEbot);
  return {
    numero: guardada.numero,
    emitidaEn: guardada.emitidaEn,
    estado: guardada.estado,
    negocio: guardada.documento.cliente.negocio || '—',
    contacto: guardada.documento.cliente.contacto,
    unico: formato(totales.unico),
    // `null` y no '$0': una propuesta sin parte mensual no tiene una parte
    // mensual de cero, no tiene parte mensual.
    mensual: esCero(totales.mensual) ? null : formatoMensual(totales.mensual),
  };
}

const enRango = (fecha: string, desde?: string, hasta?: string): boolean =>
  (!desde || fecha >= desde) && (!hasta || fecha <= hasta);

export const almacenLocal: Almacen = {
  async registrar(propuesta: Propuesta) {
    const guardadas = leer();
    const emitidaEn = new Date().toISOString();
    const numero = propuesta.numero || siguienteNumero(guardadas, Number(propuesta.fecha.slice(0, 4)));
    const previa = guardadas[numero];

    guardadas[numero] = {
      numero,
      // Reemitir conserva la fecha de la primera emisión: es la que el cliente
      // tiene delante en el PDF.
      emitidaEn: previa?.emitidaEn ?? emitidaEn,
      estado: previa?.estado ?? 'emitida',
      nota: previa?.nota ?? '',
      documento: { ...propuesta, numero },
    };

    escribir(guardadas);
    return { numero, emitidaEn: guardadas[numero]!.emitidaEn };
  },

  async listar(filtro: Filtro) {
    const busqueda = filtro.busqueda?.trim().toLowerCase() ?? '';

    return Object.values(leer())
      .filter((g) => {
        if (filtro.estado && filtro.estado !== 'todas' && g.estado !== filtro.estado) return false;
        if (!enRango(g.documento.fecha, filtro.desde, filtro.hasta)) return false;
        if (!busqueda) return true;
        const paja = [g.numero, g.documento.cliente.negocio, g.documento.cliente.contacto]
          .join(' ')
          .toLowerCase();
        return paja.includes(busqueda);
      })
      .sort((a, b) => b.emitidaEn.localeCompare(a.emitidaEn))
      .map(resumir);
  },

  async abrir(numero: string) {
    const guardada = leer()[numero];
    if (!guardada) throw new FalloHistorial(`No hay ninguna propuesta con el número ${numero}.`);
    return guardada;
  },

  async marcar(numero: string, estado: Estado, nota: string) {
    const guardadas = leer();
    const guardada = guardadas[numero];
    if (!guardada) throw new FalloHistorial(`No hay ninguna propuesta con el número ${numero}.`);
    guardadas[numero] = { ...guardada, estado, nota };
    escribir(guardadas);
  },

  async borrar(numero: string) {
    const guardadas = leer();
    delete guardadas[numero];
    escribir(guardadas);
  },
};
