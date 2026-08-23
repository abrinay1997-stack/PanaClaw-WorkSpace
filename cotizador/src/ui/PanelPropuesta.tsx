/**
 * La propuesta en construcción: a quién va, qué lleva y cuánto cuesta.
 */

import { itemDe } from '../dominio/catalogo';
import { esCero, esRango, fijo, formato, formatoMensual } from '../dominio/dinero';
import { fechaLarga, sumarDias } from '../dominio/formato';
import { importeDeLinea, noIncluyeDe, plazosDe, rondasDe } from '../dominio/propuesta';
import type { Linea, Propuesta, Totales } from '../dominio/tipos';
import type { Alerta } from '../dominio/revision';
import { Campo, CampoLargo, Pastilla, Punto, Seccion } from './componentes';
import type { Accion } from './usePropuesta';

type Despachar = (accion: Accion) => void;

/* ------------------------------------------------------------------ *
 * Alertas
 * ------------------------------------------------------------------ */

export function Alertas({ alertas }: { alertas: Alerta[] }) {
  if (!alertas.length) return null;

  return (
    <ul className="space-y-2">
      {alertas.map((alerta, i) => (
        <li
          key={i}
          className={`rounded-tarjeta border p-4 ${
            alerta.gravedad === 'grave'
              ? // El ember es fondo, nunca texto: la regla de marca cumplida
                // justo donde más tentador sería romperla.
                'border-ember/40 bg-ember/12'
              : 'border-white/10 bg-white/3'
          }`}
        >
          <p className="text-sm font-semibold text-blanco">{alerta.texto}</p>
          <p className="mt-1 text-sm leading-relaxed text-gris">{alerta.comoSeArregla}</p>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ *
 * A quién va
 * ------------------------------------------------------------------ */

export function DatosCliente({ propuesta, despachar }: { propuesta: Propuesta; despachar: Despachar }) {
  const { cliente } = propuesta;
  const cambiar = (cambios: Partial<Propuesta['cliente']>) => despachar({ tipo: 'cliente', cambios });

  return (
    <Seccion titulo="Para quién">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Negocio" valor={cliente.negocio} alCambiar={(v) => cambiar({ negocio: v })} marcador="Repuestos El Chorrillo" />
        <Campo etiqueta="Contacto" valor={cliente.contacto} alCambiar={(v) => cambiar({ contacto: v })} marcador="Luis Ortega" />
        <Campo etiqueta="WhatsApp" valor={cliente.whatsapp} alCambiar={(v) => cambiar({ whatsapp: v })} marcador="6531-0721" />
        <Campo etiqueta="Correo" valor={cliente.correo} alCambiar={(v) => cambiar({ correo: v })} tipo="email" marcador="luis@negocio.com" />
        <Campo etiqueta="Ciudad" valor={cliente.ciudad} alCambiar={(v) => cambiar({ ciudad: v })} />
        <Campo etiqueta="Quién cotiza" valor={propuesta.asesor} alCambiar={(v) => despachar({ tipo: 'asesor', nombre: v })} marcador="Tu nombre" />
      </div>

      <div className="mt-4">
        <CampoLargo
          etiqueta="Qué necesita, en sus palabras"
          valor={propuesta.necesita}
          alCambiar={(texto) => despachar({ tipo: 'necesita', texto })}
          marcador="Vende repuestos por WhatsApp y quiere dejar de mandar clientes a un perfil de Instagram."
        />
        <p className="mt-2 text-xs leading-relaxed text-gris">
          Encabeza el documento. Una propuesta que empieza por el precio se lee como un presupuesto;
          una que empieza por el problema se lee como una respuesta.
        </p>
      </div>
    </Seccion>
  );
}

/* ------------------------------------------------------------------ *
 * Las líneas
 * ------------------------------------------------------------------ */

export function ListaLineas({
  propuesta,
  despachar,
  alertas,
}: {
  propuesta: Propuesta;
  despachar: Despachar;
  alertas: Alerta[];
}) {
  if (!propuesta.lineas.length) {
    return (
      <Seccion titulo="Qué incluye">
        <p className="py-6 text-center text-sm text-gris">
          Elige del catálogo lo que va a llevar la propuesta.
        </p>
      </Seccion>
    );
  }

  return (
    <Seccion titulo={`Qué incluye · ${propuesta.lineas.length}`}>
      <ul className="space-y-3">
        {propuesta.lineas.map((linea) => (
          <li key={linea.id}>
            <FilaLinea
              linea={linea}
              despachar={despachar}
              senalada={alertas.some((a) => a.lineaId === linea.id && a.gravedad === 'grave')}
            />
          </li>
        ))}
      </ul>
    </Seccion>
  );
}

function FilaLinea({
  linea,
  despachar,
  senalada,
}: {
  linea: Linea;
  despachar: Despachar;
  senalada: boolean;
}) {
  const item = itemDe(linea.itemId);
  if (!item) return null;

  const editar = (cambios: Partial<Linea>) =>
    despachar({ tipo: 'editarLinea', lineaId: linea.id, cambios });

  const importe = importeDeLinea(linea);
  const mensual = item.recurrencia === 'mensual';
  const rangoAbierto = esRango(linea.precio);

  return (
    <div
      className={`rounded-campo border p-4 ${senalada ? 'border-ember/40 bg-ember/8' : 'border-white/10 bg-white/2'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <input
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-medium text-blanco focus:outline-none"
          value={linea.descripcion}
          onChange={(e) => editar({ descripcion: e.currentTarget.value })}
          aria-label="Descripción de la línea"
        />
        <div className="shrink-0 text-right">
          <p className={`text-sm font-semibold ${linea.incluida ? 'text-gris' : 'text-naranja'}`}>
            {linea.incluida ? 'Incluido' : mensual ? formatoMensual(importe) : formato(importe)}
          </p>
          <p className="text-[0.6875rem] text-gris">{mensual ? 'cada mes' : 'pago único'}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {/*
          El precio cerrado NO se puede tocar, y es la regla de marca «la marca
          no regatea» hecha interfaz. Lo único editable es un RANGO, y solo
          hacia dentro: cerrar $80–$150 en $110 es elegir el tramo que
          corresponde; escribir $70 sería inventarse una cifra que la marca no
          publica, y aquí no hay dónde escribirla.
        */}
        {rangoAbierto || linea.precioAjustado ? (
          <CerrarRango linea={linea} editar={editar} />
        ) : (
          <Pastilla>Precio publicado · {item.precioTexto}</Pastilla>
        )}

        {item.repetible ? (
          <label className="flex items-center gap-2 text-xs text-gris">
            Cantidad
            <input
              type="number"
              min={1}
              max={20}
              className="campo w-16 px-2 py-1 text-center"
              value={linea.cantidad}
              onChange={(e) => editar({ cantidad: Math.max(1, Number(e.currentTarget.value) || 1) })}
            />
          </label>
        ) : null}

        {item.incluidoDesde ? (
          <label className="flex cursor-pointer items-center gap-2 text-xs text-gris">
            <input
              type="checkbox"
              checked={linea.incluida}
              onChange={(e) => editar({ incluida: e.currentTarget.checked })}
            />
            Ya viene con el plan
          </label>
        ) : null}

        <button
          type="button"
          className="boton boton-fantasma ml-auto px-2 py-1 text-xs"
          onClick={() => despachar({ tipo: 'quitar', lineaId: linea.id })}
        >
          Quitar
        </button>
      </div>

      <input
        className="campo mt-3 text-xs"
        placeholder={item.queConsigue ?? 'Nota para el cliente'}
        value={linea.nota}
        onChange={(e) => editar({ nota: e.currentTarget.value })}
        aria-label="Nota de la línea"
      />
    </div>
  );
}

/** Cierra un rango publicado en una cifra de dentro. Nunca de fuera. */
function CerrarRango({ linea, editar }: { linea: Linea; editar: (cambios: Partial<Linea>) => void }) {
  const item = itemDe(linea.itemId);
  if (!item) return null;

  const { min, max } = item.precio;
  const valor = linea.precioAjustado ? linea.precio.min : min;

  return (
    <span className="flex items-center gap-2 text-xs text-gris">
      {linea.precioAjustado ? (
        <>
          Cerrado en
          <input
            type="number"
            min={min}
            max={max}
            className="campo w-24 px-2 py-1 text-center"
            value={valor}
            onChange={(e) => {
              const escrito = Number(e.currentTarget.value);
              const dentro = Math.min(max, Math.max(min, Number.isFinite(escrito) ? escrito : min));
              editar({ precio: fijo(dentro) });
            }}
          />
          <button
            type="button"
            className="boton boton-fantasma px-2 py-1 text-xs"
            onClick={() => editar({ precio: item.precio, precioAjustado: false })}
          >
            Volver al rango
          </button>
        </>
      ) : (
        <>
          <Pastilla encendida>Rango · {item.precioTexto}</Pastilla>
          <button
            type="button"
            className="boton boton-secundario px-2.5 py-1 text-xs"
            onClick={() => editar({ precio: fijo(min), precioAjustado: true })}
          >
            Cerrar en una cifra
          </button>
        </>
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Los dos totales
 * ------------------------------------------------------------------ */

export function LosDosTotales({ totales }: { totales: Totales }) {
  const hayMensual = !esCero(totales.mensual);

  return (
    <section className="tarjeta overflow-hidden">
      <div className={`grid ${hayMensual ? 'sm:grid-cols-2' : ''}`}>
        <BloqueCifra
          rotulo="Pago único"
          cifra={formato(totales.unico)}
          pie="50 % al empezar, 50 % al entregar."
        />
        {hayMensual ? (
          // La línea que los separa es el mensaje: dos compromisos con dos
          // duraciones. Nunca una suma, y nunca un tercer número debajo.
          <BloqueCifra
            rotulo="Cada mes"
            cifra={formatoMensual(totales.mensual)}
            pie="Opcional y sin permanencia."
            conSeparador
          />
        ) : null}
      </div>

      {totales.terceros.length ? (
        <div className="border-t border-white/10 p-5">
          <h3 className="antetitulo">A terceros</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-gris">
            No lo cobra PanaClaw. Va en su propio bloque de la propuesta.
          </p>
          <ul className="mt-3 space-y-1.5">
            {totales.terceros.map((costo) => (
              <Punto key={costo.concepto}>
                {costo.concepto}: <strong className="font-semibold text-blanco">{costo.precioTexto}</strong> a {costo.aQuien}
              </Punto>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function BloqueCifra({
  rotulo,
  cifra,
  pie,
  conSeparador = false,
}: {
  rotulo: string;
  cifra: string;
  pie: string;
  conSeparador?: boolean;
}) {
  return (
    <div className={`p-5 ${conSeparador ? 'border-t border-white/10 sm:border-t-0 sm:border-l' : ''}`}>
      <h3 className="antetitulo">{rotulo}</h3>
      <p className="mt-2 text-3xl leading-none font-semibold tracking-tight text-naranja">{cifra}</p>
      <p className="mt-2 text-xs text-gris">{pie}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Lo que la propuesta va a decir sola
 * ------------------------------------------------------------------ */

export function QueNoIncluye({ propuesta, despachar }: { propuesta: Propuesta; despachar: Despachar }) {
  const lista = noIncluyeDe(propuesta.lineas, propuesta.condiciones.noIncluyeExtra);

  return (
    <Seccion
      titulo="Qué NO incluye"
      ayuda="Se arma sola según lo que lleve la propuesta, y en el documento va ANTES del precio. Es la firma de la marca."
    >
      <ul className="space-y-2">
        {lista.map((punto) => (
          <Punto key={punto}>{punto}</Punto>
        ))}
      </ul>

      <div className="mt-4">
        <CampoLargo
          etiqueta="Añadir exclusiones de este caso"
          filas={2}
          valor={propuesta.condiciones.noIncluyeExtra.join('\n')}
          alCambiar={(texto) =>
            despachar({
              tipo: 'condiciones',
              cambios: { noIncluyeExtra: texto.split('\n').filter((l) => l.trim()) },
            })
          }
          marcador="Una por línea"
        />
      </div>
    </Seccion>
  );
}

export function PlazoYCambios({ propuesta }: { propuesta: Propuesta }) {
  const plazos = plazosDe(propuesta.lineas);
  const rondas = rondasDe(propuesta.lineas);
  if (!plazos.length && !rondas) return null;

  return (
    <Seccion titulo="Plazo y cambios">
      <ul className="space-y-2">
        {plazos.map((plazo) => (
          <Punto key={plazo.que}>
            {plazo.que}: <strong className="font-semibold text-blanco">{plazo.cuando}</strong>
          </Punto>
        ))}
        {rondas ? (
          <Punto>
            {rondas.incluidas === 0
              ? `${rondas.plan} no trae rondas de cambios.`
              : `${rondas.plan} incluye ${rondas.incluidas} ${rondas.incluidas === 1 ? 'ronda' : 'rondas'} de cambios.`}{' '}
            Ronda extra: <strong className="font-semibold text-blanco">{rondas.extra}</strong>
          </Punto>
        ) : null}
      </ul>
      <p className="mt-3 text-xs leading-relaxed text-gris">
        El documento dice solo desde cuándo cuenta el reloj: cuando llega el material del cliente y
        la mitad del pago.
      </p>
    </Seccion>
  );
}

export function PanelCondiciones({ propuesta, despachar }: { propuesta: Propuesta; despachar: Despachar }) {
  const { condiciones } = propuesta;

  return (
    <Seccion titulo="Condiciones">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="etiqueta">Validez</span>
          <select
            className="campo"
            value={condiciones.validezDias}
            onChange={(e) =>
              despachar({ tipo: 'condiciones', cambios: { validezDias: Number(e.currentTarget.value) } })
            }
          >
            {[8, 15, 30].map((dias) => (
              <option key={dias} value={dias} className="bg-negro">
                {dias} días
              </option>
            ))}
          </select>
        </label>

        <div>
          <span className="etiqueta">Válida hasta</span>
          <p className="campo bg-transparent">
            {fechaLarga(sumarDias(propuesta.fecha, condiciones.validezDias))}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <CampoLargo
          etiqueta="Notas"
          filas={2}
          valor={condiciones.observaciones}
          alCambiar={(texto) => despachar({ tipo: 'condiciones', cambios: { observaciones: texto } })}
          marcador="Arrancamos la semana del 1 de septiembre."
        />
      </div>
    </Seccion>
  );
}
