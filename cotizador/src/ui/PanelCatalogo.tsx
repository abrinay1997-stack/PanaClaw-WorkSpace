/**
 * El catálogo, para elegir de él.
 *
 * Agrupado por producto y con el precio publicado a la vista en cada fila: es
 * la misma información que ve un cliente en el sitio, y eso es deliberado —
 * quien cotiza no debería tener que recordar una lista de precios distinta de
 * la que está publicada.
 */

import { useMemo, useState } from 'react';

import { catalogo } from '../dominio/catalogo';
import { formato, formatoMensual } from '../dominio/dinero';
import { planCorto, slugDe } from '../dominio/propuesta';
import { PLANES, type Familia, type Item } from '../dominio/tipos';
import { itemDe } from '../dominio/catalogo';
import { Pastilla } from './componentes';

/** Los grupos, en el orden en el que se arma una propuesta de verdad. */
const GRUPOS: { familia: Familia; titulo: string; ayuda: string }[] = [
  { familia: 'web', titulo: 'Sitios web', ayuda: 'Pago único. El plan lo decide la necesidad, no el presupuesto.' },
  { familia: 'capacidad', titulo: 'Capacidades avanzadas', ayuda: 'Se suman a un plan, no lo sustituyen.' },
  { familia: 'ebot', titulo: 'eBot', ayuda: 'Producto aparte. No es una capacidad y no reemplaza un sitio.' },
  { familia: 'auditoria', titulo: 'Auditoría de Seguridad', ayuda: 'Mira por dónde te pueden entrar. Va antes de cualquier plan mensual.' },
  { familia: 'seguridad', titulo: 'Seguridad mensual', ayuda: 'Quién entra y por dónde. No hace copias ni actualizaciones.' },
  { familia: 'care', titulo: 'PanaClaw Care', ayuda: 'Mantiene la infraestructura. No es ciberseguridad.' },
  { familia: 'diagnostico', titulo: 'Diagnóstico de Ventas', ayuda: 'Mira el negocio: por qué no vende.' },
  { familia: 'ronda', titulo: 'Cambios', ayuda: '' },
];

export function PanelCatalogo({
  itemsEnUso,
  planActual,
  alAgregar,
}: {
  itemsEnUso: Set<string>;
  planActual?: Item;
  alAgregar: (item: Item) => void;
}) {
  const [busqueda, setBusqueda] = useState('');

  const grupos = useMemo(() => {
    const aguja = busqueda.trim().toLowerCase();
    return GRUPOS.map((grupo) => ({
      ...grupo,
      items: catalogo.items.filter(
        (item) =>
          item.familia === grupo.familia &&
          (!aguja ||
            `${item.nombre} ${item.queConsigue ?? ''} ${item.paraQuien ?? ''}`
              .toLowerCase()
              .includes(aguja)),
      ),
    })).filter((grupo) => grupo.items.length > 0);
  }, [busqueda]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-linea p-4">
        <label className="block">
          <span className="sr-only">Buscar en el catálogo</span>
          <input
            type="search"
            className="campo"
            placeholder="Buscar un producto…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.currentTarget.value)}
          />
        </label>
        <p className="mt-2.5 text-xs text-gris">
          {catalogo.items.length} productos · listado {catalogo.version}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {grupos.map((grupo, i) => (
          /* Cada categoría se pliega: son ocho y veintiún productos, y verlos todos de
             golpe cansa. Con una búsqueda activa se abren todas, porque quien busca
             quiere ver qué encontró; sin ella, solo la primera. La `key` cambia con la
             búsqueda para que el estado de abierto se recalcule. */
          <details
            key={`${grupo.familia}-${busqueda.trim() ? 'b' : 'n'}`}
            open={!!busqueda.trim() || i === 0}
            className="mb-3 rounded-campo border border-linea bg-papel last:mb-0"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-3 p-3">
              <span className="min-w-0">
                <span className="antetitulo block">{grupo.titulo}</span>
                {grupo.ayuda ? <span className="mt-0.5 block text-xs text-gris">{grupo.ayuda}</span> : null}
              </span>
              <span className="shrink-0 rounded-pastilla bg-velo-fuerte px-2.5 py-0.5 text-xs font-medium text-gris">
                {grupo.items.length}
              </span>
            </summary>

            <ul className="space-y-2 p-3 pt-0">
              {grupo.items.map((item) => (
                <li key={item.id}>
                  <FilaCatalogo
                    item={item}
                    enUso={itemsEnUso.has(item.id) && !item.repetible}
                    planActual={planActual}
                    alAgregar={() => alAgregar(item)}
                  />
                </li>
              ))}
            </ul>
          </details>
        ))}

        {grupos.length === 0 ? (
          <p className="py-8 text-center text-sm text-gris">Nada con ese nombre.</p>
        ) : null}
      </div>
    </div>
  );
}

function FilaCatalogo({
  item,
  enUso,
  planActual,
  alAgregar,
}: {
  item: Item;
  enUso: boolean;
  planActual?: Item;
  alAgregar: () => void;
}) {
  const precio = item.recurrencia === 'mensual' ? formatoMensual(item.precio) : formato(item.precio);
  const aviso = avisoDePlan(item, planActual);

  return (
    <button
      type="button"
      onClick={alAgregar}
      disabled={enUso}
      className="w-full rounded-campo border border-linea bg-velo p-3 text-left transition hover:border-linea-fuerte hover:bg-velo-fuerte disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-linea disabled:hover:bg-velo"
    >
      <span className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 text-sm font-medium text-blanco">{item.nombre}</span>
        <span className="shrink-0 text-sm font-semibold text-naranja">{precio}</span>
      </span>

      {/* Aquí manda `paraQuien` cuando existe: al elegir del catálogo, lo que
          ayuda es saber a quién se le vende. Lo que sale en el documento es
          `queConsigue`, y de eso se ocupa el PDF. */}
      {item.paraQuien ?? item.queConsigue ? (
        <span className="mt-1 block text-xs leading-relaxed text-gris">
          {item.paraQuien ?? item.queConsigue}
        </span>
      ) : null}

      {(aviso || enUso || item.entrega) && (
        <span className="mt-2 flex flex-wrap items-center gap-1.5">
          {enUso ? <Pastilla>Ya está</Pastilla> : null}
          {item.entrega ? <Pastilla>{item.entrega}</Pastilla> : null}
          {aviso ? <Pastilla encendida>{aviso}</Pastilla> : null}
        </span>
      )}
    </button>
  );
}

/**
 * Lo que esta línea va a exigir, dicho ANTES de añadirla.
 *
 * Es la misma regla que el sitio aplica en su cotizador: lo que no se puede
 * marcar se apaga y dice por qué. Aquí no se apaga —quien cotiza puede querer
 * añadir la capacidad y subir el plan después—, pero el aviso llega antes de la
 * decisión y no después, en un panel de errores.
 */
function avisoDePlan(item: Item, planActual?: Item): string | null {
  if (item.incluidoDesde && planActual && rango(planActual) >= PLANES.indexOf(item.incluidoDesde)) {
    return `Ya viene con ${planCorto(planActual)}`;
  }
  if (!item.planMinimo) return null;
  const minimo = itemDe(`web-${item.planMinimo}`);
  if (!minimo) return null;
  if (planActual && rango(planActual) >= PLANES.indexOf(item.planMinimo)) return null;
  return `Pide ${planCorto(minimo)}`;
}

const rango = (plan: Item): number => PLANES.indexOf(slugDe(plan));
