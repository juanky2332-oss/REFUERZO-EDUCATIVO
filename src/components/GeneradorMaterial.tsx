'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { MaterialGenerado, PeticionGenerate } from '@/lib/ai/schemas';
import { paraAlumno, puntuacionTotal, type MaterialAlumno } from '@/lib/material';
import { TEMAS_ORIENTATIVOS } from '@/lib/curriculum';
import {
  NIVELES,
  NIVEL_DESCRIPCION,
  type Curso,
  type Materia,
  type Nivel,
} from '@/lib/types';

/**
 * Generador de material.
 *
 * Dos vistas mutuamente excluyentes: cuadernillo del alumno y solucionario del
 * profesor. La del alumno recibe un objeto sin soluciones (`paraAlumno`), de
 * modo que no puede enseñarlas ni al imprimir.
 */

type Tipo = PeticionGenerate['tipo'];

const TIPOS: { valor: Tipo; etiqueta: string; descripcion: string }[] = [
  { valor: 'ejercicios', etiqueta: 'Ejercicios', descripcion: 'Práctica graduada del tema.' },
  { valor: 'examen', etiqueta: 'Examen', descripcion: 'Simulacro sobre 10 puntos.' },
  { valor: 'resumen', etiqueta: 'Resumen', descripcion: 'El tema por apartados.' },
  { valor: 'ficha', etiqueta: 'Ficha', descripcion: 'Teoría breve y actividades.' },
  { valor: 'test', etiqueta: 'Test', descripcion: 'Preguntas de opción múltiple.' },
  { valor: 'plan_estudio', etiqueta: 'Plan de estudio', descripcion: 'Sesiones hasta el examen.' },
];

const MATERIAS_ELEGIBLES: { valor: Materia; etiqueta: string }[] = [
  { valor: 'matematicas', etiqueta: 'Matemáticas' },
  { valor: 'fisica_quimica', etiqueta: 'Física y Química' },
  { valor: 'biologia_geologia', etiqueta: 'Biología y Geología' },
];

const CURSOS_ELEGIBLES: { valor: Curso; etiqueta: string }[] = [
  { valor: '1eso', etiqueta: '1.º de ESO' },
  { valor: '2eso', etiqueta: '2.º de ESO' },
];

function esTipo(v: string | null): v is Tipo {
  return TIPOS.some((t) => t.valor === v);
}

export function GeneradorMaterial() {
  const parametros = useSearchParams();

  // El tipo inicial se deriva de la URL en el primer render: hacerlo en un
  // efecto provocaría un render en cascada (y lo señala el compilador de React).
  const [tipo, setTipo] = useState<Tipo>(() => {
    const t = parametros.get('tipo');
    return esTipo(t) ? t : 'ejercicios';
  });
  const [materia, setMateria] = useState<Materia>('matematicas');
  const [curso, setCurso] = useState<Curso>('1eso');
  const [tema, setTema] = useState('');
  const [nivel, setNivel] = useState<Nivel>('B');
  const [numero, setNumero] = useState(6);
  const [notas, setNotas] = useState('');

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [material, setMaterial] = useState<MaterialGenerado | null>(null);
  const [vista, setVista] = useState<'alumno' | 'profesor'>('alumno');

  const sugerencias =
    materia === 'matematicas' || materia === 'fisica_quimica' || materia === 'biologia_geologia'
      ? TEMAS_ORIENTATIVOS[materia]
      : [];

  async function generar() {
    if (tema.trim().length < 2) {
      setError('Escribe el tema sobre el que quieres el material.');
      return;
    }
    setCargando(true);
    setError(null);
    setMaterial(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          tipo,
          materia,
          curso,
          tema: tema.trim(),
          nivel,
          numeroPreguntas: numero,
          notas: notas.trim(),
        }),
      });

      const datos: unknown = await res.json();
      if (!res.ok) {
        const e = datos as { error?: string };
        setError(e.error ?? 'No he podido generar el material. Vuelve a intentarlo.');
        return;
      }

      const { material: generado } = datos as { material: MaterialGenerado };
      setMaterial(generado);
      setVista('alumno');
    } catch {
      setError('Se ha cortado la conexión. Comprueba tu red y vuelve a intentarlo.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <header className="no-imprimir">
        <h1 className="text-2xl font-bold tracking-tight text-texto sm:text-3xl">
          Crear material
        </h1>
        <p className="mt-2 text-texto-suave">
          Ejercicios, exámenes, resúmenes y planes de estudio. El cuadernillo del alumno y el
          solucionario van siempre por separado.
        </p>
      </header>

      <form
        className="no-imprimir mt-6 rounded-tarjeta border border-borde bg-superficie p-5"
        onSubmit={(e) => {
          e.preventDefault();
          void generar();
        }}
      >
        <fieldset>
          <legend className="text-sm font-semibold text-texto">¿Qué quieres crear?</legend>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {TIPOS.map((t) => (
              <button
                key={t.valor}
                type="button"
                onClick={() => setTipo(t.valor)}
                aria-pressed={tipo === t.valor}
                className={[
                  'min-h-16 rounded-lg border p-2.5 text-left',
                  tipo === t.valor
                    ? 'border-primario bg-primario-suave'
                    : 'border-borde bg-superficie-2 hover:bg-superficie',
                ].join(' ')}
              >
                <span className="block text-sm font-semibold text-texto">{t.etiqueta}</span>
                <span className="block text-xs text-texto-tenue">{t.descripcion}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="m-materia" className="block text-sm font-medium text-texto">
              Materia
            </label>
            <select
              id="m-materia"
              value={materia}
              onChange={(e) => setMateria(e.target.value as Materia)}
              className="mt-1 min-h-11 w-full rounded-lg border border-borde bg-superficie-2 px-2 text-texto"
            >
              {MATERIAS_ELEGIBLES.map((m) => (
                <option key={m.valor} value={m.valor}>
                  {m.etiqueta}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="m-curso" className="block text-sm font-medium text-texto">
              Curso
            </label>
            <select
              id="m-curso"
              value={curso}
              onChange={(e) => setCurso(e.target.value as Curso)}
              className="mt-1 min-h-11 w-full rounded-lg border border-borde bg-superficie-2 px-2 text-texto"
            >
              {CURSOS_ELEGIBLES.map((c) => (
                <option key={c.valor} value={c.valor}>
                  {c.etiqueta}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="m-tema" className="block text-sm font-medium text-texto">
            Tema
          </label>
          <input
            id="m-tema"
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            maxLength={300}
            placeholder="Por ejemplo: ecuaciones de primer grado"
            className="mt-1 min-h-11 w-full rounded-lg border border-borde bg-superficie-2 px-3 text-texto placeholder:text-texto-tenue"
          />
          {sugerencias.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-texto-tenue">
                Sugerencias habituales de aula (orientativas, no son el currículo oficial):
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {sugerencias.slice(0, 8).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setTema(s)}
                    className="rounded-full border border-borde bg-superficie-2 px-2.5 py-1 text-xs text-texto-suave hover:bg-superficie"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="m-numero" className="block text-sm font-medium text-texto">
              Número de elementos: {numero}
            </label>
            <input
              id="m-numero"
              type="range"
              min={1}
              max={20}
              value={numero}
              onChange={(e) => setNumero(Number(e.target.value))}
              className="mt-3 w-full accent-[var(--primario)]"
            />
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-texto">Nivel</legend>
            <div className="mt-1 flex gap-1">
              {NIVELES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNivel(n)}
                  aria-pressed={nivel === n}
                  title={NIVEL_DESCRIPCION[n].titulo}
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
          </fieldset>
        </div>

        <div className="mt-4">
          <label htmlFor="m-notas" className="block text-sm font-medium text-texto">
            Algo más que deba tener en cuenta <span className="text-texto-tenue">(opcional)</span>
          </label>
          <textarea
            id="m-notas"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="Le cuestan los problemas con fracciones; el examen es el jueves."
            className="mt-1 w-full resize-y rounded-lg border border-borde bg-superficie-2 p-3 text-texto placeholder:text-texto-tenue"
          />
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-error-suave px-3 py-2 text-sm text-error" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={cargando}
          className="mt-5 min-h-11 w-full rounded-lg bg-primario px-5 font-semibold text-sobre-primario hover:bg-primario-fuerte disabled:opacity-45 sm:w-auto"
        >
          {cargando ? 'Preparando el material…' : 'Generar'}
        </button>

        {cargando && (
          <p className="mt-3 text-sm text-texto-suave" role="status">
            Estoy escribiendo los enunciados y resolviéndolos para comprobar que salen…
          </p>
        )}
      </form>

      {material && (
        <section className="mt-6">
          <div className="no-imprimir flex flex-wrap items-center justify-between gap-3">
            <div
              role="tablist"
              aria-label="Versión del material"
              className="inline-flex rounded-lg border border-borde bg-superficie-2 p-1"
            >
              {(['alumno', 'profesor'] as const).map((v) => (
                <button
                  key={v}
                  role="tab"
                  type="button"
                  aria-selected={vista === v}
                  onClick={() => setVista(v)}
                  className={[
                    'min-h-10 rounded-md px-4 text-sm font-semibold',
                    vista === v
                      ? 'bg-superficie text-texto shadow-sm'
                      : 'text-texto-suave hover:text-texto',
                  ].join(' ')}
                >
                  {v === 'alumno' ? 'Cuadernillo del alumno' : 'Solucionario del profesor'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-10 rounded-lg border border-borde-fuerte bg-superficie px-4 text-sm font-medium text-texto hover:bg-superficie-2"
            >
              Imprimir o guardar en PDF
            </button>
          </div>

          <p className="no-imprimir mt-2 text-xs text-texto-tenue">
            Se imprimirá exactamente la versión que estás viendo. El cuadernillo del alumno no
            contiene las soluciones.
          </p>

          <div className="mt-4">
            {vista === 'alumno' ? (
              <VistaAlumno material={paraAlumno(material)} />
            ) : (
              <VistaProfesor material={material} />
            )}
          </div>
        </section>
      )}
    </div>
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
      <p className="text-xs font-semibold uppercase tracking-wide text-texto-tenue">
        {subtitulo}
      </p>
      <h2 className="mt-1 text-xl font-bold text-texto">{titulo}</h2>
      <p className="text-sm text-texto-suave">{tema}</p>
    </header>
  );
}

function VistaAlumno({ material }: { material: MaterialAlumno }) {
  return (
    <article className="hoja rounded-tarjeta border border-borde bg-superficie p-5 sm:p-7">
      <Cabecera
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
        <p className="mt-4 whitespace-pre-wrap rounded-lg bg-superficie-2 p-3 text-sm text-texto-suave">
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
          <h3 className="text-sm font-bold uppercase tracking-wide text-acento">
            ⭐ Lo que tengo que aprender sí o sí
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
    <article className="hoja rounded-tarjeta border border-borde bg-superficie p-5 sm:p-7">
      <Cabecera
        titulo={material.titulo}
        tema={material.tema}
        subtitulo="Solucionario del profesor"
      />

      <p className="mt-3 rounded-lg bg-aviso-suave px-3 py-2 text-sm text-aviso">
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
              <div className="mt-3 rounded-lg border-l-4 border-exito bg-exito-suave/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-exito">
                  Solución
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-texto-suave">{p.solucion}</p>
              </div>
            )}

            {p.criterioCorreccion && (
              <div className="mt-2 rounded-lg bg-superficie-2 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-texto-tenue">
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
          <h3 className="text-sm font-semibold uppercase tracking-wide text-texto-tenue">
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
          <h3 className="text-sm font-semibold uppercase tracking-wide text-texto-tenue">
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
