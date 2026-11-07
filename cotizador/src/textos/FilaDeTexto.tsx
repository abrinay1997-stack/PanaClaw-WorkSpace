/**
 * Un texto editable: lo que dice hoy, su original al lado, y cómo se leerá.
 *
 * Sirve a dos pantallas que se parecen y no son lo mismo: la plantilla del equipo
 * (se guarda en el servidor y vale para las propuestas nuevas) y el retoque de una
 * propuesta (solo vale para ese cliente). Cambia lo que ocurre al guardar; la
 * fila es la misma.
 */

import { useEffect, useState } from 'react';

import { mensajeDe } from '../api/fallo';
import { rellenar, validarTexto, vistaPrevia, type TextoEditable } from '../dominio/textos';

interface Props {
  def: TextoEditable;
  /** Lo que vale ahora, sin contar lo que se esté escribiendo. */
  vigente: string;
  /** Lo que valdría sin edición en este sitio: el original, o la plantilla. */
  base: string;
  /** Texto del botón que guarda. */
  etiquetaGuardar: string;
  /** Guarda el texto. Con `null`, quita la edición y vuelve a `base`. */
  alGuardar: (texto: string | null) => Promise<void> | void;
  /** «Editado por ana@… el 2026-11-07», cuando se sabe. */
  autoria?: string;
}

export function FilaDeTexto({ def, vigente, base, etiquetaGuardar, alGuardar, autoria }: Props) {
  const [borrador, setBorrador] = useState(vigente);
  const [fallo, setFallo] = useState('');
  const [ocupado, setOcupado] = useState(false);

  // Si lo vigente cambia por fuera (se guardó, o se restauró), el campo lo sigue.
  useEffect(() => setBorrador(vigente), [vigente]);

  const cambiado = borrador.trim() !== vigente.trim();
  const editado = vigente.trim() !== base.trim();
  const problema = cambiado ? validarTexto(def.clave, borrador) : null;

  const ejecutar = async (texto: string | null) => {
    setOcupado(true);
    try {
      await alGuardar(texto);
      setFallo('');
    } catch (error) {
      setFallo(mensajeDe(error, 'No se pudo guardar.'));
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="border-t border-white/10 py-4 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-sm font-semibold text-blanco">{def.titulo}</h4>
        {editado ? (
          <span className="rounded-full border border-naranja/60 px-2 py-0.5 text-xs text-naranja">Editado</span>
        ) : null}
      </div>
      {def.ayuda ? <p className="mt-1 text-xs text-gris">{def.ayuda}</p> : null}

      <textarea
        className="campo mt-2 w-full"
        rows={Math.min(6, Math.max(2, Math.ceil(borrador.length / 90)))}
        value={borrador}
        onChange={(e) => setBorrador(e.currentTarget.value)}
        aria-label={def.titulo}
      />

      {def.variables.length ? (
        <p className="mt-1.5 text-xs leading-relaxed text-gris">
          Se rellenan solas:{' '}
          {def.variables.map((v, i) => (
            <span key={v.nombre}>
              {i ? ' · ' : ''}
              <code className="text-blanco">{`{${v.nombre}}`}</code> {v.que}
            </span>
          ))}
          . Los importes se escriben con la variable, no con la cifra.
        </p>
      ) : null}

      {problema ? (
        <p className="mt-2 text-xs text-naranja" role="alert">
          {problema}
        </p>
      ) : (
        <p className="mt-2 text-xs leading-relaxed text-gris">
          <span className="text-blanco">Así se leerá:</span> {vistaPrevia(def, borrador.trim() || base)}
        </p>
      )}

      {editado ? (
        <p className="mt-1.5 text-xs leading-relaxed text-gris">
          <span className="text-blanco">El original dice:</span> {rellenar(def.defecto, Object.fromEntries(def.variables.map((v) => [v.nombre, v.ejemplo])))}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="boton boton-secundario px-3 py-1 text-xs"
          disabled={ocupado || !cambiado || !!problema}
          onClick={() => void ejecutar(borrador.trim())}
        >
          {etiquetaGuardar}
        </button>
        {editado ? (
          <button type="button" className="boton boton-fantasma px-3 py-1 text-xs" disabled={ocupado} onClick={() => void ejecutar(null)}>
            Restaurar
          </button>
        ) : null}
        {autoria ? <span className="text-xs text-gris">{autoria}</span> : null}
      </div>

      {fallo ? (
        <p className="mt-2 text-xs text-naranja" role="alert">
          {fallo}
        </p>
      ) : null}
    </div>
  );
}
