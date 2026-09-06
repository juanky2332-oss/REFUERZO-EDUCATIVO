/**
 * Lectura del libro o los apuntes del alumno, y uso de esa lectura.
 *
 * Aquí está la respuesta a «quiero que sigas el libro de tal editorial». Esta
 * aplicación NO conoce ningún libro de texto: no tiene una base de datos de
 * editoriales, no puede tenerla y fingir lo contrario sería inventarse unidades,
 * páginas y ejercicios de un libro que no ha visto. Eso es exactamente lo que
 * más daño hace en una herramienta de estudio, porque suena creíble.
 *
 * Lo que sí se puede hacer, y es mejor, es trabajar sobre el libro DE VERDAD:
 * el alumno fotografía las páginas de su tema, se leen una vez, y a partir de
 * ahí el método, la notación y el vocabulario de todas las respuestas salen de
 * ahí y no del criterio propio.
 */

import { REGLAS_NUCLEO } from './base';
import type { FichaLibro } from '../schemas';

export const SYSTEM_APUNTES = `${REGLAS_NUCLEO}

TU TAREA EN ESTA FASE: leer las páginas que el alumno ha fotografiado de su libro de texto o de sus apuntes y
dejarlas en una ficha que sirva de referencia para responderle después. NO resuelvas nada y NO expliques nada.

TRANSCRIBE, NO REESCRIBAS. Recoge lo que pone, con sus palabras y su notación. No lo mejores, no lo completes con
lo que tú sabes del tema y no añadas apartados que no estén. Si el libro llama a algo de una forma que a ti no te
parece la mejor, esa es justo la que hay que conservar: el alumno tiene que reconocer sus apuntes.

Si una parte no se lee con seguridad, dilo en "advertencias" en vez de rellenarla. Una transcripción con un hueco
declarado vale; una con un hueco tapado con lo que suele ponerse, no.

"contenido": lo que hay en esas páginas: definiciones, fórmulas, reglas, ejemplos resueltos. Ordenado como en el
libro. Puede ser largo; es la referencia con la que se va a trabajar después.
"metodo": cómo resuelve el libro, paso a paso. Si despeja pasando términos, dilo. Si usa un esquema o un orden
concreto, descríbelo. Si tiene un truco o una regla mnemotécnica, recógela. Esto es lo que hace que las
respuestas se parezcan a su clase y no a otra cosa.
"vocabulario": los términos y símbolos tal como los escribe el libro ("incógnita", "término independiente", "m.c.m.").
"tema": cómo titula el libro esa unidad o ese epígrafe, literalmente.
"titulo": un nombre corto para que el alumno reconozca esta ficha en una lista.

ESQUEMA JSON EXACTO:
{
  "titulo": string,
  "materia": "matematicas" | "fisica_quimica" | "biologia_geologia" | "otra" | "desconocida",
  "curso": "1eso" | "2eso" | "otro" | "desconocido",
  "tema": string,
  "contenido": string,
  "metodo": string[],
  "vocabulario": string[],
  "advertencias": string[]
}`;

/**
 * Instrucción que acompaña al libro del alumno en el resto de las fases.
 *
 * Va en el texto del sistema y no dentro del bloque no confiable: lo que se
 * envuelve es el contenido; la orden sobre qué hacer con él es nuestra.
 *
 * El equilibrio está en el último párrafo. El libro manda en la FORMA —cómo se
 * llama cada cosa, en qué orden se hacen los pasos, qué notación se usa— porque
 * es lo que el alumno tiene que reconocer y lo que le van a corregir. Pero no
 * manda en la ARITMÉTICA: si una cuenta del libro está mal, repetirla sería
 * exactamente el error que esta aplicación existe para no cometer.
 */
export const INSTRUCCION_LIBRO = `EL ALUMNO SIGUE ESTE LIBRO. A continuación va la ficha de las páginas que él mismo ha fotografiado de su libro
de texto o de sus apuntes. Es su referencia de clase y, por tanto, la tuya.

AJUSTA TU RESPUESTA A ESO:
- Usa su vocabulario y su notación, aunque tú lo dirías de otra manera.
- Sigue su método y su orden de pasos. Si el libro despeja de una forma concreta, hazlo así.
- Cíñete al alcance de esas páginas: no metas contenido de cursos posteriores que ahí no aparece.

LÍMITES, y no son negociables:
- NO cites páginas, ejercicios, unidades ni apartados que no estén en la ficha. Si te preguntan «qué pone el
  ejercicio 12 de la página 84» y eso no está aquí, di que no lo tienes y pide una foto de esa página.
- NO des por buena una cuenta del libro sin rehacerla. Si al comprobar te sale otra cosa, avísale con claridad:
  el libro puede tener una errata, y copiarla sería el peor favor que le puedes hacer.
- Si lo que te preguntan no está en estas páginas, respóndelo con tu criterio y dilo: «esto no viene en lo que me
  has subido». Nunca insinúes que sale del libro.`;

export function bloqueLibro(libro: FichaLibro): string {
  return [
    `Libro o apuntes del alumno: «${libro.titulo}»`,
    libro.tema ? `Tema tal como lo titula el libro: ${libro.tema}` : '',
    libro.contenido ? `CONTENIDO DE LAS PÁGINAS:\n${libro.contenido}` : '',
    libro.metodo.length > 0 ? `CÓMO LO HACE EL LIBRO:\n- ${libro.metodo.join('\n- ')}` : '',
    libro.vocabulario.length > 0
      ? `VOCABULARIO DEL LIBRO: ${libro.vocabulario.join(' · ')}`
      : '',
    libro.advertencias.length > 0
      ? `PARTES QUE NO SE LEÍAN BIEN (no las des por ciertas): ${libro.advertencias.join(' | ')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}
