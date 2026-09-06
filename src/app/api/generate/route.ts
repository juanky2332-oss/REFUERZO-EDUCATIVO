/**
 * Generación de material: ejercicios, exámenes, resúmenes, fichas, tests y
 * planes de estudio.
 *
 * Devuelve el material completo (con solución). La separación entre el
 * cuadernillo del alumno y el solucionario del profesor la garantiza
 * `paraAlumno()`, que elimina las soluciones por construcción (regla 28).
 */

import { esquemaPeticionGenerate } from '@/lib/ai/schemas';
import { limiteGenerate, ventanaLimiteMs } from '@/lib/config';
import { registro } from '@/lib/observabilidad';
import { generarMaterialVerificado } from '@/lib/pipeline/generador';
import { traducirError } from '@/lib/pipeline/orquestador';
import { claveCliente, consumir } from '@/lib/security/rate-limit';
import { generarNonce } from '@/lib/security/sanitize';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

export async function POST(req: Request): Promise<Response> {
  const limite = consumir(`generate:${claveCliente(req)}`, limiteGenerate(), ventanaLimiteMs());
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

  try {
    const material = await generarMaterialVerificado(peticion, generarNonce());
    return Response.json({ material });
  } catch (e) {
    const { mensaje, codigo } = traducirError(e);
    registro.error({ evento: 'material_error', codigo });
    return Response.json({ error: mensaje, codigo }, { status: 502 });
  }
}
