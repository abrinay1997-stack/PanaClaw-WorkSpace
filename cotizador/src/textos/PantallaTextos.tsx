/**
 * La plantilla de textos del equipo.
 *
 * Aquí se reescribe lo que el PDF y el mensaje dicen siempre: las condiciones, los
 * plazos, las rondas de cambios, cada viñeta de «Qué NO incluye». Lo que se guarda
 * vale para las propuestas NUEVAS; el original nunca se pierde y «Restaurar» lo
 * devuelve. Las propuestas ya emitidas no cambian: guardan dentro de sí los textos
 * del día que salieron.
 */

import { useEffect, useMemo } from 'react';

import { ES_DEMOSTRACION } from '../api/pedir';
import { TEXTOS_EDITABLES, type TextoEditable } from '../dominio/textos';
import { BotonDeTema, VolverAlHub } from '../ui/componentes';
import { almacenTextos } from './almacenTextos';
import { FilaDeTexto } from './FilaDeTexto';
import { cargarPlantilla, fijarPlantilla, useEdiciones, usePlantilla } from './plantilla';

export function PantallaTextos({ alVolver }: { alVolver: () => void }) {
  const plantilla = usePlantilla();
  const ediciones = useEdiciones();

  useEffect(() => {
    void cargarPlantilla();
  }, []);

  const grupos = useMemo(() => {
    const porGrupo = new Map<string, TextoEditable[]>();
    for (const def of TEXTOS_EDITABLES) porGrupo.set(def.grupo, [...(porGrupo.get(def.grupo) ?? []), def]);
    return [...porGrupo];
  }, []);

  const quienEdito = (clave: string): string | undefined => {
    const e = ediciones.find((x) => x.clave === clave);
    return e ? `Editado por ${e.por} el ${e.en.slice(0, 10)}` : undefined;
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 p-4 lg:p-6">
      <header className="flex flex-wrap items-center gap-3">
        <button type="button" className="boton boton-secundario" onClick={alVolver}>
          ← Volver al cotizador
        </button>
        <VolverAlHub />
        <BotonDeTema />
        <h1 className="text-lg font-semibold">Textos del documento</h1>
      </header>

      <p className="text-sm leading-relaxed text-gris">
        Lo que escribas aquí vale para las propuestas <strong className="text-blanco">nuevas</strong>. El texto original
        no se pierde: «Restaurar» lo devuelve. Las propuestas que ya salieron no cambian, porque guardan los textos del
        día en que se emitieron. Para cambiar una frase solo en una propuesta, se hace desde esa propuesta.
      </p>

      {ES_DEMOSTRACION ? (
        <p className="tarjeta p-5 text-sm text-gris">
          La plantilla del equipo necesita el servidor del hub, así que no está en la vista previa.
        </p>
      ) : (
        grupos.map(([grupo, defs], i) => (
          <details key={grupo} className="tarjeta p-5" open={i === 0}>
            <summary className="cursor-pointer text-sm font-semibold text-blanco">
              {grupo} <span className="font-normal text-gris">({defs.length})</span>
            </summary>
            <div className="mt-4">
              {defs.map((def) => (
                <FilaDeTexto
                  key={def.clave}
                  def={def}
                  vigente={plantilla[def.clave] ?? def.defecto}
                  base={def.defecto}
                  etiquetaGuardar="Guardar para todas las propuestas nuevas"
                  autoria={quienEdito(def.clave)}
                  alGuardar={async (texto) => fijarPlantilla(await almacenTextos.guardar(def.clave, texto ?? ''))}
                />
              ))}
            </div>
          </details>
        ))
      )}
    </div>
  );
}
