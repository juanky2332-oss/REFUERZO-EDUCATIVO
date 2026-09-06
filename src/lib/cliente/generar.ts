'use client';

import type { PeticionGenerate } from '@/lib/ai/schemas';
import type { MaterialVerificado } from '@/lib/material';

/**
 * Llamada al generador de material desde el navegador.
 *
 * Devuelve un resultado, no lanza: el error ya viene traducido a algo que se le
 * puede enseñar a un alumno (regla 45), así que quien la usa sólo tiene que
 * pintarlo.
 */

export type ResultadoMaterial =
  | { ok: true; material: MaterialVerificado }
  | { ok: false; error: string };

export async function generarMaterial(
  peticion: Omit<
    PeticionGenerate,
    'nivel' | 'numeroPreguntas' | 'notas' | 'diasDisponibles' | 'libro'
  > &
    Partial<
      Pick<PeticionGenerate, 'nivel' | 'numeroPreguntas' | 'notas' | 'diasDisponibles' | 'libro'>
    >,
  senal?: AbortSignal,
): Promise<ResultadoMaterial> {
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(peticion),
      signal: senal,
    });

    const datos: unknown = await res.json();

    if (!res.ok) {
      const e = datos as { error?: string };
      return {
        ok: false,
        error: e.error ?? 'No he podido preparar el material. Vuelve a intentarlo.',
      };
    }

    const { material } = datos as { material: MaterialVerificado };
    return { ok: true, material };
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      return { ok: false, error: 'Se ha cancelado.' };
    }
    return {
      ok: false,
      error: 'Se ha cortado la conexión. Comprueba tu red y vuelve a intentarlo.',
    };
  }
}
