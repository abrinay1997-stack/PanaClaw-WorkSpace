/**
 * La plantilla de textos del equipo: qué viaja por el cable.
 *
 * Los textos en sí —sus claves, sus originales y cómo se validan— viven en
 * `cotizador/src/dominio/textos.ts`, y el servidor importa de allí. Aquí solo está
 * la forma de lo que se intercambia.
 */

/** Quién cambió cada texto de la plantilla y cuándo. */
export interface EdicionDeTexto {
  clave: string;
  por: string;
  en: string;
}

export interface PlantillaDeTextos {
  /** Solo lo que se cambió respecto al original. Lo que falta vale el original. */
  textos: Record<string, string>;
  ediciones: EdicionDeTexto[];
}
