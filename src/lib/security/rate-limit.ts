/**
 * Límite de uso por cliente.
 *
 * Implementación de ventana deslizante en memoria del proceso. Frena el abuso
 * accidental y el consumo desbocado de IA (regla 44).
 *
 * LIMITACIÓN CONOCIDA, documentada también en el README: en Vercel cada
 * instancia serverless tiene su propia memoria, así que el límite real es por
 * instancia, no global. Para un límite estricto y compartido hay que respaldarlo
 * con un almacén externo (Upstash Redis / Vercel KV). El punto de sustitución es
 * la función `consumir`.
 */

interface Ventana {
  marcas: number[];
}

const almacen = new Map<string, Ventana>();

/** Se purga de vez en cuando para que el mapa no crezca sin límite. */
let ultimaPurga = Date.now();
const INTERVALO_PURGA_MS = 5 * 60_000;

function purgar(ahora: number, ventanaMs: number) {
  if (ahora - ultimaPurga < INTERVALO_PURGA_MS) return;
  ultimaPurga = ahora;
  for (const [clave, v] of almacen) {
    const vivas = v.marcas.filter((m) => ahora - m < ventanaMs);
    if (vivas.length === 0) almacen.delete(clave);
    else v.marcas = vivas;
  }
}

export interface ResultadoLimite {
  permitido: boolean;
  restantes: number;
  /** Segundos que faltan para poder reintentar, si se ha superado el límite. */
  reintentarEn: number;
}

export function consumir(clave: string, maximo: number, ventanaMs: number): ResultadoLimite {
  const ahora = Date.now();
  purgar(ahora, ventanaMs);

  const ventana = almacen.get(clave) ?? { marcas: [] };
  ventana.marcas = ventana.marcas.filter((m) => ahora - m < ventanaMs);

  if (ventana.marcas.length >= maximo) {
    const masAntigua = Math.min(...ventana.marcas);
    almacen.set(clave, ventana);
    return {
      permitido: false,
      restantes: 0,
      reintentarEn: Math.ceil((ventanaMs - (ahora - masAntigua)) / 1000),
    };
  }

  ventana.marcas.push(ahora);
  almacen.set(clave, ventana);
  return { permitido: true, restantes: maximo - ventana.marcas.length, reintentarEn: 0 };
}

/**
 * Identifica al cliente a partir de las cabeceras del proxy.
 * No se guarda ni se registra: sólo se usa en memoria como clave del límite.
 */
export function claveCliente(req: Request): string {
  const cabeceras = req.headers;
  const ip =
    cabeceras.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    cabeceras.get('x-real-ip')?.trim() ||
    'desconocido';
  return ip;
}

/** Sólo para pruebas: reinicia el estado interno. */
export function reiniciarLimites(): void {
  almacen.clear();
  ultimaPurga = Date.now();
}
