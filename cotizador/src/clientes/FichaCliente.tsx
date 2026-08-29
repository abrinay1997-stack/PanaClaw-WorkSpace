/**
 * La ficha de un cliente: quién es, qué se le ha propuesto y en qué acabó.
 *
 * Responde de una vez las tres preguntas que si no obligan a mirar en tres
 * sitios. Y las cifras de arriba van **en pares** —lo de una vez y lo de cada
 * mes, separados— porque «este cliente vale tanto» es una frase que no se puede
 * decir con un solo número sin mentir.
 */

import { useCallback, useEffect, useState } from 'react';

import {
  ESTADOS_CLIENTE,
  MOTIVO_COINCIDENCIA,
  NOMBRE_ESTADO_CLIENTE,
  clienteVacio,
  nombreDocumento,
  type Cliente,
  type Coincidencia,
  type DatosCliente,
  type EstadoCliente,
  type TipoCliente,
} from '../../../compartido/clientes';
import type { ActividadCliente, Cifra } from '../../../compartido/actividad';
import { FalloApi, mensajeDe } from '../api/fallo';
import { esCero, formato, formatoMensual } from '../dominio/dinero';
import { fechaLarga } from '../dominio/formato';
import { NOMBRE_ESTADO } from '../historial/contrato';
import { Campo, CampoLargo, Pastilla, Seccion } from '../ui/componentes';
import { clientes } from './almacen';

export function FichaCliente({
  codigo,
  alVolver,
  alCotizar,
}: {
  /** `null` para una ficha nueva. */
  codigo: string | null;
  alVolver: () => void;
  alCotizar: (cliente: Cliente) => void;
}) {
  const [datos, setDatos] = useState<DatosCliente>(clienteVacio());
  const [ficha, setFicha] = useState<Cliente | null>(null);
  const [actividad, setActividad] = useState<ActividadCliente | null>(null);
  const [parecida, setParecida] = useState<Coincidencia | null>(null);
  const [duplicada, setDuplicada] = useState<string | null>(null);
  const [aviso, setAviso] = useState('');
  const [fallo, setFallo] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    if (!codigo) {
      setDatos(clienteVacio());
      setFicha(null);
      setActividad(null);
      return;
    }
    try {
      const cliente = await clientes.abrir(codigo);
      setFicha(cliente);
      setDatos(cliente);
      setFallo('');
      setActividad(await clientes.actividad(codigo));
    } catch (error) {
      setFallo(mensajeDe(error, 'No se pudo abrir la ficha.'));
    }
  }, [codigo]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const cambiar = <C extends keyof DatosCliente>(campo: C, valor: DatosCliente[C]) => {
    setDatos((previos) => ({ ...previos, [campo]: valor }));
    setParecida(null);
    setDuplicada(null);
  };

  /**
   * Guardar.
   *
   * Al crear, primero se pregunta si ya existe alguien parecido. Una
   * coincidencia fuerte —el mismo RUC— la rechaza el servidor con su propio
   * mensaje; las flojas se enseñan aquí y no guardan nada todavía: quien está
   * escribiendo decide si es el mismo o si es otro.
   */
  const guardar = async (aunqueSeParezca = false) => {
    if (guardando) return;
    setGuardando(true);
    setFallo('');
    setAviso('');

    try {
      if (!codigo && !aunqueSeParezca) {
        const { coincidencia } = await clientes.coincidencia({
          documento: datos.documento,
          whatsapp: datos.whatsapp,
          correo: datos.correo,
          negocio: datos.negocio,
        });
        if (coincidencia) {
          setParecida(coincidencia);
          return;
        }
      }

      const guardada = codigo
        ? await clientes.actualizar(codigo, datos)
        : await clientes.crear(datos);

      setFicha(guardada);
      setDatos(guardada);
      setParecida(null);
      setAviso(codigo ? 'Ficha actualizada.' : `Ficha creada: ${guardada.codigo}.`);
    } catch (error) {
      if (error instanceof FalloApi && error.codigo === 'cliente-duplicado') {
        setDuplicada(error.detalle ?? null);
      }
      setFallo(mensajeDe(error, 'No se pudo guardar la ficha.'));
    } finally {
      setGuardando(false);
    }
  };

  const nombreDoc = nombreDocumento(datos.tipo);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 p-4 lg:p-6">
      <header className="flex flex-wrap items-center gap-3">
        <button type="button" className="boton boton-secundario" onClick={alVolver}>
          ← Volver a clientes
        </button>
        <h1 className="mr-auto min-w-0 truncate text-lg font-semibold">
          {ficha ? ficha.negocio || ficha.codigo : 'Cliente nuevo'}
        </h1>
        {ficha ? (
          <button type="button" className="boton boton-secundario" onClick={() => alCotizar(ficha)}>
            Cotizarle
          </button>
        ) : null}
        <button
          type="button"
          className="boton boton-primario"
          onClick={() => void guardar()}
          disabled={guardando || !datos.negocio.trim()}
        >
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </header>

      {aviso ? (
        <p className="rounded-tarjeta border border-naranja/30 bg-naranja/10 p-4 text-sm text-blanco">
          {aviso}
        </p>
      ) : null}

      {fallo ? (
        <div className="rounded-tarjeta border border-ember/40 bg-ember/12 p-4 text-sm text-blanco">
          <p>{fallo}</p>
          {duplicada ? (
            <button
              type="button"
              className="boton boton-secundario mt-3 px-3 py-1 text-xs"
              onClick={() => {
                location.hash = `#cliente/${duplicada}`;
              }}
            >
              Abrir {duplicada}
            </button>
          ) : null}
        </div>
      ) : null}

      {parecida ? (
        <SeParece
          coincidencia={parecida}
          alAbrir={() => {
            location.hash = `#cliente/${parecida.cliente.codigo}`;
          }}
          alGuardarIgual={() => void guardar(true)}
        />
      ) : null}

      {actividad ? <Cifras totales={actividad.totales} /> : null}

      <Seccion titulo="Quién es">
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo
            etiqueta="Negocio o persona"
            valor={datos.negocio}
            alCambiar={(v) => cambiar('negocio', v)}
            marcador="Nombre con el que factura"
          />
          <label className="block">
            <span className="etiqueta">Tipo</span>
            <select
              className="campo"
              value={datos.tipo}
              onChange={(e) => cambiar('tipo', e.currentTarget.value as TipoCliente)}
            >
              <option value="empresa" className="bg-negro">
                Empresa
              </option>
              <option value="persona" className="bg-negro">
                Persona natural
              </option>
            </select>
          </label>
          <Campo
            etiqueta={nombreDoc}
            valor={datos.documento}
            alCambiar={(v) => cambiar('documento', v)}
            marcador={datos.tipo === 'persona' ? 'Cédula' : 'RUC'}
          />
          <label className="block">
            <span className="etiqueta">Estado</span>
            <select
              className="campo"
              value={datos.estado}
              onChange={(e) => cambiar('estado', e.currentTarget.value as EstadoCliente)}
            >
              {ESTADOS_CLIENTE.map((e) => (
                <option key={e} value={e} className="bg-negro">
                  {NOMBRE_ESTADO_CLIENTE[e]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Seccion>

      <Seccion titulo="Cómo se le escribe">
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo
            etiqueta="Contacto"
            valor={datos.contacto}
            alCambiar={(v) => cambiar('contacto', v)}
            marcador="Con quién se habla"
          />
          <Campo etiqueta="Cargo" valor={datos.cargo} alCambiar={(v) => cambiar('cargo', v)} />
          <Campo
            etiqueta="WhatsApp"
            valor={datos.whatsapp}
            alCambiar={(v) => cambiar('whatsapp', v)}
            marcador="Por donde entra casi todo"
          />
          <Campo
            etiqueta="Teléfono"
            valor={datos.telefono}
            alCambiar={(v) => cambiar('telefono', v)}
          />
          <Campo
            etiqueta="Correo"
            valor={datos.correo}
            alCambiar={(v) => cambiar('correo', v)}
            tipo="email"
          />
          <Campo etiqueta="Ciudad" valor={datos.ciudad} alCambiar={(v) => cambiar('ciudad', v)} />
          <ListaExtra
            etiqueta="Otros correos"
            valores={datos.correosExtra}
            alCambiar={(v) => cambiar('correosExtra', v)}
          />
          <ListaExtra
            etiqueta="Otros teléfonos"
            valores={datos.telefonosExtra}
            alCambiar={(v) => cambiar('telefonosExtra', v)}
          />
        </div>
      </Seccion>

      <Seccion titulo="Lo demás">
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo
              etiqueta="Dirección"
              valor={datos.direccion}
              alCambiar={(v) => cambiar('direccion', v)}
            />
            <Campo
              etiqueta="Quién lo atiende"
              valor={datos.asesor}
              alCambiar={(v) => cambiar('asesor', v)}
            />
          </div>
          <CampoLargo
            etiqueta="Notas"
            valor={datos.notas}
            alCambiar={(v) => cambiar('notas', v)}
            marcador="Lo que haga falta recordar la próxima vez"
          />
        </div>
      </Seccion>

      {actividad ? <SusPropuestas actividad={actividad} /> : null}

      {ficha ? (
        <p className="text-xs text-gris">
          {ficha.codigo} · alta el {fechaLarga(ficha.creadoEn.slice(0, 10))} · última corrección el{' '}
          {fechaLarga(ficha.actualizadoEn.slice(0, 10))}
        </p>
      ) : null}
    </div>
  );
}

/**
 * «Esto se parece a una ficha que ya existe».
 *
 * No guarda nada todavía y ofrece las dos salidas. Fusionar dos clientes por
 * parecido es de las pocas cosas de este hub que no se deshacen, así que la
 * decisión es de quien está escribiendo y no del programa.
 */
function SeParece({
  coincidencia,
  alAbrir,
  alGuardarIgual,
}: {
  coincidencia: Coincidencia;
  alAbrir: () => void;
  alGuardarIgual: () => void;
}) {
  return (
    <div className="rounded-tarjeta border border-naranja/30 bg-naranja/10 p-5 text-sm leading-relaxed text-blanco">
      <p>
        <strong className="font-semibold">{coincidencia.cliente.negocio}</strong> (
        {coincidencia.cliente.codigo}) {MOTIVO_COINCIDENCIA[coincidencia.clase]}. No se ha guardado
        nada todavía.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="boton boton-secundario px-3 py-1 text-xs" onClick={alAbrir}>
          Abrir la que ya existe
        </button>
        <button
          type="button"
          className="boton boton-fantasma px-3 py-1 text-xs"
          onClick={alGuardarIgual}
        >
          Guardar igual, es otro cliente
        </button>
      </div>
    </div>
  );
}

/** Las cuatro cifras de la ficha. Cada una, dos importes que no se suman. */
function Cifras({ totales }: { totales: ActividadCliente['totales'] }) {
  const cuatro: { titulo: string; cifra: Cifra; encendida?: boolean }[] = [
    { titulo: 'Propuesto', cifra: totales.propuesto },
    { titulo: 'Ganado', cifra: totales.ganado, encendida: true },
    { titulo: 'Pendiente', cifra: totales.pendiente },
    { titulo: 'Perdido', cifra: totales.perdido },
  ];

  return (
    <Seccion
      titulo="Sus cifras"
      ayuda={`${totales.cuantas} ${totales.cuantas === 1 ? 'propuesta' : 'propuestas'} enlazadas a esta ficha. El pago único y la mensualidad van separados: son dos compromisos distintos y sumarlos daría una cifra falsa.`}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cuatro.map(({ titulo, cifra, encendida }) => (
          <div key={titulo} className="rounded-campo border border-white/10 bg-white/2 p-4">
            <p className="etiqueta mb-2">{titulo}</p>
            <p className={`text-sm font-semibold ${encendida ? 'text-naranja' : 'text-blanco'}`}>
              {formato(cifra.unico)}
            </p>
            <p className="mt-1 text-xs text-gris">
              {esCero(cifra.mensual)
                ? 'sin parte mensual'
                : `y ${formatoMensual(cifra.mensual)}`}
            </p>
          </div>
        ))}
      </div>
    </Seccion>
  );
}

/** Lo que se le ha propuesto, de lo último hacia atrás. */
function SusPropuestas({ actividad }: { actividad: ActividadCliente }) {
  if (actividad.propuestas.length === 0) {
    return (
      <Seccion titulo="Sus propuestas">
        <p className="text-sm text-gris">
          Todavía no hay ninguna propuesta enlazada a esta ficha.
        </p>
      </Seccion>
    );
  }

  return (
    <Seccion titulo="Sus propuestas">
      <ul className="space-y-2">
        {actividad.propuestas.map((propuesta) => (
          <li
            key={propuesta.numero}
            className="flex flex-wrap items-center gap-3 rounded-campo border border-white/10 p-3"
          >
            <div className="mr-auto min-w-0">
              <p className="truncate text-sm text-blanco">{propuesta.numero}</p>
              <p className="truncate text-xs text-gris">
                {fechaLarga(propuesta.fecha)}
                {propuesta.asesor ? ` · ${propuesta.asesor}` : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-naranja">
                {formato(propuesta.unico)}
              </p>
              {esCero(propuesta.mensual) ? null : (
                <p className="text-xs text-gris">+ {formatoMensual(propuesta.mensual)}</p>
              )}
            </div>
            <Pastilla encendida={propuesta.estado === 'aceptada'}>
              {NOMBRE_ESTADO[propuesta.estado]}
            </Pastilla>
          </li>
        ))}
      </ul>
    </Seccion>
  );
}

/**
 * Los correos o teléfonos adicionales, uno por línea.
 *
 * Uno por línea y no separados por coma: un correo no lleva saltos de línea
 * nunca, y una coma sí puede acabar dentro de un teléfono escrito a mano.
 */
function ListaExtra({
  etiqueta,
  valores,
  alCambiar,
}: {
  etiqueta: string;
  valores: string[];
  alCambiar: (valores: string[]) => void;
}) {
  return (
    <label className="block">
      <span className="etiqueta">{etiqueta}</span>
      <textarea
        className="campo resize-y"
        rows={2}
        value={valores.join('\n')}
        placeholder="Uno por línea"
        onChange={(e) =>
          alCambiar(
            e.currentTarget.value
              .split('\n')
              .map((v) => v.trim())
              .filter(Boolean),
          )
        }
      />
    </label>
  );
}
