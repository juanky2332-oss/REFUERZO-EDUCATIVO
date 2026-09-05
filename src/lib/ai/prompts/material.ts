/**
 * Prompt del generador de material (fichas, ejercicios, exámenes, resúmenes,
 * tests y planes de estudio).
 */

import { NIVEL_DESCRIPCION, type Nivel } from '@/lib/types';
import { REGLAS_NUCLEO } from './base';
import type { PeticionGenerate } from '../schemas';

const DESCRIPCION_TIPO: Record<PeticionGenerate['tipo'], string> = {
  ejercicios:
    'una tanda de ejercicios de práctica, ordenados de menor a mayor dificultad, sobre el tema indicado.',
  examen:
    'un examen realista de aula, con la puntuación de cada pregunta sumando 10 puntos en total, mezclando preguntas de aplicación directa y algún problema. Sin preguntas trampa.',
  resumen:
    'un resumen del tema. En este caso cada "pregunta" es un apartado del resumen: el campo "enunciado" es el título del apartado y "solucion" es el contenido explicado del apartado.',
  ficha:
    'una ficha de trabajo con una parte breve de recordatorio teórico y actividades de aplicación.',
  test:
    'preguntas tipo test. Cada "enunciado" incluye la pregunta y cuatro opciones etiquetadas a), b), c) y d), una sola correcta. En "solucion" indica la letra correcta y por qué las otras no lo son.',
  plan_estudio:
    'un plan de estudio por sesiones. Cada "pregunta" es una sesión: el "enunciado" describe qué hacer en esa sesión y "solucion" indica cómo saber si la sesión ha ido bien.',
};

export function systemMaterial(p: PeticionGenerate): string {
  const n = NIVEL_DESCRIPCION[p.nivel as Nivel];

  return `${REGLAS_NUCLEO}

TU TAREA: generar ${DESCRIPCION_TIPO[p.tipo]}

El material es para ${p.curso === '1eso' ? '1.º de ESO' : p.curso === '2eso' ? '2.º de ESO' : 'Educación Secundaria Obligatoria'},
nivel de adaptación ${p.nivel} (${n.titulo}: ${n.detalle}).

REGLAS DEL MATERIAL:
- Contenido ORIGINAL. No reproduzcas ejercicios de una editorial concreta ni digas de qué libro o página sale algo.
- Enunciados claros, sin dobles sentidos, sin trampas y con todos los datos necesarios para resolverlos.
- Dificultad graduada: las primeras preguntas deben poder hacerlas casi todos; las últimas, distinguir.
- Todo ejercicio numérico DEBE ser resoluble con los datos que das, y su solución debe ser correcta: resuélvelo
  mentalmente antes de escribirlo y comprueba el resultado.
- Usa números que salgan redondos siempre que se pueda, para que el alumno se centre en el procedimiento.
- Escribe las matemáticas en texto plano (x = 4, 3/4, x^2, 25 m/s), nunca en LaTeX.
- No cites normativa, decretos ni criterios oficiales de evaluación. "criterioCorreccion" es una orientación
  didáctica tuya sobre cómo repartir la puntuación, no un criterio oficial.

"loQueHayQueAprender": la lista de lo imprescindible del tema (conceptos, fórmulas, procedimientos y
vocabulario). Es el apartado "LO QUE TENGO QUE APRENDER SÍ O SÍ" que verá el alumno.
"notasDidacticas": observaciones para el profesorado o la familia: errores típicos, qué mirar, qué reforzar.

ESQUEMA JSON EXACTO:
{
  "titulo": string,
  "materia": "matematicas" | "fisica_quimica" | "biologia_geologia" | "otra" | "desconocida",
  "curso": "1eso" | "2eso" | "otro" | "desconocido",
  "tema": string,
  "instrucciones": string,
  "duracionMinutos": number | null,
  "preguntas": [{ "numero": number, "enunciado": string, "puntuacion": number, "solucion": string, "criterioCorreccion": string }],
  "loQueHayQueAprender": string[],
  "notasDidacticas": string[]
}

Genera exactamente ${p.numeroPreguntas} elementos en "preguntas".`;
}
