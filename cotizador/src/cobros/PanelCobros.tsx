/**
 * Los cobros de una propuesta aceptada: lo debido, lo cobrado y lo que falta.
 *
 * Es un libro y se lee como un libro: cada cobro es una línea que no se edita.
 * Un error se corrige con «Corregir», que añade un asiento contrario con su
 * motivo y deja los dos a la vista. El saldo se suma aquí con la misma función
 * que el servidor; ninguna cifra se guarda aparte.
 */

import { useCallback, useEffect, useState } from 'react';

import {
  aCentavos,
  dolares,
  METODOS,
  NOMBRE_METODO,
  type LibroDeCobros,
  type Metodo,
} from '../../../compartido/cobros';
import { mensajeDe } from '../api/fallo';
import { hoyISO } from '../dominio/formato';
import { almacenCobros } from './almacenCobros';

const VACIO: LibroDeCobros = {
  cobros: [],
  resumen: { debidoCentavos: null, cobradoCentavos: 0, pendienteCentavos: null },
  hitos: null,
};

export function PanelCobros({ numero }: { numero: string }) {
  const [libro, setLibro] = useState<LibroDeCobros>(VACIO);
  const [cargado, setCargado] = useState(false);
  const [fallo, setFallo] = useState('');
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState<Metodo>('yappy');
  const [fecha, setFecha] = useState(hoyISO());
  const [referencia, setReferencia] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setLibro(await almacenCobros.listar(numero));
      setFallo('');
    } catch (error) {
      setFallo(mensajeDe(error, 'No se pudieron cargar los cobros.'));
    } finally {
      setCargado(true);
    }
  }, [numero]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const { resumen } = libro;
  const sinCifra = resumen.debidoCentavos === null;

  const registrar = async () => {
    const centavos = aCentavos(monto);
    if (centavos === null) {
      setFallo('Escribe un importe válido, por ejemplo 425 o 425.50.');
      return;
    }
    setOcupado(true);
    try {
      setLibro(await almacenCobros.registrar(numero, { centavos, metodo, fecha, referencia }));
      setMonto('');
      setReferencia('');
      setFallo('');
    } catch (error) {
      setFallo(mensajeDe(error, 'No se pudo registrar el cobro.'));
    } finally {
      setOcupado(false);
    }
  };

  const corregir = async (id: number) => {
    const motivo = window.prompt('¿Por qué se corrige este cobro? Queda escrito en el libro.');
    if (!motivo?.trim()) return;
    try {
      setLibro(await almacenCobros.corregir(numero, id, motivo));
      setFallo('');
    } catch (error) {
      setFallo(mensajeDe(error, 'No se pudo corregir el cobro.'));
    }
  };

  const yaCorregidos = new Set(libro.cobros.map((c) => c.corrigeA).filter((x): x is number => x !== null));

  return (
    <div className="mt-3 rounded-lg border border-white/10 p-4" aria-label={`Cobros de ${numero}`}>
      {!cargado ? <p className="text-xs text-gris">Cargando cobros…</p> : null}

      {cargado && sinCifra ? (
        <p className="text-xs text-gris">
          Esta propuesta tiene un rango sin cerrar, así que no hay una cifra que cobrar. Cierra el
          rango y emite la versión definitiva.
        </p>
      ) : null}

      {cargado && !sinCifra ? (
        <dl className="grid grid-cols-3 gap-3 text-center">
          <Cifra rotulo="Debe (con ITBMS)" valor={dolares(resumen.debidoCentavos!)} />
          <Cifra rotulo="Cobrado" valor={dolares(resumen.cobradoCentavos)} />
          <Cifra
            rotulo="Falta"
            valor={dolares(resumen.pendienteCentavos!)}
            resaltar={resumen.pendienteCentavos! > 0}
          />
        </dl>
      ) : null}

      {libro.hitos ? (
        <ul className="mt-4 space-y-1.5 text-xs" aria-label="Etapas del pago">
          {libro.hitos.map((h) => (
            <li key={h.nombre} className="flex items-center gap-2">
              <span className={h.cubierto ? 'font-semibold text-blanco' : 'text-gris'}>
                {h.cubierto ? 'Cubierto' : 'Pendiente'}
              </span>
              <span>{h.nombre}</span>
              <span className="ml-auto font-semibold text-blanco">{dolares(h.centavos)}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {libro.cobros.length ? (
        <ul className="mt-4 divide-y divide-white/10 text-xs">
          {libro.cobros.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
              <span className="text-gris">{c.fecha}</span>
              <span className={c.centavos < 0 ? 'font-semibold text-gris line-through' : 'font-semibold text-blanco'}>
                {dolares(c.centavos)}
              </span>
              <span>{NOMBRE_METODO[c.metodo]}</span>
              {c.referencia ? <span className="text-gris">ref. {c.referencia}</span> : null}
              {c.corrigeA !== null ? (
                <span className="text-gris">corrige el cobro #{c.corrigeA}: {c.motivo}</span>
              ) : null}
              <span className="ml-auto text-gris">{c.registradoPor}</span>
              {c.corrigeA === null && !yaCorregidos.has(c.id) ? (
                <button
                  type="button"
                  className="boton boton-fantasma px-2 py-1 text-xs"
                  onClick={() => void corregir(c.id)}
                >
                  Corregir
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : cargado && !sinCifra ? (
        <p className="mt-3 text-xs text-gris">Todavía no hay cobros registrados.</p>
      ) : null}

      {cargado && !sinCifra && resumen.pendienteCentavos! > 0 ? (
        <form
          className="mt-4 grid gap-3 sm:grid-cols-5"
          onSubmit={(e) => {
            e.preventDefault();
            void registrar();
          }}
        >
          <label className="block">
            <span className="etiqueta">Importe</span>
            <input
              className="campo"
              inputMode="decimal"
              value={monto}
              onChange={(e) => setMonto(e.currentTarget.value)}
              placeholder="0.00"
            />
          </label>
          <label className="block">
            <span className="etiqueta">Método</span>
            <select className="campo" value={metodo} onChange={(e) => setMetodo(e.currentTarget.value as Metodo)}>
              {METODOS.map((m) => (
                <option key={m} value={m} className="bg-negro">
                  {NOMBRE_METODO[m]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="etiqueta">Fecha</span>
            <input className="campo" type="date" value={fecha} onChange={(e) => setFecha(e.currentTarget.value)} />
          </label>
          <label className="block">
            <span className="etiqueta">Referencia</span>
            <input
              className="campo"
              value={referencia}
              onChange={(e) => setReferencia(e.currentTarget.value)}
              placeholder="Comprobante"
            />
          </label>
          <div className="flex items-end">
            <button type="submit" className="boton w-full" disabled={ocupado}>
              Registrar cobro
            </button>
          </div>
        </form>
      ) : null}

      {fallo ? (
        <p className="mt-3 text-xs text-naranja" role="alert">
          {fallo}
        </p>
      ) : null}
    </div>
  );
}

function Cifra({ rotulo, valor, resaltar = false }: { rotulo: string; valor: string; resaltar?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-gris">{rotulo}</dt>
      <dd className={`mt-1 text-lg font-semibold ${resaltar ? 'text-naranja' : 'text-blanco'}`}>{valor}</dd>
    </div>
  );
}
