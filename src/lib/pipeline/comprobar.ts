/**
 * Recálculo de las operaciones que el modelo afirma haber hecho.
 *
 * Es la diferencia entre "la IA dice que ha comprobado" y "el servidor ha
 * comprobado". Sólo cuando esto pasa se puede etiquetar una respuesta como
 * "comprobado mediante cálculo" (regla 5, nivel 2).
 */

import type { ComprobacionNumerica, ResultadoComprobacionNumerica } from '@/lib/types';
import { intentarEvaluar } from './aritmetica';

/** Tope de comprobaciones por respuesta, para acotar el trabajo por petición. */
const MAX_COMPROBACIONES = 12;

export function comprobar(c: ComprobacionNumerica): ResultadoComprobacionNumerica {
  const evaluacion = intentarEvaluar(c.expresion);

  if (!evaluacion.ok) {
    return { ...c, ok: false, valorCalculado: null, error: evaluacion.error };
  }

  // La tolerancia declarada por el modelo puede ser 0 o absurdamente pequeña
  // para valores grandes: se combina con una tolerancia relativa.
  const toleranciaAbsoluta = Math.max(c.tolerancia, 1e-9);
  const toleranciaRelativa = Math.abs(c.valorEsperado) * 1e-6;
  const margen = Math.max(toleranciaAbsoluta, toleranciaRelativa);

  const diferencia = Math.abs(evaluacion.valor - c.valorEsperado);
  const ok = diferencia <= margen;

  return {
    ...c,
    ok,
    valorCalculado: evaluacion.valor,
    error: ok ? null : `Diferencia de ${diferencia.toPrecision(4)} respecto al valor afirmado.`,
  };
}

export function comprobarLista(
  comprobaciones: ComprobacionNumerica[],
): ResultadoComprobacionNumerica[] {
  return comprobaciones.slice(0, MAX_COMPROBACIONES).map(comprobar);
}
