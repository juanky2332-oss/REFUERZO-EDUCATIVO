'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Icono } from './ui/Icono';

/**
 * Barra de navegación por la conversación.
 *
 * Una explicación larga empuja hacia arriba lo que preguntaste hace tres
 * mensajes, y volver a encontrarlo a base de rueda del ratón es justo lo que
 * hace abandonar. Esto es una línea encima de la barra de escritura con dos
 * flechas para saltar de una pregunta a la anterior o a la siguiente, y un
 * desplegable con todas.
 *
 * Ocupa una línea a propósito. Un historial que se hace notar en una pantalla
 * de móvil se come justo el sitio donde va la respuesta.
 */

export interface PreguntaDelHilo {
  id: string;
  texto: string;
  etiqueta?: string;
}

/**
 * Siguiente posición al pulsar una flecha.
 *
 * Se separa para poder probarlo: los dos extremos son lo que se rompe siempre.
 * No da la vuelta a propósito —saltar de la última pregunta a la primera
 * desorienta— y admite -1 como «aún no estoy en ninguna».
 */
export function moverIndice(actual: number, total: number, direccion: -1 | 1): number {
  if (total === 0) return -1;
  if (actual < 0) return direccion === 1 ? 0 : total - 1;
  return Math.min(total - 1, Math.max(0, actual + direccion));
}

/** Recorta una pregunta para que quepa en una línea sin cortar una palabra. */
export function resumirPregunta(texto: string, maximo = 60): string {
  const limpio = texto.replace(/\s+/g, ' ').trim();
  if (limpio.length === 0) return 'Enviaste una foto';
  if (limpio.length <= maximo) return limpio;

  const corte = limpio.slice(0, maximo);
  const ultimoEspacio = corte.lastIndexOf(' ');
  return `${(ultimoEspacio > maximo * 0.6 ? corte.slice(0, ultimoEspacio) : corte).trimEnd()}…`;
}

export function BarraHistorial({
  preguntas,
  onIr,
}: {
  preguntas: PreguntaDelHilo[];
  onIr: (id: string) => void;
}) {
  const [indice, setIndice] = useState(-1);
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  // El puntero se sanea al leerlo, no con un efecto: si la conversación se
  // vacía, el índice guardado apunta a un hueco, y corregirlo desde un efecto
  // provoca un render en cascada por un valor que se puede derivar.
  const indiceSeguro = indice >= preguntas.length ? preguntas.length - 1 : indice;

  useEffect(() => {
    if (!abierto) return;
    function fuera(e: PointerEvent) {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    }
    function escape(e: KeyboardEvent) {
      if (e.key === 'Escape') setAbierto(false);
    }
    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', fuera);
      document.removeEventListener('keydown', escape);
    };
  }, [abierto]);

  const saltar = useCallback(
    (direccion: -1 | 1) => {
      const siguiente = moverIndice(indiceSeguro, preguntas.length, direccion);
      if (siguiente < 0) return;
      setIndice(siguiente);
      onIr(preguntas[siguiente].id);
    },
    [indiceSeguro, onIr, preguntas],
  );

  if (preguntas.length === 0) return null;

  const actual = indiceSeguro >= 0 ? preguntas[indiceSeguro] : preguntas[preguntas.length - 1];

  return (
    <div ref={caja} className="no-imprimir relative mx-auto max-w-3xl">
      {abierto && (
        <div className="absolute bottom-9 left-0 right-0 z-30 max-h-64 overflow-y-auto rounded-tarjeta border border-borde bg-superficie p-1 shadow-[var(--sombra)]">
          <p className="px-3 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.09em] text-texto-tenue">
            Lo que has preguntado
          </p>
          <ol>
            {preguntas.map((p, n) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    setIndice(n);
                    setAbierto(false);
                    onIr(p.id);
                  }}
                  className={`flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-superficie-2 ${
                    n === indiceSeguro ? 'text-primario' : 'text-texto-suave'
                  }`}
                >
                  <span aria-hidden="true" className="tabular-nums text-texto-tenue">
                    {n + 1}.
                  </span>
                  <span className="min-w-0 flex-1">
                    {p.etiqueta && (
                      <span className="block text-xs text-texto-tenue">{p.etiqueta}</span>
                    )}
                    {resumirPregunta(p.texto, 90)}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="flex items-center gap-1 py-1">
        <button
          type="button"
          onClick={() => saltar(-1)}
          disabled={indiceSeguro === 0}
          aria-label="Ir a la pregunta anterior"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-texto-tenue transition hover:bg-superficie-2 hover:text-primario disabled:opacity-30"
        >
          <Icono nombre="flecha" className="h-3.5 w-3.5 -rotate-90" />
        </button>
        <button
          type="button"
          onClick={() => saltar(1)}
          disabled={indiceSeguro >= 0 && indiceSeguro === preguntas.length - 1}
          aria-label="Ir a la pregunta siguiente"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-texto-tenue transition hover:bg-superficie-2 hover:text-primario disabled:opacity-30"
        >
          <Icono nombre="flecha" className="h-3.5 w-3.5 rotate-90" />
        </button>

        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg px-1.5 py-1 text-left text-xs text-texto-tenue transition hover:bg-superficie-2 hover:text-texto"
        >
          <span className="shrink-0 tabular-nums">
            {indiceSeguro >= 0 ? indiceSeguro + 1 : preguntas.length}/{preguntas.length}
          </span>
          <span className="truncate">{resumirPregunta(actual.texto)}</span>
          <Icono
            nombre="flecha"
            className={`ml-auto h-3 w-3 shrink-0 transition ${abierto ? '-rotate-90' : 'rotate-90'}`}
          />
        </button>
      </div>
    </div>
  );
}
