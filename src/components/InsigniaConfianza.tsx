import { CONFIANZA_ETIQUETA, type Confianza } from '@/lib/types';

/**
 * Indicador de confianza (reglas 33 y 74).
 *
 * Cuatro estados con nombre, nunca un porcentaje: un "97 % de fiabilidad"
 * transmitiría una precisión que el sistema no puede demostrar.
 */

const ESTILO: Record<Confianza, { clases: string; icono: string; explicacion: string }> = {
  verificado: {
    clases: 'bg-exito-suave text-exito border-exito/30',
    icono: '✓',
    explicacion: 'Respaldado por una fuente oficial que el sistema ha leído.',
  },
  calculo_comprobado: {
    clases: 'bg-primario-suave text-primario border-primario/30',
    icono: '=',
    explicacion: 'El servidor ha rehecho las operaciones y coinciden.',
  },
  conocimiento_estable: {
    clases: 'bg-neutro-suave text-neutro border-borde-fuerte',
    icono: '≡',
    explicacion: 'Contenido científico o matemático asentado, no dependiente de una consulta externa.',
  },
  necesita_confirmacion: {
    clases: 'bg-aviso-suave text-aviso border-aviso/40',
    icono: '!',
    explicacion: 'Hay algo que no he podido confirmar. Contrasta esta respuesta antes de darla por buena.',
  },
};

export function InsigniaConfianza({
  confianza,
  conExplicacion = false,
}: {
  confianza: Confianza;
  conExplicacion?: boolean;
}) {
  const e = ESTILO[confianza];

  return (
    <span className="inline-flex flex-col gap-1">
      <span
        className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${e.clases}`}
      >
        <span aria-hidden="true">{e.icono}</span>
        {CONFIANZA_ETIQUETA[confianza]}
      </span>
      {conExplicacion && <span className="text-xs text-texto-tenue">{e.explicacion}</span>}
    </span>
  );
}
