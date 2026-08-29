/**
 * Cuatro pantallas y una barra de direcciones.
 *
 * El hash y no un enrutador: son cuatro vistas, el cotizador se sirve desde un
 * subdirectorio del hub, y una dependencia más para esto sería más de lo que
 * hace falta. Con el hash, además, recargar la página deja donde estabas, y la
 * ficha de un cliente tiene una dirección que se puede pegar en un mensaje.
 */

import { useEffect, useState } from 'react';

export type Ruta =
  | { pantalla: 'cotizador' }
  | { pantalla: 'historial' }
  | { pantalla: 'clientes' }
  /** `codigo` en `null` es la ficha nueva, que todavía no tiene código. */
  | { pantalla: 'cliente'; codigo: string | null };

/** `#cliente/CLI-0007` → la ficha. `#cliente/nuevo` → una en blanco. */
function leer(): Ruta {
  const hash = location.hash.replace(/^#/, '');

  if (hash === 'historial') return { pantalla: 'historial' };
  if (hash === 'clientes') return { pantalla: 'clientes' };

  const ficha = /^cliente\/(.+)$/.exec(hash);
  if (ficha) {
    const codigo = decodeURIComponent(ficha[1]!);
    return { pantalla: 'cliente', codigo: codigo === 'nuevo' ? null : codigo };
  }

  return { pantalla: 'cotizador' };
}

function aHash(ruta: Ruta): string {
  switch (ruta.pantalla) {
    case 'historial':
      return '#historial';
    case 'clientes':
      return '#clientes';
    case 'cliente':
      return `#cliente/${ruta.codigo ? encodeURIComponent(ruta.codigo) : 'nuevo'}`;
    default:
      return '';
  }
}

export function useRuta(): [Ruta, (ruta: Ruta) => void] {
  const [ruta, setRuta] = useState<Ruta>(leer);

  useEffect(() => {
    // El `hashchange` es la única fuente: así los enlaces internos que cambian
    // `location.hash` a mano —el «abrir la que ya existe» de la ficha— llegan
    // aquí sin tener que pasar por esta función.
    const alCambiar = () => setRuta(leer());
    addEventListener('hashchange', alCambiar);
    return () => removeEventListener('hashchange', alCambiar);
  }, []);

  return [
    ruta,
    (destino: Ruta) => {
      const hash = aHash(destino);

      if (hash) {
        if (location.hash !== hash) location.hash = hash;
      } else {
        // Volver al cotizador quita el fragmento entero. Asignar una cadena
        // vacía a `location.hash` deja un `#` suelto en la barra y no siempre
        // avisa del cambio, así que se reescribe la dirección a mano.
        history.replaceState(null, '', location.pathname + location.search);
      }

      // Siempre, aunque el hash ya fuera ése: `hashchange` no se dispara
      // cuando no cambia nada, y la pantalla tiene que moverse igual.
      setRuta(destino);
    },
  ];
}
