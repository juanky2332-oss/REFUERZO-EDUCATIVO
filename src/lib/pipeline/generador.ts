/**
 * Generación de material, con las cuentas rehechas por el servidor.
 *
 * Antes esto vivía dentro del endpoint y devolvía lo que dijera el modelo. El
 * problema es que una ficha de ejercicios es material de estudio: si una
 * solución está mal, el alumno se aprende el error y encima lo da por bueno
 * porque «lo pone en la hoja».
 *
 * Así que el generador pide ahora, por cada pregunta, las operaciones en las
 * que se apoya la solución, y aquí se rehacen con el mismo evaluador
 * determinista que usa el resolutor. La interfaz recibe el resultado de ese
 * recálculo y puede avisar de lo que no cuadra en vez de presentarlo como
 * bueno. Es la misma idea que en el resolutor: el modelo propone, el servidor
 * comprueba.
 */

import { pedirJSON } from '@/lib/ai/pedir';
import { systemMaterial } from '@/lib/ai/prompts/material';
import { esquemaMaterial, type PeticionGenerate } from '@/lib/ai/schemas';
import type { MaterialVerificado, PreguntaVerificada } from '@/lib/material';
import { registro } from '@/lib/observabilidad';
import { envolverNoConfiable } from '@/lib/security/sanitize';
import { comprobarLista } from './comprobar';

const MAX_TOKENS_MATERIAL = 8000;

/**
 * Cuenta cuántas preguntas tienen alguna operación que no cuadra.
 *
 * Se separa para poder probarlo: es el número que decide si la ficha sale con
 * un aviso o sin él, y equivocarse aquí significa callar un error o alarmar sin
 * motivo.
 */
export function preguntasConFallo(material: MaterialVerificado): number[] {
  return material.preguntas
    .filter((p) => p.comprobaciones.some((c) => !c.ok))
    .map((p) => p.numero);
}

export async function generarMaterialVerificado(
  peticion: PeticionGenerate,
  nonce: string,
): Promise<MaterialVerificado> {
  const inicio = Date.now();

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
      maxTokens: MAX_TOKENS_MATERIAL,
      etiqueta: 'material',
    },
    esquemaMaterial,
  );

  const preguntas: PreguntaVerificada[] = material.preguntas.map((p) => ({
    ...p,
    comprobaciones: comprobarLista(p.comprobaciones),
  }));

  const verificado: MaterialVerificado = { ...material, preguntas };
  const conFallo = preguntasConFallo(verificado);

  registro.info({
    evento: 'material_generado',
    ms,
    datos: {
      tipo: peticion.tipo,
      preguntas: preguntas.length,
      comprobaciones: preguntas.reduce((s, p) => s + p.comprobaciones.length, 0),
      preguntasConFallo: conFallo.length,
      totalMs: Date.now() - inicio,
    },
  });

  return verificado;
}
