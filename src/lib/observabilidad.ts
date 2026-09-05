/**
 * Registro estructurado.
 *
 * Se registra lo necesario para detectar fallos y medir tiempos, NUNCA el
 * contenido de la consulta ni la imagen del alumno (reglas 43 y 61).
 */

type Nivel = 'info' | 'aviso' | 'error';

export interface Evento {
  evento: string;
  ms?: number;
  fase?: string;
  codigo?: string;
  proveedor?: string;
  modelo?: string;
  /** Contadores y banderas. Nunca texto del usuario. */
  datos?: Record<string, string | number | boolean>;
}

function emitir(nivel: Nivel, e: Evento) {
  const linea = JSON.stringify({ n: nivel, t: new Date().toISOString(), ...e });
  if (nivel === 'error') console.error(linea);
  else if (nivel === 'aviso') console.warn(linea);
  else console.log(linea);
}

export const registro = {
  info: (e: Evento) => emitir('info', e),
  aviso: (e: Evento) => emitir('aviso', e),
  error: (e: Evento) => emitir('error', e),
};
