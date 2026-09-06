'use client';

import { useMemo, useState } from 'react';
import { PanelConsulta, type ConsultaEscrita } from './PanelConsulta';
import { Texto } from './VistaRespuesta';
import { Icono } from './ui/Icono';
import type { MaterialGenerado, PreguntaMaterial } from '@/lib/ai/schemas';
import { paraAlumno, puntuacionTotal, type MaterialAlumno } from '@/lib/material';

/**
 * Material generado: ejercicios, examen, test, resumen o plan de estudio.
 *
 * La decisión que manda aquí: cada pregunta lleva su solución al lado, a un
 * clic. Un examen sin respuestas no le sirve de nada a quien estudia solo en
 * casa; lo que necesita es intentarlo, darle a «Ver solución» y comprobarse. La
 * separación entre cuadernillo y solucionario sigue existiendo, pero donde
 * importa de verdad: al IMPRIMIR. El cuadernillo en papel se construye desde
 * `paraAlumno()`, un objeto del que las soluciones han desaparecido, así que no
 * pueden colarse en la hoja que se reparte en clase.
 */

export interface ConsultaSobrePregunta extends ConsultaEscrita {
  numero: number;
  enunciado: string;
  solucionPropuesta: string;
  tituloMaterial: string;
}

type ModoImpresion = 'sin_soluciones' | 'con_soluciones';

/** Un plan de estudio o un resumen no se corrigen: no se habla de «solución». */
export function vocabularioDe(material: MaterialGenerado): {
  elemento: string;
  elementos: string;
  respuesta: string;
  /** Ya en plural y en minúscula: pegarle una «s» daba «solucións». */
  verTodas: string;
  verRespuesta: string;
  esCuestionario: boolean;
} {
  const sinPuntos = material.preguntas.every((p) => p.puntuacion === 0);

  // Una sesión de estudio trae "cómo saber si te ha salido bien", no una
  // solución; llamarlo igual que en un examen confundiría al alumno.
  if (sinPuntos && material.preguntas.length > 0 && /plan|sesi/i.test(material.titulo)) {
    return {
      elemento: 'sesión',
      elementos: 'sesiones',
      respuesta: 'Cómo sabrás que te ha salido bien',
      verTodas: 'Ver todos los objetivos',
      verRespuesta: 'Ver el objetivo',
      esCuestionario: false,
    };
  }
  if (sinPuntos) {
    return {
      elemento: 'apartado',
      elementos: 'apartados',
      respuesta: 'Contenido del apartado',
      verTodas: 'Desplegar todos los apartados',
      verRespuesta: 'Ver el contenido',
      esCuestionario: false,
    };
  }
  return {
    elemento: 'pregunta',
    elementos: 'preguntas',
    respuesta: 'Solución',
    verTodas: 'Ver todas las soluciones',
    verRespuesta: 'Ver solución',
    esCuestionario: true,
  };
}

export function VistaMaterial({
  material,
  onPreguntar,
  ocupado = false,
}: {
  material: MaterialGenerado;
  /** Sin esto no se ofrece preguntar: no habría dónde recibir la respuesta. */
  onPreguntar?: (consulta: ConsultaSobrePregunta) => void;
  ocupado?: boolean;
}) {
  const voz = useMemo(() => vocabularioDe(material), [material]);
  const [abiertas, setAbiertas] = useState<ReadonlySet<number>>(new Set());
  const [consultando, setConsultando] = useState<number | null>(null);
  const [impresion, setImpresion] = useState<ModoImpresion>('sin_soluciones');

  const total = puntuacionTotal(material);
  const todasAbiertas = abiertas.size === material.preguntas.length;

  function alternar(numero: number) {
    setAbiertas((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(numero)) siguiente.delete(numero);
      else siguiente.add(numero);
      return siguiente;
    });
  }

  function imprimir(modo: ModoImpresion) {
    setImpresion(modo);
    // Un fotograma para que el bloque de impresión correcto esté ya en el DOM.
    requestAnimationFrame(() => window.print());
  }

  return (
    <section>
      {/* ---------- Pantalla ---------- */}
      <div className="print:hidden">
        <header>
          <h2 className="text-lg font-bold leading-snug text-texto sm:text-xl">{material.titulo}</h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
            {[
              material.tema,
              `${material.preguntas.length} ${voz.elementos}`,
              total > 0 ? `${total} puntos` : null,
              material.duracionMinutos ? `${material.duracionMinutos} min` : null,
            ]
              .filter(Boolean)
              .map((t) => (
                <span
                  key={t as string}
                  className="rounded-full border border-borde bg-superficie-2 px-2.5 py-0.5 text-texto-suave"
                >
                  {t}
                </span>
              ))}
          </div>
        </header>

        {material.instrucciones && (
          <p className="mt-3 whitespace-pre-wrap rounded-xl bg-superficie-2 px-3 py-2.5 text-sm text-texto-suave">
            {material.instrucciones}
          </p>
        )}

        {/* Cómo se usa esto. Una línea, para que nadie tenga que adivinarlo. */}
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-primario/25 bg-primario-suave px-3 py-2.5 text-sm text-texto-suave">
          <Icono nombre="comprobado" className="mt-0.5 h-4 w-4 shrink-0 text-primario" />
          <span>
            {voz.esCuestionario ? (
              <>
                Inténtalo tú primero y luego dale a <strong className="text-texto">{voz.verRespuesta}</strong>{' '}
                para comprobarte.
              </>
            ) : (
              <>
                Dale a <strong className="text-texto">{voz.verRespuesta}</strong> en cada{' '}
                {voz.elemento} para ver el detalle.
              </>
            )}
            {onPreguntar && (
              <>
                {' '}
                Si algo no te sale, pulsa <strong className="text-texto">Preguntar</strong>: puedes
                escribir tu duda y añadir una foto de lo que has hecho.
              </>
            )}
          </span>
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <BotonBarra
            onClick={() =>
              setAbiertas(
                todasAbiertas ? new Set() : new Set(material.preguntas.map((p) => p.numero)),
              )
            }
            icono={todasAbiertas ? 'cerrar' : 'lupa'}
          >
            {todasAbiertas ? 'Ocultar todas' : voz.verTodas}
          </BotonBarra>

          <span className="ml-auto flex flex-wrap gap-1.5">
            <BotonBarra onClick={() => imprimir('sin_soluciones')} icono="imprimir">
              Imprimir en blanco
            </BotonBarra>
            <BotonBarra onClick={() => imprimir('con_soluciones')} icono="imprimir">
              Imprimir con soluciones
            </BotonBarra>
          </span>
        </div>

        <ol className="mt-4 space-y-2.5">
          {material.preguntas.map((p) => (
            <Pregunta
              key={p.numero}
              pregunta={p}
              voz={voz}
              abierta={abiertas.has(p.numero)}
              onAlternar={() => alternar(p.numero)}
              consultando={consultando === p.numero}
              onConsultar={
                onPreguntar
                  ? () => setConsultando((n) => (n === p.numero ? null : p.numero))
                  : undefined
              }
              onDesarrollar={
                onPreguntar
                  ? () =>
                      onPreguntar({
                        texto:
                          'Explícame esta pregunta paso a paso, como si fuera la primera vez que la veo.',
                        imagenes: [],
                        numero: p.numero,
                        enunciado: p.enunciado,
                        solucionPropuesta: p.solucion,
                        tituloMaterial: material.titulo,
                      })
                  : undefined
              }
              ocupado={ocupado}
              onEnviarConsulta={(consulta) => {
                setConsultando(null);
                onPreguntar?.({
                  ...consulta,
                  numero: p.numero,
                  enunciado: p.enunciado,
                  solucionPropuesta: p.solucion,
                  tituloMaterial: material.titulo,
                });
              }}
            />
          ))}
        </ol>

        {material.loQueHayQueAprender.length > 0 && (
          <section className="mt-4 rounded-tarjeta border border-acento/30 bg-acento-suave px-4 py-3">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-acento">
              <Icono nombre="estrella" className="h-4 w-4 shrink-0" />
              Lo que tengo que aprender sí o sí
            </h3>
            <ul className="mt-1.5 space-y-1 text-sm text-texto-suave">
              {material.loQueHayQueAprender.map((x, n) => (
                <li key={n} className="flex gap-2">
                  <span aria-hidden="true" className="text-acento">
                    ·
                  </span>
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {material.notasDidacticas.length > 0 && (
          <details className="mt-2.5 rounded-tarjeta border border-borde px-4 py-3">
            <summary className="cursor-pointer text-sm font-medium text-texto-suave">
              Para quien te ayude en casa o en clase
            </summary>
            <ul className="mt-2 space-y-1 text-sm text-texto-suave">
              {material.notasDidacticas.map((x, n) => (
                <li key={n} className="flex gap-2">
                  <span aria-hidden="true">·</span>
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </details>
        )}

        <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-texto-tenue">
          <Icono nombre="aviso" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Los enunciados y sus soluciones los he generado yo y no han pasado por la comprobación
          que sí hago al resolver: si una solución te chirría, pulsa «Preguntar» y la rehago paso a
          paso.
        </p>
      </div>

      {/* ---------- Papel ---------- */}
      <div className="hidden print:block">
        {impresion === 'sin_soluciones' ? (
          <HojaEnBlanco material={paraAlumno(material)} />
        ) : (
          <HojaConSoluciones material={material} voz={voz} />
        )}
      </div>
    </section>
  );
}

function BotonBarra({
  children,
  onClick,
  icono,
}: {
  children: React.ReactNode;
  onClick: () => void;
  icono: 'lupa' | 'cerrar' | 'imprimir';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-borde bg-superficie px-3 text-xs font-semibold text-texto-suave transition hover:border-primario/45 hover:text-texto"
    >
      <Icono nombre={icono} className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

function Pregunta({
  pregunta,
  voz,
  abierta,
  onAlternar,
  consultando,
  onConsultar,
  onDesarrollar,
  onEnviarConsulta,
  ocupado,
}: {
  pregunta: PreguntaMaterial;
  voz: ReturnType<typeof vocabularioDe>;
  abierta: boolean;
  onAlternar: () => void;
  consultando: boolean;
  onConsultar?: () => void;
  onDesarrollar?: () => void;
  onEnviarConsulta: (consulta: ConsultaEscrita) => void;
  ocupado: boolean;
}) {
  const idSolucion = `solucion-${pregunta.numero}`;

  return (
    <li className="rounded-tarjeta border border-borde bg-superficie">
      <div className="flex items-start gap-3 p-3.5">
        <span
          aria-hidden="true"
          className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primario-suave text-sm font-bold text-primario"
        >
          {pregunta.numero}
        </span>

        <div className="min-w-0 flex-1">
          <p className="whitespace-pre-wrap text-texto">{pregunta.enunciado}</p>
          {pregunta.puntuacion > 0 && (
            <p className="mt-1 text-xs text-texto-tenue">{pregunta.puntuacion} puntos</p>
          )}
        </div>

        {/* El botón que pidió el usuario: a la derecha de cada pregunta. */}
        <div className="flex shrink-0 flex-col items-end gap-1">
          <button
            type="button"
            onClick={onAlternar}
            aria-expanded={abierta}
            aria-controls={idSolucion}
            className={[
              'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition',
              abierta
                ? 'border-exito/40 bg-exito-suave text-exito'
                : 'border-borde-fuerte bg-superficie text-texto-suave hover:border-primario/45 hover:text-primario',
            ].join(' ')}
          >
            <Icono nombre={abierta ? 'comprobado' : 'lupa'} className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{abierta ? 'Ocultar' : voz.verRespuesta}</span>
            <span className="sm:hidden">{abierta ? 'Ocultar' : 'Ver'}</span>
          </button>

          {onConsultar && (
            <button
              type="button"
              onClick={onConsultar}
              aria-expanded={consultando}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium text-texto-tenue transition hover:text-primario"
            >
              <Icono nombre="chat" className="h-3.5 w-3.5" />
              Preguntar
            </button>
          )}
        </div>
      </div>

      {abierta && (
        <div id={idSolucion} className="border-t border-borde px-3.5 py-3">
          <div className="rounded-xl border-l-[3px] border-exito bg-exito-suave/60 px-3 py-2.5">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.09em] text-exito">
              {voz.respuesta}
            </p>
            {pregunta.solucion ? (
              <Texto className="mt-1 text-sm text-texto-suave">{pregunta.solucion}</Texto>
            ) : (
              <p className="mt-1 text-sm text-texto-suave">
                Esta me la he dejado sin resolver. Dale a «Explícamela paso a paso» y te la saco
                entera, que así además pasa por la comprobación.
              </p>
            )}

            {/*
              La salida siempre está a la vista. Una solución de una línea a veces
              basta y a veces se queda corta, y no hay forma fiable de saber
              cuál es cuál desde aquí: en lugar de adivinarlo con una heurística,
              se ofrece siempre. Además, lo que sale por aquí sí pasa por el
              recálculo aritmético y el revisor, que esta solución no ha visto.
            */}
            {onDesarrollar && (
              <button
                type="button"
                onClick={onDesarrollar}
                className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-full border border-exito/40 bg-superficie px-3 text-xs font-semibold text-exito transition hover:bg-exito-suave"
              >
                <Icono nombre="lapiz" className="h-3.5 w-3.5" />
                Explícamela paso a paso
              </button>
            )}
          </div>

          {pregunta.criterioCorreccion && (
            <div className="mt-2 rounded-xl bg-superficie-2 px-3 py-2.5">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.09em] text-texto-tenue">
                Cómo se puntúa
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-texto-suave">
                {pregunta.criterioCorreccion}
              </p>
            </div>
          )}
        </div>
      )}

      {consultando && (
        <div className="border-t border-borde p-3.5">
          <PanelConsulta
            marcador="¿Qué no te sale? Puedes escribir tu respuesta para que te la corrija, o preguntar por dónde empezar."
            textoBoton="Preguntar sobre esta"
            ocupado={ocupado}
            onEnviar={onEnviarConsulta}
          />
        </div>
      )}
    </li>
  );
}

// --- Versiones para papel -----------------------------------------------------

function CabeceraPapel({
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

/**
 * Cuadernillo para repartir. Recibe un `MaterialAlumno`, del que las soluciones
 * han desaparecido en `paraAlumno()`: aquí no hay nada que ocultar porque no
 * hay nada que enseñar.
 */
function HojaEnBlanco({ material }: { material: MaterialAlumno }) {
  return (
    <article className="hoja">
      <CabeceraPapel
        titulo={material.titulo}
        tema={material.tema}
        subtitulo="Cuadernillo del alumno"
      />

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-texto-suave">
        <span>Nombre: ______________________________</span>
        {material.duracionMinutos && <span>Duración: {material.duracionMinutos} min</span>}
        {material.puntuacionTotal > 0 && <span>Total: {material.puntuacionTotal} puntos</span>}
      </div>

      {material.instrucciones && (
        <p className="mt-4 whitespace-pre-wrap text-sm text-texto-suave">{material.instrucciones}</p>
      )}

      <ol className="mt-5 space-y-6">
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
        <section className="mt-6 border-t border-borde pt-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-texto-tenue">
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

function HojaConSoluciones({
  material,
  voz,
}: {
  material: MaterialGenerado;
  voz: ReturnType<typeof vocabularioDe>;
}) {
  return (
    <article className="hoja">
      <CabeceraPapel
        titulo={material.titulo}
        tema={material.tema}
        subtitulo="Con las soluciones"
      />

      <p className="mt-3 text-sm text-texto-suave">
        Puntuación total: {puntuacionTotal(material)} puntos. Revisa las soluciones antes de
        repartir este documento: están generadas automáticamente.
      </p>

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
              <div className="mt-2 border-l-[3px] border-exito pl-3">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-exito">
                  {voz.respuesta}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-texto-suave">{p.solucion}</p>
              </div>
            )}

            {p.criterioCorreccion && (
              <p className="mt-2 whitespace-pre-wrap text-sm text-texto-tenue">
                Cómo se puntúa: {p.criterioCorreccion}
              </p>
            )}
          </li>
        ))}
      </ol>

      {material.loQueHayQueAprender.length > 0 && (
        <section className="mt-6 border-t border-borde pt-4">
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

      {material.notasDidacticas.length > 0 && (
        <section className="mt-4 border-t border-borde pt-4">
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
    </article>
  );
}
