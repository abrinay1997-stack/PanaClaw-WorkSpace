/**
 * Lo que se ha emitido, y en qué acabó.
 *
 * El estado —emitida, aceptada, perdida— es lo que convierte un archivo en algo
 * que se mira: cuánto se cotizó el mes pasado y cuánto de eso entró.
 */

import { useCallback, useEffect, useState } from 'react';

import type { Propuesta } from '../dominio/tipos';
import { fechaLarga } from '../dominio/formato';
import { Pastilla, Seccion } from '../ui/componentes';
import { descargarPdf } from '../ui/acciones';
import { almacenLocal } from './almacenLocal';
import { ESTADOS, FalloHistorial, type Estado, type Resumen } from './contrato';

const ETIQUETA: Record<Estado, string> = {
  emitida: 'Emitida',
  aceptada: 'Aceptada',
  perdida: 'Perdida',
};

export function PantallaHistorial({
  alVolver,
  alReabrir,
}: {
  alVolver: () => void;
  alReabrir: (propuesta: Propuesta) => void;
}) {
  const [filas, setFilas] = useState<Resumen[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState<Estado | 'todas'>('todas');
  const [fallo, setFallo] = useState('');

  const recargar = useCallback(async () => {
    try {
      setFilas(await almacenLocal.listar({ busqueda, estado }));
      setFallo('');
    } catch (error) {
      setFallo(error instanceof FalloHistorial ? error.mensaje : 'No se pudo leer el historial.');
    }
  }, [busqueda, estado]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const conFallo = async (accion: () => Promise<void>) => {
    try {
      await accion();
      await recargar();
    } catch (error) {
      setFallo(error instanceof FalloHistorial ? error.mensaje : 'No se pudo completar la acción.');
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 p-4 lg:p-6">
      <header className="flex flex-wrap items-center gap-3">
        <button type="button" className="boton boton-secundario" onClick={alVolver}>
          ← Volver al cotizador
        </button>
        <h1 className="text-lg font-semibold">Historial</h1>
      </header>

      {/*
        La limitación se dice arriba y sin poderse cerrar. Un historial que solo
        vive en este navegador y no lo advierte es una trampa: dos personas
        cotizando a la vez pueden mandar la misma «PROP-2026-0007» a dos
        clientes distintos y no enterarse hasta cruzar los dos PDF.
      */}
      <p className="rounded-tarjeta border border-naranja/30 bg-naranja/10 p-4 text-sm leading-relaxed text-blanco">
        Este historial vive <strong className="font-semibold">solo en este navegador</strong>. No lo
        ve nadie más y el consecutivo lo lleva este equipo: si cotizan dos personas, cada una tiene
        su propia numeración. Descarga el PDF de lo que emitas.
      </p>

      <Seccion titulo="Buscar">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            type="search"
            className="campo"
            placeholder="Número, negocio o contacto"
            value={busqueda}
            onChange={(e) => setBusqueda(e.currentTarget.value)}
          />
          <select
            className="campo sm:w-44"
            value={estado}
            onChange={(e) => setEstado(e.currentTarget.value as Estado | 'todas')}
          >
            <option value="todas" className="bg-negro">Todas</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e} className="bg-negro">
                {ETIQUETA[e]}
              </option>
            ))}
          </select>
        </div>
      </Seccion>

      {fallo ? (
        <p className="rounded-tarjeta border border-ember/40 bg-ember/12 p-4 text-sm text-blanco">{fallo}</p>
      ) : null}

      {filas.length === 0 ? (
        <p className="tarjeta p-8 text-center text-sm text-gris">
          Todavía no hay nada emitido desde este navegador.
        </p>
      ) : (
        <ul className="space-y-3">
          {filas.map((fila) => (
            <li key={fila.numero} className="tarjeta p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-blanco">{fila.negocio}</p>
                  <p className="text-xs text-gris">
                    {fila.numero} · {fechaLarga(fila.emitidaEn.slice(0, 10))}
                    {fila.contacto ? ` · ${fila.contacto}` : ''}
                  </p>
                </div>

                {/* Los dos totales, separados también aquí. Fundirlos en la
                    lista sería contradecir el documento que está enlazado
                    dos centímetros más abajo. */}
                <div className="text-right">
                  <p className="text-sm font-semibold text-naranja">{fila.unico}</p>
                  {fila.mensual ? <p className="text-xs text-gris">+ {fila.mensual}</p> : null}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Pastilla encendida={fila.estado === 'aceptada'}>{ETIQUETA[fila.estado]}</Pastilla>

                <select
                  className="campo w-auto px-2 py-1 text-xs"
                  value={fila.estado}
                  onChange={(e) =>
                    void conFallo(() =>
                      almacenLocal.marcar(fila.numero, e.currentTarget.value as Estado, ''),
                    )
                  }
                  aria-label={`Estado de ${fila.numero}`}
                >
                  {ESTADOS.map((e) => (
                    <option key={e} value={e} className="bg-negro">
                      {ETIQUETA[e]}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="boton boton-secundario px-3 py-1 text-xs"
                  onClick={() =>
                    void conFallo(async () => {
                      const guardada = await almacenLocal.abrir(fila.numero);
                      await descargarPdf(guardada.documento);
                    })
                  }
                >
                  Bajar PDF
                </button>

                <button
                  type="button"
                  className="boton boton-secundario px-3 py-1 text-xs"
                  onClick={() =>
                    void conFallo(async () => {
                      const guardada = await almacenLocal.abrir(fila.numero);
                      // Se reabre SIN número: una versión nueva es una
                      // propuesta nueva, y pisar la vieja borraría lo que el
                      // cliente ya tiene en la mano.
                      alReabrir({ ...guardada.documento, numero: '' });
                    })
                  }
                >
                  Hacer una versión nueva
                </button>

                <button
                  type="button"
                  className="boton boton-fantasma ml-auto px-2 py-1 text-xs"
                  onClick={() => {
                    if (confirm(`¿Borrar ${fila.numero} del historial? El PDF que ya se envió no se borra.`)) {
                      void conFallo(() => almacenLocal.borrar(fila.numero));
                    }
                  }}
                >
                  Borrar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
