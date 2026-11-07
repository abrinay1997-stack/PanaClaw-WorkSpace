/**
 * Las piezas que se repiten en las dos pantallas.
 *
 * Todo lo visual sale de `src/index.css`, que a su vez sale de
 * `datos/marca.json`. Aquí no hay ni un hex.
 */

import type { ReactNode } from 'react';
import { useTema } from './tema';

import { LOGO } from '../datos/empresa';

/** El símbolo de la marca. Hereda el color de donde se ponga. */
export function Simbolo({ className = 'h-6' }: { className?: string }) {
  return (
    <svg viewBox={LOGO.viewBox} className={className} aria-hidden="true" fill="currentColor">
      <path d={LOGO.path} fillRule={LOGO.fillRule} />
    </svg>
  );
}

export function Seccion({
  titulo,
  ayuda,
  accion,
  children,
}: {
  titulo: string;
  ayuda?: string;
  accion?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="tarjeta p-5">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="antetitulo">{titulo}</h2>
          {ayuda ? <p className="mt-1.5 text-sm text-gris">{ayuda}</p> : null}
        </div>
        {accion}
      </header>
      {children}
    </section>
  );
}

export function Campo({
  etiqueta,
  valor,
  alCambiar,
  marcador,
  tipo = 'text',
  ancho = '',
}: {
  etiqueta: string;
  valor: string;
  alCambiar: (valor: string) => void;
  marcador?: string;
  tipo?: string;
  ancho?: string;
}) {
  return (
    <label className={`block ${ancho}`}>
      <span className="etiqueta">{etiqueta}</span>
      <input
        type={tipo}
        className="campo"
        value={valor}
        placeholder={marcador}
        onChange={(e) => alCambiar(e.currentTarget.value)}
      />
    </label>
  );
}

export function CampoLargo({
  etiqueta,
  valor,
  alCambiar,
  marcador,
  filas = 3,
}: {
  etiqueta: string;
  valor: string;
  alCambiar: (valor: string) => void;
  marcador?: string;
  filas?: number;
}) {
  return (
    <label className="block">
      <span className="etiqueta">{etiqueta}</span>
      <textarea
        className="campo resize-y"
        rows={filas}
        value={valor}
        placeholder={marcador}
        onChange={(e) => alCambiar(e.currentTarget.value)}
      />
    </label>
  );
}

/** Una viñeta de la marca con su texto al lado. */
export function Punto({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm leading-relaxed text-gris">
      <span className="vineta mt-1.5" aria-hidden="true" />
      <span className="min-w-0 flex-1">{children}</span>
    </li>
  );
}

/** Pastilla de estado. En naranja o apagada; no hay una tercera. */
export function Pastilla({ children, encendida = false }: { children: ReactNode; encendida?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-pastilla px-2.5 py-0.5 text-[0.75rem] font-medium tracking-wide uppercase ${
        encendida
          ? 'bg-naranja/15 text-naranja ring-1 ring-naranja/30'
          : 'bg-velo-fuerte text-gris ring-1 ring-linea'
      }`}
    >
      {children}
    </span>
  );
}

/**
 * La salida a la portada del hub.
 *
 * El cotizador y los clientes son una pantalla más del hub, no una aplicación
 * aparte, y sin esto quien entra por la portada no tiene cómo volver a ella
 * salvo la flecha del navegador (que con las direcciones `#clientes` e
 * `#historial` tampoco lleva a la portada: lleva a la pantalla anterior).
 *
 * `../` y no `/`: el cotizador se sirve en `/cotizador/`, y relativo funciona
 * igual si algún día el hub cuelga de un subdirectorio. En el servidor de
 * desarrollo, donde la aplicación ES la raíz, apunta a sí misma.
 */
export function VolverAlHub({ conFlecha = false }: { conFlecha?: boolean }) {
  return (
    <a href="../" className="boton boton-secundario" aria-label="Volver a la portada del hub">
      {conFlecha ? '← Hub' : 'Hub'}
    </a>
  );
}

/**
 * Cambia entre el tema claro y el oscuro.
 *
 * Un solo botón con un icono que dice a qué se va a cambiar (una luna en el claro,
 * un sol en el oscuro) y un nombre para los lectores de pantalla. Solo icono: en el
 * móvil la cabecera no tiene sitio para una palabra más.
 */
export function BotonDeTema() {
  const [tema, alternar] = useTema();
  const aOscuro = tema === 'claro';

  return (
    <button
      type="button"
      className="boton boton-secundario !px-3"
      onClick={alternar}
      aria-label={aOscuro ? 'Cambiar al tema oscuro' : 'Cambiar al tema claro'}
      title={aOscuro ? 'Tema oscuro' : 'Tema claro'}
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {aOscuro ? (
          <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8Z" />
        ) : (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        )}
      </svg>
    </button>
  );
}
