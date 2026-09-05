/**
 * Lectura de configuración desde el entorno.
 *
 * `Number(process.env.X ?? 20)` parece inofensivo y no lo es: si la variable
 * existe pero está vacía —cosa que ocurre al crearla sin valor en el panel de
 * Vercel— el operador `??` no salta, `Number('')` da 0 y el límite de uso pasa a
 * bloquear todas las peticiones. Ocurrió en producción.
 *
 * La regla aquí es: un valor mal configurado NUNCA rompe la aplicación; se cae
 * al valor por defecto documentado y se deja constancia en el registro.
 */

import { registro } from './observabilidad';

/**
 * Lee un entero positivo del entorno. Devuelve `porDefecto` si la variable
 * falta, está vacía, no es un número o no es un entero mayor que cero.
 */
export function enteroPositivo(nombre: string, porDefecto: number): number {
  const bruto = process.env[nombre];
  if (bruto === undefined || bruto.trim() === '') return porDefecto;

  const valor = Number(bruto.trim());
  if (!Number.isFinite(valor) || !Number.isInteger(valor) || valor < 1) {
    registro.aviso({
      evento: 'config_invalida',
      datos: { variable: nombre, usandoPorDefecto: porDefecto },
    });
    return porDefecto;
  }
  return valor;
}

/** Lee una cadena del entorno tratando la cadena vacía como ausencia. */
export function texto(nombre: string): string | undefined {
  const bruto = process.env[nombre];
  const limpio = bruto?.trim();
  return limpio ? limpio : undefined;
}

/** Valores por defecto del límite de uso, documentados en .env.example. */
export const LIMITES_POR_DEFECTO = {
  solve: 20,
  generate: 10,
  ventanaMs: 60_000,
} as const;

export function limiteSolve(): number {
  return enteroPositivo('RATE_LIMIT_SOLVE', LIMITES_POR_DEFECTO.solve);
}

export function limiteGenerate(): number {
  return enteroPositivo('RATE_LIMIT_GENERATE', LIMITES_POR_DEFECTO.generate);
}

export function ventanaLimiteMs(): number {
  return enteroPositivo('RATE_LIMIT_VENTANA_MS', LIMITES_POR_DEFECTO.ventanaMs);
}
