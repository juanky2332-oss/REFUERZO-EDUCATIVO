'use client';

import { useState } from 'react';
import { InsigniaConfianza } from './InsigniaConfianza';
import { Icono, type NombreIcono } from './ui/Icono';
import { Boton } from './ui/primitivos';
import type { CorreccionAlumno, RespuestaEducativa } from '@/lib/types';

/**
 * Respuesta educativa.
 *
 * El problema que resuelve esta pantalla no es qué información se da, sino
 * cuánta cabe de un vistazo. Antes se apilaban seis secciones y había que
 * arrastrar el ratón hasta el final para saber siquiera el resultado. Ahora:
 *
 *  - Lo que el alumno busca —el resultado y si me puedo fiar— está arriba,
 *    visible sin tocar nada.
 *  - El resto se reparte en pestañas, así que la tarjeta ocupa una pantalla en
 *    lugar de cinco.
 *  - La resolución se puede leer paso a paso, de uno en uno, que es como se
 *    copia en el cuaderno.
 *
 * Lo que NO cambia: las incertidumbres van antes que el resultado, siempre
 * visibles y fuera de las pestañas. Nunca pueden quedar escondidas detrás de un
 * clic, porque son justo lo que el alumno no debe copiar sin contrastar.
 */

const ESTILO_CORRECCION: Record<
  CorreccionAlumno['estado'],
  { etiqueta: string; icono: NombreIcono; chip: string; borde: string }
> = {
  correcto: {
    etiqueta: 'Lo tienes bien',
    icono: 'comprobado',
    chip: 'bg-exito-suave text-exito',
    borde: 'border-exito/35',
  },
  parcial: {
    etiqueta: 'Casi: falla una parte',
    icono: 'aviso',
    chip: 'bg-aviso-suave text-aviso',
    borde: 'border-aviso/40',
  },
  incorrecto: {
    etiqueta: 'No es correcto',
    icono: 'cerrar',
    chip: 'bg-error-suave text-error',
    borde: 'border-error/35',
  },
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
export function Texto({ children, className = '' }: { children: string; className?: string }) {
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

type ClavePestana = 'pasos' | 'planteamiento' | 'repaso';

interface Pestana {
  clave: ClavePestana;
  texto: string;
  icono: NombreIcono;
  contador?: number;
}

/**
 * Pestañas visibles de una respuesta, en el orden en que se muestran.
 *
 * Se calcula aparte para poder probarlo: una respuesta sin pasos no debe
 * enseñar una pestaña «Pasos» vacía, y la pestaña abierta al llegar tiene que
 * ser siempre una que tenga contenido.
 *
 * La comprobación no está aquí a propósito: va junto al resultado, siempre a la
 * vista. Es la razón por la que el alumno se puede fiar del número que va a
 * copiar; esconderla detrás de un clic la convertiría en letra pequeña.
 */
export function pestanasDe(r: RespuestaEducativa): Pestana[] {
  const p: Pestana[] = [];
  if (r.pasos.length > 0) {
    p.push({ clave: 'pasos', texto: 'Pasos', icono: 'lapiz', contador: r.pasos.length });
  }
  if (r.datos.length > 0 || r.comoLoHacemos) {
    p.push({ clave: 'planteamiento', texto: 'Planteamiento', icono: 'lupa' });
  }
  if (r.recuerda.length > 0 || r.ejercicioSimilar || r.fuentes.length > 0) {
    p.push({ clave: 'repaso', texto: 'Repaso', icono: 'estrella' });
  }
  return p;
}

/** Con pocos pasos se enseñan todos: navegar entre tres cosas sólo estorba. */
export function empiezaConTodosLosPasos(numeroDePasos: number): boolean {
  return numeroDePasos <= 3;
}

function Panel({
  activo,
  children,
}: {
  activo: boolean;
  children: React.ReactNode;
}) {
  // Al imprimir se enseña todo: el papel no tiene pestañas.
  return <div className={activo ? '' : 'hidden print:block'}>{children}</div>;
}

function Etiqueta({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[0.7rem] font-bold uppercase tracking-[0.09em] text-texto-tenue">
      {children}
    </p>
  );
}

function ListaDePasos({
  pasos,
  className = '',
}: {
  pasos: RespuestaEducativa['pasos'];
  className?: string;
}) {
  return (
    <ol className={`space-y-4 ${className}`}>
      {pasos.map((p, n) => (
        <li key={n} className="flex gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primario-suave text-xs font-bold text-primario"
          >
            {n + 1}
          </span>
          <div className="min-w-0 flex-1">
            {p.titulo && <p className="font-semibold text-texto">{p.titulo}</p>}
            <Texto className="mt-0.5 text-texto-suave">{p.contenido}</Texto>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Pasos({ pasos }: { pasos: RespuestaEducativa['pasos'] }) {
  const [todos, setTodos] = useState(() => empiezaConTodosLosPasos(pasos.length));
  const [actual, setActual] = useState(0);
  const indice = Math.min(actual, pasos.length - 1);

  return (
    <div>
      {todos ? (
        <ListaDePasos pasos={pasos} />
      ) : (
        <div className="print:hidden">
          <div className="min-h-[7rem]" aria-live="polite">
            <Etiqueta>
              Paso {indice + 1} de {pasos.length}
            </Etiqueta>
            {pasos[indice].titulo && (
              <p className="mt-1 text-base font-semibold text-texto">{pasos[indice].titulo}</p>
            )}
            <Texto className="mt-1 text-texto-suave">{pasos[indice].contenido}</Texto>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActual(indice - 1)}
              disabled={indice === 0}
              className="grid h-10 w-10 place-items-center rounded-xl border border-borde text-texto-suave transition hover:border-primario/40 hover:text-texto disabled:opacity-35"
              aria-label="Paso anterior"
            >
              <Icono nombre="flecha" className="h-4 w-4 rotate-180" />
            </button>

            <div
              className="flex flex-1 gap-1"
              role="group"
              aria-label={`Ir a un paso de ${pasos.length}`}
            >
              {pasos.map((p, n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setActual(n)}
                  aria-label={`Paso ${n + 1}${p.titulo ? `: ${p.titulo}` : ''}`}
                  aria-current={n === indice}
                  className={`h-1.5 flex-1 rounded-full transition ${
                    n === indice
                      ? 'bg-primario'
                      : n < indice
                        ? 'bg-primario/40'
                        : 'bg-borde hover:bg-borde-fuerte'
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setActual(indice + 1)}
              disabled={indice === pasos.length - 1}
              className="grid h-10 w-10 place-items-center rounded-xl border border-borde text-texto-suave transition hover:border-primario/40 hover:text-texto disabled:opacity-35"
              aria-label="Paso siguiente"
            >
              <Icono nombre="flecha" className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Leerlos de uno en uno es cómodo en pantalla; en papel harían falta
          cuatro folios en blanco. Al imprimir siempre va la resolución entera. */}
      {!todos && <ListaDePasos pasos={pasos} className="hidden print:block" />}

      {pasos.length > 3 && (
        <button
          type="button"
          onClick={() => setTodos((v) => !v)}
          className="no-imprimir mt-3 text-sm font-medium text-primario underline underline-offset-2"
        >
          {todos ? 'Verlos de uno en uno' : `Ver los ${pasos.length} pasos seguidos`}
        </button>
      )}
    </div>
  );
}

export function VistaRespuesta({ respuesta }: { respuesta: RespuestaEducativa }) {
  const pestanas = pestanasDe(respuesta);
  const [abierta, setAbierta] = useState<ClavePestana>(pestanas[0]?.clave ?? 'pasos');
  const [copiado, setCopiado] = useState(false);
  const c = respuesta.correccion;

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
      <header className="border-b border-borde px-4 py-3.5 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <h2 className="min-w-0 flex-1 text-base font-bold leading-snug tracking-tight text-texto sm:text-lg">
            {respuesta.titulo}
          </h2>
          <InsigniaConfianza confianza={respuesta.confianza} />
        </div>
        {respuesta.queNosPiden && (
          <p className="mt-1 text-sm leading-snug text-texto-suave">{respuesta.queNosPiden}</p>
        )}
      </header>

      {/* Lo que no se ha podido confirmar. Fuera de las pestañas a propósito. */}
      {respuesta.incertidumbres.length > 0 && (
        <div className="border-b border-aviso/30 bg-aviso-suave px-4 py-3 sm:px-5" role="note">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-aviso">
            <Icono nombre="aviso" className="h-4 w-4 shrink-0" />
            Ojo antes de copiarlo
          </p>
          <ul className="mt-1 space-y-1 text-sm text-texto-suave">
            {respuesta.incertidumbres.map((i, n) => (
              <li key={n} className="flex gap-2">
                <span aria-hidden="true">·</span>
                <span>{i}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="px-4 py-4 sm:px-5">
        {/* Corrección: cuando el alumno manda lo que ha hecho, esto es la respuesta. */}
        {c && (
          <div className={`mb-4 rounded-tarjeta border p-3.5 ${ESTILO_CORRECCION[c.estado].borde}`}>
            <p
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-bold ${ESTILO_CORRECCION[c.estado].chip}`}
            >
              <Icono nombre={ESTILO_CORRECCION[c.estado].icono} className="h-4 w-4" />
              {ESTILO_CORRECCION[c.estado].etiqueta}
            </p>

            {c.explicacion && (
              <Texto className="mt-2 text-sm text-texto-suave">{c.explicacion}</Texto>
            )}

            {(c.queHizoBien.length > 0 || c.dondeFalla.length > 0) && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {c.queHizoBien.length > 0 && (
                  <div>
                    <Etiqueta>Bien hecho</Etiqueta>
                    <ul className="mt-1 space-y-1 text-sm text-texto-suave">
                      {c.queHizoBien.map((x, n) => (
                        <li key={n} className="flex gap-1.5">
                          <Icono
                            nombre="comprobado"
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-exito"
                          />
                          <span>{x}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {c.dondeFalla.length > 0 && (
                  <div>
                    <Etiqueta>Dónde se tuerce</Etiqueta>
                    <ul className="mt-1 space-y-1 text-sm text-texto-suave">
                      {c.dondeFalla.map((x, n) => (
                        <li key={n} className="flex gap-1.5">
                          <Icono nombre="aviso" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-aviso" />
                          <span>{x}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* El resultado, arriba y grande: es lo primero que se busca. */}
        {respuesta.resultado && (
          <div className="rounded-tarjeta border border-primario/30 bg-primario-suave px-4 py-3">
            <Etiqueta>Resultado</Etiqueta>
            <div className="mt-0.5 text-lg font-bold leading-snug text-texto sm:text-xl">
              <Texto>{respuesta.resultado}</Texto>
            </div>
          </div>
        )}

        {respuesta.comprobacion && (
          <details
            open
            className="group mt-2 rounded-tarjeta border border-exito/25 bg-exito-suave px-3.5 py-2.5 open:pb-3"
          >
            <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-exito">
              <Icono nombre="comprobado" className="h-4 w-4 shrink-0" />
              Así se comprueba que está bien
              <Icono
                nombre="flecha"
                className="ml-auto h-3.5 w-3.5 rotate-90 transition group-open:-rotate-90"
              />
            </summary>
            <Texto className="mt-1.5 text-sm text-texto-suave">{respuesta.comprobacion}</Texto>
          </details>
        )}

        {pestanas.length > 0 && (
          <>
            <div
              role="tablist"
              aria-label="Partes de la explicación"
              className="no-imprimir mt-4 flex gap-1 overflow-x-auto rounded-xl bg-superficie-2 p-1"
            >
              {pestanas.map((p) => {
                const activa = abierta === p.clave;
                return (
                  <button
                    key={p.clave}
                    type="button"
                    role="tab"
                    aria-selected={activa}
                    onClick={() => setAbierta(p.clave)}
                    className={[
                      'inline-flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-sm font-semibold transition',
                      activa
                        ? 'bg-superficie text-primario shadow-[0_1px_3px_rgba(19,26,43,.12)]'
                        : 'text-texto-tenue hover:text-texto',
                    ].join(' ')}
                  >
                    <Icono nombre={p.icono} className="h-4 w-4" />
                    {p.texto}
                    {p.contador !== undefined && (
                      <span className="tabular-nums opacity-60">{p.contador}</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4">
              {respuesta.pasos.length > 0 && (
                <Panel activo={abierta === 'pasos'}>
                  <Pasos pasos={respuesta.pasos} />
                </Panel>
              )}

              {(respuesta.datos.length > 0 || respuesta.comoLoHacemos) && (
                <Panel activo={abierta === 'planteamiento'}>
                  {respuesta.datos.length > 0 && (
                    <div>
                      <Etiqueta>Datos</Etiqueta>
                      <ul className="mt-1 flex flex-wrap gap-1.5">
                        {respuesta.datos.map((d, n) => (
                          <li
                            key={n}
                            className={`rounded-lg border border-borde bg-superficie-2 px-2.5 py-1 text-sm text-texto-suave ${
                              esLineaDeFormula(d) ? 'formula' : ''
                            }`}
                          >
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {respuesta.comoLoHacemos && (
                    <div className={respuesta.datos.length > 0 ? 'mt-3' : ''}>
                      <Etiqueta>Cómo lo hacemos</Etiqueta>
                      <Texto className="mt-1 text-texto-suave">{respuesta.comoLoHacemos}</Texto>
                    </div>
                  )}
                </Panel>
              )}

              {(respuesta.recuerda.length > 0 ||
                respuesta.ejercicioSimilar ||
                respuesta.fuentes.length > 0) && (
                <Panel activo={abierta === 'repaso'}>
                  {respuesta.recuerda.length > 0 && (
                    <div className="rounded-tarjeta border border-acento/30 bg-acento-suave px-3.5 py-3">
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-acento">
                        <Icono nombre="estrella" className="h-4 w-4 shrink-0" />
                        Quédate con esto
                      </p>
                      <ul className="mt-1.5 space-y-1 text-sm text-texto-suave">
                        {respuesta.recuerda.map((r, n) => (
                          <li key={n} className="flex gap-2">
                            <span aria-hidden="true" className="text-acento">
                              ·
                            </span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {respuesta.ejercicioSimilar && (
                    <div className={respuesta.recuerda.length > 0 ? 'mt-3' : ''}>
                      <Etiqueta>Practica con este</Etiqueta>
                      <Texto className="mt-1 text-texto-suave">{respuesta.ejercicioSimilar}</Texto>
                    </div>
                  )}

                  {respuesta.fuentes.length > 0 && (
                    <div className="mt-3">
                      <Etiqueta>Fuentes consultadas</Etiqueta>
                      <ul className="mt-1 space-y-2 text-sm">
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
                    </div>
                  )}
                </Panel>
              )}
            </div>
          </>
        )}

        <div className="no-imprimir mt-4 flex flex-wrap gap-1 border-t border-borde pt-3">
          <Boton variante="sutil" icono="copiar" onClick={() => void copiar()} type="button">
            {copiado ? 'Copiado' : 'Copiar'}
          </Boton>
          <Boton variante="sutil" icono="imprimir" type="button" onClick={() => window.print()}>
            Imprimir
          </Boton>
        </div>
      </div>
    </article>
  );
}
