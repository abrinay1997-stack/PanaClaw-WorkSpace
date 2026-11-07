/**
 * Claro u oscuro.
 *
 * El claro es el de trabajo y el que arranca: quien cotiza lee y escribe durante
 * horas, y el oscuro de la marca cansa la vista. El oscuro sigue a un botón de
 * distancia y se recuerda en este navegador.
 *
 * Se decide con un atributo en `<html>` (`data-tema`), que lee el CSS; y se pone
 * con un guion en `index.html` ANTES de pintar, para que quien eligió el oscuro no
 * vea un destello claro cada vez que abre la página.
 */

import { useCallback, useState } from 'react';

export type Tema = 'claro' | 'oscuro';

export const CLAVE_TEMA = 'panaclaw-tema';

/** El `<meta name="theme-color">` que acompaña a cada tema: la barra del navegador en el móvil. */
const COLOR_DE_BARRA: Record<Tema, string> = { claro: '#f6f3f1', oscuro: '#100101' };

export function temaActual(): Tema {
  return document.documentElement.dataset.tema === 'oscuro' ? 'oscuro' : 'claro';
}

export function aplicarTema(tema: Tema): void {
  const raiz = document.documentElement;
  if (tema === 'oscuro') raiz.dataset.tema = 'oscuro';
  else delete raiz.dataset.tema;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLOR_DE_BARRA[tema]);
}

export function guardarTema(tema: Tema): void {
  try {
    localStorage.setItem(CLAVE_TEMA, tema);
  } catch {
    // Sin dónde recordarlo, el tema sigue valiendo hasta cerrar la pestaña.
  }
}

/** El tema de ahora y cómo cambiarlo. */
export function useTema(): [Tema, () => void] {
  const [tema, fijar] = useState<Tema>(temaActual);
  const alternar = useCallback(() => {
    const siguiente: Tema = temaActual() === 'oscuro' ? 'claro' : 'oscuro';
    aplicarTema(siguiente);
    guardarTema(siguiente);
    fijar(siguiente);
  }, []);
  return [tema, alternar];
}
