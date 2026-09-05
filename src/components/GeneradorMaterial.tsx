'use client';

import { useState } from 'react';
import { VistaMaterial } from './VistaMaterial';
import { Icono, type NombreIcono } from './ui/Icono';
import { Boton, Segmentado, Tarjeta } from './ui/primitivos';
import type { MaterialGenerado, PeticionGenerate } from '@/lib/ai/schemas';
import { generarMaterial } from '@/lib/cliente/generar';
import { usePreferencias } from '@/lib/cliente/preferencias';
import { TEMAS_ORIENTATIVOS } from '@/lib/curriculum';
import { NIVELES, NIVEL_DESCRIPCION, type Curso, type Materia } from '@/lib/types';

/**
 * Generador de material: ejercicios, exámenes, resúmenes, fichas, tests y
 * planes de estudio.
 */

type Tipo = PeticionGenerate['tipo'];

const TIPOS: { valor: Tipo; etiqueta: string; descripcion: string; icono: NombreIcono }[] = [
  {
    valor: 'ejercicios',
    etiqueta: 'Ejercicios',
    descripcion: 'Práctica graduada.',
    icono: 'documento',
  },
  { valor: 'examen', etiqueta: 'Examen', descripcion: 'Simulacro sobre 10.', icono: 'libro' },
  { valor: 'resumen', etiqueta: 'Resumen', descripcion: 'El tema por apartados.', icono: 'estrella' },
  { valor: 'ficha', etiqueta: 'Ficha', descripcion: 'Teoría y actividades.', icono: 'lapiz' },
  { valor: 'test', etiqueta: 'Test', descripcion: 'Opción múltiple.', icono: 'comprobado' },
  {
    valor: 'plan_estudio',
    etiqueta: 'Plan de estudio',
    descripcion: 'Sesiones hasta el examen.',
    icono: 'calendario',
  },
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

/** El generador necesita materia y curso concretos; «no lo sé» no vale aquí. */
function materiaConcreta(m: Materia): Materia {
  return m === 'desconocida' || m === 'otra' ? 'matematicas' : m;
}
function cursoConcreto(c: Curso): Curso {
  return c === 'desconocido' || c === 'otro' ? '1eso' : c;
}

/** El tipo inicial llega del servidor, leido de la URL. */
export function GeneradorMaterial({ tipoInicial }: { tipoInicial: string | null }) {
  const [preferencias, guardarPreferencias] = usePreferencias();

  const [tipo, setTipo] = useState<Tipo>(() =>
    esTipo(tipoInicial) ? tipoInicial : 'ejercicios',
  );
  const [tema, setTema] = useState('');
  const [numero, setNumero] = useState(6);
  const [notas, setNotas] = useState('');

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [material, setMaterial] = useState<MaterialGenerado | null>(null);

  const materia = materiaConcreta(preferencias.materia);
  const curso = cursoConcreto(preferencias.curso);
  const sugerencias = TEMAS_ORIENTATIVOS[materia as keyof typeof TEMAS_ORIENTATIVOS] ?? [];

  async function generar() {
    if (tema.trim().length < 2) {
      setError('Escribe el tema sobre el que quieres el material.');
      return;
    }
    setCargando(true);
    setError(null);
    setMaterial(null);

    const r = await generarMaterial({
      tipo,
      materia,
      curso,
      tema: tema.trim(),
      nivel: preferencias.nivel,
      numeroPreguntas: numero,
      notas: notas.trim(),
    });

    setCargando(false);
    if (r.ok) setMaterial(r.material);
    else setError(r.error);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <header className="no-imprimir">
        <h1 className="text-2xl font-bold tracking-tight text-texto sm:text-3xl">Crear material</h1>
        <p className="mt-2 text-texto-suave">
          Ejercicios, exámenes, resúmenes y planes de estudio. El cuadernillo del alumno y el
          solucionario van siempre por separado.
        </p>
      </header>

      <Tarjeta as="section" className="no-imprimir mt-6 p-5 sm:p-6" elevada>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void generar();
          }}
        >
          <fieldset>
            <legend className="text-sm font-semibold text-texto">¿Qué quieres crear?</legend>
            <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TIPOS.map((t) => {
                const activo = tipo === t.valor;
                return (
                  <button
                    key={t.valor}
                    type="button"
                    onClick={() => setTipo(t.valor)}
                    aria-pressed={activo}
                    className={[
                      'flex min-h-20 flex-col gap-1 rounded-xl border p-3 text-left transition',
                      activo
                        ? 'border-primario bg-primario-suave'
                        : 'border-borde bg-superficie-2 hover:border-borde-fuerte hover:bg-superficie',
                    ].join(' ')}
                  >
                    <Icono
                      nombre={t.icono}
                      className={`h-5 w-5 ${activo ? 'text-primario' : 'text-texto-tenue'}`}
                    />
                    <span className="text-sm font-semibold text-texto">{t.etiqueta}</span>
                    <span className="text-xs leading-snug text-texto-tenue">{t.descripcion}</span>
                  </button>
                );
              })}
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
                onChange={(e) => guardarPreferencias({ materia: e.target.value as Materia })}
                className="mt-1 min-h-11 w-full rounded-xl border border-borde bg-superficie-2 px-2.5 text-texto"
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
                onChange={(e) => guardarPreferencias({ curso: e.target.value as Curso })}
                className="mt-1 min-h-11 w-full rounded-xl border border-borde bg-superficie-2 px-2.5 text-texto"
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
              className="mt-1 min-h-11 w-full rounded-xl border border-borde bg-superficie-2 px-3 text-texto placeholder:text-texto-tenue"
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
                      className="rounded-full border border-borde bg-superficie-2 px-2.5 py-1 text-xs text-texto-suave transition hover:border-primario/40 hover:text-texto"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="m-numero" className="block text-sm font-medium text-texto">
                Número de elementos:{' '}
                <span className="tabular-nums text-primario">{numero}</span>
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

            <div>
              <p className="mb-1 text-sm font-medium text-texto">Nivel</p>
              <Segmentado
                etiqueta="Nivel de dificultad"
                valor={preferencias.nivel}
                onCambio={(nivel) => guardarPreferencias({ nivel })}
                opciones={NIVELES.map((n) => ({
                  valor: n,
                  texto: n,
                  titulo: NIVEL_DESCRIPCION[n].titulo,
                }))}
              />
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="m-notas" className="block text-sm font-medium text-texto">
              Algo más que deba tener en cuenta{' '}
              <span className="font-normal text-texto-tenue">(opcional)</span>
            </label>
            <textarea
              id="m-notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              maxLength={2000}
              placeholder="Le cuestan los problemas con fracciones; el examen es el jueves."
              className="mt-1 w-full resize-y rounded-xl border border-borde bg-superficie-2 p-3 text-texto placeholder:text-texto-tenue"
            />
          </div>

          {error && (
            <p
              className="mt-4 flex items-start gap-2 rounded-lg bg-error-suave px-3 py-2 text-sm text-error"
              role="alert"
            >
              <Icono nombre="aviso" className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <Boton
            type="submit"
            tamano="lg"
            disabled={cargando}
            iconoDerecha="flecha"
            className="mt-5 w-full sm:w-auto"
          >
            {cargando ? 'Preparando el material…' : 'Generar'}
          </Boton>

          {cargando && (
            <p className="mt-3 text-sm text-texto-suave" role="status">
              Estoy escribiendo los enunciados y resolviéndolos para comprobar que salen…
            </p>
          )}
        </form>
      </Tarjeta>

      {material && (
        <div className="mt-6">
          <VistaMaterial material={material} />
        </div>
      )}
    </div>
  );
}
