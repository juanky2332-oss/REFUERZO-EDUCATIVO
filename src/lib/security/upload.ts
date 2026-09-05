/**
 * Validación de imágenes en el servidor.
 *
 * El tipo MIME que declara el navegador no es fiable: se puede falsificar. Aquí
 * se comprueba la firma real del fichero (magic bytes) y el tamaño antes de
 * gastar una sola llamada de IA (reglas 42 y 44).
 */

export const MAX_BYTES_IMAGEN = 6 * 1024 * 1024; // 6 MB por imagen
export const MAX_IMAGENES = 4;

/** Tipos que los proveedores de visión aceptan y que sabemos validar. */
export const MIMES_ADMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
export type MimeAdmitido = (typeof MIMES_ADMITIDOS)[number];

export interface ImagenValidada {
  mime: MimeAdmitido;
  base64: string;
  bytes: number;
}

export type ResultadoValidacion =
  | { ok: true; imagen: ImagenValidada }
  | { ok: false; motivo: string };

/** Quita el prefijo `data:...;base64,` si viene incluido. */
export function quitarPrefijoDataUrl(valor: string): string {
  const coma = valor.indexOf(',');
  return valor.startsWith('data:') && coma !== -1 ? valor.slice(coma + 1) : valor;
}

function esBase64(valor: string): boolean {
  return /^[A-Za-z0-9+/]*={0,2}$/.test(valor) && valor.length % 4 === 0;
}

/** Tamaño en bytes que ocupará el binario decodificado, sin decodificarlo. */
export function bytesDeBase64(base64: string): number {
  const relleno = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return (base64.length / 4) * 3 - relleno;
}

/**
 * Detecta el tipo real a partir de la cabecera del fichero.
 * Devuelve null si la firma no corresponde a ningún formato admitido.
 */
export function detectarMime(cabecera: Uint8Array): MimeAdmitido | null {
  const b = cabecera;

  // JPEG: FF D8 FF
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (b.length >= 8 && png.every((v, i) => b[i] === v)) return 'image/png';

  // GIF: "GIF87a" o "GIF89a"
  if (b.length >= 6 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return 'image/gif';

  // WEBP: "RIFF" .... "WEBP"
  const riff = [0x52, 0x49, 0x46, 0x46];
  const webp = [0x57, 0x45, 0x42, 0x50];
  if (
    b.length >= 12 &&
    riff.every((v, i) => b[i] === v) &&
    webp.every((v, i) => b[8 + i] === v)
  ) {
    return 'image/webp';
  }

  return null;
}

/**
 * Valida una imagen recibida en base64.
 *
 * El tipo MIME que declare el cliente se ignora por completo: el que se usa
 * es siempre el detectado a partir de la firma del fichero.
 */
export function validarImagen(base64Bruto: string): ResultadoValidacion {
  const base64 = quitarPrefijoDataUrl((base64Bruto ?? '').trim());

  if (!base64) return { ok: false, motivo: 'La imagen llegó vacía.' };
  if (!esBase64(base64)) return { ok: false, motivo: 'La imagen no tiene un formato válido.' };

  const bytes = bytesDeBase64(base64);
  if (bytes > MAX_BYTES_IMAGEN) {
    const mb = (MAX_BYTES_IMAGEN / (1024 * 1024)).toFixed(0);
    return { ok: false, motivo: `La imagen supera el máximo de ${mb} MB.` };
  }

  let cabecera: Uint8Array;
  try {
    // Basta con los primeros bytes para identificar la firma.
    const trozo = base64.slice(0, 64);
    const binario = Buffer.from(trozo, 'base64');
    cabecera = new Uint8Array(binario);
  } catch {
    return { ok: false, motivo: 'No se ha podido leer la imagen.' };
  }

  const mime = detectarMime(cabecera);
  if (!mime) {
    return {
      ok: false,
      motivo: 'Sólo se admiten imágenes JPG, PNG, WEBP o GIF. Este archivo no lo es.',
    };
  }

  return { ok: true, imagen: { mime, base64, bytes } };
}
