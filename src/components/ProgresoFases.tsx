'use client';

import type { FasePipeline } from '@/lib/types';

/**
 * Progreso del pipeline.
 *
 * Cada línea corresponde a una fase que se está ejecutando de verdad en el
 * servidor: los eventos llegan por streaming. No se simula ningún paso (regla 47).
 */

const ORDEN: { fase: FasePipeline; texto: string; icono: string }[] = [
  { fase: 'analisis', texto: 'Leyendo y entendiendo el ejercicio', icono: '📷' },
  { fase: 'resolucion', texto: 'Resolviéndolo', icono: '✏️' },
  { fase: 'verificacion', texto: 'Comprobando el resultado', icono: '🔎' },
  { fase: 'explicacion', texto: 'Preparando la explicación', icono: '📚' },
];

export function ProgresoFases({
  completadas,
  actual,
}: {
  completadas: FasePipeline[];
  actual: FasePipeline | null;
}) {
  return (
    <div
      className="rounded-tarjeta border border-borde bg-superficie p-5"
      role="status"
      aria-live="polite"
    >
      <p className="text-sm font-semibold text-texto">Trabajando en tu ejercicio</p>
      <ol className="mt-3 space-y-2">
        {ORDEN.map(({ fase, texto, icono }) => {
          const hecha = completadas.includes(fase);
          const enCurso = actual === fase;
          const pendiente = !hecha && !enCurso;

          return (
            <li
              key={fase}
              className={[
                'flex items-center gap-3 text-sm',
                hecha ? 'text-texto-suave' : '',
                enCurso ? 'font-medium text-texto' : '',
                pendiente ? 'text-texto-tenue' : '',
              ].join(' ')}
            >
              <span
                aria-hidden="true"
                className={[
                  'grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs',
                  hecha ? 'bg-exito-suave text-exito' : '',
                  enCurso ? 'bg-primario-suave latido' : '',
                  pendiente ? 'bg-neutro-suave' : '',
                ].join(' ')}
              >
                {hecha ? '✓' : icono}
              </span>
              <span>
                {texto}
                {enCurso && <span className="sr-only"> (en curso)</span>}
                {hecha && <span className="sr-only"> (completado)</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
