/**
 * «¿Para quién es?», preguntado antes de escribir los datos a mano.
 *
 * Se escriben tres letras del nombre, del RUC, del WhatsApp o del correo, se
 * elige, y los campos de abajo se llenan solos con lo que la ficha tenga hoy.
 *
 * **No es obligatorio.** Se puede seguir escribiendo a mano como siempre, y al
 * emitir la ficha se crea sola si no existe. Obligar a elegir antes de empezar
 * estorbaría en la propuesta de afán, que es justo cuando nadie quiere pelearse
 * con un buscador.
 */

import { useEffect, useState } from 'react';

import type { Cliente } from '../../../compartido/clientes';
import { ES_DEMOSTRACION } from '../api/pedir';
import { mensajeDe } from '../api/fallo';
import { clientes } from './almacen';

/** Cuántas letras hacen falta para preguntar. Con menos, sobran resultados. */
const MINIMO = 3;
/** Cuánto se espera desde la última tecla. Lo justo para no pedir por letra. */
const ESPERA = 250;

export function BuscadorCliente({
  codigoEnlazado,
  alElegir,
  alSoltar,
}: {
  codigoEnlazado: string | undefined;
  alElegir: (cliente: Cliente) => void;
  alSoltar: () => void;
}) {
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState<Cliente[]>([]);
  const [fallo, setFallo] = useState('');
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    const busqueda = texto.trim();
    if (busqueda.length < MINIMO) {
      setResultados([]);
      return;
    }

    // El temporizador se cancela con cada tecla, así que solo sale una petición
    // cuando quien escribe para.
    let vigente = true;
    const temporizador = setTimeout(async () => {
      setBuscando(true);
      try {
        const pagina = await clientes.listar({ texto: busqueda });
        if (vigente) {
          setResultados(pagina.clientes);
          setFallo('');
        }
      } catch (error) {
        if (vigente) setFallo(mensajeDe(error, 'No se pudo buscar en la libreta.'));
      } finally {
        if (vigente) setBuscando(false);
      }
    }, ESPERA);

    return () => {
      vigente = false;
      clearTimeout(temporizador);
    };
  }, [texto]);

  // Sin servidor no hay libreta que buscar, y un buscador que no encuentra
  // nunca nada es peor que no tenerlo.
  if (ES_DEMOSTRACION) return null;

  if (codigoEnlazado) {
    return (
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-campo border border-naranja/30 bg-naranja/10 p-3">
        <p className="mr-auto text-sm text-blanco">
          Enlazada con la ficha <strong className="font-semibold">{codigoEnlazado}</strong>. Lo que
          se imprime son los datos de aquí abajo; la ficha no se toca.
        </p>
        <button
          type="button"
          className="boton boton-fantasma px-2 py-1 text-xs"
          onClick={() => {
            setTexto('');
            alSoltar();
          }}
        >
          Quitar el enlace
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label className="block">
        <span className="etiqueta">Buscar en la libreta</span>
        <input
          type="search"
          className="campo"
          placeholder="Tres letras del nombre, el RUC, el WhatsApp o el correo"
          value={texto}
          onChange={(e) => setTexto(e.currentTarget.value)}
        />
      </label>

      {fallo ? <p className="mt-2 text-xs text-gris">{fallo}</p> : null}

      {texto.trim().length >= MINIMO && !buscando && resultados.length === 0 && !fallo ? (
        <p className="mt-2 text-xs text-gris">
          Nadie con eso en la libreta. Escribe los datos abajo: la ficha se crea al emitir.
        </p>
      ) : null}

      {resultados.length > 0 ? (
        <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto">
          {resultados.map((cliente) => (
            <li key={cliente.codigo}>
              <button
                type="button"
                className="w-full rounded-campo border border-white/10 p-2.5 text-left hover:border-white/30"
                onClick={() => {
                  setTexto('');
                  setResultados([]);
                  alElegir(cliente);
                }}
              >
                <span className="block truncate text-sm text-blanco">{cliente.negocio}</span>
                <span className="block truncate text-xs text-gris">
                  {[cliente.codigo, cliente.documento, cliente.contacto, cliente.whatsapp, cliente.correo]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
