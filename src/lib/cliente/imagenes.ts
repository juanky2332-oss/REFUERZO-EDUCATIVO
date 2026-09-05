/**
 * Preparación de imágenes en el navegador antes de enviarlas.
 *
 * Reduce y recomprime la foto: una imagen de móvil de 12 MP no aporta nada a la
 * lectura del enunciado y multiplica el tiempo de subida y el coste (regla 44).
 * También permite rotar, porque las fotos de apuntes salen giradas a menudo.
 */

export interface ImagenPreparada {
  id: string;
  /** URL de objeto para la previsualización. Hay que revocarla al eliminarla. */
  previsualizacion: string;
  mime: string;
  base64: string;
  bytes: number;
  nombre: string;
  /** Grados aplicados respecto al original. */
  rotacion: number;
}

/** Lado mayor máximo. Suficiente para leer texto impreso y manuscrito. */
const LADO_MAXIMO = 1600;
const CALIDAD_JPEG = 0.85;

export const TIPOS_ACEPTADOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_BYTES_ORIGEN = 20 * 1024 * 1024;

export class ErrorImagen extends Error {}

function nuevoId(): string {
  return Math.random().toString(36).slice(2, 10);
}

async function cargarImagen(archivo: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(archivo);
  try {
    return await new Promise<HTMLImageElement>((resolver, rechazar) => {
      const img = new Image();
      img.onload = () => resolver(img);
      img.onerror = () => rechazar(new ErrorImagen('No se ha podido abrir la imagen.'));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function dibujar(img: HTMLImageElement, rotacion: number): HTMLCanvasElement {
  const girado = rotacion === 90 || rotacion === 270;
  const anchoOriginal = girado ? img.naturalHeight : img.naturalWidth;
  const altoOriginal = girado ? img.naturalWidth : img.naturalHeight;

  const escala = Math.min(1, LADO_MAXIMO / Math.max(anchoOriginal, altoOriginal));
  const ancho = Math.max(1, Math.round(anchoOriginal * escala));
  const alto = Math.max(1, Math.round(altoOriginal * escala));

  const lienzo = document.createElement('canvas');
  lienzo.width = ancho;
  lienzo.height = alto;

  const ctx = lienzo.getContext('2d');
  if (!ctx) throw new ErrorImagen('Este navegador no puede procesar la imagen.');

  // Fondo blanco: un PNG con transparencia convertido a JPEG saldría negro.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, ancho, alto);

  ctx.translate(ancho / 2, alto / 2);
  ctx.rotate((rotacion * Math.PI) / 180);
  const dibujoAncho = (girado ? alto : ancho);
  const dibujoAlto = (girado ? ancho : alto);
  ctx.drawImage(img, -dibujoAncho / 2, -dibujoAlto / 2, dibujoAncho, dibujoAlto);

  return lienzo;
}

async function lienzoABase64(lienzo: HTMLCanvasElement): Promise<{ base64: string; bytes: number }> {
  const dataUrl = lienzo.toDataURL('image/jpeg', CALIDAD_JPEG);
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const relleno = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return { base64, bytes: (base64.length / 4) * 3 - relleno };
}

/** Valida, redimensiona y codifica un archivo elegido por el usuario. */
export async function prepararImagen(archivo: File, rotacion = 0): Promise<ImagenPreparada> {
  if (!TIPOS_ACEPTADOS.includes(archivo.type)) {
    throw new ErrorImagen('Sólo se admiten imágenes JPG, PNG, WEBP o GIF.');
  }
  if (archivo.size > MAX_BYTES_ORIGEN) {
    throw new ErrorImagen('La imagen es demasiado grande. Prueba con una foto de menos resolución.');
  }

  const img = await cargarImagen(archivo);
  const lienzo = dibujar(img, rotacion);
  const { base64, bytes } = await lienzoABase64(lienzo);

  return {
    id: nuevoId(),
    previsualizacion: lienzo.toDataURL('image/jpeg', 0.6),
    mime: 'image/jpeg',
    base64,
    bytes,
    nombre: archivo.name || 'foto.jpg',
    rotacion,
  };
}

/** Vuelve a generar la imagen con 90° más de giro. */
export async function rotarImagen(
  imagen: ImagenPreparada,
  archivoOriginal: File,
): Promise<ImagenPreparada> {
  const rotacion = (imagen.rotacion + 90) % 360;
  const nueva = await prepararImagen(archivoOriginal, rotacion);
  return { ...nueva, id: imagen.id };
}

export function formatearTamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
