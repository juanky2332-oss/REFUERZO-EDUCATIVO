'use client';

import { Icono, type NombreIcono } from './ui/Icono';
import { FASE_ETIQUETA, type FasePipeline } from '@/lib/types';

/**
 * Lo que está pasando ahora mismo, en una línea.
 *
 * Antes esto era una tarjeta con cuatro filas y una barra de progreso. Ocupaba
 * media pantalla para decir algo que se lee en dos palabras, y en una
 * conversación aparecía después de cada mensaje. Cada fase que se nombra aquí
 * corresponde a un paso que el servidor está ejecutando de verdad; los eventos
 * llegan por streaming y no se simula ninguno (regla 47).
 */

const ICONO: Record<FasePipeline, NombreIcono> = {
  analisis: 'lupa',
  resolucion: 'lapiz',
  verificacion: 'igual',
  explicacion: 'libro',
  charla: 'chat',
  listo: 'comprobado',
};

export function Pensando({
  fase,
  generando = false,
}: {
  fase: FasePipeline | null;
  generando?: boolean;
}) {
  const texto = generando
    ? 'Preparando el material…'
    : fase
      ? FASE_ETIQUETA[fase]
      : 'Un momento…';
  const icono: NombreIcono = generando ? 'documento' : fase ? ICONO[fase] : 'chat';

  return (
    <p
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-2.5 rounded-2xl rounded-tl-md border border-borde bg-superficie px-3.5 py-2.5 text-sm text-texto-suave"
    >
      <Icono nombre={icono} className="h-4 w-4 shrink-0 text-primario" />
      {texto}
      <span aria-hidden="true" className="flex gap-1">
        {[0, 1, 2].map((n) => (
          <span
            key={n}
            className="latido h-1.5 w-1.5 rounded-full bg-primario"
            style={{ animationDelay: `${n * 0.18}s` }}
          />
        ))}
      </span>
    </p>
  );
}
