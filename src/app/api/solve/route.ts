/**
 * Endpoint principal: recibe la consulta (texto y/o imágenes) y devuelve el
 * avance del pipeline en NDJSON, una línea JSON por evento.
 *
 * Se emite en streaming para que la interfaz muestre los pasos reales conforme
 * ocurren, no una animación decorativa (regla 47).
 */

import { esquemaPeticionSolve } from '@/lib/ai/schemas';
import { ejecutarPipeline } from '@/lib/pipeline/orquestador';
import { registro } from '@/lib/observabilidad';
import { claveCliente, consumir } from '@/lib/security/rate-limit';
import { MAX_IMAGENES } from '@/lib/security/upload';
import type { EventoStream } from '@/lib/types';

export const maxDuration = 120;
/** No tiene sentido cachear: cada consulta es distinta y lleva datos del usuario. */
export const dynamic = 'force-dynamic';

/** Tamaño máximo del cuerpo, como primera barrera antes de parsear nada. */
const MAX_BYTES_CUERPO = 28 * 1024 * 1024;

const LIMITE_PETICIONES = Number(process.env.RATE_LIMIT_SOLVE ?? 20);
const VENTANA_MS = Number(process.env.RATE_LIMIT_VENTANA_MS ?? 60_000);

function lineaJSON(evento: EventoStream): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(evento) + '\n');
}

function respuestaDeError(mensaje: string, codigo: string, status: number): Response {
  const evento: EventoStream = { tipo: 'error', mensaje, codigo };
  return new Response(JSON.stringify(evento) + '\n', {
    status,
    headers: { 'content-type': 'application/x-ndjson; charset=utf-8' },
  });
}

export async function POST(req: Request): Promise<Response> {
  const inicio = Date.now();

  const limite = consumir(`solve:${claveCliente(req)}`, LIMITE_PETICIONES, VENTANA_MS);
  if (!limite.permitido) {
    return respuestaDeError(
      `Has hecho muchas consultas seguidas. Espera ${limite.reintentarEn} segundos y vuelve a intentarlo.`,
      'limite_uso',
      429,
    );
  }

  const longitud = Number(req.headers.get('content-length') ?? 0);
  if (longitud > MAX_BYTES_CUERPO) {
    return respuestaDeError(
      'Lo que has enviado es demasiado grande. Prueba con menos imágenes o con fotos más pequeñas.',
      'cuerpo_grande',
      413,
    );
  }

  let cuerpo: unknown;
  try {
    cuerpo = await req.json();
  } catch {
    return respuestaDeError('No he podido leer los datos enviados.', 'json_invalido', 400);
  }

  const analisis = esquemaPeticionSolve.safeParse(cuerpo);
  if (!analisis.success) {
    return respuestaDeError(
      'Los datos enviados no son válidos. Recarga la página y prueba otra vez.',
      'peticion_invalida',
      400,
    );
  }

  const peticion = analisis.data;
  if (peticion.imagenes.length > MAX_IMAGENES) {
    return respuestaDeError(
      `Puedes enviar como máximo ${MAX_IMAGENES} imágenes a la vez.`,
      'demasiadas_imagenes',
      400,
    );
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controlador) {
      try {
        for await (const evento of ejecutarPipeline(peticion)) {
          controlador.enqueue(lineaJSON(evento));
        }
      } catch (e) {
        registro.error({
          evento: 'stream_error',
          datos: { detalle: e instanceof Error ? e.message.slice(0, 200) : 'desconocido' },
        });
        controlador.enqueue(
          lineaJSON({
            tipo: 'error',
            codigo: 'inesperado',
            mensaje: 'Ha ocurrido un problema y he tenido que parar. Vuelve a intentarlo.',
          }),
        );
      } finally {
        registro.info({
          evento: 'solve_completado',
          ms: Date.now() - inicio,
          datos: { imagenes: peticion.imagenes.length, nivel: peticion.nivel },
        });
        controlador.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'application/x-ndjson; charset=utf-8',
      'cache-control': 'no-store, no-transform',
      // Evita que un proxy intermedio acumule el cuerpo y rompa el streaming.
      'x-accel-buffering': 'no',
    },
  });
}
