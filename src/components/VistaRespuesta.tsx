'use client';

import { useState } from 'react';
import { InsigniaConfianza } from './InsigniaConfianza';
import { Icono, type NombreIcono } from './ui/Icono';
import { Boton } from './ui/primitivos';
import type { CorreccionAlumno, RespuestaEducativa } from '@/lib/types';

/**
 * Respuesta educativa estructurada (regla 31).
 *
 * El orden es deliberado: primero qué nos piden, luego el procedimiento y sólo
 * después el resultado. Las incertidumbres van ARRIBA, antes que el resultado:
 * si hay algo que no se ha podido confirmar, el alumno debe leerlo antes de
 * copiar el número en el cuaderno.
 */

const ESTILO_CORRECCION: Record<
  CorreccionAlumno['estado'],
  { etiqueta: string; icono: NombreIcono; clases: string }
> = {
  correcto: { etiqueta: 'Correcto', icono: 'comprobado', clases: 'bg-exito-suave text-exito' },
  parcial: {
    etiqueta: 'Parcialmente correcto',
    icono: 'aviso',
    clases: 'bg-aviso-suave text-aviso',
  },
  incorrecto: { etiqueta: 'Incorrecto', icono: 'cerrar', clases: 'bg-error-suave text-error' },
};

/**
 * Distingue una línea que es una expresión matemática de una que es prosa, para
 * poder darle tipografía monoespaciada. Es deliberadamente conservador: ante la
 * duda la trata como texto normal, porque equivocarse aquí sólo puede empeorar
 * la lectura.
 */
export function esLineaDeFormula(linea: string): boolean {
  const t = linea.trim();
  if (t.length < 2 || t.length > 90) return false;
  if (!/[=+\-*/×÷^√]/.test(t)) return false;
  if (!/\d/.test(t)) return false;

  const letras = (t.match(/[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]/g) ?? []).length;
  return letras / t.length < 0.35;
}

/** Conserva los saltos de línea y resalta las expresiones. Nunca interpreta HTML. */
function Texto({ children, className = '' }: { children: string; className?: string }) {
  const lineas = children.split('\n');

  return (
    <div className={className}>
      {lineas.map((linea, i) =>
        esLineaDeFormula(linea) ? (
          <p key={i} className="my-1.5 overflow-x-auto">
            <span className="formula inline-block rounded-lg bg-superficie-2 px-2.5 py-1 font-medium text-texto">
              {linea.trim()}
            </span>
          </p>
        ) : (
          <p key={i} className={linea.trim() ? 'whitespace-pre-wrap' : 'h-2'}>
            {linea}
          </p>
        ),
      )}
    </div>
  );
}

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
      <h3 className="flex items-baseline gap-2 text-xs font-bold uppercase tracking-[0.08em] text-texto-tenue">
        {numero && <span className="text-primario">{numero}</span>}
        {titulo}
      </h3>
      <div className="mt-2 text-texto-suave">{children}</div>
    </section>
  );
}

/** Versión en texto plano, para copiar al cuaderno o a un mensaje. */
export function respuestaComoTexto(r: RespuestaEducativa): string {
  const partes = [r.titulo, ''];
  if (r.incertidumbres.length > 0) {
    partes.push('OJO:', ...r.incertidumbres.map((i) => `- ${i}`), '');
  }
  if (r.queNosPiden) partes.push('QUÉ NOS PIDEN', r.queNosPiden, '');
  if (r.datos.length > 0) partes.push('DATOS', ...r.datos.map((d) => `- ${d}`), '');
  if (r.comoLoHacemos) partes.push('CÓMO LO HACEMOS', r.comoLoHacemos, '');
  if (r.pasos.length > 0) {
    partes.push('RESOLUCIÓN');
    r.pasos.forEach((p, i) => partes.push(`${i + 1}. ${p.titulo}`, p.contenido));
    partes.push('');
  }
  if (r.resultado) partes.push('RESULTADO', r.resultado, '');
  if (r.comprobacion) partes.push('COMPROBACIÓN', r.comprobacion, '');
  if (r.recuerda.length > 0) partes.push('RECUERDA', ...r.recuerda.map((x) => `- ${x}`));
  return partes.join('\n').trim();
}

export function VistaRespuesta({ respuesta }: { respuesta: RespuestaEducativa }) {
  const c = respuesta.correccion;
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(respuestaComoTexto(respuesta));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    } catch {
      // Algunos navegadores no dan acceso al portapapeles sin HTTPS o permiso;
      // no es motivo para molestar al alumno con un error.
    }
  }

  return (
    <article className="hoja overflow-hidden rounded-tarjeta border border-borde bg-superficie shadow-[var(--sombra)]">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-borde bg-superficie-2/60 px-5 py-4 sm:px-7">
        <h2 className="text-xl font-bold tracking-tight text-texto sm:text-2xl">
          {respuesta.titulo}
        </h2>
        <InsigniaConfianza confianza={respuesta.confianza} />
      </header>

      <div className="px-5 py-5 sm:px-7 sm:py-6">
        {respuesta.incertidumbres.length > 0 && (
          <div className="rounded-tarjeta border border-aviso/40 bg-aviso-suave p-4" role="note">
            <p className="flex items-center gap-2 text-sm font-semibold text-aviso">
              <Icono nombre="aviso" className="h-4 w-4" />
              Antes de seguir, ten esto en cuenta
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-texto-suave">
              {respuesta.incertidumbres.map((i, n) => (
                <li key={n}>{i}</li>
              ))}
            </ul>
          </div>
        )}

        {c && (
          <div
            className={`rounded-tarjeta border border-borde p-4 ${respuesta.incertidumbres.length > 0 ? 'mt-4' : ''}`}
          >
            <p
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${ESTILO_CORRECCION[c.estado].clases}`}
            >
              <Icono nombre={ESTILO_CORRECCION[c.estado].icono} className="h-4 w-4" />
              Tu respuesta: {ESTILO_CORRECCION[c.estado].etiqueta}
            </p>

            {c.explicacion && (
              <Texto className="mt-3 text-sm text-texto-suave">{c.explicacion}</Texto>
            )}

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {c.queHizoBien.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-texto-tenue">
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
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-texto-tenue">
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
              <ul className="space-y-1">
                {respuesta.datos.map((d, n) => (
                  <li key={n} className="flex gap-2">
                    <span aria-hidden="true" className="text-primario">
                      ·
                    </span>
                    <span className={esLineaDeFormula(d) ? 'formula' : ''}>{d}</span>
                  </li>
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
                  <li key={n} className="relative flex gap-3.5">
                    <span className="flex flex-col items-center">
                      <span
                        aria-hidden="true"
                        className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primario-suave text-xs font-bold text-primario"
                      >
                        {n + 1}
                      </span>
                      {n < respuesta.pasos.length - 1 && (
                        <span aria-hidden="true" className="mt-1 w-px flex-1 bg-borde" />
                      )}
                    </span>
                    <div className="min-w-0 pb-1">
                      {p.titulo && <p className="font-semibold text-texto">{p.titulo}</p>}
                      <Texto className="mt-0.5">{p.contenido}</Texto>
                    </div>
                  </li>
                ))}
              </ol>
            </Seccion>
          )}

          {respuesta.resultado && (
            <Seccion numero="5." titulo="Resultado">
              <div className="rounded-tarjeta border border-primario/25 bg-primario-suave px-4 py-3 text-base font-semibold text-texto">
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
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-acento">
                <Icono nombre="estrella" className="h-4 w-4" />
                Recuerda
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

        <div className="no-imprimir mt-6 flex flex-wrap gap-2 border-t border-borde pt-4">
          <Boton variante="secundario" icono="copiar" onClick={() => void copiar()} type="button">
            {copiado ? 'Copiado' : 'Copiar explicación'}
          </Boton>
          <Boton
            variante="sutil"
            icono="imprimir"
            type="button"
            onClick={() => window.print()}
          >
            Imprimir
          </Boton>
        </div>
      </div>
    </article>
  );
}
