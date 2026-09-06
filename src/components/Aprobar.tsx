'use client';

import { useRef, useState } from 'react';
import { VistaMaterial } from './VistaMaterial';
import { Icono } from './ui/Icono';
import { Boton, Segmentado, Tarjeta, TituloSeccion } from './ui/primitivos';
import type { MaterialGenerado } from '@/lib/ai/schemas';
import { generarMaterial } from '@/lib/cliente/generar';
import { cursoConcreto, materiaConcreta, sesionesParaPlazo } from '@/lib/material';
import { usePreferencias } from '@/lib/cliente/preferencias';
import { TEMAS_ORIENTATIVOS } from '@/lib/curriculum';
import { NIVELES, NIVEL_DESCRIPCION, type Curso, type Materia } from '@/lib/types';

/**
 * Modo «Quiero aprobar este tema» (regla 68).
 *
 * Encadena lo que el alumno necesita cuando tiene un examen a la vista: primero
 * el plan y los contenidos esenciales, y desde ahí, con un clic, la práctica y
 * el simulacro. Cada paso es una llamada distinta y sólo se hace si el alumno la
 * pide: no se gastan tres generaciones de golpe (regla 44).
 */

const MATERIAS_ELEGIBLES: { valor: Materia; etiqueta: string }[] = [
  { valor: 'matematicas', etiqueta: 'Matemáticas' },
  { valor: 'fisica_quimica', etiqueta: 'Física y Química' },
  { valor: 'biologia_geologia', etiqueta: 'Biología y Geología' },
];

const CURSOS_ELEGIBLES: { valor: Curso; etiqueta: string }[] = [
  { valor: '1eso', etiqueta: '1.º de ESO' },
  { valor: '2eso', etiqueta: '2.º de ESO' },
];

type Extra = 'ejercicios' | 'examen';

export function Aprobar() {
  const [preferencias, guardarPreferencias] = usePreferencias();
  const [tema, setTema] = useState('');
  const [dias, setDias] = useState(7);
  const [dificultades, setDificultades] = useState('');

  const [plan, setPlan] = useState<MaterialGenerado | null>(null);
  const [extra, setExtra] = useState<{ tipo: Extra; material: MaterialGenerado } | null>(null);
  const [cargando, setCargando] = useState<'plan' | Extra | null>(null);
  const [error, setError] = useState<string | null>(null);
  const zonaPlan = useRef<HTMLDivElement>(null);

  const materia = materiaConcreta(preferencias.materia);
  const curso = cursoConcreto(preferencias.curso);
  const sugerencias = TEMAS_ORIENTATIVOS[materia as keyof typeof TEMAS_ORIENTATIVOS] ?? [];

  const base = {
    materia,
    curso,
    tema: tema.trim(),
    nivel: preferencias.nivel,
    notas: dificultades.trim(),
  };

  async function crearPlan() {
    if (tema.trim().length < 2) {
      setError('Dime de qué tema es el examen.');
      return;
    }
    setCargando('plan');
    setError(null);
    setPlan(null);
    setExtra(null);

    const r = await generarMaterial({
      ...base,
      tipo: 'plan_estudio',
      numeroPreguntas: sesionesParaPlazo(dias),
      diasDisponibles: dias,
    });

    setCargando(null);
    if (r.ok) {
      setPlan(r.material);
      requestAnimationFrame(() =>
        zonaPlan.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      );
    } else {
      setError(r.error);
    }
  }

  async function crearExtra(tipo: Extra) {
    setCargando(tipo);
    setError(null);

    const r = await generarMaterial({
      ...base,
      tipo,
      numeroPreguntas: tipo === 'examen' ? 6 : 8,
      diasDisponibles: dias,
    });

    setCargando(null);
    if (r.ok) setExtra({ tipo, material: r.material });
    else setError(r.error);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <header className="no-imprimir">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-primario-suave px-3 py-1 text-xs font-semibold text-primario">
          <Icono nombre="birrete" className="h-3.5 w-3.5" />
          Modo examen
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-texto sm:text-3xl">
          Quiero aprobar este tema
        </h1>
        <p className="mt-2 text-texto-suave">
          Dime qué entra y cuánto falta, y te preparo el plan: lo esencial, cómo repartir los días
          y, cuando lo pidas, práctica y un simulacro.
        </p>
      </header>

      <Tarjeta as="section" className="no-imprimir mt-6 p-5 sm:p-6" elevada>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void crearPlan();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="a-materia" className="block text-sm font-medium text-texto">
                Materia
              </label>
              <select
                id="a-materia"
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
              <label htmlFor="a-curso" className="block text-sm font-medium text-texto">
                Curso
              </label>
              <select
                id="a-curso"
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
            <label htmlFor="a-tema" className="block text-sm font-medium text-texto">
              ¿Qué entra en el examen?
            </label>
            <input
              id="a-tema"
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              maxLength={300}
              placeholder="Por ejemplo: fracciones y porcentajes"
              className="mt-1 min-h-11 w-full rounded-xl border border-borde bg-superficie-2 px-3 text-texto placeholder:text-texto-tenue"
            />
            {sugerencias.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {sugerencias.slice(0, 6).map((s) => (
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
            )}
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="a-dias" className="block text-sm font-medium text-texto">
                Días hasta el examen:{' '}
                <span className="tabular-nums text-primario">{dias}</span>
              </label>
              <input
                id="a-dias"
                type="range"
                min={1}
                max={30}
                value={dias}
                onChange={(e) => setDias(Number(e.target.value))}
                className="mt-3 w-full accent-[var(--primario)]"
              />
              <p className="mt-1 text-xs text-texto-tenue">
                Saldrán {sesionesParaPlazo(dias)} sesiones de trabajo.
              </p>
            </div>

            <div>
              <p className="mb-1 text-sm font-medium text-texto">Nivel de explicación</p>
              <Segmentado
                etiqueta="Nivel de explicación"
                valor={preferencias.nivel}
                onCambio={(nivel) => guardarPreferencias({ nivel })}
                opciones={NIVELES.map((n) => ({
                  valor: n,
                  texto: n,
                  titulo: NIVEL_DESCRIPCION[n].titulo,
                }))}
              />
              <p className="mt-1.5 text-xs text-texto-tenue">
                {NIVEL_DESCRIPCION[preferencias.nivel].titulo}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="a-dificultades" className="block text-sm font-medium text-texto">
              ¿Qué es lo que peor llevas?{' '}
              <span className="font-normal text-texto-tenue">(opcional)</span>
            </label>
            <textarea
              id="a-dificultades"
              value={dificultades}
              onChange={(e) => setDificultades(e.target.value)}
              rows={2}
              maxLength={2000}
              placeholder="Me lío al pasar de fracción a decimal y con los problemas largos."
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
            icono="birrete"
            disabled={cargando !== null}
            className="mt-5 w-full sm:w-auto"
          >
            {cargando === 'plan' ? 'Preparando tu plan…' : 'Prepárame el plan'}
          </Boton>

          {cargando === 'plan' && (
            <p className="mt-3 text-sm text-texto-suave" role="status">
              Estoy decidiendo qué es lo imprescindible y cómo repartirlo en {dias} días…
            </p>
          )}
        </form>
      </Tarjeta>

      <div ref={zonaPlan} />

      {plan && (
        <div className="mt-8">
          <VistaMaterial material={plan} />

          <Tarjeta className="no-imprimir mt-6 p-5" elevada>
            <TituloSeccion>Y ahora, a practicar</TituloSeccion>
            <p className="mt-1.5 text-sm text-texto-suave">
              El plan te dice qué hacer. Esto te da con qué hacerlo.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Boton
                type="button"
                variante="secundario"
                icono="documento"
                disabled={cargando !== null}
                onClick={() => void crearExtra('ejercicios')}
              >
                {cargando === 'ejercicios' ? 'Preparando…' : 'Ejercicios de práctica'}
              </Boton>
              <Boton
                type="button"
                variante="secundario"
                icono="libro"
                disabled={cargando !== null}
                onClick={() => void crearExtra('examen')}
              >
                {cargando === 'examen' ? 'Preparando…' : 'Simulacro de examen'}
              </Boton>
            </div>
            <p className="mt-3 text-xs text-texto-tenue">
              ¿Un ejercicio se te resiste? Hazle una foto y llévalo a{' '}
              <a href="/resolver?modo=foto" className="text-primario underline underline-offset-2">
                Resolver
              </a>
              : te lo explico paso a paso.
            </p>
          </Tarjeta>
        </div>
      )}

      {extra && (
        <div className="mt-8">
          <VistaMaterial material={extra.material} />
        </div>
      )}
    </div>
  );
}
