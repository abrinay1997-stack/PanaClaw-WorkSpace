/**
 * Las cuatro pantallas: armar una propuesta, el historial, la libreta de
 * clientes y la ficha de uno.
 *
 * En escritorio, armar son dos columnas a la vez: el catálogo a la izquierda y
 * la propuesta a la derecha. En móvil no caben, y apilarlas obligaría a bajar
 * una pantalla entera de catálogo antes de ver el formulario, así que ahí se
 * alternan con un conmutador y las cifras bajan a una barra fija.
 *
 * **Casi todo ocurre en el navegador**: el catálogo sale de
 * `datos/precios.json`, el PDF se genera aquí y la vista previa del documento
 * no toca la red. Lo único que necesita servidor es EMITIR —porque el número lo
 * da la base, que es lo que impide que dos personas manden la misma
 * «PROP-2026-0007» a dos clientes distintos— y el panel de clientes.
 */

import { useState } from 'react';

import { EMPRESA } from './datos/empresa';
import { esCero, formato, formatoMensual } from './dominio/dinero';
import { hayGraves } from './dominio/revision';
import type { Item, Propuesta } from './dominio/tipos';
import { mensajeDe } from './api/fallo';
import { FichaCliente } from './clientes/FichaCliente';
import { PantallaClientes } from './clientes/PantallaClientes';
import { almacen } from './historial/almacen';
import { PantallaHistorial } from './historial/PantallaHistorial';
import { abrirWhatsapp, copiarMensaje, descargarPdf, verPdf } from './ui/acciones';
import { Simbolo } from './ui/componentes';
import { PanelCatalogo } from './ui/PanelCatalogo';
import {
  Alertas,
  DatosCliente,
  ListaLineas,
  LosDosTotales,
  PanelCondiciones,
  PlazoYCambios,
  QueNoIncluye,
} from './ui/PanelPropuesta';
import { usePropuesta } from './ui/usePropuesta';
import { useRuta } from './ui/useRuta';

type Panel = 'catalogo' | 'propuesta';

export default function App() {
  const estado = usePropuesta();
  const [ruta, ir] = useRuta();

  switch (ruta.pantalla) {
    case 'historial':
      return (
        <PantallaHistorial
          alVolver={() => ir({ pantalla: 'cotizador' })}
          alReabrir={(propuesta) => {
            estado.despachar({ tipo: 'cargar', propuesta });
            ir({ pantalla: 'cotizador' });
          }}
          alAbrirCliente={(codigo) => ir({ pantalla: 'cliente', codigo })}
        />
      );

    case 'clientes':
      return (
        <PantallaClientes
          alVolver={() => ir({ pantalla: 'cotizador' })}
          alAbrir={(codigo) => ir({ pantalla: 'cliente', codigo })}
          alNuevo={() => ir({ pantalla: 'cliente', codigo: null })}
        />
      );

    case 'cliente':
      return (
        <FichaCliente
          codigo={ruta.codigo}
          alVolver={() => ir({ pantalla: 'clientes' })}
          alCotizar={(cliente) => {
            // Se llena el destinatario y se deja el enlace puesto. Lo que se
            // imprime son estos campos, congelados como estén al emitir; la
            // ficha no se toca desde el cotizador.
            estado.despachar({
              tipo: 'ficha',
              codigo: cliente.codigo,
              cliente: {
                negocio: cliente.negocio,
                contacto: cliente.contacto,
                whatsapp: cliente.whatsapp,
                correo: cliente.correo,
                ciudad: cliente.ciudad,
              },
            });
            ir({ pantalla: 'cotizador' });
          }}
        />
      );

    default:
      return (
        <Cotizador
          estado={estado}
          alHistorial={() => ir({ pantalla: 'historial' })}
          alClientes={() => ir({ pantalla: 'clientes' })}
        />
      );
  }
}

function Cotizador({
  estado,
  alHistorial,
  alClientes,
}: {
  estado: ReturnType<typeof usePropuesta>;
  alHistorial: () => void;
  alClientes: () => void;
}) {
  const { propuesta, despachar, totales, alertas, plan, itemsEnUso } = estado;
  const [panel, setPanel] = useState<Panel>('catalogo');
  const [aviso, setAviso] = useState('');
  const [emitiendo, setEmitiendo] = useState(false);

  const vacia = propuesta.lineas.length === 0;
  const bloqueada = vacia || hayGraves(alertas);

  const anunciar = (mensaje: string, milisegundos = 3200) => {
    setAviso(mensaje);
    setTimeout(() => setAviso(''), milisegundos);
  };

  const agregar = (item: Item) => {
    despachar({ tipo: 'agregar', item });
    anunciar(`${item.nombre} añadido a la propuesta.`);
  };

  /**
   * Emitir son dos cosas a la vez: el documento que sale hacia el cliente y el
   * registro de que salió. Primero se guarda —de ahí vuelve el número— y solo
   * después se genera el PDF o el mensaje, para que lo que el cliente recibe y
   * lo que queda en el historial sean el mismo documento con el mismo número.
   */
  const emitir = async (accion: (p: Propuesta) => Promise<void> | void) => {
    if (emitiendo || bloqueada) return;
    setEmitiendo(true);
    try {
      const { numero, enlace } = await almacen.registrar(propuesta);
      if (numero !== propuesta.numero) despachar({ tipo: 'numeroAsignado', numero });
      // Emitir puede haber creado o reconocido la ficha del cliente. Se guarda
      // el enlace para que reemitir la misma propuesta no cree una segunda.
      if (enlace.codigo && enlace.codigo !== propuesta.clienteCodigo) {
        despachar({ tipo: 'ficha', codigo: enlace.codigo });
      }
      await accion({ ...propuesta, numero, clienteCodigo: enlace.codigo ?? undefined });
      // El aviso del enlace se enseña después de que el documento haya salido:
      // lo urgente es la propuesta, y lo de la ficha se arregla luego.
      if (enlace.aviso) anunciar(enlace.aviso, 7000);
    } catch (error) {
      console.error(error);
      anunciar(mensajeDe(error, 'No se pudo emitir la propuesta.'), 6000);
    } finally {
      setEmitiendo(false);
    }
  };

  const acciones = {
    descargar: () => void emitir((p) => descargarPdf(p)),
    // La vista previa NO emite: es para revisar, no para enviar, y no gasta
    // número ni deja registro.
    ver: () => void verPdf(propuesta).catch(() => anunciar('No se pudo abrir la vista previa.')),
    whatsapp: () => void emitir(abrirWhatsapp),
    copiar: () =>
      void emitir(async (p) =>
        anunciar(
          (await copiarMensaje(p))
            ? 'Mensaje copiado al portapapeles.'
            : 'No se pudo copiar; selecciona el texto a mano.',
        ),
      ),
    nueva: () => {
      if (vacia || confirm('¿Descartar esta propuesta y empezar una nueva?')) {
        despachar({ tipo: 'reiniciar' });
        setPanel('catalogo');
      }
    },
  };

  return (
    <div className="flex min-h-screen flex-col pb-24 lg:pb-0">
      <header className="cristal sticky top-0 z-30 border-b border-white/10">
        <div className="mx-auto flex w-full max-w-[110rem] items-center gap-4 px-4 py-3 lg:px-6">
          <Simbolo className="h-6 shrink-0 text-naranja" />
          <div className="mr-auto min-w-0">
            <h1 className="truncate text-sm font-semibold">Cotizador · {EMPRESA.nombre}</h1>
            <p className="truncate text-xs text-gris">
              {propuesta.numero || 'El número se asigna al emitir'}
            </p>
          </div>

          <button type="button" className="boton boton-secundario" onClick={alClientes}>
            Clientes
          </button>

          <button type="button" className="boton boton-secundario" onClick={alHistorial}>
            Historial
          </button>

          <div className="hidden flex-wrap items-center gap-2 lg:flex">
            <button type="button" className="boton boton-fantasma" onClick={acciones.nueva}>
              Nueva
            </button>
            <button
              type="button"
              className="boton boton-secundario"
              onClick={acciones.copiar}
              disabled={bloqueada || emitiendo}
            >
              Copiar mensaje
            </button>
            <button
              type="button"
              className="boton boton-secundario"
              onClick={acciones.whatsapp}
              disabled={bloqueada || emitiendo}
            >
              WhatsApp
            </button>
            <button type="button" className="boton boton-secundario" onClick={acciones.ver} disabled={vacia}>
              Vista previa
            </button>
            <button
              type="button"
              className="boton boton-primario"
              onClick={acciones.descargar}
              disabled={bloqueada || emitiendo}
            >
              {emitiendo ? 'Emitiendo…' : 'Emitir PDF'}
            </button>
          </div>
        </div>

        <Conmutador panel={panel} alCambiar={setPanel} lineas={propuesta.lineas.length} />
      </header>

      <main className="mx-auto flex w-full max-w-[110rem] flex-1 flex-col gap-6 p-4 lg:flex-row lg:p-6">
        <aside
          className={`tarjeta h-[calc(100vh-17rem)] overflow-hidden lg:sticky lg:top-24 lg:flex lg:h-[calc(100vh-8rem)] lg:w-[24rem] lg:shrink-0 ${
            panel === 'catalogo' ? 'flex' : 'hidden'
          }`}
        >
          <PanelCatalogo itemsEnUso={itemsEnUso} planActual={plan} alAgregar={agregar} />
        </aside>

        <div className={`min-w-0 flex-1 space-y-5 lg:block ${panel === 'propuesta' ? 'block' : 'hidden'}`}>
          <Alertas alertas={alertas} />
          <DatosCliente propuesta={propuesta} despachar={despachar} />
          <ListaLineas propuesta={propuesta} despachar={despachar} alertas={alertas} />
          <QueNoIncluye propuesta={propuesta} despachar={despachar} />
          <LosDosTotales totales={totales} />
          <PlazoYCambios propuesta={propuesta} />
          <PanelCondiciones propuesta={propuesta} despachar={despachar} />

          <div className="flex flex-wrap gap-2 lg:hidden">
            <button type="button" className="boton boton-fantasma" onClick={acciones.nueva}>
              Nueva
            </button>
            <button
              type="button"
              className="boton boton-secundario"
              onClick={acciones.copiar}
              disabled={bloqueada || emitiendo}
            >
              Copiar mensaje
            </button>
            <button type="button" className="boton boton-secundario" onClick={acciones.ver} disabled={vacia}>
              Vista previa
            </button>
          </div>

          <PieCatalogo />
        </div>
      </main>

      <BarraMovil
        totales={totales}
        bloqueada={bloqueada || emitiendo}
        alWhatsapp={acciones.whatsapp}
        alDescargar={acciones.descargar}
      />

      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-28 z-40 flex justify-center px-4 lg:bottom-6"
      >
        {aviso ? (
          <p className="rounded-pastilla bg-blanco px-5 py-2 text-center text-sm font-semibold text-negro shadow-lg">
            {aviso}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Conmutador entre catálogo y propuesta, solo en móvil.
 *
 * Son dos botones con `aria-pressed` y no un `tablist`: en escritorio los dos
 * paneles se ven a la vez y el conmutador desaparece, así que anunciarlos como
 * pestañas sería mentir sobre la mitad de los casos.
 */
function Conmutador({
  panel,
  alCambiar,
  lineas,
}: {
  panel: Panel;
  alCambiar: (panel: Panel) => void;
  lineas: number;
}) {
  const opciones: { clave: Panel; texto: string; contador?: number }[] = [
    { clave: 'catalogo', texto: 'Catálogo' },
    { clave: 'propuesta', texto: 'Propuesta', contador: lineas },
  ];

  return (
    <div className="flex gap-2 border-t border-white/10 px-4 py-2 lg:hidden">
      {opciones.map(({ clave, texto, contador }) => {
        const activo = panel === clave;
        return (
          <button
            key={clave}
            type="button"
            aria-pressed={activo}
            onClick={() => alCambiar(clave)}
            className={`boton flex-1 ${activo ? 'boton-primario' : 'boton-secundario'}`}
          >
            {texto}
            {contador ? (
              <span className="rounded-pastilla bg-black/25 px-2 py-0.5 text-xs">{contador}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** Las dos cifras siempre a la vista y las dos acciones de envío, en móvil. */
function BarraMovil({
  totales,
  bloqueada,
  alWhatsapp,
  alDescargar,
}: {
  totales: ReturnType<typeof usePropuesta>['totales'];
  bloqueada: boolean;
  alWhatsapp: () => void;
  alDescargar: () => void;
}) {
  return (
    <section
      aria-label="Totales y envío de la propuesta"
      className="cristal fixed inset-x-0 bottom-0 z-30 border-t border-white/10 px-4 py-3 lg:hidden"
    >
      <div className="flex items-center gap-3">
        <div className="mr-auto min-w-0">
          <p className="text-sm font-semibold text-naranja">{formato(totales.unico)}</p>
          <p className="truncate text-[0.6875rem] text-gris">
            {esCero(totales.mensual)
              ? 'pago único'
              : `pago único · y ${formatoMensual(totales.mensual)}`}
          </p>
        </div>
        <button type="button" className="boton boton-secundario" onClick={alWhatsapp} disabled={bloqueada}>
          WhatsApp
        </button>
        <button type="button" className="boton boton-primario" onClick={alDescargar} disabled={bloqueada}>
          PDF
        </button>
      </div>
    </section>
  );
}

/** De dónde salen los precios. Se dice, no se da por sabido. */
function PieCatalogo() {
  return (
    <p className="tarjeta p-5 text-xs leading-relaxed text-gris">
      Todos los importes salen de <code className="rounded bg-white/10 px-1">datos/precios.json</code>,
      que es la fuente única de cifras de la marca y espejo del repositorio del sitio. El cotizador
      no inventa ninguna: si un precio cambia allí, cambia aquí, en el PDF y en el mensaje a la vez.
    </p>
  );
}
