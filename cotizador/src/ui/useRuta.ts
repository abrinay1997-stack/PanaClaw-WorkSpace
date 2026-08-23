/**
 * Dos pantallas y una barra de direcciones.
 *
 * El hash y no un enrutador: son dos vistas, el cotizador se sirve desde un
 * subdirectorio del hub, y una dependencia más para esto sería más de lo que
 * hace falta. Con el hash, además, recargar la página deja donde estabas.
 */

import { useEffect, useState } from 'react';

export type Ruta = 'cotizador' | 'historial';

const leer = (): Ruta => (location.hash === '#historial' ? 'historial' : 'cotizador');

export function useRuta(): [Ruta, (ruta: Ruta) => void] {
  const [ruta, setRuta] = useState<Ruta>(leer);

  useEffect(() => {
    const alCambiar = () => setRuta(leer());
    addEventListener('hashchange', alCambiar);
    return () => removeEventListener('hashchange', alCambiar);
  }, []);

  return [
    ruta,
    (destino: Ruta) => {
      location.hash = destino === 'historial' ? '#historial' : '';
      setRuta(destino);
    },
  ];
}
