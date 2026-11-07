/**
 * Cambiar una frase solo en esta propuesta.
 *
 * Es el retoque para un cliente concreto —un despacho de abogados no se lee como
 * una tienda de repuestos—, encima de la plantilla del equipo. Lo que se cambia
 * aquí se guarda dentro de la propuesta y no toca la plantilla.
 */

import { useMemo } from 'react';

import { GRUPO_PRODUCTOS, TEXTOS_EDITABLES, type TextoEditable } from '../dominio/textos';
import type { Propuesta } from '../dominio/tipos';
import { Seccion } from '../ui/componentes';
import type { Accion } from '../ui/usePropuesta';
import { FilaDeTexto } from './FilaDeTexto';
import { usePlantilla } from './plantilla';

export function TextosDeLaPropuesta({
  propuesta,
  despachar,
}: {
  propuesta: Propuesta;
  despachar: (accion: Accion) => void;
}) {
  const plantilla = usePlantilla();

  // Las descripciones de producto solo para los productos que lleva la propuesta:
  // veinte filas de productos que no están aquí serían ruido.
  const enUso = useMemo(() => new Set(propuesta.lineas.map((l) => `item.${l.itemId}`)), [propuesta.lineas]);
  const visibles: TextoEditable[] = TEXTOS_EDITABLES.filter((d) => d.grupo !== GRUPO_PRODUCTOS || enUso.has(d.clave));

  const grupos = useMemo(() => {
    const porGrupo = new Map<string, TextoEditable[]>();
    for (const def of visibles) porGrupo.set(def.grupo, [...(porGrupo.get(def.grupo) ?? []), def]);
    return [...porGrupo];
  }, [visibles]);

  const retocados = Object.entries(propuesta.textos ?? {}).filter(
    ([clave, texto]) => texto.trim() !== (plantilla[clave] ?? TEXTOS_EDITABLES.find((d) => d.clave === clave)?.defecto ?? '').trim(),
  ).length;

  return (
    <Seccion
      titulo="Textos de esta propuesta"
      ayuda="Para cambiar una frase solo aquí. Lo que quieras cambiar en todas las propuestas se hace en «Textos»."
    >
      <details>
        <summary className="cursor-pointer text-sm text-blanco">
          {retocados ? `${retocados} ${retocados === 1 ? 'frase retocada' : 'frases retocadas'} en esta propuesta` : 'Ver y retocar los textos'}
        </summary>

        <div className="mt-4 space-y-4">
          {propuesta.textos && Object.keys(propuesta.textos).length ? (
            <button
              type="button"
              className="boton boton-fantasma px-3 py-1 text-xs"
              onClick={() => despachar({ tipo: 'textos', textos: undefined })}
            >
              Volver a la plantilla del equipo en todo
            </button>
          ) : null}

          {grupos.map(([grupo, defs]) => (
            <div key={grupo}>
              <h3 className="antetitulo mb-2">{grupo}</h3>
              {defs.map((def) => (
                <FilaDeTexto
                  key={def.clave}
                  def={def}
                  vigente={propuesta.textos?.[def.clave] ?? plantilla[def.clave] ?? def.defecto}
                  base={plantilla[def.clave] ?? def.defecto}
                  etiquetaGuardar="Usar en esta propuesta"
                  alGuardar={(texto) => despachar({ tipo: 'texto', clave: def.clave, texto })}
                />
              ))}
            </div>
          ))}
        </div>
      </details>
    </Seccion>
  );
}
