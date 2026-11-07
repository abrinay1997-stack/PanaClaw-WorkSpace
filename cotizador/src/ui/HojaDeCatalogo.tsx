/**
 * El catálogo, en un panel que se abre cuando hace falta.
 *
 * Antes estaba siempre a la izquierda, con los veintiún productos a la vista,
 * robándole espacio a lo que de verdad se está escribiendo. Ahora la propuesta ocupa
 * la pantalla y el catálogo aparece desde «Incluir algo más», dentro de «Qué
 * incluye», que es donde se piensa en añadir algo. Se queda abierto al elegir, para
 * poder añadir varios seguidos; «Listo» lo cierra.
 */

import { useEffect, useRef } from 'react';

import type { Item } from '../dominio/tipos';
import { PanelCatalogo } from './PanelCatalogo';

export function HojaDeCatalogo({
  abierta,
  alCerrar,
  itemsEnUso,
  planActual,
  alAgregar,
  lineas,
}: {
  abierta: boolean;
  alCerrar: () => void;
  itemsEnUso: Set<string>;
  planActual?: Item;
  alAgregar: (item: Item) => void;
  lineas: number;
}) {
  const panel = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!abierta) return;

    // Mientras está abierto la página de detrás no se desplaza, y Escape lo cierra.
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') alCerrar();
    };
    addEventListener('keydown', alPulsar);
    panel.current?.focus();

    return () => {
      document.body.style.overflow = overflow;
      removeEventListener('keydown', alPulsar);
    };
  }, [abierta, alCerrar]);

  if (!abierta) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Elegir qué incluir">
      <button
        type="button"
        aria-label="Cerrar el catálogo"
        tabIndex={-1}
        className="absolute inset-0 cursor-default bg-black/45"
        onClick={alCerrar}
      />

      <aside
        ref={panel}
        tabIndex={-1}
        className="relative flex h-full w-full max-w-md flex-col bg-negro shadow-2xl outline-none"
      >
        <header className="flex items-start justify-between gap-3 border-b border-linea p-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-blanco">Incluir algo más</h2>
            <p className="mt-0.5 text-sm text-gris">Elige y se añade a la propuesta. Puedes añadir varios.</p>
          </div>
          <button type="button" className="boton boton-secundario shrink-0 !py-1.5 text-sm" onClick={alCerrar}>
            Cerrar
          </button>
        </header>

        <PanelCatalogo itemsEnUso={itemsEnUso} planActual={planActual} alAgregar={alAgregar} />

        <footer className="border-t border-linea p-4">
          <button type="button" className="boton boton-primario w-full" onClick={alCerrar}>
            Listo{lineas ? ` · ${lineas} en la propuesta` : ''}
          </button>
        </footer>
      </aside>
    </div>
  );
}
