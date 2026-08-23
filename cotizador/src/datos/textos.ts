/**
 * La prosa oficial de la marca, tal cual está publicada.
 *
 * Nada de esto se redacta aquí: cada bloque es una cita literal de un archivo
 * de `catalogo/`, y el comentario de encima dice de cuál. La razón es la misma
 * por la que `datos/precios.json` manda sobre cualquier `.md`: si el cotizador
 * escribiera su propia versión de «qué no incluye», habría dos listas y una de
 * las dos empezaría a envejecer sin que nadie lo notara — y la que va dentro de
 * una propuesta firmada es la que más caro sale que envejezca.
 *
 * **Al cambiar cualquier archivo de `catalogo/`, revisar este.** Está anotado
 * en `operacion/sincronizacion.md`.
 */

/* ------------------------------------------------------------------ *
 * catalogo/02-capacidades.md — «Las seis»
 *
 * Se describen por lo que consigue el cliente, nunca por con qué se
 * construyen. Estas descripciones son las oficiales y van tal cual.
 * ------------------------------------------------------------------ */

export const QUE_CONSIGUE: Record<string, string> = {
  integracion: 'Tu web y el programa que ya usas dejan de vivir por separado',
  cuentas: 'Cada persona entra con su clave y ve solo lo que le corresponde',
  inventario: 'El stock se descuenta solo y dejas de vender lo que no tienes',
  reservas: 'Tus clientes reservan solos, sin llamarte y sin pisarse el horario',
  panel: 'Ves tus números y gestionas tu negocio desde una sola pantalla',
  portal: 'Cada cliente entra y consulta lo suyo sin escribirte para preguntar',
};

/* ------------------------------------------------------------------ *
 * catalogo/01-webs.md — qué consigue el cliente con cada plan
 *
 * Derivado de `secciones` y `editablePorCliente` de `datos/precios.json`, pero
 * escrito y no compuesto: «7 a medida» es un dato, no una frase, y pegarle
 * «secciones» detrás produce «7 a medida secciones».
 *
 * Va SEPARADO de `paraQuien`, que es el otro texto que el listado trae por
 * plan. `paraQuien` dice a quién se le vende —«Sustituye al WordPress de las
 * agencias»— y eso es posicionamiento interno: sirve para elegir el plan y no
 * para imprimirlo en una propuesta con el nombre del cliente arriba. Lo de aquí
 * es lo que sí sale en el documento.
 * ------------------------------------------------------------------ */

export const QUE_CONSIGUE_PLAN: Record<string, string> = {
  start: '4–5 secciones. Los cambios se los pides a PanaClaw',
  launch: '7 secciones a medida. Los cambios se los pides a PanaClaw',
  corporate: 'Hasta 10 páginas, con panel para editar tu contenido sin llamar a nadie',
  commerce: 'Todo lo de Corporate, más la tienda para cobrar en línea',
};

/* ------------------------------------------------------------------ *
 * catalogo/07-condiciones.md — «Qué no incluye ningún precio del catálogo»
 * ------------------------------------------------------------------ */

export const NO_INCLUYE_SIEMPRE: readonly string[] = [
  'Escribir los textos de tu negocio desde cero',
  'Sesión de fotos y licencias de imágenes de pago',
  'Posicionamiento en Google: entregamos el sitio listo para que Google lo entienda, que es la mitad del trabajo; la otra mitad es tiempo y contenido, y no prometemos posiciones',
];

/**
 * Lo que se añade a la lista según lo que lleve la propuesta.
 *
 * Va por familia y no por item porque el cliente no lee familias: lee «esto no
 * me lo van a hacer». Dos capacidades avanzadas no producen dos veces la misma
 * viñeta.
 */
export const NO_INCLUYE_POR_FAMILIA: Record<string, readonly string[]> = {
  web: ['Mantenimiento del sitio una vez entregado: eso es PanaClaw Care, y es aparte y opcional'],
  ebot: [
    'Una página web: eBot atiende tus mensajes, no reemplaza tu sitio',
    'Las cuentas de terceros donde vive: la nube y la empresa de IA se pagan aparte y no las cobra PanaClaw',
  ],
  seguridad: [
    'Mantenimiento, copias y actualizaciones: eso es PanaClaw Care',
    'Los planes de pago de filtros o de alojamiento que haga falta contratar',
  ],
  auditoria: ['Arreglar lo que el informe encuentre: la auditoría mira y te dice, reparar se cotiza aparte'],
  care: ['Protección frente a ataques: eso es el servicio de Seguridad, y es otro producto'],
  diagnostico: ['Ejecutar los cambios que recomiende el informe'],
};

/** Se añade sola cuando el plan elegido no deja al cliente editar su contenido. */
export const NO_INCLUYE_SIN_PANEL =
  'Un panel para editar tu contenido: este plan no lo lleva, los cambios los hacemos nosotros';

/* ------------------------------------------------------------------ *
 * catalogo/08-fronteras.md — las frases oficiales, con estas palabras exactas
 *
 * Se imprimen cuando la propuesta lleva dos o más de los cuatro productos
 * confundibles. No son relleno: son lo que más preguntas ahorra, y confundir
 * estos productos no produce un texto feo, produce una venta que después no se
 * puede cumplir.
 * ------------------------------------------------------------------ */

export const FRONTERAS = {
  careNoEsSeguridad:
    'Care mantiene la infraestructura —dominio, copias, actualizaciones y los cambios del mes—. ' +
    'Esto es ciberseguridad: quién entra, por dónde y qué se hace para impedirlo.',
  auditoriaNoEsDiagnostico:
    'El Diagnóstico de Ventas mira tu negocio: por qué tu sitio no vende y cómo hacer que convierta. ' +
    'La Auditoría de Seguridad mira por dónde te pueden entrar. Se parecen en la forma y en nada más.',
  auditoriaVaAparte:
    'La Auditoría de Seguridad se paga siempre, y aparte. Son dos trabajos distintos y el segundo no ' +
    'se puede hacer bien sin el primero: proteger sin haber revisado es proteger a ciegas.',
} as const;

/* ------------------------------------------------------------------ *
 * catalogo/07-condiciones.md — plazos, cambios, cancelación, Google
 * ------------------------------------------------------------------ */

/**
 * Va donde se anuncia el plazo, no en una nota al pie. La causa número uno de
 * retraso, con diferencia, es esperar los textos del cliente.
 */
export const PLAZO_DESDE =
  'El reloj empieza cuando recibimos tu material y la mitad del pago.';

export const QUE_NECESITAS_PARA_ARRANCAR =
  'Textos, imágenes y logo si ya lo tienes. Nada más. Si no tienes los textos claros, ' +
  'te ayudamos a ordenarlos en la primera conversación — escribirlos por completo es un ' +
  'trabajo aparte y se cotiza.';

export const CODIGO_TUYO =
  'Al pagar el resto, el código pasa a tu cuenta y el dominio queda a tu nombre.';

/**
 * Cancelación, en el orden decidido el 2026-08-19 por el dueño de la marca.
 *
 * El hecho no cambia; el orden sí. Dicho a secas, «el adelanto no se devuelve»
 * es lo primero que lee alguien que va a mandar dinero a gente que no conoce, y
 * deja el miedo entero encima de la mesa. Todo «no» viene con su «sí».
 */
export const CANCELACION =
  'Pagas la mitad para reservar la semana de trabajo. Si a mitad decides parar, paras: ' +
  'te entregamos lo que exista, con el código y el dominio a tu nombre. Lo que ya está ' +
  'hecho no se devuelve, pero tampoco se queda con nosotros.';

export const CANCELACION_MENSUAL =
  'Los planes mensuales se cancelan cuando quieras, sin permanencia y sin llamada de retención. ' +
  'Lo que se queda es tuyo: informes, contraseñas y configuración.';

export const TRABAJO_REMOTO =
  'Todo el trabajo es en remoto y se coordina por WhatsApp. Trabajamos con negocios de todo Panamá.';
