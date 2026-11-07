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

import { useEffect, useState } from 'react';

import { EMPRESA } from './datos/empresa';
import { esCero, formato, formatoMensual } from './dominio/dinero';
import { hayGraves } from './dominio/revision';
import type { Item, Propuesta } from './dominio/tipos';
import { mensajeDe } from './api/fallo';
import { FichaCliente } from './clientes/FichaCliente';
import { PantallaClientes } from './clientes/PantallaClientes';
import { PantallaContabilidad } from './contabilidad/PantallaContabilidad';
import { almacen } from './historial/almacen';
import { PantallaHistorial } from './historial/PantallaHistorial';
import { congelarTextos, conPlantilla } from './dominio/textos';
import { cargarPlantilla, plantillaActual, refrescarPlantilla } from './textos/plantilla';
import { PantallaTextos } from './textos/PantallaTextos';
import { abrirWhatsapp, copiarMensaje, descargarPdf, verPdf } from './ui/acciones';
import { Simbolo, BotonDeTema, VolverAlHub } from './ui/componentes';
import { HojaDeCatalogo } from './ui/HojaDeCatalogo';
import {
  Alertas,
  DatosCliente,
  ListaLineas,
  LosDosTotales,
  PanelCondiciones,
  PlazoYCambios,
  QueEsCadaCosa,
  QueNoIncluye,
} from './ui/PanelPropuesta';
import { usePropuesta } from './ui/usePropuesta';
import { useRuta } from './ui/useRuta';

export default function App() {
  const estado = usePropuesta();
  const [ruta, ir] = useRuta();

  // La plantilla de textos del equipo se lee una vez al abrir. Si el servidor no
  // contesta, todo vale su original; y al emitir se vuelve a pedir, que es cuando
  // importa de verdad (ver `emitir`).
  useEffect(() => {
    void cargarPlantilla();
  }, []);

  switch (ruta.pantalla) {
    case 'textos':
      return <PantallaTextos alVolver={() => ir({ pantalla: 'cotizador' })} />;

    case 'contabilidad':
      return <PantallaContabilidad alVolver={() => ir({ pantalla: 'cotizador' })} />;

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
                documento: cliente.documento,
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
          alContabilidad={() => ir({ pantalla: 'contabilidad' })}
          alTextos={() => ir({ pantalla: 'textos' })}
        />
      );
  }
}

function Cotizador({
  estado,
  alHistorial,
  alClientes,
  alContabilidad,
  alTextos,
}: {
  estado: ReturnType<typeof usePropuesta>;
  alHistorial: () => void;
  alClientes: () => void;
  alContabilidad: () => void;
  alTextos: () => void;
}) {
  const { propuesta, despachar, totales, alertas, plan, itemsEnUso } = estado;
  // El catálogo ya no ocupa media pantalla: se abre desde «Incluir algo más».
  const [catalogoAbierto, setCatalogoAbierto] = useState(false);
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
      // Los textos se congelan DENTRO de la propuesta antes de guardarla: así el
      // PDF que el cliente recibe se puede regenerar idéntico dentro de un año, y
      // editar la plantilla mañana no lo cambia. Se pide la plantilla fresca justo
      // ahora: congelar los originales porque la red falló un momento, cuando el
      // equipo tiene otra redacción, sacaría un documento distinto sin avisar.
      await refrescarPlantilla();
      const congelada = congelarTextos(propuesta, plantillaActual());
      despachar({ tipo: 'textos', textos: congelada.textos });

      const { numero, enlace } = await almacen.registrar(congelada);
      if (numero !== propuesta.numero) despachar({ tipo: 'numeroAsignado', numero });
      // Emitir puede haber creado o reconocido la ficha del cliente. Se guarda
      // el enlace para que reemitir la misma propuesta no cree una segunda.
      if (enlace.codigo && enlace.codigo !== propuesta.clienteCodigo) {
        despachar({ tipo: 'ficha', codigo: enlace.codigo });
      }
      await accion({ ...congelada, numero, clienteCodigo: enlace.codigo ?? undefined });
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
    ver: () => void verPdf(conPlantilla(propuesta, plantillaActual())).catch(() => anunciar('No se pudo abrir la vista previa.')),
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
        setCatalogoAbierto(false);
      }
    },
  };

  return (
    <div className="flex min-h-screen flex-col pb-28">
      <header className="cristal sticky top-0 z-30 border-b border-linea">
        <div className="mx-auto flex w-full max-w-[110rem] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 lg:flex-nowrap lg:px-6">
          <VolverAlHub conFlecha />
          <BotonDeTema />
          <Simbolo className="h-6 shrink-0 text-naranja" />
          <div className="mr-auto min-w-0">
            <h1 className="truncate text-sm font-semibold">Cotizador · {EMPRESA.nombre}</h1>
            <p className="truncate text-xs text-gris">
              {propuesta.numero || 'El número se asigna al emitir'}
            </p>
          </div>

          {/*
            Las tres pantallas hermanas. En el móvil bajan a su propia fila y se
            reparten el ancho: con cuatro botones en la fila del título, el último
            se salía de la pantalla y el panel no admite desbordes laterales.
          */}
          <nav className="order-last flex w-full flex-wrap gap-2 lg:order-none lg:w-auto" aria-label="Pantallas del cotizador">
            <button type="button" className="boton boton-secundario flex-1 lg:flex-none" onClick={alClientes}>
              Clientes
            </button>
            <button type="button" className="boton boton-secundario flex-1 lg:flex-none" onClick={alHistorial}>
              Historial
            </button>
            <button type="button" className="boton boton-secundario flex-1 lg:flex-none" onClick={alContabilidad}>
              Contabilidad
            </button>
            <button type="button" className="boton boton-secundario flex-1 lg:flex-none" onClick={alTextos}>
              Textos
            </button>
          </nav>

        </div>

      </header>

      {/*
        UNA columna, en el mismo orden que el documento: lo que se escribe aquí es lo
        que sale en el PDF, de arriba abajo. Cada sección se edita en su sitio; el
        catálogo no está a la vista, se abre desde «Incluir algo más».
      */}
      <main className="mx-auto w-full max-w-4xl flex-1 space-y-5 p-4 lg:p-6">
        <Alertas alertas={alertas} />
        <DatosCliente propuesta={propuesta} despachar={despachar} />
        <ListaLineas
          propuesta={propuesta}
          despachar={despachar}
          alertas={alertas}
          alIncluir={() => setCatalogoAbierto(true)}
        />
        <QueNoIncluye propuesta={propuesta} despachar={despachar} />
        <LosDosTotales totales={totales} propuesta={propuesta} despachar={despachar} />
        <PlazoYCambios propuesta={propuesta} despachar={despachar} />
        <QueEsCadaCosa propuesta={propuesta} despachar={despachar} />
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
      </main>

      <HojaDeCatalogo
        abierta={catalogoAbierto}
        alCerrar={() => setCatalogoAbierto(false)}
        itemsEnUso={itemsEnUso}
        planActual={plan}
        alAgregar={agregar}
        lineas={propuesta.lineas.length}
      />

      <BarraDeAcciones
        totales={totales}
        bloqueada={bloqueada || emitiendo}
        vacia={vacia}
        emitiendo={emitiendo}
        alNueva={acciones.nueva}
        alCopiar={acciones.copiar}
        alVer={acciones.ver}
        alWhatsapp={acciones.whatsapp}
        alDescargar={acciones.descargar}
      />

      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4"
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

/** Las dos cifras siempre a la vista y las dos acciones de envío, en móvil. */
function BarraDeAcciones({
  totales,
  bloqueada,
  vacia,
  alNueva,
  alCopiar,
  alVer,
  alWhatsapp,
  alDescargar,
  emitiendo,
}: {
  totales: ReturnType<typeof usePropuesta>['totales'];
  bloqueada: boolean;
  vacia: boolean;
  alNueva: () => void;
  alCopiar: () => void;
  alVer: () => void;
  alWhatsapp: () => void;
  alDescargar: () => void;
  emitiendo: boolean;
}) {
  return (
    <section
      aria-label="Totales y envío de la propuesta"
      className="cristal fixed inset-x-0 bottom-0 z-30 border-t border-linea px-4 py-3"
    >
      <div className="mx-auto flex w-full max-w-4xl items-center gap-3">
        <div className="mr-auto min-w-0">
          <p className="text-base font-semibold text-naranja">{formato(totales.unico)}</p>
          <p className="truncate text-xs text-gris">
            {esCero(totales.mensual)
              ? 'pago único, más ITBMS'
              : `pago único · y ${formatoMensual(totales.mensual)}`}
          </p>
        </div>

        {/* Las acciones de apoyo solo en pantalla ancha; en el móvil bajan a una fila
            dentro de la propuesta, para que la barra no tape lo que se escribe. */}
        <div className="hidden items-center gap-2 lg:flex">
          <button type="button" className="boton boton-fantasma" onClick={alNueva}>
            Nueva
          </button>
          <button type="button" className="boton boton-secundario" onClick={alCopiar} disabled={bloqueada}>
            Copiar mensaje
          </button>
          <button type="button" className="boton boton-secundario" onClick={alVer} disabled={vacia}>
            Vista previa
          </button>
        </div>

        <button type="button" className="boton boton-secundario" onClick={alWhatsapp} disabled={bloqueada}>
          WhatsApp
        </button>
        <button type="button" className="boton boton-primario" onClick={alDescargar} disabled={bloqueada}>
          {emitiendo ? 'Emitiendo…' : 'Emitir PDF'}
        </button>
      </div>
    </section>
  );
}

/** De dónde salen los precios. Se dice, no se da por sabido. */
function PieCatalogo() {
  return (
    <p className="tarjeta p-5 text-xs leading-relaxed text-gris">
      Todos los importes salen de <code className="rounded bg-velo-fuerte px-1">datos/precios.json</code>,
      que es la fuente única de cifras de la marca y espejo del repositorio del sitio. El cotizador
      no inventa ninguna: si un precio cambia allí, cambia aquí, en el PDF y en el mensaje a la vez.
    </p>
  );
}
