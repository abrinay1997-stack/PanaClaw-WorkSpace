/**
 * Un texto del documento, tal como se verá, con su botón «Editar» al lado.
 *
 * Es la forma de editar los textos: donde se ve, no en una lista aparte. La
 * sección «Plazo» enseña la frase del plazo y, junto a ella, «Editar»; al pulsarlo
 * se abre ahí mismo el campo, con lo que se va a leer en el PDF debajo, y se
 * elige en el momento si el cambio vale solo para esta propuesta o para todas las
 * nuevas. Nadie tiene que acordarse de en qué pantalla estaba cada texto.
 *
 * Lo que se enseña es el texto ya resuelto (con el precio de la ronda extra, el
 * nombre del plan…), idéntico a lo que saldrá en el PDF: por eso `valores` trae los
 * datos reales de esta propuesta y no unos de muestra.
 */

import { useRef, useState, type ReactNode } from 'react';

import { mensajeDe } from '../api/fallo';
import { ES_DEMOSTRACION } from '../api/pedir';
import { definicion, rellenar, textoDe, validarTexto } from '../dominio/textos';
import type { Propuesta } from '../dominio/tipos';
import type { Accion } from '../ui/usePropuesta';
import { almacenTextos } from './almacenTextos';
import { fijarPlantilla, usePlantilla } from './plantilla';

type Valores = Readonly<Record<string, string | number>>;

interface Props {
  clave: string;
  propuesta: Propuesta;
  despachar: (accion: Accion) => void;
  /** Los datos reales con los que se rellena este texto (el plan, lo que cuesta la ronda extra…). */
  valores?: Valores;
  /**
   * Cómo se dibuja cuando no se está editando. Por defecto, un párrafo con el
   * texto. Sirve cuando un mismo texto gobierna varias líneas (el formato de cada
   * plazo) y lo que se quiere ver es la lista entera.
   */
  vista?: ReactNode;
  /** Qué se edita, para el botón y para los lectores de pantalla. */
  nombre?: string;
  /** Cómo se dibuja el texto en la vista por defecto. */
  claseDelTexto?: string;
}

export function TextoEnLugar({ clave, propuesta, despachar, valores = {}, vista, nombre, claseDelTexto }: Props) {
  const def = definicion(clave);
  const plantilla = usePlantilla();
  const [abierto, setAbierto] = useState(false);
  const [borrador, setBorrador] = useState('');
  const [fallo, setFallo] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const campo = useRef<HTMLTextAreaElement>(null);

  if (!def) return null;

  const propio = propuesta.textos?.[clave];
  const delEquipo = plantilla[clave];
  /** Lo que valdría en esta propuesta si no tuviera cambio propio. */
  const sinCambioPropio = delEquipo ?? def.defecto;
  const vigente = propio ?? sinCambioPropio;
  const soloAqui = propio !== undefined && propio.trim() !== sinCambioPropio.trim();

  const texto = textoDe(clave, { ...plantilla, ...propuesta.textos }, valores);
  const nombreCorto = nombre ?? def.titulo;

  const abrir = () => {
    setBorrador(vigente);
    setFallo('');
    setAbierto(true);
    // El foco al campo en cuanto existe: quien pulsa «Editar» quiere escribir.
    requestAnimationFrame(() => campo.current?.focus());
  };

  const limpio = borrador.trim();
  const problema = abierto && limpio ? validarTexto(clave, limpio) : abierto ? 'El texto está vacío. Para volver al original, usa «Volver al original».' : null;
  const vistaPrevia = rellenar(limpio || sinCambioPropio, valores);

  const insertar = (nombreVariable: string) => {
    const el = campo.current;
    const hueco = `{${nombreVariable}}`;
    if (!el) return setBorrador((b) => b + hueco);
    const { selectionStart: desde, selectionEnd: hasta } = el;
    const nuevo = borrador.slice(0, desde) + hueco + borrador.slice(hasta);
    setBorrador(nuevo);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(desde + hueco.length, desde + hueco.length);
    });
  };

  const ejecutar = async (accion: () => Promise<void> | void) => {
    setOcupado(true);
    try {
      await accion();
      setAbierto(false);
    } catch (error) {
      setFallo(mensajeDe(error, 'No se pudo guardar.'));
    } finally {
      setOcupado(false);
    }
  };

  /** Solo esta propuesta. Si queda igual que lo que ya valía, no hay nada que recordar. */
  const soloEstaPropuesta = () =>
    ejecutar(() => despachar({ tipo: 'texto', clave, texto: limpio === sinCambioPropio.trim() ? null : limpio }));

  /** Todas las propuestas nuevas: a la plantilla, y esta propuesta pasa a seguirla. */
  const todasLasNuevas = () =>
    ejecutar(async () => {
      fijarPlantilla(await almacenTextos.guardar(clave, limpio === def.defecto.trim() ? '' : limpio));
      despachar({ tipo: 'texto', clave, texto: null });
    });

  const quitarCambioPropio = () => ejecutar(() => despachar({ tipo: 'texto', clave, texto: null }));

  const volverAlOriginal = () =>
    ejecutar(async () => {
      fijarPlantilla(await almacenTextos.guardar(clave, ''));
      despachar({ tipo: 'texto', clave, texto: null });
    });

  if (!abierto) {
    return (
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          {vista ?? <p className={claseDelTexto ?? 'text-sm leading-relaxed text-blanco'}>{texto}</p>}
          {soloAqui ? (
            <p className="mt-1 text-xs font-medium text-naranja">Cambiado solo en esta propuesta</p>
          ) : delEquipo !== undefined ? (
            <p className="mt-1 text-xs text-gris">Texto del equipo</p>
          ) : null}
        </div>
        <button
          type="button"
          className="boton boton-secundario shrink-0 !px-3 !py-1.5 text-xs"
          onClick={abrir}
          aria-label={`Editar: ${nombreCorto}`}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
          Editar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-campo border border-naranja/50 bg-papel p-3 shadow-sm" role="group" aria-label={`Editando: ${nombreCorto}`}>
      <div>
        <p className="text-sm font-semibold text-blanco">{def.titulo}</p>
        {def.ayuda ? <p className="mt-0.5 text-xs text-gris">{def.ayuda}</p> : null}
      </div>

      <textarea
        ref={campo}
        className="campo"
        rows={Math.min(7, Math.max(3, Math.ceil(borrador.length / 80)))}
        value={borrador}
        onChange={(e) => setBorrador(e.currentTarget.value)}
        aria-label={def.titulo}
      />

      {def.variables.length ? (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-gris">
          <span>Insertar un dato:</span>
          {def.variables.map((v) => (
            <button
              key={v.nombre}
              type="button"
              className="rounded-pastilla border border-linea-fuerte bg-papel px-2.5 py-1 font-medium text-blanco hover:bg-velo-fuerte"
              onClick={() => insertar(v.nombre)}
              title={`${v.que} (por ejemplo: ${v.ejemplo})`}
            >
              {v.nombre}
            </button>
          ))}
          <span className="basis-full">Los importes se insertan con el dato, no se escriben: así no se quedan desfasados.</span>
        </div>
      ) : null}

      {problema ? (
        <p className="text-xs font-medium text-naranja" role="alert">
          {problema}
        </p>
      ) : (
        <div className="rounded-campo bg-velo p-2.5 text-sm leading-relaxed text-blanco">
          <span className="block text-xs font-medium text-gris">Así se leerá en el documento</span>
          {vistaPrevia}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="boton boton-primario !py-1.5 text-xs" disabled={ocupado || !!problema} onClick={() => void soloEstaPropuesta()}>
          Solo en esta propuesta
        </button>
        {!ES_DEMOSTRACION ? (
          <button
            type="button"
            className="boton boton-secundario !py-1.5 text-xs"
            disabled={ocupado || !!problema || limpio === sinCambioPropio.trim()}
            onClick={() => void todasLasNuevas()}
          >
            En todas las propuestas nuevas
          </button>
        ) : null}
        <button type="button" className="boton boton-fantasma !py-1.5 text-xs" disabled={ocupado} onClick={() => setAbierto(false)}>
          Cancelar
        </button>
      </div>

      {soloAqui || (delEquipo !== undefined && !ES_DEMOSTRACION) ? (
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-linea pt-2 text-xs">
          {soloAqui ? (
            <button type="button" className="font-medium text-gris underline underline-offset-2 hover:text-blanco" disabled={ocupado} onClick={() => void quitarCambioPropio()}>
              Quitar el cambio de esta propuesta
            </button>
          ) : null}
          {delEquipo !== undefined && !ES_DEMOSTRACION ? (
            <button type="button" className="font-medium text-gris underline underline-offset-2 hover:text-blanco" disabled={ocupado} onClick={() => void volverAlOriginal()}>
              Volver al texto original en todas las propuestas
            </button>
          ) : null}
        </div>
      ) : null}

      {fallo ? (
        <p className="text-xs font-medium text-naranja" role="alert">
          {fallo}
        </p>
      ) : null}
    </div>
  );
}
