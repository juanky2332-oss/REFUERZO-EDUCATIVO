'use client';

import { useState } from 'react';
import { Icono } from './ui/Icono';
import { Boton } from './ui/primitivos';
import type { MaterialGenerado } from '@/lib/ai/schemas';
import { paraAlumno, puntuacionTotal, type MaterialAlumno } from '@/lib/material';

/**
 * Visor de material generado, compartido por el generador y por el modo
 * «Quiero aprobar».
 *
 * Dos vistas mutuamente excluyentes: cuadernillo del alumno y solucionario del
 * profesor. La del alumno recibe un objeto sin soluciones (`paraAlumno`), de
 * modo que no puede enseñarlas ni al imprimir ni al copiar (regla 28).
 */

export function VistaMaterial({ material }: { material: MaterialGenerado }) {
  const [vista, setVista] = useState<'alumno' | 'profesor'>('alumno');

  return (
    <section>
      <div className="no-imprimir flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Versión del material"
          className="inline-flex rounded-xl border border-borde bg-superficie-2 p-1"
        >
          {(['alumno', 'profesor'] as const).map((v) => (
            <button
              key={v}
              role="tab"
              type="button"
              aria-selected={vista === v}
              onClick={() => setVista(v)}
              className={[
                'min-h-10 rounded-lg px-4 text-sm font-semibold transition',
                vista === v
                  ? 'bg-superficie text-primario shadow-[0_1px_3px_rgba(19,26,43,.12)]'
                  : 'text-texto-tenue hover:text-texto',
              ].join(' ')}
            >
              {v === 'alumno' ? 'Cuadernillo del alumno' : 'Solucionario'}
            </button>
          ))}
        </div>

        <Boton
          type="button"
          variante="secundario"
          icono="imprimir"
          onClick={() => window.print()}
        >
          Imprimir o guardar en PDF
        </Boton>
      </div>

      <p className="no-imprimir mt-2 text-xs text-texto-tenue">
        Se imprimirá exactamente la versión que estás viendo. El cuadernillo del alumno no contiene
        las soluciones.
      </p>

      <div className="mt-4">
        {vista === 'alumno' ? (
          <VistaAlumno material={paraAlumno(material)} />
        ) : (
          <VistaProfesor material={material} />
        )}
      </div>
    </section>
  );
}

function Cabecera({
  titulo,
  tema,
  subtitulo,
}: {
  titulo: string;
  tema: string;
  subtitulo: string;
}) {
  return (
    <header className="border-b border-borde pb-4">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-texto-tenue">{subtitulo}</p>
      <h2 className="mt-1 text-xl font-bold text-texto">{titulo}</h2>
      <p className="text-sm text-texto-suave">{tema}</p>
    </header>
  );
}

function VistaAlumno({ material }: { material: MaterialAlumno }) {
  return (
    <article className="hoja rounded-tarjeta border border-borde bg-superficie p-5 shadow-[var(--sombra)] sm:p-7">
      <Cabecera titulo={material.titulo} tema={material.tema} subtitulo="Cuadernillo del alumno" />

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-texto-suave">
        <span>Nombre: ______________________________</span>
        {material.duracionMinutos && <span>Duración: {material.duracionMinutos} min</span>}
        {material.puntuacionTotal > 0 && <span>Total: {material.puntuacionTotal} puntos</span>}
      </div>

      {material.instrucciones && (
        <p className="mt-4 whitespace-pre-wrap rounded-xl bg-superficie-2 p-3 text-sm text-texto-suave">
          {material.instrucciones}
        </p>
      )}

      <ol className="mt-5 space-y-5">
        {material.preguntas.map((p) => (
          <li key={p.numero} className="border-t border-borde pt-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-semibold text-texto">{p.numero}.</span>
              {p.puntuacion > 0 && (
                <span className="shrink-0 text-xs text-texto-tenue">({p.puntuacion} p.)</span>
              )}
            </div>
            <p className="mt-1 whitespace-pre-wrap text-texto">{p.enunciado}</p>
          </li>
        ))}
      </ol>

      {material.loQueHayQueAprender.length > 0 && (
        <section className="mt-6 rounded-tarjeta border border-acento/30 bg-acento-suave p-4">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-acento">
            <Icono nombre="estrella" className="h-4 w-4" />
            Lo que tengo que aprender sí o sí
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-texto-suave">
            {material.loQueHayQueAprender.map((x, n) => (
              <li key={n}>{x}</li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

function VistaProfesor({ material }: { material: MaterialGenerado }) {
  return (
    <article className="hoja rounded-tarjeta border border-borde bg-superficie p-5 shadow-[var(--sombra)] sm:p-7">
      <Cabecera titulo={material.titulo} tema={material.tema} subtitulo="Solucionario" />

      <p className="mt-3 flex items-start gap-2 rounded-xl bg-aviso-suave px-3 py-2 text-sm text-aviso">
        <Icono nombre="aviso" className="mt-0.5 h-4 w-4 shrink-0" />
        Documento con soluciones. Revísalas antes de repartir el material: los enunciados y sus
        respuestas están generados automáticamente.
      </p>

      <div className="mt-4 text-sm text-texto-suave">
        Puntuación total: {puntuacionTotal(material)} puntos
      </div>

      <ol className="mt-5 space-y-5">
        {material.preguntas.map((p) => (
          <li key={p.numero} className="border-t border-borde pt-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-semibold text-texto">{p.numero}.</span>
              {p.puntuacion > 0 && (
                <span className="shrink-0 text-xs text-texto-tenue">({p.puntuacion} p.)</span>
              )}
            </div>
            <p className="mt-1 whitespace-pre-wrap text-texto">{p.enunciado}</p>

            {p.solucion && (
              <div className="mt-3 rounded-xl border-l-4 border-exito bg-exito-suave/60 p-3">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-exito">Solución</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-texto-suave">{p.solucion}</p>
              </div>
            )}

            {p.criterioCorreccion && (
              <div className="mt-2 rounded-xl bg-superficie-2 p-3">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-texto-tenue">
                  Cómo repartir la puntuación
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-texto-suave">
                  {p.criterioCorreccion}
                </p>
              </div>
            )}
          </li>
        ))}
      </ol>

      {material.notasDidacticas.length > 0 && (
        <section className="mt-6 border-t border-borde pt-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-texto-tenue">
            Observaciones didácticas
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-texto-suave">
            {material.notasDidacticas.map((x, n) => (
              <li key={n}>{x}</li>
            ))}
          </ul>
        </section>
      )}

      {material.loQueHayQueAprender.length > 0 && (
        <section className="mt-4 border-t border-borde pt-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-texto-tenue">
            Contenidos mínimos
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-texto-suave">
            {material.loQueHayQueAprender.map((x, n) => (
              <li key={n}>{x}</li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
