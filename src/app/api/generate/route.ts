/**
 * Generación de material: ejercicios, exámenes, resúmenes, fichas, tests y
 * planes de estudio.
 *
 * Devuelve el material completo (con solución). La separación entre el
 * cuadernillo del alumno y el solucionario del profesor la garantiza
 * `paraAlumno()`, que elimina las soluciones por construcción (regla 28).
 */

import { pedirJSON } from '@/lib/ai/pedir';
import { systemMaterial } from '@/lib/ai/prompts/material';
import { esquemaMaterial, esquemaPeticionGenerate } from '@/lib/ai/schemas';
import { registro } from '@/lib/observabilidad';
import { traducirError } from '@/lib/pipeline/orquestador';
import { claveCliente, consumir } from '@/lib/security/rate-limit';
import { envolverNoConfiable, generarNonce } from '@/lib/security/sanitize';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

const LIMITE_PETICIONES = Number(process.env.RATE_LIMIT_GENERATE ?? 10);
const VENTANA_MS = Number(process.env.RATE_LIMIT_VENTANA_MS ?? 60_000);

export async function POST(req: Request): Promise<Response> {
  const inicio = Date.now();

  const limite = consumir(`generate:${claveCliente(req)}`, LIMITE_PETICIONES, VENTANA_MS);
  if (!limite.permitido) {
    return Response.json(
      {
        error: `Has generado mucho material seguido. Espera ${limite.reintentarEn} segundos.`,
        codigo: 'limite_uso',
      },
      { status: 429 },
    );
  }

  let cuerpo: unknown;
  try {
    cuerpo = await req.json();
  } catch {
    return Response.json(
      { error: 'No he podido leer los datos enviados.', codigo: 'json_invalido' },
      { status: 400 },
    );
  }

  const validacion = esquemaPeticionGenerate.safeParse(cuerpo);
  if (!validacion.success) {
    return Response.json(
      {
        error: 'Faltan datos para generar el material: revisa materia, curso y tema.',
        codigo: 'peticion_invalida',
      },
      { status: 400 },
    );
  }

  const peticion = validacion.data;
  const nonce = generarNonce();

  try {
    const { valor: material, ms } = await pedirJSON(
      {
        system: systemMaterial(peticion),
        mensajes: [
          {
            rol: 'user',
            partes: [
              {
                tipo: 'texto',
                texto: [
                  `Tema solicitado:\n${envolverNoConfiable('tema', peticion.tema, nonce)}`,
                  peticion.notas
                    ? `Indicaciones adicionales del usuario:\n${envolverNoConfiable('notas', peticion.notas, nonce)}`
                    : '',
                  `Tipo de material: ${peticion.tipo}. Número de elementos: ${peticion.numeroPreguntas}.`,
                ]
                  .filter(Boolean)
                  .join('\n\n'),
              },
            ],
          },
        ],
        maxTokens: 6000,
        etiqueta: 'material',
      },
      esquemaMaterial,
    );

    registro.info({
      evento: 'material_generado',
      ms,
      datos: {
        tipo: peticion.tipo,
        preguntas: material.preguntas.length,
        totalMs: Date.now() - inicio,
      },
    });

    return Response.json({ material });
  } catch (e) {
    const { mensaje, codigo } = traducirError(e);
    registro.error({ evento: 'material_error', codigo });
    return Response.json({ error: mensaje, codigo }, { status: 502 });
  }
}
