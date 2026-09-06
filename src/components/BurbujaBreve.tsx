'use client';

import { Icono } from './ui/Icono';
import { Texto } from './VistaRespuesta';
import type { Confianza, RespuestaBreve } from '@/lib/types';

/**
 * Respuesta corta de conversación.
 *
 * Cuando el alumno pregunta «no entiendo el paso 2», devolverle otra vez la
 * tarjeta entera con pestañas es ruido: ya tiene el ejercicio resuelto más
 * arriba. Esto es una burbuja de chat normal, deliberadamente sin cromo.
 *
 * La insignia de confianza sólo aparece cuando hay algo que avisar. Ponerla en
 * cada frase de una conversación la convertiría en decoración y dejaría de
 * leerse justo cuando importa.
 */

export function BurbujaBreve({
  mensaje,
  confianza,
  onSugerencia,
}: {
  mensaje: RespuestaBreve;
  confianza: Confianza;
  onSugerencia: (texto: string) => void;
}) {
  return (
    <div className="max-w-[92%]">
      <div className="rounded-2xl rounded-tl-md border border-borde bg-superficie px-4 py-3 shadow-[0_1px_2px_rgb(19_26_43_/_0.05)]">
        <Texto className="text-texto">{mensaje.texto}</Texto>

        {mensaje.puntos.length > 0 && (
          <ul className="mt-2.5 space-y-1 border-t border-borde pt-2.5 text-sm text-texto-suave">
            {mensaje.puntos.map((p, n) => (
              <li key={n} className="flex gap-2">
                <span aria-hidden="true" className="text-primario">
                  ·
                </span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        )}

        {(mensaje.incertidumbres.length > 0 || confianza === 'necesita_confirmacion') && (
          <div
            className="mt-2.5 rounded-xl border border-aviso/35 bg-aviso-suave px-3 py-2"
            role="note"
          >
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-aviso">
              <Icono nombre="aviso" className="h-3.5 w-3.5 shrink-0" />
              Contrástalo
            </p>
            <ul className="mt-1 space-y-1 text-sm text-texto-suave">
              {mensaje.incertidumbres.length > 0 ? (
                mensaje.incertidumbres.map((i, n) => <li key={n}>{i}</li>)
              ) : (
                <li>Esto no lo he podido comprobar con un cálculo. Pregúntaselo también a tu profe.</li>
              )}
            </ul>
          </div>
        )}
      </div>

      {mensaje.sugerencias.length > 0 && (
        <div className="no-imprimir mt-2 flex flex-wrap gap-1.5">
          {mensaje.sugerencias.slice(0, 3).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSugerencia(s)}
              className="min-h-9 rounded-full border border-borde bg-superficie px-3 text-sm text-texto-suave transition hover:border-primario/45 hover:text-texto"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
