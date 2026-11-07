/**
 * La contabilidad ligera: cuánto entró, cuánto salió y quién debe.
 *
 * Es flujo de caja: cuenta lo cobrado y lo pagado en las fechas del periodo. No
 * es una utilidad contable, y la pantalla lo dice junto a cada cifra. Todo sale
 * de los libros de cobros y de gastos sumando asientos; nada se guarda aparte.
 * Las cifras son del pago único: lo mensual no entra aquí, y no hay un total que
 * lo mezcle.
 */

import { useCallback, useEffect, useState } from 'react';

import {
  anioDe,
  CATEGORIAS,
  mesAnteriorDe,
  mesDe,
  mesDeFecha,
  NOMBRE_CATEGORIA,
  NOMBRE_TRAMO,
  TRAMOS,
  variacion,
  type Categoria,
  type ContabilidadDelPeriodo,
  type EstadoDeCierre,
} from '../../../compartido/contabilidad';
import { aCentavos, dolares, NOMBRE_METODO, type Metodo } from '../../../compartido/cobros';
import { mensajeDe } from '../api/fallo';
import { ES_DEMOSTRACION } from '../api/pedir';
import { hoyISO } from '../dominio/formato';
import { Pastilla, Seccion } from '../ui/componentes';
import { descargarTexto } from '../ui/csv';
import { almacenContabilidad } from './almacenContabilidad';
import { cobrosACsv, gastosACsv } from './exportar';

export function PantallaContabilidad({ alVolver }: { alVolver: () => void }) {
  const hoy = hoyISO();
  const [desde, setDesde] = useState(mesDe(hoy).desde);
  const [hasta, setHasta] = useState(mesDe(hoy).hasta);
  const [datos, setDatos] = useState<ContabilidadDelPeriodo | null>(null);
  const [fallo, setFallo] = useState('');

  const cargar = useCallback(async () => {
    try {
      setDatos(await almacenContabilidad.periodo(desde, hasta));
      setFallo('');
    } catch (error) {
      setFallo(mensajeDe(error, 'No se pudo cargar la contabilidad.'));
    }
  }, [desde, hasta]);

  useEffect(() => {
    if (!ES_DEMOSTRACION) void cargar();
  }, [cargar]);

  const elegir = (rango: { desde: string; hasta: string }) => {
    setDesde(rango.desde);
    setHasta(rango.hasta);
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 p-4 lg:p-6">
      <header className="flex flex-wrap items-center gap-3">
        <button type="button" className="boton boton-secundario" onClick={alVolver}>
          ← Volver al cotizador
        </button>
        <h1 className="text-lg font-semibold">Contabilidad</h1>
      </header>

      {ES_DEMOSTRACION ? (
        <p className="tarjeta p-5 text-sm text-gris">
          La contabilidad necesita el servidor del hub, así que no está en la vista previa.
        </p>
      ) : (
        <>
          <section className="tarjeta flex flex-wrap items-end gap-3 p-4">
            <label className="block">
              <span className="etiqueta">Desde</span>
              <input className="campo" type="date" value={desde} onChange={(e) => setDesde(e.currentTarget.value)} />
            </label>
            <label className="block">
              <span className="etiqueta">Hasta</span>
              <input className="campo" type="date" value={hasta} onChange={(e) => setHasta(e.currentTarget.value)} />
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="boton boton-secundario px-3 py-1 text-xs" onClick={() => elegir(mesDe(hoy))}>
                Este mes
              </button>
              <button type="button" className="boton boton-secundario px-3 py-1 text-xs" onClick={() => elegir(mesAnteriorDe(hoy))}>
                Mes pasado
              </button>
              <button type="button" className="boton boton-secundario px-3 py-1 text-xs" onClick={() => elegir(anioDe(hoy))}>
                Este año
              </button>
            </div>
          </section>

          {fallo ? (
            <p className="text-sm text-naranja" role="alert">
              {fallo}
            </p>
          ) : null}

          {datos ? (
            <>
              {datos.mesesCerrados.length ? (
                <p className="tarjeta p-4 text-xs text-gris">
                  Meses cerrados en este periodo: <strong className="text-blanco">{datos.mesesCerrados.join(', ')}</strong>. En
                  ellos no se registra ni se corrige nada hasta que se reabran.
                </p>
              ) : null}
              <Resumen datos={datos} />
              <CuentasPorCobrar datos={datos} />
              <Cobros datos={datos} desde={desde} hasta={hasta} />
              <Gastos datos={datos} desde={desde} hasta={hasta} alCambiar={cargar} />
              <CierreDeMes alCambiar={cargar} />
            </>
          ) : fallo ? null : (
            <p className="text-sm text-gris">Cargando…</p>
          )}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * El resumen
 * ------------------------------------------------------------------ */

/** «+$120.00 (+8.5 %) frente al periodo anterior», o que antes no había nada. */
function cambioFrente(actual: number, anterior: number): string {
  if (actual === 0 && anterior === 0) return 'Sin movimiento en los dos periodos';
  const v = variacion(actual, anterior);
  const signo = v.diferencia >= 0 ? '+' : '-';
  const pct = v.porcentaje === null ? '' : ` (${v.porcentaje > 0 ? '+' : ''}${v.porcentaje} %)`;
  return `${signo}${dolares(Math.abs(v.diferencia))}${pct} frente al periodo anterior`;
}

function Resumen({ datos }: { datos: ContabilidadDelPeriodo }) {
  const r = datos.resumen;
  const antes = datos.anterior;
  const aFavor = r.itbmsPorPagarCentavos < 0;

  return (
    <Seccion
      titulo="Resumen del periodo"
      ayuda="Flujo de caja: lo que entró y lo que salió en estas fechas. Es del pago único; lo mensual no entra aquí."
    >
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Cifra
          rotulo="Ingreso"
          valor={dolares(r.ingresoCentavos)}
          nota="Cobrado, sin ITBMS"
          cambio={cambioFrente(r.ingresoCentavos, antes.ingresoCentavos)}
        />
        <Cifra
          rotulo="Gastos"
          valor={dolares(r.gastosCentavos)}
          nota="Pagados, sin ITBMS"
          cambio={cambioFrente(r.gastosCentavos, antes.gastosCentavos)}
        />
        <Cifra
          rotulo="Resultado de caja"
          valor={dolares(r.resultadoCentavos)}
          nota="Ingreso menos gastos"
          cambio={cambioFrente(r.resultadoCentavos, antes.resultadoCentavos)}
          resaltar={r.resultadoCentavos > 0}
        />
        <Cifra
          rotulo={aFavor ? 'ITBMS a favor' : 'ITBMS por pagar'}
          valor={dolares(Math.abs(r.itbmsPorPagarCentavos))}
          nota="Cobrado menos pagado (orientativo)"
        />
      </dl>

      <p className="mt-4 text-xs leading-relaxed text-gris">
        Cobrado con ITBMS: <strong className="text-blanco">{dolares(r.cobradoCentavos)}</strong>, de los cuales{' '}
        {dolares(r.itbmsCobradoCentavos)} son ITBMS. El ITBMS que traían las facturas de los gastos: {dolares(r.itbmsPagadoCentavos)}.
        Lo que se declara a la DGI lo decide la contadora; esto es para ver el pulso del mes.
      </p>

      {r.cobradoPorMetodo.length || r.gastosPorCategoria.length ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Desglose
            titulo="Cobrado por método"
            filas={r.cobradoPorMetodo.map((m) => ({ nombre: NOMBRE_METODO[m.metodo as Metodo] ?? m.metodo, centavos: m.centavos }))}
          />
          <Desglose
            titulo="Gastos por categoría"
            filas={r.gastosPorCategoria.map((g) => ({ nombre: NOMBRE_CATEGORIA[g.categoria], centavos: g.centavos }))}
          />
        </div>
      ) : null}
    </Seccion>
  );
}

function Cifra({
  rotulo,
  valor,
  nota,
  cambio,
  resaltar = false,
}: {
  rotulo: string;
  valor: string;
  nota: string;
  cambio?: string;
  resaltar?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-gris">{rotulo}</dt>
      <dd className={`mt-1 text-2xl font-semibold ${resaltar ? 'text-naranja' : 'text-blanco'}`}>{valor}</dd>
      <p className="mt-1 text-xs text-gris">{nota}</p>
      {cambio ? <p className="mt-0.5 text-xs text-gris">{cambio}</p> : null}
    </div>
  );
}

function Desglose({ titulo, filas }: { titulo: string; filas: { nombre: string; centavos: number }[] }) {
  if (!filas.length) return null;
  return (
    <div>
      <h3 className="antetitulo">{titulo}</h3>
      <ul className="mt-2 divide-y divide-white/10 text-sm">
        {filas.map((f) => (
          <li key={f.nombre} className="flex justify-between py-1.5">
            <span>{f.nombre}</span>
            <span className="font-semibold text-blanco">{dolares(f.centavos)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Las cuentas por cobrar
 * ------------------------------------------------------------------ */

function CuentasPorCobrar({ datos }: { datos: ContabilidadDelPeriodo }) {
  const a = datos.antiguedad;

  return (
    <Seccion
      titulo="Cuentas por cobrar"
      ayuda={`Propuestas aceptadas que no se han cobrado enteras, con ITBMS, al ${datos.hoy}. La antigüedad corre desde que se aceptaron y no depende del periodo de arriba.`}
    >
      {a.cuentas.length === 0 ? (
        <p className="text-sm text-gris">Nadie debe nada ahora mismo.</p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {TRAMOS.map((t) => (
              <div key={t}>
                <dt className="text-xs text-gris">{NOMBRE_TRAMO[t]}</dt>
                <dd className={`mt-1 text-lg font-semibold ${t === 'mas-90' && a.porTramo[t] > 0 ? 'text-naranja' : 'text-blanco'}`}>
                  {dolares(a.porTramo[t])}
                </dd>
              </div>
            ))}
            <div>
              <dt className="text-xs text-gris">Total pendiente</dt>
              <dd className="mt-1 text-lg font-semibold text-blanco">{dolares(a.pendienteCentavos)}</dd>
            </div>
          </dl>

          <ul className="mt-4 divide-y divide-white/10 text-sm">
            {a.cuentas.map((c) => (
              <li key={c.numero} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                <span className="font-semibold text-blanco">{c.negocio || 'Sin nombre'}</span>
                <span className="text-xs text-gris">{c.numero} · aceptada el {c.desde}</span>
                <Pastilla encendida={c.tramo === 'mas-90'}>{c.dias} días</Pastilla>
                <span className="ml-auto text-xs text-gris">
                  debe {dolares(c.debidoCentavos)} · cobrado {dolares(c.cobradoCentavos)}
                </span>
                <span className="font-semibold text-blanco">{dolares(c.pendienteCentavos)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Seccion>
  );
}

/* ------------------------------------------------------------------ *
 * Los cobros del periodo
 * ------------------------------------------------------------------ */

function Cobros({ datos, desde, hasta }: { datos: ContabilidadDelPeriodo; desde: string; hasta: string }) {
  return (
    <Seccion
      titulo="Cobros del periodo"
      ayuda="Lo que entró, con ITBMS. Se registran desde «Cobros» en el historial; aquí solo se leen."
      accion={
        datos.cobros.length ? (
          <button
            type="button"
            className="boton boton-secundario px-3 py-1 text-xs"
            onClick={() => descargarTexto(cobrosACsv(datos.cobros), `cobros-${desde}-a-${hasta}.csv`)}
          >
            Exportar CSV
          </button>
        ) : undefined
      }
    >
      {datos.cobros.length ? (
        <ul className="divide-y divide-white/10 text-sm">
          {datos.cobros.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
              <span className="text-xs text-gris">{c.fecha}</span>
              <span className={`font-semibold ${c.centavos < 0 ? 'text-gris line-through' : 'text-blanco'}`}>{dolares(c.centavos)}</span>
              <span>{c.negocio || 'Sin nombre'}</span>
              <span className="text-xs text-gris">{c.propuesta} · {NOMBRE_METODO[c.metodo as Metodo] ?? c.metodo}</span>
              {c.referencia ? <span className="text-xs text-gris">ref. {c.referencia}</span> : null}
              {c.corrigeA !== null ? <span className="text-xs text-gris">corrige el cobro #{c.corrigeA}</span> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gris">No hay cobros en estas fechas.</p>
      )}
    </Seccion>
  );
}

/* ------------------------------------------------------------------ *
 * Los gastos
 * ------------------------------------------------------------------ */

function Gastos({
  datos,
  desde,
  hasta,
  alCambiar,
}: {
  datos: ContabilidadDelPeriodo;
  desde: string;
  hasta: string;
  alCambiar: () => Promise<void>;
}) {
  const [monto, setMonto] = useState('');
  const [itbms, setItbms] = useState('');
  const [categoria, setCategoria] = useState<Categoria>('servidores');
  const [proveedor, setProveedor] = useState('');
  const [fecha, setFecha] = useState(hoyISO());
  const [referencia, setReferencia] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [fallo, setFallo] = useState('');

  const yaCorregidos = new Set(datos.gastos.map((g) => g.corrigeA).filter((x): x is number => x !== null));

  const registrar = async () => {
    const centavos = aCentavos(monto);
    if (centavos === null) {
      setFallo('Escribe el importe sin ITBMS, por ejemplo 20 o 20.50.');
      return;
    }
    const itbmsCentavos = itbms.trim() === '' ? 0 : aCentavos(itbms);
    if (itbmsCentavos === null) {
      setFallo('El ITBMS no es un importe válido. Déjalo vacío si la factura no lo trae.');
      return;
    }
    setOcupado(true);
    try {
      await almacenContabilidad.registrarGasto({ centavos, itbmsCentavos, fecha, categoria, proveedor, referencia });
      setMonto('');
      setItbms('');
      setProveedor('');
      setReferencia('');
      setFallo('');
      await alCambiar();
    } catch (error) {
      setFallo(mensajeDe(error, 'No se pudo registrar el gasto.'));
    } finally {
      setOcupado(false);
    }
  };

  const corregir = async (id: number) => {
    const motivo = window.prompt('¿Por qué se corrige este gasto? Queda escrito en el libro.');
    if (!motivo?.trim()) return;
    try {
      await almacenContabilidad.corregirGasto(id, motivo);
      setFallo('');
      await alCambiar();
    } catch (error) {
      setFallo(mensajeDe(error, 'No se pudo corregir el gasto.'));
    }
  };

  return (
    <Seccion
      titulo="Gastos"
      ayuda="Lo que PanaClaw paga. Lo escrito no se edita ni se elimina: un error se corrige con un asiento contrario que queda a la vista."
      accion={
        datos.gastos.length ? (
          <button
            type="button"
            className="boton boton-secundario px-3 py-1 text-xs"
            onClick={() => descargarTexto(gastosACsv(datos.gastos), `gastos-${desde}-a-${hasta}.csv`)}
          >
            Exportar CSV
          </button>
        ) : undefined
      }
    >
      {datos.gastos.length ? (
        <ul className="divide-y divide-white/10 text-sm">
          {datos.gastos.map((g) => (
            <li key={g.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
              <span className="text-xs text-gris">{g.fecha}</span>
              <span className={`font-semibold ${g.centavos < 0 ? 'text-gris line-through' : 'text-blanco'}`}>{dolares(g.centavos)}</span>
              {g.itbmsCentavos !== 0 ? <span className="text-xs text-gris">+ ITBMS {dolares(g.itbmsCentavos)}</span> : null}
              <span>{g.proveedor}</span>
              <span className="text-xs text-gris">{NOMBRE_CATEGORIA[g.categoria]}</span>
              {g.referencia ? <span className="text-xs text-gris">ref. {g.referencia}</span> : null}
              {g.corrigeA !== null ? <span className="text-xs text-gris">corrige el gasto #{g.corrigeA}: {g.motivo}</span> : null}
              <span className="ml-auto text-xs text-gris">{g.registradoPor}</span>
              {g.corrigeA === null && !yaCorregidos.has(g.id) ? (
                <button type="button" className="boton boton-fantasma px-2 py-1 text-xs" onClick={() => void corregir(g.id)}>
                  Corregir
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gris">No hay gastos en estas fechas.</p>
      )}

      <form
        className="mt-5 grid gap-3 sm:grid-cols-6"
        onSubmit={(e) => {
          e.preventDefault();
          void registrar();
        }}
      >
        <label className="block">
          <span className="etiqueta">Importe sin ITBMS</span>
          <input className="campo" inputMode="decimal" value={monto} onChange={(e) => setMonto(e.currentTarget.value)} placeholder="0.00" />
        </label>
        <label className="block">
          <span className="etiqueta">ITBMS</span>
          <input className="campo" inputMode="decimal" value={itbms} onChange={(e) => setItbms(e.currentTarget.value)} placeholder="0.00" />
        </label>
        <label className="block">
          <span className="etiqueta">Categoría</span>
          <select className="campo" value={categoria} onChange={(e) => setCategoria(e.currentTarget.value as Categoria)}>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c} className="bg-negro">
                {NOMBRE_CATEGORIA[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="etiqueta">Proveedor</span>
          <input className="campo" value={proveedor} onChange={(e) => setProveedor(e.currentTarget.value)} placeholder="A quién se le pagó" />
        </label>
        <label className="block">
          <span className="etiqueta">Fecha</span>
          <input className="campo" type="date" value={fecha} onChange={(e) => setFecha(e.currentTarget.value)} />
        </label>
        <div className="flex items-end">
          <button type="submit" className="boton w-full" disabled={ocupado}>
            Registrar gasto
          </button>
        </div>
        <label className="block sm:col-span-6">
          <span className="etiqueta">Referencia (opcional)</span>
          <input className="campo" value={referencia} onChange={(e) => setReferencia(e.currentTarget.value)} placeholder="Número de factura o comprobante" />
        </label>
      </form>

      {fallo ? (
        <p className="mt-3 text-xs text-naranja" role="alert">
          {fallo}
        </p>
      ) : null}
    </Seccion>
  );
}

/* ------------------------------------------------------------------ *
 * El cierre de mes
 * ------------------------------------------------------------------ */

/**
 * Cerrar un mes: lista de chequeo, bloqueo y rastro.
 *
 * Con el mes cerrado no se registra ni se corrige nada en cobros ni en gastos, y
 * lo que se mandó a la contadora no cambia debajo de ella. Se reabre, pero con un
 * motivo que queda escrito, junto a quién y cuándo.
 */
function CierreDeMes({ alCambiar }: { alCambiar: () => Promise<void> }) {
  const [mes, setMes] = useState(mesDeFecha(mesAnteriorDe(hoyISO()).desde));
  const [estado, setEstado] = useState<EstadoDeCierre | null>(null);
  const [nota, setNota] = useState('');
  const [fallo, setFallo] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setEstado(await almacenContabilidad.cierre(mes));
      setFallo('');
    } catch (error) {
      setEstado(null);
      setFallo(mensajeDe(error, 'No se pudo leer el estado del mes.'));
    }
  }, [mes]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const accion = async (hacer: () => Promise<EstadoDeCierre>) => {
    setOcupado(true);
    try {
      setEstado(await hacer());
      setFallo('');
      await alCambiar();
    } catch (error) {
      setFallo(mensajeDe(error, 'No se pudo completar la acción.'));
    } finally {
      setOcupado(false);
    }
  };

  const cerrar = () => {
    if (!confirm(`¿Cerrar ${mes}? En ese mes ya no se podrá registrar ni corregir nada hasta que se reabra.`)) return;
    void accion(() => almacenContabilidad.cerrarMes(mes, nota));
  };

  const reabrir = () => {
    const motivo = window.prompt('¿Por qué se reabre el mes? Queda escrito en el historial.');
    if (!motivo?.trim()) return;
    void accion(() => almacenContabilidad.reabrirMes(mes, motivo));
  };

  const impide = estado?.chequeo.some((c) => c.bloquea && !c.ok) ?? true;

  return (
    <Seccion
      titulo="Cierre de mes"
      ayuda="Cierra un mes cuando ya está revisado. Cerrado, no admite cobros ni gastos nuevos ni correcciones, y lo que se mandó a la contadora no cambia."
    >
      <label className="block max-w-xs">
        <span className="etiqueta">Mes</span>
        <input className="campo" type="month" value={mes} onChange={(e) => setMes(e.currentTarget.value)} />
      </label>

      {estado ? (
        <>
          <p className="mt-4 text-sm">
            <Pastilla encendida={estado.cerrado}>{estado.cerrado ? 'Cerrado' : 'Abierto'}</Pastilla>
          </p>

          <ul className="mt-3 space-y-2 text-sm" aria-label="Lista de chequeo">
            {estado.chequeo.map((c) => (
              <li key={c.clave} className="flex flex-wrap gap-x-2">
                <span className={c.ok ? 'font-semibold text-blanco' : 'font-semibold text-naranja'}>
                  {c.ok ? 'Listo' : c.bloquea ? 'Impide' : 'Aviso'}
                </span>
                <span>{c.titulo}.</span>
                <span className="text-xs text-gris">{c.detalle}</span>
              </li>
            ))}
          </ul>

          {estado.cerrado && estado.resumenAlCerrar ? (
            <p className="mt-4 text-xs leading-relaxed text-gris">
              Al cerrar: ingreso {dolares(estado.resumenAlCerrar.ingresoCentavos)}, gastos{' '}
              {dolares(estado.resumenAlCerrar.gastosCentavos)}, resultado de caja{' '}
              {dolares(estado.resumenAlCerrar.resultadoCentavos)}.
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-end gap-3">
            {estado.cerrado ? (
              <button type="button" className="boton boton-secundario" disabled={ocupado} onClick={reabrir}>
                Reabrir el mes
              </button>
            ) : (
              <>
                <label className="block min-w-[14rem] flex-1">
                  <span className="etiqueta">Nota del cierre (opcional)</span>
                  <input className="campo" value={nota} onChange={(e) => setNota(e.currentTarget.value)} />
                </label>
                <button type="button" className="boton" disabled={ocupado || impide} onClick={cerrar}>
                  Cerrar el mes
                </button>
              </>
            )}
          </div>

          {estado.historial.length ? (
            <ul className="mt-4 divide-y divide-white/10 text-xs text-gris">
              {estado.historial.map((h) => (
                <li key={h.id} className="py-1.5">
                  {h.accion === 'cerrar' ? 'Cerrado' : 'Reabierto'} el {h.en.slice(0, 10)} por {h.por}
                  {h.motivo ? ` — ${h.motivo}` : ''}
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}

      {fallo ? (
        <p className="mt-3 text-xs text-naranja" role="alert">
          {fallo}
        </p>
      ) : null}
    </Seccion>
  );
}
