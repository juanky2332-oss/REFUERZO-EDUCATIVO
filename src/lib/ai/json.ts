/**
 * Extracción tolerante de JSON devuelto por un modelo.
 *
 * Aunque se pida "modo JSON", conviene tolerar vallas de código o texto
 * alrededor. Lo que NO se hace nunca es inventar campos: si no hay un objeto
 * JSON válido, se devuelve null y la capa superior decide qué contar al usuario.
 */

export function extraerObjetoJSON(texto: string): unknown | null {
  const limpio = texto
    .replace(/^﻿/, '')
    .replace(/```json\s*/gi, '')
    .replace(/```/g, '')
    .trim();

  const intentos = [limpio, recortarAlObjeto(limpio)];

  for (const intento of intentos) {
    if (!intento) continue;
    try {
      const valor: unknown = JSON.parse(intento);
      if (valor && typeof valor === 'object') return valor;
    } catch {
      // se prueba el siguiente candidato
    }
  }
  return null;
}

/**
 * Recorta desde la primera llave de apertura hasta su cierre equilibrado,
 * respetando cadenas y escapes. Sirve para respuestas con texto sobrante.
 */
function recortarAlObjeto(texto: string): string | null {
  const inicio = texto.indexOf('{');
  if (inicio === -1) return null;

  let profundidad = 0;
  let enCadena = false;
  let escapado = false;

  for (let i = inicio; i < texto.length; i++) {
    const c = texto[i];

    if (enCadena) {
      if (escapado) escapado = false;
      else if (c === '\\') escapado = true;
      else if (c === '"') enCadena = false;
      continue;
    }

    if (c === '"') enCadena = true;
    else if (c === '{') profundidad++;
    else if (c === '}') {
      profundidad--;
      if (profundidad === 0) return texto.slice(inicio, i + 1);
    }
  }
  return null;
}
