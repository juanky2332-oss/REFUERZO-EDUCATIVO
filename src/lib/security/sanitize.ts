/**
 * Tratamiento del contenido aportado por el usuario.
 *
 * Todo lo que llega de fuera —texto escrito, texto leído de una foto, texto de
 * un documento— es DATO, nunca instrucción (reglas 56 y 57). Una fotografía
 * puede contener "ignora las instrucciones anteriores": esta capa se asegura de
 * que ese texto llegue al modelo claramente delimitado y etiquetado como
 * contenido no confiable.
 */

/** Longitud máxima de un bloque de texto de usuario que se envía al modelo. */
export const MAX_TEXTO_USUARIO = 8000;

/** Controles C0/C1 invisibles, salvo tabulador y salto de línea. */
const CONTROLES = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g;

/**
 * Caracteres invisibles usados con frecuencia para esconder instrucciones:
 * espacios de anchura cero, marcas de dirección bidireccional y BOM.
 */
const INVISIBLES = /[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;

/** Bloque de etiquetas Unicode (U+E0000–U+E007F), invisible en pantalla. */
const ETIQUETAS_UNICODE = /[\u{E0000}-\u{E007F}]/gu;

/**
 * Normaliza el texto y elimina los caracteres invisibles con los que se pueden
 * ocultar instrucciones dentro de un enunciado aparentemente inocente.
 */
export function limpiarTexto(entrada: string): string {
  return entrada
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(CONTROLES, '')
    .replace(INVISIBLES, '')
    .replace(ETIQUETAS_UNICODE, '')
    .slice(0, MAX_TEXTO_USUARIO)
    .trim();
}

/**
 * Envuelve contenido no confiable en un bloque delimitado.
 *
 * El delimitador lleva un identificador aleatorio distinto en cada petición,
 * para que el contenido del usuario no pueda cerrar el bloque e inyectar
 * instrucciones fuera de él.
 */
export function envolverNoConfiable(etiqueta: string, contenido: string, nonce: string): string {
  const limpio = limpiarTexto(contenido).split(nonce).join('·');
  return `<${etiqueta} nonce="${nonce}">\n${limpio}\n</${etiqueta} nonce="${nonce}">`;
}

/** Identificador aleatorio para delimitar bloques de contenido no confiable. */
export function generarNonce(): string {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Señales frecuentes de intento de inyección. No se usan para bloquear (darían
 * falsos positivos en ejercicios legítimos sobre informática), sino para avisar
 * al modelo dentro del propio prompt y para observabilidad.
 */
const PATRONES_INYECCION: RegExp[] = [
  /ignora (todas )?(las )?instrucciones/i,
  /ignore (all )?(previous |prior )?instructions/i,
  /olvida (todo|tus instrucciones)/i,
  /disregard (the )?(above|previous)/i,
  /system prompt/i,
  /eres ahora (un|una)\b/i,
  /you are now (a|an)\b/i,
  /act[uú]a como si no tuvieras (reglas|restricciones)/i,
  /revela (tus|las) instrucciones/i,
];

export function detectarPosibleInyeccion(texto: string): boolean {
  return PATRONES_INYECCION.some((p) => p.test(texto));
}
