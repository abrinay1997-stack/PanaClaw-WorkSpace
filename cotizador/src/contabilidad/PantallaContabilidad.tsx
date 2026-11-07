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
  NOMBRE_CATEGORIA,
  NOMBRE_TRAMO,
  TRAMOS,
  type Categoria,
  type ContabilidadDelPeriodo,
} from '../../../compartido/contabilidad';
import { aCentavos, dolares, NOMBRE_METODO, type Metodo } from '../../../compartido/cobros';
import { mensajeDe } from '../api/fallo';
import { ES_DEMOSTRACION } from '../api/pedir';
import { hoyISO } from '../dominio/formato';
import { Pastilla, Seccion } from '../ui/componentes';
import { almacenContabilidad } from './almacenContabilidad';

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
              <Resumen datos={datos} />
              <CuentasPorCobrar datos={datos} />
              <Gastos datos={datos} alCambiar={cargar} />
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

function Resumen({ datos }: { datos: ContabilidadDelPeriodo }) {
  const r = datos.resumen;
  const aFavor = r.itbmsPorPagarCentavos < 0;

  return (
    <Seccion
      titulo="Resumen del periodo"
      ayuda="Flujo de caja: lo que entró y lo que salió en estas fechas. Es del pago único; lo mensual no entra aquí."
    >
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Cifra rotulo="Ingreso" valor={dolares(r.ingresoCentavos)} nota="Cobrado, sin ITBMS" />
        <Cifra rotulo="Gastos" valor={dolares(r.gastosCentavos)} nota="Pagados, sin ITBMS" />
        <Cifra
          rotulo="Resultado de caja"
          valor={dolares(r.resultadoCentavos)}
          nota="Ingreso menos gastos"
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

function Cifra({ rotulo, valor, nota, resaltar = false }: { rotulo: string; valor: string; nota: string; resaltar?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-gris">{rotulo}</dt>
      <dd className={`mt-1 text-2xl font-semibold ${resaltar ? 'text-naranja' : 'text-blanco'}`}>{valor}</dd>
      <p className="mt-1 text-xs text-gris">{nota}</p>
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
 * Los gastos
 * ------------------------------------------------------------------ */

function Gastos({ datos, alCambiar }: { datos: ContabilidadDelPeriodo; alCambiar: () => Promise<void> }) {
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
