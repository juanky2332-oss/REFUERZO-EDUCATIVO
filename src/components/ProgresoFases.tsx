'use client';

import { Icono, type NombreIcono } from './ui/Icono';
import type { FasePipeline } from '@/lib/types';

/**
 * Progreso del pipeline.
 *
 * Cada línea corresponde a una fase que se está ejecutando de verdad en el
 * servidor: los eventos llegan por streaming. No se simula ningún paso (regla 47).
 */

const ORDEN: { fase: FasePipeline; texto: string; icono: NombreIcono }[] = [
  { fase: 'analisis', texto: 'Leyendo y entendiendo el ejercicio', icono: 'camara' },
  { fase: 'resolucion', texto: 'Resolviéndolo', icono: 'lapiz' },
  { fase: 'verificacion', texto: 'Comprobando el resultado', icono: 'igual' },
  { fase: 'explicacion', texto: 'Preparando la explicación', icono: 'libro' },
];

export function ProgresoFases({
  completadas,
  actual,
}: {
  completadas: FasePipeline[];
  actual: FasePipeline | null;
}) {
  const hechas = ORDEN.filter((o) => completadas.includes(o.fase)).length;
  const porcentaje = Math.round((hechas / ORDEN.length) * 100);

  return (
    <div
      className="rounded-tarjeta border border-borde bg-superficie p-5 shadow-[var(--sombra)]"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-texto">Trabajando en tu ejercicio</p>
        <p className="text-xs tabular-nums text-texto-tenue">
          {hechas} de {ORDEN.length}
        </p>
      </div>

      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-superficie-2"
        role="progressbar"
        aria-valuenow={porcentaje}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progreso"
      >
        <div
          className="h-full rounded-full bg-primario transition-[width] duration-500"
          style={{ width: `${Math.max(porcentaje, 4)}%` }}
        />
      </div>

      <ol className="mt-4 space-y-2.5">
        {ORDEN.map(({ fase, texto, icono }) => {
          const hecha = completadas.includes(fase);
          const enCurso = actual === fase && !hecha;

          return (
            <li
              key={fase}
              className={[
                'flex items-center gap-3 text-sm transition',
                hecha ? 'text-texto-suave' : '',
                enCurso ? 'font-medium text-texto' : '',
                !hecha && !enCurso ? 'text-texto-tenue' : '',
              ].join(' ')}
            >
              <span
                aria-hidden="true"
                className={[
                  'grid h-7 w-7 shrink-0 place-items-center rounded-lg',
                  hecha ? 'bg-exito-suave text-exito' : '',
                  enCurso ? 'bg-primario-suave text-primario latido' : '',
                  !hecha && !enCurso ? 'bg-superficie-2 text-texto-tenue' : '',
                ].join(' ')}
              >
                <Icono nombre={hecha ? 'comprobado' : icono} className="h-4 w-4" />
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
