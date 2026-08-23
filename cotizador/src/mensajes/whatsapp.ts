/**
 * La propuesta, en un mensaje de WhatsApp.
 *
 * No es un resumen del PDF: es el mismo documento en el canal por el que de
 * verdad se cierra en Panamá. Por eso lleva las mismas secciones y en el mismo
 * orden —incluido el «qué NO incluye» antes del precio—, y se arma desde la
 * misma propuesta que genera el PDF en vez de escribirse a mano cada vez.
 *
 * El PDF va detrás, adjunto. El mensaje es lo que la persona lee de camino a
 * algún sitio, con una mano.
 */

import { EMPRESA } from '../datos/empresa';
import { PLAZO_DESDE } from '../datos/textos';
import { catalogo, itemDe } from '../dominio/catalogo';
import { esCero, formato, formatoMensual } from '../dominio/dinero';
import { fechaLarga, MONEDA_DECLARADA, sumarDias } from '../dominio/formato';
import {
  fronterasDe,
  importeDeLinea,
  noIncluyeDe,
  plazosDe,
  rondasDe,
  totalesDe,
} from '../dominio/propuesta';
import type { Propuesta } from '../dominio/tipos';

/** WhatsApp pone en negrita lo que va entre asteriscos simples. */
const fuerte = (texto: string): string => `*${texto}*`;

export function mensajeWhatsapp(propuesta: Propuesta): string {
  const totales = totalesDe(propuesta.lineas, catalogo.costosDeEbot);
  const bloques: string[] = [];

  bloques.push(
    [
      fuerte(`${EMPRESA.nombre} · Propuesta ${propuesta.numero || 'sin emitir'}`),
      `${EMPRESA.tagline}`,
      `${fechaLarga(propuesta.fecha)}${propuesta.cliente.negocio ? ` · para ${propuesta.cliente.negocio}` : ''}`,
    ].join('\n'),
  );

  if (propuesta.necesita.trim()) {
    bloques.push([fuerte('QUÉ NECESITAS'), propuesta.necesita.trim()].join('\n'));
  }

  bloques.push(
    [
      fuerte('QUÉ INCLUYE'),
      ...propuesta.lineas.map((linea) => {
        const item = itemDe(linea.itemId);
        const cantidad = linea.cantidad > 1 ? ` × ${linea.cantidad}` : '';
        const importe = linea.incluida
          ? 'incluido'
          : item?.recurrencia === 'mensual'
            ? formatoMensual(importeDeLinea(linea))
            : formato(importeDeLinea(linea));
        return `• ${linea.descripcion}${cantidad} — ${importe}`;
      }),
    ].join('\n'),
  );

  // Antes del precio, igual que en el PDF. Es la firma de la marca y el canal
  // no la cambia.
  bloques.push(
    [
      fuerte('QUÉ NO INCLUYE'),
      ...noIncluyeDe(propuesta.lineas, propuesta.condiciones.noIncluyeExtra).map((p) => `• ${p}`),
    ].join('\n'),
  );

  /*
   * Dos bloques, separados por una línea en blanco, y nunca una sola cifra.
   *
   * En un chat la tentación de juntarlos es mayor que en papel —cabe en un
   * renglón— y es donde más caro sale: un total único que incluya la
   * mensualidad se reenvía, se cita y acaba siendo lo que el cliente recuerda.
   */
  bloques.push(
    [fuerte(`PAGO ÚNICO: ${formato(totales.unico)}`), cobroDe(propuesta)].join('\n'),
  );

  if (!esCero(totales.mensual)) {
    bloques.push(
      [
        fuerte(`CADA MES: ${formatoMensual(totales.mensual)}`),
        'Opcional y sin permanencia. Se cancela cuando quieras.',
      ].join('\n'),
    );
  }

  if (totales.terceros.length) {
    bloques.push(
      [
        fuerte('A TERCEROS'),
        'Esto no lo cobra PanaClaw: son las cuentas donde vive tu eBot y las pagas tú.',
        ...totales.terceros.map((c) => `• ${c.concepto}: ${c.precioTexto} a ${c.aQuien}`),
      ].join('\n'),
    );
  }

  const plazos = plazosDe(propuesta.lineas);
  if (plazos.length) {
    bloques.push(
      [fuerte('PLAZO'), ...plazos.map((p) => `• ${p.que}: ${p.cuando}`), PLAZO_DESDE].join('\n'),
    );
  }

  const rondas = rondasDe(propuesta.lineas);
  if (rondas) {
    bloques.push(
      [
        fuerte('CAMBIOS'),
        rondas.incluidas === 0
          ? `${rondas.plan} no trae rondas de cambios. La ronda extra cuesta ${rondas.extra}.`
          : `${rondas.plan} incluye ${rondas.incluidas} ${rondas.incluidas === 1 ? 'ronda' : 'rondas'}. La ronda extra cuesta ${rondas.extra}.`,
      ].join('\n'),
    );
  }

  const fronteras = fronterasDe(propuesta.lineas);
  if (fronteras.length) {
    bloques.push([fuerte('QUÉ ES CADA COSA'), ...fronteras.map((f) => `• ${f}`)].join('\n'));
  }

  bloques.push(
    [
      `Válida hasta el ${fechaLarga(sumarDias(propuesta.fecha, propuesta.condiciones.validezDias))}.`,
      MONEDA_DECLARADA,
      ...(propuesta.condiciones.observaciones.trim()
        ? [propuesta.condiciones.observaciones.trim()]
        : []),
      `${EMPRESA.sitio.replace('https://', '')} · ${EMPRESA.horario}`,
    ].join('\n'),
  );

  return bloques.join('\n\n');
}

/** Cómo se cobra el pago único, según lo que lleve la propuesta. */
function cobroDe(propuesta: Propuesta): string {
  const cobros = [
    ...new Set(
      propuesta.lineas
        .map((l) => itemDe(l.itemId))
        .filter((i) => i?.recurrencia === 'unico')
        .map((i) => i!.cobro),
    ),
  ];
  return cobros.join(' · ');
}

/**
 * Enlace de WhatsApp con el mensaje precargado.
 *
 * Si el cliente dejó su número se abre su chat; si no, el de PanaClaw, para que
 * quien cotiza reenvíe el texto desde donde quiera.
 */
export function enlaceWhatsapp(propuesta: Propuesta): string {
  const texto = encodeURIComponent(mensajeWhatsapp(propuesta));
  const numero = numeroPanameno(propuesta.cliente.whatsapp) ?? EMPRESA.whatsappCrudo;
  return `https://wa.me/${numero}?text=${texto}`;
}

/**
 * Normaliza un número panameño al formato que espera wa.me.
 *
 * Acepta lo que la gente escribe de verdad: «6531-0721», «6531 0721»,
 * «+507 6531-0721». Los fijos de siete dígitos no llevan el 6 delante, así que
 * se descartan antes que mandar la propuesta a un número equivocado: un enlace
 * que abre una conversación con nadie falla en silencio, y este falla a la
 * vista.
 */
export function numeroPanameno(telefono: string): string | null {
  const digitos = telefono.replace(/\D/g, '');
  if (!digitos) return null;
  if (digitos.length === 8 && digitos.startsWith('6')) return `507${digitos}`;
  if (digitos.length === 11 && digitos.startsWith('5076')) return digitos;
  return null;
}
