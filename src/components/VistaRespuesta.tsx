'use client';

import { InsigniaConfianza } from './InsigniaConfianza';
import type { CorreccionAlumno, RespuestaEducativa } from '@/lib/types';

/**
 * Respuesta educativa estructurada (regla 31).
 *
 * El orden es deliberado: primero qué nos piden, luego el procedimiento, y sólo
 * después el resultado. Y las incertidumbres van ARRIBA, antes que el resultado:
 * si hay algo que no se ha podido confirmar, el alumno debe leerlo antes de
 * copiar el número.
 */

const ESTILO_CORRECCION: Record<
  CorreccionAlumno['estado'],
  { etiqueta: string; icono: string; clases: string }
> = {
  correcto: { etiqueta: 'Correcto', icono: '✅', clases: 'bg-exito-suave text-exito' },
  parcial: {
    etiqueta: 'Parcialmente correcto',
    icono: '🟡',
    clases: 'bg-aviso-suave text-aviso',
  },
  incorrecto: { etiqueta: 'Incorrecto', icono: '❌', clases: 'bg-error-suave text-error' },
};

function Seccion({
  numero,
  titulo,
  children,
}: {
  numero?: string;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-borde pt-5">
      <h3 className="flex items-baseline gap-2 text-sm font-semibold uppercase tracking-wide text-texto-tenue">
        {numero && <span className="text-primario">{numero}</span>}
        {titulo}
      </h3>
      <div className="mt-2 text-texto-suave">{children}</div>
    </section>
  );
}

/** Conserva los saltos de línea del modelo sin interpretar HTML (anti-XSS). */
function Texto({ children }: { children: string }) {
  return <p className="whitespace-pre-wrap">{children}</p>;
}

export function VistaRespuesta({ respuesta }: { respuesta: RespuestaEducativa }) {
  const c = respuesta.correccion;

  return (
    <article className="hoja rounded-tarjeta border border-borde bg-superficie p-5 sm:p-7">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight text-texto sm:text-2xl">
          {respuesta.titulo}
        </h2>
        <InsigniaConfianza confianza={respuesta.confianza} />
      </header>

      {respuesta.incertidumbres.length > 0 && (
        <div
          className="mt-4 rounded-tarjeta border border-aviso/40 bg-aviso-suave p-4"
          role="note"
        >
          <p className="text-sm font-semibold text-aviso">Antes de seguir, ten en cuenta esto</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-texto-suave">
            {respuesta.incertidumbres.map((i, n) => (
              <li key={n}>{i}</li>
            ))}
          </ul>
        </div>
      )}

      {c && (
        <div className="mt-4 rounded-tarjeta border border-borde p-4">
          <p
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${ESTILO_CORRECCION[c.estado].clases}`}
          >
            <span aria-hidden="true">{ESTILO_CORRECCION[c.estado].icono}</span>
            Tu respuesta: {ESTILO_CORRECCION[c.estado].etiqueta}
          </p>
          {c.explicacion && (
            <div className="mt-3 text-sm text-texto-suave">
              <Texto>{c.explicacion}</Texto>
            </div>
          )}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {c.queHizoBien.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-texto-tenue">
                  Lo que has hecho bien
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-texto-suave">
                  {c.queHizoBien.map((x, n) => (
                    <li key={n}>{x}</li>
                  ))}
                </ul>
              </div>
            )}
            {c.dondeFalla.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-texto-tenue">
                  Dónde se tuerce
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-texto-suave">
                  {c.dondeFalla.map((x, n) => (
                    <li key={n}>{x}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-5 space-y-5">
        {respuesta.queNosPiden && (
          <Seccion numero="1." titulo="¿Qué nos piden?">
            <Texto>{respuesta.queNosPiden}</Texto>
          </Seccion>
        )}

        {respuesta.datos.length > 0 && (
          <Seccion numero="2." titulo="Datos">
            <ul className="list-disc space-y-1 pl-5">
              {respuesta.datos.map((d, n) => (
                <li key={n}>{d}</li>
              ))}
            </ul>
          </Seccion>
        )}

        {respuesta.comoLoHacemos && (
          <Seccion numero="3." titulo="Cómo lo hacemos">
            <Texto>{respuesta.comoLoHacemos}</Texto>
          </Seccion>
        )}

        {respuesta.pasos.length > 0 && (
          <Seccion numero="4." titulo="Resolución">
            <ol className="space-y-4">
              {respuesta.pasos.map((p, n) => (
                <li key={n} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primario-suave text-xs font-bold text-primario"
                  >
                    {n + 1}
                  </span>
                  <div className="min-w-0">
                    {p.titulo && <p className="font-semibold text-texto">{p.titulo}</p>}
                    <div className="mt-0.5 overflow-x-auto">
                      <Texto>{p.contenido}</Texto>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </Seccion>
        )}

        {respuesta.resultado && (
          <Seccion numero="5." titulo="Resultado">
            <div className="rounded-tarjeta bg-primario-suave px-4 py-3 text-base font-semibold text-texto">
              <Texto>{respuesta.resultado}</Texto>
            </div>
          </Seccion>
        )}

        {respuesta.comprobacion && (
          <Seccion numero="6." titulo="Comprobación">
            <Texto>{respuesta.comprobacion}</Texto>
          </Seccion>
        )}

        {respuesta.recuerda.length > 0 && (
          <section className="rounded-tarjeta border border-acento/30 bg-acento-suave p-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-acento">
              ⭐ Recuerda
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-texto-suave">
              {respuesta.recuerda.map((r, n) => (
                <li key={n}>{r}</li>
              ))}
            </ul>
          </section>
        )}

        {respuesta.ejercicioSimilar && (
          <Seccion titulo="Practica con este">
            <Texto>{respuesta.ejercicioSimilar}</Texto>
          </Seccion>
        )}

        {respuesta.fuentes.length > 0 && (
          <Seccion titulo="Fuentes consultadas">
            <ul className="space-y-2 text-sm">
              {respuesta.fuentes.map((f, n) => (
                <li key={n}>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primario underline underline-offset-2"
                  >
                    {f.titulo}
                  </a>
                  {f.organismo && <span className="text-texto-tenue"> · {f.organismo}</span>}
                  {f.consultadaEn && (
                    <span className="text-texto-tenue"> · consultada el {f.consultadaEn}</span>
                  )}
                  {f.queAfirma && <p className="text-texto-suave">{f.queAfirma}</p>}
                </li>
              ))}
            </ul>
          </Seccion>
        )}
      </div>
    </article>
  );
}
