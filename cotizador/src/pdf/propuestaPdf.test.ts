import { mkdirSync, writeFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

import { itemDe } from '../dominio/catalogo';
import { lineaDesde } from '../dominio/propuesta';
import type { Linea, Propuesta } from '../dominio/tipos';
import { generarPdf, nombreDeArchivo } from './propuestaPdf';

/**
 * Con `MUESTRA_PDF=1 npm test` los PDF de prueba quedan en `muestras/` para
 * poder abrirlos y revisar el diseño a ojo, que es lo único que detecta un
 * bloque descuadrado.
 */
const GUARDAR = process.env.MUESTRA_PDF === '1';

let n = 0;
const linea = (id: string, cambios: Partial<Linea> = {}): Linea => {
  const item = itemDe(id);
  if (!item) throw new Error(`No existe el item ${id}`);
  return { ...lineaDesde(item, `l${++n}`), ...cambios };
};

const propuesta = (lineas: Linea[], cambios: Partial<Propuesta> = {}): Propuesta => ({
  numero: 'PROP-2026-0042',
  fecha: '2026-08-23',
  asesor: 'Ana',
  necesita: 'Vende repuestos por WhatsApp y quiere dejar de mandar clientes a un perfil de Instagram.',
  catalogoVersion: 'prueba',
  cliente: {
    negocio: 'Repuestos El Chorrillo',
    contacto: 'Luis Ortega',
    whatsapp: '+507 6000-0000',
    correo: 'luis@repuestos.com',
    ciudad: 'Ciudad de Panamá',
  },
  lineas,
  condiciones: { validezDias: 15, noIncluyeExtra: [], observaciones: '' },
  ...cambios,
});

/**
 * El texto que el PDF lleva dentro.
 *
 * El documento se genera comprimido, así que mirar los bytes a secas no
 * encuentra nada: hay que desinflar cada `stream`. Cuesta quince líneas y a
 * cambio las pruebas pueden afirmar qué DICE el documento que recibe el
 * cliente, y no solo cuántas páginas ocupa.
 */
function textoDelPdf(doc: ReturnType<typeof generarPdf>): string {
  const crudo = Buffer.from(doc.output('arraybuffer'));
  const bytes = crudo.toString('latin1');
  let texto = '';

  const marca = /stream\r?\n/g;
  let encontrado: RegExpExecArray | null;
  while ((encontrado = marca.exec(bytes))) {
    const inicio = encontrado.index + encontrado[0].length;
    const fin = bytes.indexOf('endstream', inicio);
    if (fin < 0) continue;
    try {
      texto += inflateSync(crudo.subarray(inicio, fin)).toString('latin1');
    } catch {
      texto += bytes.slice(inicio, fin);
    }
  }

  // Dentro del PDF los paréntesis delimitan las cadenas, así que los que
  // forman parte del texto van escapados. Se deshace para poder buscar lo que
  // el documento dice de verdad.
  return aUnicode(texto.replace(/\\([()])/g, '$1'));
}

/**
 * De la codificación del PDF a la del editor.
 *
 * Las fuentes incorporadas de jsPDF escriben en WinAnsi, que es Latin-1 salvo
 * en el tramo 0x80–0x9F. Ahí viven justo los caracteres que más usa esta marca:
 * el guion largo de los rangos ($80–$150), las comillas y los puntos
 * suspensivos. Sin esta tabla, una prueba que busque '$30–$60/mes' no
 * encontraría nada y habría que escribirla con el byte crudo, que no se lee.
 */
const WINANSI: Record<number, string> = {
  0x82: '‚', 0x84: '„', 0x85: '…', 0x86: '†', 0x87: '‡', 0x88: 'ˆ', 0x89: '‰',
  0x8b: '‹', 0x91: '‘', 0x92: '’', 0x93: '“', 0x94: '”', 0x95: '•', 0x96: '–',
  0x97: '—', 0x98: '˜', 0x99: '™', 0x9b: '›',
};

const aUnicode = (texto: string): string =>
  texto.replace(/[\u0080-\u009f]/g, (c) => WINANSI[c.charCodeAt(0)] ?? c);

function guardar(nombre: string, doc: ReturnType<typeof generarPdf>): void {
  if (!GUARDAR) return;
  mkdirSync('muestras', { recursive: true });
  writeFileSync(`muestras/${nombre}`, Buffer.from(doc.output('arraybuffer')));
}

describe('regla 2 · el documento no puede enseñar la suma prohibida', () => {
  it('un plan y un Care salen como dos cifras, y la suma no aparece por ningún lado', () => {
    const doc = generarPdf(propuesta([linea('web-corporate'), linea('care-base')]));
    const texto = textoDelPdf(doc);

    expect(texto).toContain('$850');
    expect(texto).toContain('$35/mes');
    // $850 + $35 = $885. Ese número no existe, y el PDF no puede insinuarlo.
    expect(texto).not.toContain('$885');
    guardar('web-mas-care.pdf', doc);
  });

  it('los dos totales van bajo rótulos distintos', () => {
    const texto = textoDelPdf(generarPdf(propuesta([linea('web-launch'), linea('care-pro')])));
    expect(texto).toContain('PAGO ÚNICO');
    expect(texto).toContain('CADA MES');
  });

  it('sin parte mensual no se inventa un bloque vacío', () => {
    const texto = textoDelPdf(generarPdf(propuesta([linea('web-start')])));
    expect(texto).toContain('PAGO ÚNICO');
    expect(texto).not.toContain('CADA MES');
  });
});

describe('regla 8 · los rangos se citan enteros', () => {
  it('un mensual con rango sale con sus dos extremos', () => {
    const texto = textoDelPdf(
      generarPdf(propuesta([linea('aud-medio'), linea('seg-protegida')])),
    );
    expect(texto).toContain('$30\u2013$60/mes');
    expect(texto).not.toMatch(/desde \$30/);
  });
});

describe('la firma de la marca', () => {
  it('«qué NO incluye» va ANTES del precio, no en una nota al pie', () => {
    const texto = textoDelPdf(generarPdf(propuesta([linea('web-corporate')])));
    const noIncluye = texto.indexOf('QUÉ NO INCLUYE');
    const precio = texto.indexOf('PAGO ÚNICO');
    expect(noIncluye).toBeGreaterThan(-1);
    expect(precio).toBeGreaterThan(-1);
    expect(noIncluye).toBeLessThan(precio);
  });

  it('en Start avisa solo de que no hay panel de edición', () => {
    expect(textoDelPdf(generarPdf(propuesta([linea('web-start')])))).toContain(
      'panel para editar tu contenido',
    );
  });

  it('con eBot publica los dos costos de terceros y dice que no los cobra PanaClaw', () => {
    const texto = textoDelPdf(generarPdf(propuesta([linea('web-launch'), linea('ebot')])));
    expect(texto).toContain('A TERCEROS');
    expect(texto).toContain('Cloudflare');
    expect(texto).toContain('$5 al mes');
    expect(texto).toContain('no lo cobra PanaClaw');
  });

  it('con Care y Seguridad juntas imprime la frase de frontera', () => {
    const texto = textoDelPdf(
      generarPdf(propuesta([linea('care-base'), linea('aud-chico'), linea('seg-protegida')])),
    );
    expect(texto).toContain('Care mantiene la infraestructura');
  });

  it('el plazo dice desde cuándo cuenta', () => {
    expect(textoDelPdf(generarPdf(propuesta([linea('web-commerce')])))).toContain(
      'El reloj empieza cuando recibimos tu material',
    );
  });
});

describe('la maquetación aguanta', () => {
  /**
   * Dos páginas, y no una.
   *
   * Una propuesta de PanaClaw lleva dentro la lista de exclusiones, el plazo
   * con su «desde cuándo cuenta», las rondas y las condiciones de cancelación.
   * Eso no cabe en una cara a un cuerpo de letra que se pueda leer, y la
   * alternativa —recortarlo o encogerlo— sería quitarle al documento
   * exactamente lo que lo distingue del presupuesto de la agencia de al lado.
   *
   * Lo que sí se vigila es que no crezca sin darse cuenta: si un día la
   * propuesta más simple del catálogo pasa de dos páginas, algo se ha colado.
   */
  it('la propuesta más simple ocupa dos páginas y no más', () => {
    for (const id of ['web-start', 'aud-medio', 'diagnostico']) {
      const doc = generarPdf(propuesta([linea(id)]));
      expect(doc.getNumberOfPages(), id).toBeLessThanOrEqual(2);
    }
    guardar('corta.pdf', generarPdf(propuesta([linea('web-start')])));
  });

  it('una propuesta con todo el catálogo se reparte sin perder el pie', () => {
    const doc = generarPdf(
      propuesta(
        [
          linea('web-commerce'),
          linea('cap-cuentas'),
          linea('cap-panel'),
          linea('cap-reservas'),
          linea('cap-portal'),
          linea('cap-integracion'),
          linea('cap-inventario', { incluida: true }),
          linea('ronda-extra', { cantidad: 2 }),
          linea('ebot'),
          linea('aud-tienda'),
          linea('seg-blindada'),
          linea('care-business'),
          linea('diagnostico'),
        ],
        { condiciones: { validezDias: 15, noIncluyeExtra: ['Traducción al inglés'], observaciones: 'Arrancamos la semana del 1 de septiembre.' } },
      ),
    );
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
    // El pie lleva la numeración, y va en todas las páginas.
    expect(textoDelPdf(doc)).toContain(`1/${doc.getNumberOfPages()}`);
    guardar('completa.pdf', doc);
  });

  it('el nombre del archivo sale limpio de acentos y de espacios', () => {
    expect(nombreDeArchivo(propuesta([]))).toBe('Propuesta-PROP-2026-0042-Repuestos-El-Chorrillo.pdf');
  });
});
