'use client';

import { useState } from 'react';
import { Icono, type NombreIcono } from './ui/Icono';
import { Boton } from './ui/primitivos';
import type { Herramienta } from './Redactor';
import { TEMAS_ORIENTATIVOS } from '@/lib/curriculum';
import { cursoConcreto, materiaConcreta, sesionesParaPlazo } from '@/lib/material';
import type { Curso, Materia } from '@/lib/types';

/**
 * Petición de material, dentro de la propia conversación.
 *
 * Antes esto vivía en dos pantallas aparte. Aquí es una tarjeta más del chat:
 * se pide el tema, se genera y el resultado aparece como un mensaje, así que el
 * alumno no cambia de sitio ni pierde el hilo de lo que estaba haciendo.
 */

export interface PeticionHerramienta {
  tipo: Herramienta;
  materia: Materia;
  curso: Curso;
  tema: string;
  cantidad: number;
  dias: number | null;
}

const FICHA: Record<
  Herramienta,
  { titulo: string; icono: NombreIcono; pie: string; etiquetaCantidad: string; porDefecto: number }
> = {
  ejercicios: {
    titulo: 'Crear ejercicios',
    icono: 'documento',
    pie: 'De menos a más difícil, con solucionario aparte.',
    etiquetaCantidad: 'Cuántos ejercicios',
    porDefecto: 6,
  },
  resumen: {
    titulo: 'Resumir un tema',
    icono: 'estrella',
    pie: 'Lo esencial del tema y lo que hay que aprender sí o sí.',
    etiquetaCantidad: 'Cuántos apartados',
    porDefecto: 6,
  },
  examen: {
    titulo: 'Simulacro de examen',
    icono: 'libro',
    pie: 'Sobre 10 puntos, con criterios de corrección.',
    etiquetaCantidad: 'Cuántas preguntas',
    porDefecto: 6,
  },
  plan_estudio: {
    titulo: 'Plan para aprobar',
    icono: 'birrete',
    pie: 'Sesiones repartidas hasta el día del examen.',
    etiquetaCantidad: 'Sesiones',
    porDefecto: 6,
  },
};

const MATERIAS_ELEGIBLES: { valor: Materia; etiqueta: string }[] = [
  { valor: 'matematicas', etiqueta: 'Matemáticas' },
  { valor: 'fisica_quimica', etiqueta: 'Física y Química' },
  { valor: 'biologia_geologia', etiqueta: 'Biología y Geología' },
];

const CURSOS_ELEGIBLES: { valor: Curso; etiqueta: string }[] = [
  { valor: '1eso', etiqueta: '1.º de ESO' },
  { valor: '2eso', etiqueta: '2.º de ESO' },
];

export function PanelHerramienta({
  tipo,
  materiaInicial,
  cursoInicial,
  ocupado,
  onGenerar,
  onCancelar,
}: {
  tipo: Herramienta;
  materiaInicial: Materia;
  cursoInicial: Curso;
  ocupado: boolean;
  onGenerar: (peticion: PeticionHerramienta) => void;
  onCancelar: () => void;
}) {
  const ficha = FICHA[tipo];
  const [materia, setMateria] = useState<Materia>(materiaConcreta(materiaInicial));
  const [curso, setCurso] = useState<Curso>(cursoConcreto(cursoInicial));
  const [tema, setTema] = useState('');
  const [cantidad, setCantidad] = useState(ficha.porDefecto);
  const [dias, setDias] = useState(7);
  const [aviso, setAviso] = useState<string | null>(null);

  const esPlan = tipo === 'plan_estudio';
  const sugerencias = TEMAS_ORIENTATIVOS[materia as keyof typeof TEMAS_ORIENTATIVOS] ?? [];

  function enviar() {
    if (tema.trim().length < 2) {
      setAviso('Dime de qué tema, aunque sea con tus palabras.');
      return;
    }
    setAviso(null);
    onGenerar({
      tipo,
      materia,
      curso,
      tema: tema.trim(),
      cantidad: esPlan ? sesionesParaPlazo(dias) : cantidad,
      dias: esPlan ? dias : null,
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        enviar();
      }}
      className="rounded-tarjeta border border-primario/30 bg-superficie p-4 shadow-[var(--sombra)]"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="flex items-center gap-2 font-semibold text-texto">
          <span
            aria-hidden="true"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primario-suave text-primario"
          >
            <Icono nombre={ficha.icono} className="h-4 w-4" />
          </span>
          {ficha.titulo}
        </p>
        <button
          type="button"
          onClick={onCancelar}
          disabled={ocupado}
          aria-label="Cancelar"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-texto-tenue transition hover:bg-superficie-2 hover:text-texto disabled:opacity-40"
        >
          <Icono nombre="cerrar" className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-1 text-sm text-texto-suave">{ficha.pie}</p>

      <label htmlFor={`tema-${tipo}`} className="mt-3 block text-sm font-medium text-texto">
        ¿De qué tema?
      </label>
      <input
        id={`tema-${tipo}`}
        value={tema}
        onChange={(e) => setTema(e.target.value)}
        disabled={ocupado}
        placeholder="Fracciones, densidad, la célula…"
        className="mt-1 min-h-11 w-full rounded-xl border border-borde bg-superficie-2 px-3 text-texto placeholder:text-texto-tenue disabled:opacity-60"
      />

      {sugerencias.length > 0 && !tema && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {sugerencias.slice(0, 6).map((s) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => setTema(s)}
                disabled={ocupado}
                className="min-h-8 rounded-full border border-borde bg-superficie-2 px-2.5 text-xs text-texto-suave transition hover:border-primario/40 hover:text-texto disabled:opacity-50"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor={`materia-${tipo}`} className="block text-sm font-medium text-texto">
            Materia
          </label>
          <select
            id={`materia-${tipo}`}
            value={materia}
            onChange={(e) => setMateria(e.target.value as Materia)}
            disabled={ocupado}
            className="mt-1 min-h-11 w-full rounded-xl border border-borde bg-superficie-2 px-2 text-sm text-texto"
          >
            {MATERIAS_ELEGIBLES.map((m) => (
              <option key={m.valor} value={m.valor}>
                {m.etiqueta}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`curso-${tipo}`} className="block text-sm font-medium text-texto">
            Curso
          </label>
          <select
            id={`curso-${tipo}`}
            value={curso}
            onChange={(e) => setCurso(e.target.value as Curso)}
            disabled={ocupado}
            className="mt-1 min-h-11 w-full rounded-xl border border-borde bg-superficie-2 px-2 text-sm text-texto"
          >
            {CURSOS_ELEGIBLES.map((c) => (
              <option key={c.valor} value={c.valor}>
                {c.etiqueta}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`cantidad-${tipo}`} className="block text-sm font-medium text-texto">
            {esPlan ? 'Días hasta el examen' : ficha.etiquetaCantidad}
          </label>
          <input
            id={`cantidad-${tipo}`}
            type="number"
            min={1}
            max={esPlan ? 60 : 20}
            value={esPlan ? dias : cantidad}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (!Number.isFinite(v)) return;
              if (esPlan) setDias(Math.min(60, Math.max(1, Math.round(v))));
              else setCantidad(Math.min(20, Math.max(1, Math.round(v))));
            }}
            disabled={ocupado}
            className="mt-1 min-h-11 w-full rounded-xl border border-borde bg-superficie-2 px-3 text-texto"
          />
        </div>
      </div>

      {aviso && (
        <p className="mt-2 text-sm text-error" role="alert">
          {aviso}
        </p>
      )}

      <div className="mt-4 flex justify-end">
        <Boton type="submit" iconoDerecha="flecha" disabled={ocupado}>
          {ocupado ? 'Preparándolo…' : 'Prepáramelo'}
        </Boton>
      </div>
    </form>
  );
}
