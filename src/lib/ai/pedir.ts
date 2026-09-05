/**
 * Petición al modelo con validación de esquema y un único reintento de reparación.
 *
 * Si el modelo devuelve algo que no encaja en el esquema, se le enseña el error
 * y se le pide que lo corrija UNA vez. Nunca más: los bucles de reintento son
 * una forma silenciosa de quemar dinero (regla 44).
 */

import type { z } from 'zod';
import { extraerObjetoJSON } from './json';
import { ErrorIA, llamarIA, type MensajeIA, type PeticionIA } from './provider';
import { registro } from '@/lib/observabilidad';

export interface ResultadoJSON<T> {
  valor: T;
  ms: number;
  modelo: string;
}

export async function pedirJSON<T>(
  peticion: Omit<PeticionIA, 'json'>,
  esquema: z.ZodType<T>,
): Promise<ResultadoJSON<T>> {
  const inicio = Date.now();
  let mensajes: MensajeIA[] = peticion.mensajes;
  let ultimoError = '';

  for (let intento = 0; intento < 2; intento++) {
    const respuesta = await llamarIA({ ...peticion, mensajes, json: true });
    const bruto = extraerObjetoJSON(respuesta.texto);

    if (bruto !== null) {
      const analisis = esquema.safeParse(bruto);
      if (analisis.success) {
        return { valor: analisis.data, ms: Date.now() - inicio, modelo: respuesta.modelo };
      }
      ultimoError = analisis.error.issues
        .slice(0, 6)
        .map((i) => `${i.path.join('.') || '(raíz)'}: ${i.message}`)
        .join('; ');
    } else {
      ultimoError = 'La respuesta no contenía un objeto JSON válido.';
    }

    registro.aviso({
      evento: 'json_invalido',
      fase: peticion.etiqueta,
      datos: { intento, detalle: ultimoError.slice(0, 200) },
    });

    if (intento === 0) {
      mensajes = [
        ...peticion.mensajes,
        { rol: 'assistant', partes: [{ tipo: 'texto', texto: respuesta.texto.slice(0, 2000) }] },
        {
          rol: 'user',
          partes: [
            {
              tipo: 'texto',
              texto:
                'Tu respuesta anterior no cumple el esquema. Errores detectados: ' +
                ultimoError +
                '. Devuelve de nuevo SÓLO el objeto JSON completo y válido, con todos los campos del esquema.',
            },
          ],
        },
      ];
    }
  }

  throw new ErrorIA(
    `El modelo no ha devuelto una respuesta con el formato esperado (${ultimoError}).`,
    'proveedor',
  );
}
