'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProgresoFases } from './ProgresoFases';
import { VistaRespuesta } from './VistaRespuesta';
import { ZonaImagenes } from './ZonaImagenes';
import type { ImagenPreparada } from '@/lib/cliente/imagenes';
import {
  CURSOS,
  MATERIAS,
  NIVELES,
  NIVEL_DESCRIPCION,
  type Analisis,
  type Curso,
  type EventoStream,
  type FasePipeline,
  type Materia,
  type MensajeHistorial,
  type Nivel,
  type RespuestaEducativa,
} from '@/lib/types';

/**
 * Pantalla de trabajo.
 *
 * Mantiene el contexto de la conversación: las preguntas de seguimiento
 * ("no entiendo el paso 2") viajan con el historial para que se entiendan como
 * parte del mismo ejercicio (regla 48).
 */

type Entrada =
  | { tipo: 'usuario'; id: string; texto: string; miniaturas: string[] }
  | { tipo: 'respuesta'; id: string; respuesta: RespuestaEducativa }
  | { tipo: 'necesita_datos'; id: string; mensaje: string; analisis: Analisis }
  | { tipo: 'error'; id: string; mensaje: string };

const ETIQUETA_MATERIA: Record<Materia, string> = {
  matematicas: 'Matemáticas',
  fisica_quimica: 'Física y Química',
  biologia_geologia: 'Biología y Geología',
  otra: 'Otra materia',
  desconocida: 'No lo sé / que lo detecte',
};

const ETIQUETA_CURSO: Record<Curso, string> = {
  '1eso': '1.º de ESO',
  '2eso': '2.º de ESO',
  otro: 'Otro curso',
  desconocido: 'No lo sé',
};

function nuevoId() {
  return Math.random().toString(36).slice(2, 10);
}

/** Resumen breve de una respuesta para arrastrarla como contexto sin gastar de más. */
function resumirParaHistorial(r: RespuestaEducativa): string {
  return [
    `Explicación dada: ${r.queNosPiden}`,
    r.pasos.length > 0 ? `Pasos: ${r.pasos.map((p, i) => `${i + 1}) ${p.titulo}`).join('; ')}` : '',
    r.resultado ? `Resultado: ${r.resultado}` : '',
  ]
    .filter(Boolean)
    .join('\n')
    .slice(0, 1500);
}

export function Resolver() {
  const parametros = useSearchParams();
  const modo = parametros.get('modo');

  const [texto, setTexto] = useState('');
  const [imagenes, setImagenes] = useState<ImagenPreparada[]>([]);
  const [nivel, setNivel] = useState<Nivel>('B');
  const [curso, setCurso] = useState<Curso>('desconocido');
  const [materia, setMateria] = useState<Materia>('desconocida');
  const [ajustesAbiertos, setAjustesAbiertos] = useState(false);

  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [enCurso, setEnCurso] = useState(false);
  const [faseActual, setFaseActual] = useState<FasePipeline | null>(null);
  const [fasesHechas, setFasesHechas] = useState<FasePipeline[]>([]);

  const abortar = useRef<AbortController | null>(null);
  const finRef = useRef<HTMLDivElement>(null);

  const hayConversacion = entradas.length > 0;

  const marcador = useMemo(() => {
    if (modo === 'corregir') {
      return 'Sube una foto de lo que has hecho y dime qué ejercicio era. Te digo si está bien y dónde falla.';
    }
    if (modo === 'foto') {
      return 'Si quieres, añade algo: «no entiendo el apartado b», «me sale 12 y creo que está mal»…';
    }
    return 'Escribe tu duda. Por ejemplo: «explícame las ecuaciones de primer grado» o «no entiendo por qué se cambia de signo».';
  }, [modo]);

  useEffect(() => {
    if (hayConversacion) finRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [entradas, hayConversacion]);

  useEffect(() => () => abortar.current?.abort(), []);

  const historial = useCallback((): MensajeHistorial[] => {
    const h: MensajeHistorial[] = [];
    for (const e of entradas) {
      if (e.tipo === 'usuario') h.push({ rol: 'usuario', texto: e.texto || '(envió una imagen)' });
      else if (e.tipo === 'respuesta')
        h.push({ rol: 'asistente', texto: resumirParaHistorial(e.respuesta) });
      else if (e.tipo === 'necesita_datos') h.push({ rol: 'asistente', texto: e.mensaje });
    }
    return h.slice(-8);
  }, [entradas]);

  const enviar = useCallback(async () => {
    if (enCurso) return;
    if (!texto.trim() && imagenes.length === 0) return;

    const control = new AbortController();
    abortar.current = control;

    setEntradas((prev) => [
      ...prev,
      {
        tipo: 'usuario',
        id: nuevoId(),
        texto: texto.trim(),
        miniaturas: imagenes.map((i) => i.previsualizacion),
      },
    ]);

    const cuerpo = {
      texto: texto.trim(),
      imagenes: imagenes.map((i) => ({ mime: i.mime, base64: i.base64, nombre: i.nombre })),
      nivel,
      curso,
      materia,
      historial: historial(),
    };

    setTexto('');
    setImagenes([]);
    setEnCurso(true);
    setFasesHechas([]);
    setFaseActual('analisis');

    try {
      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(cuerpo),
        signal: control.signal,
      });

      if (!res.body) throw new Error('sin cuerpo');

      const lector = res.body.getReader();
      const decodificador = new TextDecoder();
      let resto = '';

      for (;;) {
        const { done, value } = await lector.read();
        if (done) break;

        resto += decodificador.decode(value, { stream: true });
        const lineas = resto.split('\n');
        resto = lineas.pop() ?? '';

        for (const linea of lineas) {
          if (!linea.trim()) continue;
          let evento: EventoStream;
          try {
            evento = JSON.parse(linea) as EventoStream;
          } catch {
            continue;
          }
          procesarEvento(evento);
        }
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) {
        setEntradas((prev) => [
          ...prev,
          {
            tipo: 'error',
            id: nuevoId(),
            mensaje:
              'Se ha cortado la conexión antes de terminar. Comprueba tu conexión y vuelve a intentarlo.',
          },
        ]);
      }
    } finally {
      setEnCurso(false);
      setFaseActual(null);
      abortar.current = null;
    }

    function procesarEvento(evento: EventoStream) {
      switch (evento.tipo) {
        case 'fase':
          if (evento.estado === 'inicio') setFaseActual(evento.fase);
          else setFasesHechas((prev) => [...new Set([...prev, evento.fase])]);
          break;
        case 'respuesta':
          setEntradas((prev) => [
            ...prev,
            { tipo: 'respuesta', id: nuevoId(), respuesta: evento.respuesta },
          ]);
          break;
        case 'necesita_datos':
          setEntradas((prev) => [
            ...prev,
            {
              tipo: 'necesita_datos',
              id: nuevoId(),
              mensaje: evento.mensaje,
              analisis: evento.analisis,
            },
          ]);
          break;
        case 'error':
          setEntradas((prev) => [
            ...prev,
            { tipo: 'error', id: nuevoId(), mensaje: evento.mensaje },
          ]);
          break;
        default:
          break;
      }
    }
  }, [curso, enCurso, historial, imagenes, materia, nivel, texto]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      {!hayConversacion && (
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-texto sm:text-3xl">
            {modo === 'corregir'
              ? 'Corrige mi ejercicio'
              : modo === 'foto'
                ? 'Sube la foto del ejercicio'
                : 'Cuéntame qué no entiendes'}
          </h1>
          <p className="mt-2 text-texto-suave">
            Puedes enviar sólo una foto: si entiendo lo que se pide, me pongo con ello; y si algo no
            se lee bien, te lo digo en vez de inventármelo.
          </p>
        </header>
      )}

      <ol className="space-y-5">
        {entradas.map((e) => {
          if (e.tipo === 'usuario') {
            return (
              <li key={e.id} className="flex flex-col items-end gap-2">
                {e.miniaturas.length > 0 && (
                  <div className="flex flex-wrap justify-end gap-2">
                    {e.miniaturas.map((m, n) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={n}
                        src={m}
                        alt={`Imagen ${n + 1} que has enviado`}
                        className="h-20 w-20 rounded-lg border border-borde object-cover"
                      />
                    ))}
                  </div>
                )}
                {e.texto && (
                  <p className="max-w-[85%] whitespace-pre-wrap rounded-tarjeta bg-primario px-4 py-2.5 text-sobre-primario">
                    {e.texto}
                  </p>
                )}
              </li>
            );
          }

          if (e.tipo === 'respuesta') {
            return (
              <li key={e.id}>
                <VistaRespuesta respuesta={e.respuesta} />
                {e.respuesta.preguntaDeSeguimiento && (
                  <div className="no-imprimir mt-3 rounded-tarjeta border border-borde bg-superficie-2 p-4">
                    <p className="text-sm text-texto-suave">
                      {e.respuesta.preguntaDeSeguimiento}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {['No entiendo un paso', 'Ponme otro parecido', 'Explícamelo más fácil'].map(
                        (s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setTexto(s)}
                            className="min-h-9 rounded-full border border-borde-fuerte bg-superficie px-3 text-sm text-texto-suave hover:bg-superficie-2"
                          >
                            {s}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          }

          if (e.tipo === 'necesita_datos') {
            return (
              <li
                key={e.id}
                className="rounded-tarjeta border border-aviso/40 bg-aviso-suave p-5"
              >
                <h2 className="text-base font-semibold text-aviso">
                  Necesito que me aclares algo
                </h2>
                {e.analisis.resumenTarea && (
                  <p className="mt-1 text-sm text-texto-suave">
                    Lo que he entendido: {e.analisis.resumenTarea}
                  </p>
                )}
                <p className="mt-3 whitespace-pre-wrap text-sm text-texto">{e.mensaje}</p>
                {e.analisis.enunciado && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-medium text-texto-suave">
                      Ver lo que he conseguido leer
                    </summary>
                    <p className="mt-2 whitespace-pre-wrap rounded-lg bg-superficie p-3 text-sm text-texto-suave">
                      {e.analisis.enunciado}
                    </p>
                  </details>
                )}
              </li>
            );
          }

          return (
            <li
              key={e.id}
              role="alert"
              className="rounded-tarjeta border border-error/30 bg-error-suave p-5 text-sm text-error"
            >
              {e.mensaje}
            </li>
          );
        })}
      </ol>

      {enCurso && (
        <div className="mt-5">
          <ProgresoFases completadas={fasesHechas} actual={faseActual} />
        </div>
      )}

      <div ref={finRef} />

      <form
        className="no-imprimir sticky bottom-0 mt-6 rounded-tarjeta border border-borde bg-superficie p-4 shadow-[0_-8px_24px_-20px_rgba(0,0,0,0.4)]"
        onSubmit={(e) => {
          e.preventDefault();
          void enviar();
        }}
      >
        <label htmlFor="pregunta" className="sr-only">
          Tu pregunta
        </label>
        <textarea
          id="pregunta"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void enviar();
            }
          }}
          rows={3}
          maxLength={8000}
          placeholder={marcador}
          disabled={enCurso}
          className="w-full resize-y rounded-lg border border-borde bg-superficie-2 p-3 text-texto placeholder:text-texto-tenue disabled:opacity-60"
        />

        <div className="mt-3">
          <ZonaImagenes imagenes={imagenes} onCambio={setImagenes} deshabilitado={enCurso} />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setAjustesAbiertos((v) => !v)}
            aria-expanded={ajustesAbiertos}
            className="min-h-11 rounded-lg px-3 text-sm font-medium text-texto-suave hover:bg-superficie-2"
          >
            Ajustes · Nivel {nivel}
            <span aria-hidden="true"> {ajustesAbiertos ? '▲' : '▼'}</span>
          </button>

          <div className="flex gap-2">
            {enCurso && (
              <button
                type="button"
                onClick={() => abortar.current?.abort()}
                className="min-h-11 rounded-lg border border-borde-fuerte px-4 text-sm font-medium text-texto-suave hover:bg-superficie-2"
              >
                Parar
              </button>
            )}
            <button
              type="submit"
              disabled={enCurso || (!texto.trim() && imagenes.length === 0)}
              className="min-h-11 rounded-lg bg-primario px-5 font-semibold text-sobre-primario hover:bg-primario-fuerte disabled:opacity-45"
            >
              {enCurso ? 'Trabajando…' : 'Ayúdame'}
            </button>
          </div>
        </div>

        {ajustesAbiertos && (
          <div className="mt-3 grid gap-4 border-t border-borde pt-4 sm:grid-cols-3">
            <div>
              <label htmlFor="curso" className="block text-sm font-medium text-texto">
                Curso
              </label>
              <select
                id="curso"
                value={curso}
                onChange={(e) => setCurso(e.target.value as Curso)}
                className="mt-1 min-h-11 w-full rounded-lg border border-borde bg-superficie-2 px-2 text-texto"
              >
                {CURSOS.map((c) => (
                  <option key={c} value={c}>
                    {ETIQUETA_CURSO[c]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="materia" className="block text-sm font-medium text-texto">
                Materia
              </label>
              <select
                id="materia"
                value={materia}
                onChange={(e) => setMateria(e.target.value as Materia)}
                className="mt-1 min-h-11 w-full rounded-lg border border-borde bg-superficie-2 px-2 text-texto"
              >
                {MATERIAS.map((m) => (
                  <option key={m} value={m}>
                    {ETIQUETA_MATERIA[m]}
                  </option>
                ))}
              </select>
            </div>

            <fieldset>
              <legend className="text-sm font-medium text-texto">Nivel de explicación</legend>
              <div className="mt-1 flex gap-1">
                {NIVELES.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNivel(n)}
                    aria-pressed={nivel === n}
                    title={`${NIVEL_DESCRIPCION[n].titulo}: ${NIVEL_DESCRIPCION[n].detalle}`}
                    className={[
                      'min-h-11 flex-1 rounded-lg border text-sm font-semibold',
                      nivel === n
                        ? 'border-primario bg-primario text-sobre-primario'
                        : 'border-borde bg-superficie-2 text-texto-suave hover:bg-superficie',
                    ].join(' ')}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-texto-tenue">
                {NIVEL_DESCRIPCION[nivel].titulo}: {NIVEL_DESCRIPCION[nivel].detalle}
              </p>
            </fieldset>
          </div>
        )}
      </form>
    </div>
  );
}
