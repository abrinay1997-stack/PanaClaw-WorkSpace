/**
 * La libreta: quién es cliente, quién fue y quién todavía no.
 *
 * Se maneja igual que el historial —buscador, filtros, casillas, papelera,
 * páginas— porque es la misma forma de trabajar sobre otra cosa. Aprender dos
 * pantallas distintas para hacer lo mismo es trabajo que no paga nadie.
 */

import { useCallback, useEffect, useState } from 'react';

import {
  CLIENTES_POR_PAGINA,
  ESTADOS_CLIENTE,
  NOMBRE_ESTADO_CLIENTE,
  type Cliente,
  type EstadoCliente,
  type FiltroClientes,
  type SeleccionClientes,
} from '../../../compartido/clientes';
import { ES_DEMOSTRACION } from '../api/pedir';
import { mensajeDe } from '../api/fallo';
import { Pastilla, Seccion } from '../ui/componentes';
import { clientes } from './almacen';
import { descargarCsv } from './exportar';

/** Cuántas páginas se traen al exportar. Doce mil fichas son de sobra. */
const PAGINAS_AL_EXPORTAR = 20;

export function PantallaClientes({
  alVolver,
  alAbrir,
  alNuevo,
}: {
  alVolver: () => void;
  alAbrir: (codigo: string) => void;
  alNuevo: () => void;
}) {
  const [texto, setTexto] = useState('');
  const [estado, setEstado] = useState<EstadoCliente | ''>('');
  const [papelera, setPapelera] = useState(false);
  const [pagina, setPagina] = useState(1);

  const [lista, setLista] = useState<Cliente[]>([]);
  const [cuantos, setCuantos] = useState(0);
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [todosDelFiltro, setTodosDelFiltro] = useState(false);
  const [fallo, setFallo] = useState('');
  const [cargando, setCargando] = useState(false);

  const filtro: FiltroClientes = {
    texto: texto.trim() || undefined,
    estado: estado || undefined,
    pagina,
    papelera,
  };

  const recargar = useCallback(async () => {
    setCargando(true);
    try {
      const respuesta = await clientes.listar({
        texto: texto.trim() || undefined,
        estado: estado || undefined,
        pagina,
        papelera,
      });
      setLista(respuesta.clientes);
      setCuantos(respuesta.cuantos);
      setFallo('');
    } catch (error) {
      setFallo(mensajeDe(error, 'No se pudo leer la lista de clientes.'));
    } finally {
      setCargando(false);
    }
  }, [texto, estado, pagina, papelera]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  // Cambiar de filtro invalida la selección: lo que estaba marcado ya no es lo
  // que se está viendo, y una operación en bloque sobre una selección vieja es
  // la forma más silenciosa de borrar lo que no era.
  useEffect(() => {
    setMarcados(new Set());
    setTodosDelFiltro(false);
  }, [texto, estado, papelera, pagina]);

  const paginas = Math.max(1, Math.ceil(cuantos / CLIENTES_POR_PAGINA));
  const alcance = todosDelFiltro ? cuantos : marcados.size;

  const seleccion = (): SeleccionClientes =>
    todosDelFiltro ? { todos: true, filtro } : { codigos: [...marcados] };

  const enBloque = async (
    accion: (s: SeleccionClientes) => Promise<{ cuantos: number }>,
    confirmacion: string,
  ) => {
    if (alcance === 0 || !confirm(confirmacion)) return;
    try {
      await accion(seleccion());
      setMarcados(new Set());
      setTodosDelFiltro(false);
      await recargar();
    } catch (error) {
      setFallo(mensajeDe(error, 'No se pudo completar la operación.'));
    }
  };

  const exportar = async () => {
    try {
      const todo: Cliente[] = [];
      for (let n = 1; n <= PAGINAS_AL_EXPORTAR; n += 1) {
        const respuesta = await clientes.listar({ ...filtro, pagina: n });
        todo.push(...respuesta.clientes);
        if (todo.length >= respuesta.cuantos) break;
      }
      descargarCsv(todo, `clientes-panaclaw-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (error) {
      setFallo(mensajeDe(error, 'No se pudo exportar la lista.'));
    }
  };

  if (ES_DEMOSTRACION) return <SinServidor alVolver={alVolver} />;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 p-4 lg:p-6">
      <header className="flex flex-wrap items-center gap-3">
        <button type="button" className="boton boton-secundario" onClick={alVolver}>
          ← Volver al cotizador
        </button>
        <h1 className="mr-auto text-lg font-semibold">
          Clientes
          <span className="ml-2 text-sm font-normal text-gris">
            {cuantos} {papelera ? 'en la papelera' : 'en la libreta'}
          </span>
        </h1>
        <button type="button" className="boton boton-secundario" onClick={() => void exportar()}>
          Exportar
        </button>
        <button type="button" className="boton boton-primario" onClick={alNuevo}>
          Cliente nuevo
        </button>
      </header>

      <Seccion titulo="Buscar">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <input
            type="search"
            className="campo"
            placeholder="Nombre, RUC, contacto, WhatsApp o correo"
            value={texto}
            onChange={(e) => {
              setTexto(e.currentTarget.value);
              setPagina(1);
            }}
          />
          <select
            className="campo sm:w-48"
            value={estado}
            onChange={(e) => {
              setEstado(e.currentTarget.value as EstadoCliente | '');
              setPagina(1);
            }}
          >
            <option value="" className="bg-negro">
              Todos los estados
            </option>
            {ESTADOS_CLIENTE.map((e) => (
              <option key={e} value={e} className="bg-negro">
                {NOMBRE_ESTADO_CLIENTE[e]}
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
        </div>
      </Seccion>

      {fallo ? (
        <p className="rounded-tarjeta border border-ember/40 bg-ember/12 p-4 text-sm text-blanco">
          {fallo}
        </p>
      ) : null}

      {alcance > 0 ? (
        <div className="tarjeta flex flex-wrap items-center gap-3 p-4">
          <p className="mr-auto text-sm text-blanco">
            {alcance} {alcance === 1 ? 'ficha seleccionada' : 'fichas seleccionadas'}
          </p>

          {!todosDelFiltro && cuantos > lista.length ? (
            <button
              type="button"
              className="boton boton-fantasma px-2 py-1 text-xs"
              onClick={() => setTodosDelFiltro(true)}
            >
              Seleccionar las {cuantos} que cumplen el filtro
            </button>
          ) : null}

          {papelera ? (
            <>
              <button
                type="button"
                className="boton boton-secundario px-3 py-1 text-xs"
                onClick={() =>
                  void enBloque(clientes.restaurar, `¿Restaurar ${alcance} de la papelera?`)
                }
              >
                Restaurar
              </button>
              <button
                type="button"
                className="boton boton-secundario px-3 py-1 text-xs"
                onClick={() =>
                  void enBloque(
                    clientes.purgar,
                    `¿Eliminar definitivamente ${alcance}? De esto no se vuelve. Sus propuestas NO se borran.`,
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
                void enBloque(
                  (s) => clientes.eliminar(s),
                  `¿Mandar ${alcance} a la papelera? Sus propuestas no se borran, y se puede deshacer.`,
                )
              }
            >
              Eliminar
            </button>
          )}
        </div>
      ) : null}

      {cargando && lista.length === 0 ? (
        <p className="tarjeta p-8 text-center text-sm text-gris">Cargando…</p>
      ) : lista.length === 0 ? (
        <p className="tarjeta p-8 text-center text-sm text-gris">
          {papelera
            ? 'La papelera está vacía.'
            : texto || estado
              ? 'Ninguna ficha cumple ese filtro.'
              : 'Todavía no hay clientes. Se crean solos al emitir una propuesta, o a mano con «Cliente nuevo».'}
        </p>
      ) : (
        <ul className="space-y-3">
          {lista.map((cliente) => (
            <li key={cliente.codigo} className="tarjeta p-4">
              <div className="flex flex-wrap items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 size-4 accent-naranja"
                  aria-label={`Seleccionar ${cliente.negocio}`}
                  checked={todosDelFiltro || marcados.has(cliente.codigo)}
                  onChange={(e) => {
                    setTodosDelFiltro(false);
                    const nuevos = new Set(marcados);
                    if (e.currentTarget.checked) nuevos.add(cliente.codigo);
                    else nuevos.delete(cliente.codigo);
                    setMarcados(nuevos);
                  }}
                />

                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => alAbrir(cliente.codigo)}
                >
                  <p className="truncate text-sm font-semibold text-blanco">{cliente.negocio}</p>
                  <p className="truncate text-xs text-gris">
                    {cliente.codigo}
                    {cliente.documento ? ` · ${cliente.documento}` : ''}
                    {cliente.contacto ? ` · ${cliente.contacto}` : ''}
                    {cliente.ciudad ? ` · ${cliente.ciudad}` : ''}
                  </p>
                  <p className="truncate text-xs text-gris">
                    {[cliente.whatsapp, cliente.correo].filter(Boolean).join(' · ') || 'Sin contacto'}
                  </p>
                </button>

                <div className="flex flex-col items-end gap-1">
                  <Pastilla encendida={cliente.estado === 'activo'}>
                    {NOMBRE_ESTADO_CLIENTE[cliente.estado]}
                  </Pastilla>
                  {cliente.asesor ? (
                    <span className="text-[0.6875rem] text-gris">{cliente.asesor}</span>
                  ) : null}
                </div>
              </div>

              {cliente.eliminadoEn ? (
                <p className="mt-3 text-xs text-gris">
                  En la papelera desde el {cliente.eliminadoEn.slice(0, 10)}
                  {cliente.eliminadoPor ? `, retirada por ${cliente.eliminadoPor}` : ''}.
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

/**
 * Lo que se ve en la vista previa.
 *
 * El panel de clientes existe para que dos personas vean la misma lista, así
 * que una versión que guardara las fichas en el navegador de cada quien
 * enseñaría lo contrario de lo que promete. Se dice y no se ofrece nada.
 */
function SinServidor({ alVolver }: { alVolver: () => void }) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 p-4 lg:p-6">
      <header className="flex flex-wrap items-center gap-3">
        <button type="button" className="boton boton-secundario" onClick={alVolver}>
          ← Volver al cotizador
        </button>
        <h1 className="text-lg font-semibold">Clientes</h1>
      </header>

      <p className="rounded-tarjeta border border-naranja/30 bg-naranja/10 p-5 text-sm leading-relaxed text-blanco">
        Esta es la <strong className="font-semibold">vista previa</strong> del cotizador y no tiene
        servidor detrás. El panel de clientes existe para que todo el equipo vea la misma libreta,
        así que aquí no se enseña una copia de mentira: se dice que falta. En el hub publicado, esta
        pantalla trae la lista, la ficha de cada cliente y lo que se le ha propuesto.
      </p>
    </div>
  );
}
