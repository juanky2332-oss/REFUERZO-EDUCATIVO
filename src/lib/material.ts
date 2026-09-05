/**
 * Separación entre el cuadernillo del alumno y el solucionario del profesor.
 *
 * La regla 28 dice que nunca deben mezclarse. En lugar de confiar en que la
 * interfaz "no pinte" las soluciones, aquí se construye un objeto del que las
 * soluciones han desaparecido: la vista del alumno no las recibe, así que no
 * puede filtrarlas ni al imprimir ni al copiar.
 */

import type { MaterialGenerado, PreguntaMaterial } from '@/lib/ai/schemas';

export type PreguntaAlumno = Omit<PreguntaMaterial, 'solucion' | 'criterioCorreccion'>;

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

export function paraAlumno(material: MaterialGenerado): MaterialAlumno {
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

export function puntuacionTotal(material: MaterialGenerado): number {
  return Math.round(material.preguntas.reduce((s, p) => s + p.puntuacion, 0) * 100) / 100;
}
