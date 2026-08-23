/**
 * Las piezas que se repiten en las dos pantallas.
 *
 * Todo lo visual sale de `src/index.css`, que a su vez sale de
 * `datos/marca.json`. Aquí no hay ni un hex.
 */

import type { ReactNode } from 'react';

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
      <span className="min-w-0">{children}</span>
    </li>
  );
}

/** Pastilla de estado. En naranja o apagada; no hay una tercera. */
export function Pastilla({ children, encendida = false }: { children: ReactNode; encendida?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-pastilla px-2.5 py-0.5 text-[0.6875rem] font-medium tracking-wide uppercase ${
        encendida
          ? 'bg-naranja/15 text-naranja ring-1 ring-naranja/30'
          : 'bg-white/5 text-gris ring-1 ring-white/10'
      }`}
    >
      {children}
    </span>
  );
}
