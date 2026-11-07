/**
 * La propuesta en construcción: a quién va, qué lleva y cuánto cuesta.
 */

import { ITBMS, itemDe } from '../dominio/catalogo';
import { conImpuesto, esCero, esRango, fijo, formato, formatoExacto, formatoMensual, type Dinero } from '../dominio/dinero';
import { fechaLarga, sumarDias } from '../dominio/formato';
import { definicion } from '../dominio/textos';
import { fronterasEntradas, importeDeLinea, noIncluyeEntradas, plazosDe, rondasDe } from '../dominio/propuesta';
import type { Linea, Propuesta, Totales } from '../dominio/tipos';
import type { Alerta } from '../dominio/revision';
import { BuscadorCliente } from '../clientes/BuscadorCliente';
import { Campo, CampoLargo, Pastilla, Punto, Seccion } from './componentes';
import { usePlantilla } from '../textos/plantilla';
import { TextoEnLugar } from '../textos/TextoEnLugar';
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
              : 'border-linea bg-velo'
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
      {/*
        Primero la libreta y después los campos. Elegir una ficha llena los seis
        de abajo con lo que sepa de ese cliente hoy; escribirlos a mano sigue
        funcionando igual, y al emitir la ficha se crea sola.
      */}
      <BuscadorCliente
        codigoEnlazado={propuesta.clienteCodigo}
        alElegir={(ficha) =>
          despachar({
            tipo: 'ficha',
            codigo: ficha.codigo,
            cliente: {
              negocio: ficha.negocio,
              contacto: ficha.contacto,
              whatsapp: ficha.whatsapp,
              correo: ficha.correo,
              ciudad: ficha.ciudad,
              documento: ficha.documento,
            },
          })
        }
        alSoltar={() => despachar({ tipo: 'ficha', codigo: undefined })}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Negocio" valor={cliente.negocio} alCambiar={(v) => cambiar({ negocio: v })} marcador="Repuestos El Chorrillo" />
        <Campo etiqueta="Contacto" valor={cliente.contacto} alCambiar={(v) => cambiar({ contacto: v })} marcador="Luis Ortega" />
        <Campo etiqueta="WhatsApp" valor={cliente.whatsapp} alCambiar={(v) => cambiar({ whatsapp: v })} marcador="6531-0721" />
        <Campo etiqueta="Correo" valor={cliente.correo} alCambiar={(v) => cambiar({ correo: v })} tipo="email" marcador="luis@negocio.com" />
        <Campo etiqueta="RUC o cédula" valor={cliente.documento ?? ''} alCambiar={(v) => cambiar({ documento: v })} marcador="Opcional" />
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
  alIncluir,
}: {
  propuesta: Propuesta;
  despachar: Despachar;
  alertas: Alerta[];
  /** Abre el catálogo para elegir qué más incluir. */
  alIncluir: () => void;
}) {
  const hay = propuesta.lineas.length > 0;

  return (
    <Seccion
      titulo={hay ? `Qué incluye · ${propuesta.lineas.length}` : 'Qué incluye'}
      ayuda={
        hay
          ? 'Cada producto que va en la propuesta. Cambia el nombre, la descripción o la cantidad aquí mismo.'
          : undefined
      }
      accion={
        hay ? (
          <button type="button" className="boton boton-primario !py-2 text-sm" onClick={alIncluir}>
            <span aria-hidden="true">＋</span> Incluir algo más
          </button>
        ) : undefined
      }
    >
      {hay ? (
        <>
          <ul className="space-y-3">
            {propuesta.lineas.map((linea) => (
              <li key={linea.id}>
                <FilaLinea
                  propuesta={propuesta}
                  linea={linea}
                  despachar={despachar}
                  senalada={alertas.some((a) => a.lineaId === linea.id && a.gravedad === 'grave')}
                />
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="mt-3 w-full rounded-campo border border-dashed border-linea-fuerte py-3 text-sm font-medium text-gris transition hover:border-naranja hover:text-naranja"
            onClick={alIncluir}
          >
            <span aria-hidden="true">＋</span> Incluir algo más
          </button>
        </>
      ) : (
        <div className="rounded-campo border border-dashed border-linea-fuerte p-8 text-center">
          <p className="text-base font-semibold text-blanco">Todavía no hay nada en la propuesta</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-gris">
            Empieza por lo que el cliente necesita: un sitio web, un asistente de mensajes, seguridad… Elige del
            catálogo y se añade aquí.
          </p>
          <button type="button" className="boton boton-primario mt-5" onClick={alIncluir}>
            <span aria-hidden="true">＋</span> Incluir un producto
          </button>
        </div>
      )}
    </Seccion>
  );
}

function FilaLinea({
  propuesta,
  linea,
  despachar,
  senalada,
}: {
  propuesta: Propuesta;
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
  const notaPropia = linea.nota.trim();
  const tieneDescripcion = !!definicion(`item.${item.id}`);

  return (
    <div className={`rounded-campo border p-4 ${senalada ? 'border-ember/50 bg-ember/10' : 'border-linea bg-papel'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <input
            className="w-full rounded-sm border-0 border-b border-transparent bg-transparent p-0 pb-0.5 text-base font-semibold text-blanco hover:border-linea-fuerte focus:border-naranja focus:outline-none"
            value={linea.descripcion}
            onChange={(e) => editar({ descripcion: e.currentTarget.value })}
            aria-label="Nombre del producto en la cotización"
          />

          {/* La descripción es la nota gris que sale bajo el nombre en el PDF. Si
              la línea trae una nota propia, esa manda; si no, el texto del producto,
              que se edita aquí mismo. */}
          <div className="mt-2">
            {notaPropia ? (
              <p className="text-sm leading-relaxed text-gris">
                {notaPropia} <span className="text-xs">(nota de esta línea; se cambia en «Más opciones»)</span>
              </p>
            ) : tieneDescripcion ? (
              <TextoEnLugar
                clave={`item.${item.id}`}
                nombre={`la descripción de ${item.nombre}`}
                propuesta={propuesta}
                despachar={despachar}
                claseDelTexto="text-sm leading-relaxed text-gris"
              />
            ) : null}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className={`text-lg font-semibold ${linea.incluida ? 'text-gris' : 'text-naranja'}`}>
            {linea.incluida ? 'Incluido' : mensual ? formatoMensual(importe) : formato(importe)}
          </p>
          <p className="text-xs text-gris">{mensual ? 'cada mes' : 'pago único'}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-linea pt-3">
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
          <label className="flex items-center gap-2 text-sm text-gris">
            Cantidad
            <input
              type="number"
              min={1}
              max={20}
              className="campo w-20 px-2 py-1 text-center"
              value={linea.cantidad}
              onChange={(e) => editar({ cantidad: Math.max(1, Number(e.currentTarget.value) || 1) })}
            />
          </label>
        ) : null}

        {item.incluidoDesde ? (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gris">
            <input
              type="checkbox"
              className="size-4 accent-naranja"
              checked={linea.incluida}
              onChange={(e) => editar({ incluida: e.currentTarget.checked })}
            />
            Ya viene con el plan
          </label>
        ) : null}

        <button
          type="button"
          className="boton boton-fantasma ml-auto !px-2 !py-1 text-sm"
          onClick={() => despachar({ tipo: 'quitar', lineaId: linea.id })}
        >
          Quitar
        </button>
      </div>

      <details className="mt-2">
        <summary className="cursor-pointer text-xs font-medium text-gris hover:text-blanco">Más opciones</summary>
        <label className="mt-2 block">
          <span className="etiqueta">Nota solo para esta línea</span>
          <input
            className="campo text-sm"
            placeholder="Si escribes algo aquí, sustituye a la descripción en el documento"
            value={linea.nota}
            onChange={(e) => editar({ nota: e.currentTarget.value })}
          />
        </label>
      </details>
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

export function LosDosTotales({
  totales,
  propuesta,
  despachar,
}: {
  totales: Totales;
  propuesta: Propuesta;
  despachar: Despachar;
}) {
  const hayMensual = !esCero(totales.mensual);

  return (
    <section className="tarjeta overflow-hidden">
      <header className="px-5 pt-5">
        <h2 className="antetitulo">Precio</h2>
        <p className="mt-1.5 text-sm text-gris">
          Lo publicado en el catálogo y el ITBMS, calculados solos. El pago único y lo mensual van siempre
          por separado.
        </p>
      </header>
      <div className={`grid ${hayMensual ? 'sm:grid-cols-2' : ''}`}>
        <BloqueCifra
          rotulo="Pago único"
          cifra={formato(totales.unico)}
          pie="50 % al empezar, 50 % al entregar."
          desglose={desgloseDe(totales.unico, '')}
        />
        {hayMensual ? (
          // La línea que los separa es el mensaje: dos compromisos con dos
          // duraciones. Nunca una suma, y nunca un tercer número debajo.
          <BloqueCifra
            rotulo="Cada mes"
            cifra={formatoMensual(totales.mensual)}
            pie="Opcional y sin permanencia."
            desglose={desgloseDe(totales.mensual, '/mes')}
            conSeparador
          />
        ) : null}
      </div>

      {totales.terceros.length ? (
        <div className="border-t border-linea p-5">
          <h3 className="antetitulo">A terceros</h3>
          <div className="mt-2">
            <TextoEnLugar clave="aTerceros" nombre="la explicación de los costos de terceros" propuesta={propuesta} despachar={despachar} />
          </div>
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
  desglose,
  conSeparador = false,
}: {
  rotulo: string;
  cifra: string;
  pie: string;
  desglose: { impuesto: string; total: string };
  conSeparador?: boolean;
}) {
  return (
    <div className={`p-5 ${conSeparador ? 'border-t border-linea sm:border-t-0 sm:border-l' : ''}`}>
      <h3 className="antetitulo">{rotulo}</h3>
      <p className="mt-2 text-3xl leading-none font-semibold tracking-tight text-naranja">{cifra}</p>
      <dl className="mt-3 space-y-1 border-t border-linea pt-3 text-xs">
        <div className="flex justify-between text-gris">
          <dt>{ITBMS.texto}</dt>
          <dd>+ {desglose.impuesto}</dd>
        </div>
        <div className="flex justify-between font-semibold text-blanco">
          <dt>Total con ITBMS</dt>
          <dd>{desglose.total}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-gris">{pie}</p>
    </div>
  );
}

/** El ITBMS de un bloque y lo que se paga con él, cada bloque por su cuenta. */
function desgloseDe(base: Dinero, sufijo: string): { impuesto: string; total: string } {
  const { impuesto, total } = conImpuesto(base, ITBMS.tasa);
  return { impuesto: `${formatoExacto(impuesto)}${sufijo}`, total: `${formatoExacto(total)}${sufijo}` };
}

/* ------------------------------------------------------------------ *
 * Lo que la propuesta va a decir sola
 * ------------------------------------------------------------------ */

export function QueNoIncluye({ propuesta, despachar }: { propuesta: Propuesta; despachar: Despachar }) {
  const plantilla = usePlantilla();
  const entradas = noIncluyeEntradas(propuesta.lineas, propuesta.condiciones.noIncluyeExtra, {
    ...plantilla,
    ...propuesta.textos,
  });

  return (
    <Seccion
      titulo="Qué NO incluye"
      ayuda="En el documento va ANTES del precio: es la firma de la marca. Se arma sola según lo que lleve la propuesta, y cada frase se puede cambiar aquí mismo."
    >
      <TextoEnLugar clave="noIncluyeIntro" nombre="la frase que abre la lista" propuesta={propuesta} despachar={despachar} claseDelTexto="text-sm leading-relaxed text-gris" />

      <ul className="mt-4 space-y-3">
        {entradas.map((entrada) => (
          <Punto key={entrada.clave ?? entrada.texto}>
            {entrada.clave ? (
              <TextoEnLugar clave={entrada.clave} propuesta={propuesta} despachar={despachar} claseDelTexto="text-sm leading-relaxed text-blanco" />
            ) : (
              <span className="text-blanco">{entrada.texto}</span>
            )}
          </Punto>
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

/** «Plazo» y «Cambios»: dos secciones del documento, dos secciones aquí. */
export function PlazoYCambios({ propuesta, despachar }: { propuesta: Propuesta; despachar: Despachar }) {
  const plantilla = usePlantilla();
  const textos = { ...plantilla, ...propuesta.textos };
  const plazos = plazosDe(propuesta.lineas, textos);
  const rondas = rondasDe(propuesta.lineas);
  if (!plazos.length && !rondas) return null;

  return (
    <>
      {plazos.length ? (
        <Seccion
          titulo="Plazo"
          ayuda="Los plazos salen del catálogo y no se cambian aquí. Lo que sí se puede cambiar es cómo se escriben."
        >
          <TextoEnLugar
            clave="plazoLinea"
            nombre="cómo se escribe cada plazo"
            propuesta={propuesta}
            despachar={despachar}
            valores={{ producto: plazos[0]!.que, plazo: plazos[0]!.cuando }}
            vista={
              <ul className="space-y-2">
                {plazos.map((plazo) => (
                  <Punto key={plazo.que}>
                    <span className="font-medium text-blanco">{plazo.linea}</span>
                  </Punto>
                ))}
              </ul>
            }
          />
          <div className="mt-4 border-t border-linea pt-4">
            <p className="etiqueta">Desde cuándo cuenta el plazo</p>
            <TextoEnLugar clave="plazoDesde" nombre="desde cuándo cuenta el plazo" propuesta={propuesta} despachar={despachar} claseDelTexto="text-sm font-semibold leading-relaxed text-blanco" />
          </div>
        </Seccion>
      ) : null}

      {rondas ? (
        <Seccion titulo="Cambios" ayuda="Cuántas rondas de cambios trae el plan y qué pasa cuando se acaban.">
          <TextoEnLugar
            clave={rondas.incluidas === 0 ? 'cambiosSinRondas' : 'cambiosConRondas'}
            nombre="la explicación de los cambios"
            propuesta={propuesta}
            despachar={despachar}
            valores={{
              plan: rondas.plan,
              rondas: rondas.incluidas,
              rondasPalabra: rondas.incluidas === 1 ? 'ronda' : 'rondas',
              extra: rondas.extra,
            }}
          />
        </Seccion>
      ) : null}
    </>
  );
}

/** «Qué es cada cosa»: solo existe cuando la propuesta lleva productos que se confunden. */
export function QueEsCadaCosa({ propuesta, despachar }: { propuesta: Propuesta; despachar: Despachar }) {
  const plantilla = usePlantilla();
  const entradas = fronterasEntradas(propuesta.lineas, { ...plantilla, ...propuesta.textos });
  if (!entradas.length) return null;

  return (
    <Seccion
      titulo="Qué es cada cosa"
      ayuda="Aparece sola cuando la propuesta lleva dos de los productos que suelen confundirse."
    >
      <ul className="space-y-3">
        {entradas.map((e) => (
          <Punto key={e.clave}>
            <TextoEnLugar clave={e.clave} propuesta={propuesta} despachar={despachar} claseDelTexto="text-sm leading-relaxed text-blanco" />
          </Punto>
        ))}
      </ul>
    </Seccion>
  );
}

export function PanelCondiciones({ propuesta, despachar }: { propuesta: Propuesta; despachar: Despachar }) {
  const { condiciones } = propuesta;
  const hayMensual = propuesta.lineas.some((l) => itemDe(l.itemId)?.recurrencia === 'mensual');

  const claves: { clave: string; nombre: string; valores?: Record<string, string> }[] = [
    { clave: 'condArranque', nombre: 'qué se necesita para arrancar' },
    { clave: 'condCodigo', nombre: 'a quién pertenece el código' },
    { clave: 'condCancelacion', nombre: 'qué pasa si se cancela' },
    ...(hayMensual ? [{ clave: 'condCancelacionMensual', nombre: 'cómo se cancela un plan mensual' }] : []),
    { clave: 'condRemoto', nombre: 'cómo se trabaja' },
    { clave: 'condItbms', nombre: 'el aviso del ITBMS', valores: { itbms: ITBMS.texto } },
  ];

  return (
    <>
      <Seccion
        titulo="Condiciones"
        ayuda="Lo que el cliente acepta al firmar. Cada condición se puede cambiar aquí mismo."
      >
        <ul className="space-y-3">
          {claves.map(({ clave, nombre, valores }) => (
            <Punto key={clave}>
              <TextoEnLugar clave={clave} nombre={nombre} propuesta={propuesta} despachar={despachar} valores={valores} claseDelTexto="text-sm leading-relaxed text-blanco" />
            </Punto>
          ))}
        </ul>

        <div className="mt-5 grid gap-4 border-t border-linea pt-5 sm:grid-cols-2">
          <label className="block">
            <span className="etiqueta">Validez de la propuesta</span>
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
            <p className="campo bg-transparent">{fechaLarga(sumarDias(propuesta.fecha, condiciones.validezDias))}</p>
          </div>
        </div>

        <div className="mt-4">
          <CampoLargo
            etiqueta="Notas para este cliente"
            filas={2}
            valor={condiciones.observaciones}
            alCambiar={(texto) => despachar({ tipo: 'condiciones', cambios: { observaciones: texto } })}
            marcador="Arrancamos la semana del 1 de septiembre."
          />
        </div>
      </Seccion>

      <Seccion titulo="Aceptación" ayuda="Al final del documento, encima de las líneas de nombre, firma y fecha.">
        <TextoEnLugar clave="aceptacion" nombre="la frase de la firma" propuesta={propuesta} despachar={despachar} />
      </Seccion>
    </>
  );
}
