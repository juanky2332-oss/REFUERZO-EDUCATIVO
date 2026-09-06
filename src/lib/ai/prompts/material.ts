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
    'un resumen del tema. En este caso cada elemento de "preguntas" es un APARTADO del resumen: "enunciado" es el título del apartado y "solucion" es el contenido explicado de ese apartado. Pon "puntuacion": 0 en todos, porque un resumen no se puntúa.',
  ficha:
    'una ficha de trabajo con una parte breve de recordatorio teórico y actividades de aplicación.',
  test:
    'preguntas tipo test. Cada "enunciado" incluye la pregunta y cuatro opciones etiquetadas a), b), c) y d), una sola correcta. En "solucion" indica la letra correcta y por qué las otras no lo son.',
  plan_estudio:
    'un plan de estudio repartido en sesiones. OJO: cada elemento de "preguntas" es UNA SESIÓN DE TRABAJO, no un ejercicio suelto. En "enunciado" escribe el nombre de la sesión, su objetivo y qué hacer exactamente: qué repasar, qué practicar, cuántos ejercicios y cuánto tiempo dedicarle (entre 20 y 45 minutos). En "solucion" escribe cómo sabrá el alumno que esa sesión le ha salido bien, es decir qué tiene que ser capaz de hacer al terminarla. Pon "puntuacion": 0 en todas, porque un plan no se puntúa.',
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

"solucion" ES OBLIGATORIA EN TODAS. El alumno la tiene a un clic, junto a cada pregunta, para corregirse solo.
Una pregunta sin solución no le sirve de nada. No escribas "respuesta abierta" ni "depende del alumno": si la
pregunta admite varias respuestas válidas, escribe una respuesta modelo completa y di qué tiene que aparecer
en cualquier respuesta que se dé por buena.
Escribe la solución para que se entienda sola: el resultado y, en una o dos frases, cómo se llega a él. No basta
con el número suelto. Si es un cálculo, deja la operación a la vista (por ejemplo: A = b·h/2 = 6·4/2 = 12 cm²).

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

Genera exactamente ${p.numeroPreguntas} elementos en "preguntas".${
    p.diasDisponibles
      ? `

QUEDAN ${p.diasDisponibles} DÍAS HASTA EL EXAMEN. Reparte el trabajo en ese plazo de forma realista para alguien
de 12 o 13 años: sesiones cortas, lo más importante primero y las últimas sesiones dedicadas a repasar y a
comprobar que se ha aprendido, no a materia nueva.`
      : ''
  }`;
}
