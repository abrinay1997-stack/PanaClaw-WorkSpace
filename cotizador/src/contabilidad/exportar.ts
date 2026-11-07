/**
 * Los libros, bajados a un archivo para la contadora.
 *
 * Una fila por asiento, con las correcciones como filas aparte y en negativo,
 * igual que están en el libro: quien reciba el archivo ve lo mismo que ve el
 * hub, no una versión «limpia» donde los errores desaparecieron. Los importes
 * van en dólares con dos decimales y punto, que es como Excel los entiende en
 * Panamá.
 */

import { NOMBRE_CATEGORIA, type CobroDelPeriodo, type Gasto } from '../../../compartido/contabilidad';
import { NOMBRE_METODO, type Metodo } from '../../../compartido/cobros';
import { filasACsv } from '../ui/csv';

/** Centavos como `1234.50`, sin símbolo ni separador de miles. */
export const importeCsv = (centavos: number): string => (centavos / 100).toFixed(2);

export function gastosACsv(gastos: readonly Gasto[]): string {
  return filasACsv(
    ['Fecha', 'Proveedor', 'Categoría', 'Importe sin ITBMS', 'ITBMS', 'Referencia', 'Nota', 'Corrige al gasto', 'Motivo', 'Registró', 'Registrado'],
    gastos.map((g) => [
      g.fecha,
      g.proveedor,
      NOMBRE_CATEGORIA[g.categoria],
      importeCsv(g.centavos),
      importeCsv(g.itbmsCentavos),
      g.referencia,
      g.nota,
      g.corrigeA === null ? '' : String(g.corrigeA),
      g.motivo,
      g.registradoPor,
      g.registradoEn.slice(0, 19).replace('T', ' '),
    ]),
  );
}

export function cobrosACsv(cobros: readonly CobroDelPeriodo[]): string {
  return filasACsv(
    ['Fecha', 'Propuesta', 'Cliente', 'Importe con ITBMS', 'Método', 'Referencia', 'Corrige al cobro'],
    cobros.map((c) => [
      c.fecha,
      c.propuesta,
      c.negocio,
      importeCsv(c.centavos),
      NOMBRE_METODO[c.metodo as Metodo] ?? c.metodo,
      c.referencia,
      c.corrigeA === null ? '' : String(c.corrigeA),
    ]),
  );
}
