/**
 * Lo que se ha emitido, y en qué acabó.
 *
 * El estado —emitida, aceptada, perdida— es lo que convierte un archivo en algo
 * que se mira: cuánto se propuso el mes pasado y cuánto de eso entró.
 *
 * Arriba van **dos sumas y no una**. «Propusimos tanto de una vez» y «tenemos
 * tanto al mes comprometido» son dos frases distintas, y ninguna de las dos se
 * puede decir con la otra dentro.
 */

import { useCallback, useEffect, useState } from 'react';

import { esCero, formato, formatoMensual } from '../dominio/dinero';
import { fechaLarga } from '../dominio/formato';
import type { Propuesta } from '../dominio/tipos';
import { ES_DEMOSTRACION } from '../api/pedir';
import { mensajeDe } from '../api/fallo';
import { descargarPdf } from '../ui/acciones';
import { Pastilla, Seccion } from '../ui/componentes';
import { almacen } from './almacen';
import {
  ESTADOS,
  NOMBRE_ESTADO,
  POR_PAGINA,
  type Estado,
  type FiltroHistorial,
  type PaginaHistorial,
  type Seleccion,
} from './contrato';

const PAGINA_VACIA: PaginaHistorial = {
  propuestas: [],
  cuantas: 0,
  pagina: 1,
  porPagina: POR_PAGINA,
  sumas: { unico: { min: 0, max: 0 }, mensual: { min: 0, max: 0 } },
};

export function PantallaHistorial({
  alVolver,
  alReabrir,
  alAbrirCliente,
}: {
  alVolver: () => void;
  alReabrir: (propuesta: Propuesta) => void;
  alAbrirCliente: (codigo: string) => void;
}) {
  const [texto, setTexto] = useState('');
  const [estado, setEstado] = useState<Estado | ''>('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [papelera, setPapelera] = useState(false);
  const [pagina, setPagina] = useState(1);

  const [datos, setDatos] = useState<PaginaHistorial>(PAGINA_VACIA);
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set());
  const [todasDelFiltro, setTodasDelFiltro] = useState(false);
  const [fallo, setFallo] = useState('');

  const filtro: FiltroHistorial = {
    texto: texto.trim() || undefined,
    estado: estado || undefined,
    desde: desde || undefined,
    hasta: hasta || undefined,
    pagina,
    papelera,
  };

  const recargar = useCallback(async () => {
    try {
      setDatos(
        await almacen.listar({
          texto: texto.trim() || undefined,
          estado: estado || undefined,
          desde: desde || undefined,
          hasta: hasta || undefined,
          pagina,
          papelera,
        }),
      );
      setFallo('');
    } catch (error) {
      setFallo(mensajeDe(error, 'No se pudo leer el historial.'));
    }
  }, [texto, estado, desde, hasta, pagina, papelera]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  // Cambiar de filtro invalida la selección: lo marcado ya no es lo que se ve.
  useEffect(() => {
    setMarcadas(new Set());
    setTodasDelFiltro(false);
  }, [texto, estado, desde, hasta, papelera, pagina]);

  const conFallo = async (accion: () => Promise<void>) => {
    try {
      await accion();
      await recargar();
    } catch (error) {
      setFallo(mensajeDe(error, 'No se pudo completar la acción.'));
    }
  };

  const paginas = Math.max(1, Math.ceil(datos.cuantas / POR_PAGINA));
  const alcance = todasDelFiltro ? datos.cuantas : marcadas.size;
  const seleccion = (): Seleccion =>
    todasDelFiltro ? { todas: true, filtro } : { numeros: [...marcadas] };

  const enBloque = (
    accion: (s: Seleccion) => Promise<{ cuantas: number }>,
    confirmacion: string,
  ) => {
    if (alcance === 0 || !confirm(confirmacion)) return;
    void conFallo(async () => {
      await accion(seleccion());
      setMarcadas(new Set());
      setTodasDelFiltro(false);
    });
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 p-4 lg:p-6">
      <header className="flex flex-wrap items-center gap-3">
        <button type="button" className="boton boton-secundario" onClick={alVolver}>
          ← Volver al cotizador
        </button>
        <h1 className="text-lg font-semibold">
          Historial
          <span className="ml-2 text-sm font-normal text-gris">
            {datos.cuantas} {papelera ? 'en la papelera' : 'emitidas'}
          </span>
        </h1>
      </header>

      {ES_DEMOSTRACION ? (
        <p className="rounded-tarjeta border border-naranja/30 bg-naranja/10 p-4 text-sm leading-relaxed text-blanco">
          Esta es la <strong className="font-semibold">vista previa</strong>: el historial vive solo
          en este navegador, no lo ve nadie más y los números salen como{' '}
          <code className="rounded bg-white/10 px-1">PROP-DEMO-0001</code> para que ningún PDF de
          éstos se confunda con uno de verdad. En el hub publicado, el historial es el mismo para
          todo el equipo y el número lo da el servidor.
        </p>
      ) : null}

      <Seccion titulo="Buscar">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="search"
            className="campo lg:col-span-2"
            placeholder="Número, negocio, contacto, WhatsApp o correo"
            value={texto}
            onChange={(e) => {
              setTexto(e.currentTarget.value);
              setPagina(1);
            }}
          />
          <select
            className="campo"
            value={estado}
            onChange={(e) => {
              setEstado(e.currentTarget.value as Estado | '');
              setPagina(1);
            }}
          >
            <option value="" className="bg-negro">
              Todos los estados
            </option>
            {ESTADOS.map((e) => (
              <option key={e} value={e} className="bg-negro">
                {NOMBRE_ESTADO[e]}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={`boton ${papelera ? 'boton-primario' : 'boton-secundario'}`}
            aria-pressed={papelera}
            onClick={() => {
              setPapelera(!papelera);
              setPagina(1);
            }}
          >
            Papelera
          </button>
          <label className="block">
            <span className="etiqueta">Desde</span>
            <input
              type="date"
              className="campo"
              value={desde}
              onChange={(e) => {
                setDesde(e.currentTarget.value);
                setPagina(1);
              }}
            />
          </label>
          <label className="block">
            <span className="etiqueta">Hasta</span>
            <input
              type="date"
              className="campo"
              value={hasta}
              onChange={(e) => {
                setHasta(e.currentTarget.value);
                setPagina(1);
              }}
            />
          </label>
        </div>
      </Seccion>

      {datos.cuantas > 0 ? <DosSumas sumas={datos.sumas} /> : null}

      {fallo ? (
        <p className="rounded-tarjeta border border-ember/40 bg-ember/12 p-4 text-sm text-blanco">
          {fallo}
        </p>
      ) : null}

      {alcance > 0 ? (
        <div className="tarjeta flex flex-wrap items-center gap-3 p-4">
          <p className="mr-auto text-sm text-blanco">
            {alcance} {alcance === 1 ? 'propuesta seleccionada' : 'propuestas seleccionadas'}
          </p>

          {!todasDelFiltro && datos.cuantas > datos.propuestas.length ? (
            <button
              type="button"
              className="boton boton-fantasma px-2 py-1 text-xs"
              onClick={() => setTodasDelFiltro(true)}
            >
              Seleccionar las {datos.cuantas} que cumplen el filtro
            </button>
          ) : null}

          {papelera ? (
            <>
              <button
                type="button"
                className="boton boton-secundario px-3 py-1 text-xs"
                onClick={() =>
                  enBloque(almacen.restaurar, `¿Restaurar ${alcance} de la papelera?`)
                }
              >
                Restaurar
              </button>
              <button
                type="button"
                className="boton boton-secundario px-3 py-1 text-xs"
                onClick={() =>
                  enBloque(
                    almacen.purgar,
                    `¿Eliminar definitivamente ${alcance}? De esto no se vuelve: con el documento se va la posibilidad de regenerar el PDF que recibió el cliente.`,
                  )
                }
              >
                Eliminar definitivamente
              </button>
            </>
          ) : (
            <button
              type="button"
              className="boton boton-secundario px-3 py-1 text-xs"
              onClick={() =>
                enBloque(
                  almacen.eliminar,
                  `¿Mandar ${alcance} a la papelera? Se puede deshacer, y el PDF que ya se envió no se borra.`,
                )
              }
            >
              Eliminar
            </button>
          )}
        </div>
      ) : null}

      {datos.propuestas.length === 0 ? (
        <p className="tarjeta p-8 text-center text-sm text-gris">
          {papelera ? 'La papelera está vacía.' : 'Todavía no hay nada emitido.'}
        </p>
      ) : (
        <ul className="space-y-3">
          {datos.propuestas.map((fila) => (
            <li key={fila.numero} className="tarjeta p-4">
              <div className="flex flex-wrap items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 size-4 accent-naranja"
                  aria-label={`Seleccionar ${fila.numero}`}
                  checked={todasDelFiltro || marcadas.has(fila.numero)}
                  onChange={(e) => {
                    setTodasDelFiltro(false);
                    const nuevas = new Set(marcadas);
                    if (e.currentTarget.checked) nuevas.add(fila.numero);
                    else nuevas.delete(fila.numero);
                    setMarcadas(nuevas);
                  }}
                />

                <div className="mr-auto min-w-0">
                  <p className="truncate text-sm font-semibold text-blanco">
                    {fila.negocio || 'Sin nombre'}
                  </p>
                  <p className="truncate text-xs text-gris">
                    {fila.numero} · {fechaLarga(fila.emitidaEn.slice(0, 10))}
                    {fila.contacto ? ` · ${fila.contacto}` : ''}
                    {fila.autor ? ` · ${fila.autor}` : ''}
                  </p>
                </div>

                {/* Los dos totales, separados también aquí. Fundirlos en la
                    lista sería contradecir el documento que está enlazado dos
                    centímetros más abajo. */}
                <div className="text-right">
                  <p className="text-sm font-semibold text-naranja">
                    {formato(fila.unico)}
                  </p>
                  {esCero(fila.mensual) ? null : (
                    <p className="text-xs text-gris">+ {formatoMensual(fila.mensual)}</p>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Pastilla encendida={fila.estado === 'aceptada'}>
                  {NOMBRE_ESTADO[fila.estado]}
                </Pastilla>

                {papelera ? null : (
                  <select
                    className="campo w-auto px-2 py-1 text-xs"
                    value={fila.estado}
                    onChange={(e) =>
                      void conFallo(() =>
                        almacen.marcar(fila.numero, e.currentTarget.value as Estado, ''),
                      )
                    }
                    aria-label={`Estado de ${fila.numero}`}
                  >
                    {ESTADOS.map((e) => (
                      <option key={e} value={e} className="bg-negro">
                        {NOMBRE_ESTADO[e]}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  className="boton boton-secundario px-3 py-1 text-xs"
                  onClick={() =>
                    void conFallo(async () => {
                      const guardada = await almacen.abrir(fila.numero);
                      await descargarPdf(guardada.documento);
                    })
                  }
                >
                  Bajar PDF
                </button>

                {papelera ? null : (
                  <button
                    type="button"
                    className="boton boton-secundario px-3 py-1 text-xs"
                    onClick={() =>
                      void conFallo(async () => {
                        const guardada = await almacen.abrir(fila.numero);
                        // Se reabre SIN número: una versión nueva es una
                        // propuesta nueva, y pisar la vieja borraría lo que el
                        // cliente ya tiene en la mano.
                        alReabrir({ ...guardada.documento, numero: '' });
                      })
                    }
                  >
                    Hacer una versión nueva
                  </button>
                )}

                {fila.clienteCodigo ? (
                  <button
                    type="button"
                    className="boton boton-fantasma px-2 py-1 text-xs"
                    onClick={() => alAbrirCliente(fila.clienteCodigo!)}
                  >
                    Ver ficha {fila.clienteCodigo}
                  </button>
                ) : (
                  <span className="text-xs text-gris">Sin ficha enlazada</span>
                )}
              </div>

              {fila.eliminadaEn ? (
                <p className="mt-3 text-xs text-gris">
                  En la papelera desde el {fila.eliminadaEn.slice(0, 10)}
                  {fila.eliminadaPor ? `, retirada por ${fila.eliminadaPor}` : ''}. El número sigue
                  ocupado: el consecutivo no retrocede.
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {paginas > 1 ? (
        <nav className="flex items-center justify-center gap-3" aria-label="Páginas">
          <button
            type="button"
            className="boton boton-secundario px-3 py-1 text-xs"
            disabled={pagina <= 1}
            onClick={() => setPagina(pagina - 1)}
          >
            Anterior
          </button>
          <span className="text-xs text-gris">
            Página {pagina} de {paginas}
          </span>
          <button
            type="button"
            className="boton boton-secundario px-3 py-1 text-xs"
            disabled={pagina >= paginas}
            onClick={() => setPagina(pagina + 1)}
          >
            Siguiente
          </button>
        </nav>
      ) : null}
    </div>
  );
}

/** Las dos sumas de lo que cumple el filtro. Dos, y nunca una. */
function DosSumas({ sumas }: { sumas: PaginaHistorial['sumas'] }) {
  return (
    <div className="tarjeta grid gap-4 p-5 sm:grid-cols-2">
      <div>
        <p className="antetitulo">De una vez</p>
        <p className="mt-1 text-lg font-semibold text-blanco">{formato(sumas.unico)}</p>
      </div>
      <div>
        <p className="antetitulo">Cada mes</p>
        <p className="mt-1 text-lg font-semibold text-blanco">
          {esCero(sumas.mensual) ? '—' : formatoMensual(sumas.mensual)}
        </p>
      </div>
      <p className="text-xs leading-relaxed text-gris sm:col-span-2">
        Son dos cifras y no se suman. Un pago único y una mensualidad son dos compromisos con dos
        duraciones distintas: juntarlos daría un número creíble y falso.
      </p>
    </div>
  );
}
