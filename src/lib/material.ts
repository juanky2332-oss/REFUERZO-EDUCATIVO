/**
 * Separación entre el cuadernillo del alumno y el solucionario del profesor.
 *
 * La regla 28 dice que nunca deben mezclarse. En lugar de confiar en que la
 * interfaz "no pinte" las soluciones, aquí se construye un objeto del que las
 * soluciones han desaparecido: la vista del alumno no las recibe, así que no
 * puede filtrarlas ni al imprimir ni al copiar.
 */

import type { MaterialGenerado, PreguntaMaterial } from '@/lib/ai/schemas';
import type { Curso, Materia, ResultadoComprobacionNumerica } from '@/lib/types';

/**
 * Material con las cuentas ya rehechas por el servidor.
 *
 * El generador escribe la solución de una tacada, sin recalcular nada. Antes
 * eso llegaba tal cual a la pantalla; ahora cada pregunta trae el resultado de
 * pasar sus operaciones por el evaluador, y la interfaz puede avisar de las que
 * no cuadran en lugar de presentarlas como buenas.
 */
export interface PreguntaVerificada extends Omit<PreguntaMaterial, 'comprobaciones'> {
  comprobaciones: ResultadoComprobacionNumerica[];
}

export interface MaterialVerificado extends Omit<MaterialGenerado, 'preguntas'> {
  preguntas: PreguntaVerificada[];
}

export type PreguntaAlumno = Omit<
  PreguntaMaterial,
  'solucion' | 'criterioCorreccion' | 'pasos' | 'comprobaciones'
>;

export interface MaterialAlumno {
  titulo: string;
  tema: string;
  curso: MaterialGenerado['curso'];
  materia: MaterialGenerado['materia'];
  instrucciones: string;
  duracionMinutos: number | null;
  preguntas: PreguntaAlumno[];
  loQueHayQueAprender: string[];
  puntuacionTotal: number;
}

export function paraAlumno(material: MaterialGenerado | MaterialVerificado): MaterialAlumno {
  return {
    titulo: material.titulo,
    tema: material.tema,
    curso: material.curso,
    materia: material.materia,
    instrucciones: material.instrucciones,
    duracionMinutos: material.duracionMinutos,
    // Se reconstruye cada pregunta campo a campo: nada de `delete` sobre una
    // copia, para que añadir un campo nuevo al esquema no lo cuele aquí sin querer.
    preguntas: material.preguntas.map((p) => ({
      numero: p.numero,
      enunciado: p.enunciado,
      puntuacion: p.puntuacion,
    })),
    loQueHayQueAprender: material.loQueHayQueAprender,
    puntuacionTotal: puntuacionTotal(material),
  };
}

export function puntuacionTotal(material: MaterialGenerado | MaterialVerificado): number {
  return Math.round(material.preguntas.reduce((s, p) => s + p.puntuacion, 0) * 100) / 100;
}

// --- Ajustes de una petición de material --------------------------------------

/**
 * Sesiones razonables para el plazo disponible, sin agobiar.
 *
 * Un plan de veinte sesiones para un examen dentro de tres días no se cumple:
 * se abandona. El tope existe por eso, no por límites de la API.
 */
export function sesionesParaPlazo(dias: number): number {
  if (dias <= 2) return 3;
  if (dias <= 5) return dias + 1;
  return Math.min(10, Math.round(dias / 1.5));
}

/** El generador exige materia y curso concretos; «no lo sé» no le vale. */
export function materiaConcreta(m: Materia): Materia {
  return m === 'desconocida' || m === 'otra' ? 'matematicas' : m;
}

export function cursoConcreto(c: Curso): Curso {
  return c === 'desconocido' || c === 'otro' ? '1eso' : c;
}
