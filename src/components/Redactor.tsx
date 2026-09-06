'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Icono, type NombreIcono } from './ui/Icono';
import { Segmentado } from './ui/primitivos';
import type { Adjuntos } from '@/lib/cliente/adjuntos';
import {
  MAX_BYTES_ORIGEN,
  TIPOS_ACEPTADOS,
  formatearTamano,
} from '@/lib/cliente/imagenes';
import type { Preferencias } from '@/lib/cliente/preferencias';
import {
  CURSOS,
  MATERIAS,
  NIVELES,
  NIVEL_DESCRIPCION,
  type Curso,
  type Materia,
} from '@/lib/types';

/**
 * Barra de escritura del chat.
 *
 * Es la pieza que unifica la aplicación: antes había una pantalla para escribir
 * y otra para mandar una foto, y elegir entre las dos era una decisión que el
 * alumno no tiene por qué tomar. Aquí la foto es un adjunto más, como en
 * cualquier mensajería: se arrastra, se pega con Ctrl+V o se hace con la cámara,
 * y viaja junto al texto en el mismo mensaje.
 */

export type Herramienta = 'ejercicios' | 'resumen' | 'examen' | 'plan_estudio';

const ETIQUETA_MATERIA: Record<Materia, string> = {
  matematicas: 'Matemáticas',
  fisica_quimica: 'Física y Química',
  biologia_geologia: 'Biología y Geología',
  otra: 'Otra materia',
  desconocida: 'Que lo detecte',
};

const ETIQUETA_CURSO: Record<Curso, string> = {
  '1eso': '1.º de ESO',
  '2eso': '2.º de ESO',
  otro: 'Otro curso',
  desconocido: 'No lo sé',
};

const HERRAMIENTAS: { valor: Herramienta; texto: string; icono: NombreIcono }[] = [
  { valor: 'ejercicios', texto: 'Crear ejercicios', icono: 'documento' },
  { valor: 'resumen', texto: 'Resumir un tema', icono: 'estrella' },
  { valor: 'examen', texto: 'Simulacro de examen', icono: 'libro' },
  { valor: 'plan_estudio', texto: 'Plan para aprobar', icono: 'birrete' },
];

/** Cierra un desplegable al pulsar fuera o al pulsar Escape. */
function useCerrarFuera(abierto: boolean, cerrar: () => void) {
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;

    function fuera(e: PointerEvent) {
      if (!contenedor.current?.contains(e.target as Node)) cerrar();
    }
    function escape(e: KeyboardEvent) {
      if (e.key === 'Escape') cerrar();
    }

    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', fuera);
      document.removeEventListener('keydown', escape);
    };
  }, [abierto, cerrar]);

  return contenedor;
}

/**
 * En un teclado táctil, Enter es la tecla de salto de línea: enviar con ella
 * cortaría los mensajes por la mitad. En un teclado físico es justo al revés.
 */
function enviaConEnter(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return true;
  return !window.matchMedia('(pointer: coarse)').matches;
}

interface Props {
  texto: string;
  onTexto: (t: string) => void;
  adjuntos: Adjuntos;
  enCurso: boolean;
  onEnviar: () => void;
  onParar: () => void;
  preferencias: Preferencias;
  onPreferencias: (cambios: Partial<Preferencias>) => void;
  onHerramienta: (h: Herramienta) => void;
  marcador: string;
}

export function Redactor({
  texto,
  onTexto,
  adjuntos,
  enCurso,
  onEnviar,
  onParar,
  preferencias,
  onPreferencias,
  onHerramienta,
  marcador,
}: Props) {
  const [menu, setMenu] = useState(false);
  const [ajustes, setAjustes] = useState(false);
  const { imagenes, error, preparando, anadir, quitar, rotar } = adjuntos;

  const area = useRef<HTMLTextAreaElement>(null);
  const inputArchivo = useRef<HTMLInputElement>(null);
  const inputCamara = useRef<HTMLInputElement>(null);

  const cajaMenu = useCerrarFuera(menu, useCallback(() => setMenu(false), []));
  const cajaAjustes = useCerrarFuera(ajustes, useCallback(() => setAjustes(false), []));

  // Crece con el texto hasta un tope, para no comerse la conversación.
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [texto]);

  const vacio = !texto.trim() && imagenes.length === 0;

  return (
    <div className="no-imprimir zona-segura-abajo border-t border-borde bg-superficie/95 px-3 pt-3 backdrop-blur sm:px-4">
      <div className="mx-auto max-w-3xl">
        {imagenes.length > 0 && (
          <ul className="mb-2 flex flex-wrap gap-2">
            {imagenes.map((img) => (
              <li key={img.id} className="group relative">
                {/* Previsualización local en base64: next/image no aporta nada. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.previsualizacion}
                  alt={`Foto adjunta: ${img.nombre}`}
                  className="h-16 w-16 rounded-xl border border-borde bg-superficie-2 object-cover"
                />
                <span className="absolute -right-1.5 -top-1.5 flex gap-0.5">
                  <button
                    type="button"
                    onClick={() => void rotar(img)}
                    disabled={enCurso}
                    aria-label={`Girar ${img.nombre}`}
                    className="grid h-6 w-6 place-items-center rounded-full border border-borde bg-superficie text-texto-suave shadow-sm transition hover:text-texto disabled:opacity-50"
                  >
                    <Icono nombre="girar" className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => quitar(img.id)}
                    disabled={enCurso}
                    aria-label={`Quitar ${img.nombre}`}
                    className="grid h-6 w-6 place-items-center rounded-full border border-borde bg-superficie text-texto-suave shadow-sm transition hover:text-error disabled:opacity-50"
                  >
                    <Icono nombre="cerrar" className="h-3 w-3" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        {preparando && (
          <p className="mb-2 text-sm text-texto-suave" role="status">
            Preparando la foto…
          </p>
        )}

        {error && (
          <p
            className="mb-2 flex items-start gap-2 rounded-xl bg-error-suave px-3 py-2 text-sm text-error"
            role="alert"
          >
            <Icono nombre="aviso" className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!vacio && !enCurso) onEnviar();
          }}
          className="flex items-end gap-2 rounded-2xl border border-borde bg-superficie-2 p-2 focus-within:border-primario/50"
        >
          {/* Adjuntar y herramientas */}
          <div ref={cajaMenu} className="relative">
            <button
              type="button"
              onClick={() => setMenu((v) => !v)}
              disabled={enCurso}
              aria-expanded={menu}
              aria-haspopup="menu"
              aria-label="Añadir una foto o pedir material"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-borde bg-superficie text-texto-suave transition hover:border-primario/45 hover:text-primario disabled:opacity-45"
            >
              <Icono nombre="mas" className="h-5 w-5" />
            </button>

            {menu && (
              <div
                role="menu"
                className="absolute bottom-12 left-0 z-30 w-64 overflow-hidden rounded-tarjeta border border-borde bg-superficie p-1 shadow-[var(--sombra)]"
              >
                <p className="px-3 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.09em] text-texto-tenue">
                  Mandar una foto
                </p>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenu(false);
                    inputCamara.current?.click();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-texto transition hover:bg-superficie-2 sm:hidden"
                >
                  <Icono nombre="camara" className="h-4 w-4 text-primario" />
                  Hacer una foto
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenu(false);
                    inputArchivo.current?.click();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-texto transition hover:bg-superficie-2"
                >
                  <Icono nombre="imagen" className="h-4 w-4 text-primario" />
                  Elegir del carrete
                </button>

                <p className="mt-1 border-t border-borde px-3 pb-1.5 pt-2.5 text-[0.7rem] font-bold uppercase tracking-[0.09em] text-texto-tenue">
                  Prepararme material
                </p>
                {HERRAMIENTAS.map((h) => (
                  <button
                    key={h.valor}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenu(false);
                      onHerramienta(h.valor);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-texto transition hover:bg-superficie-2"
                  >
                    <Icono nombre={h.icono} className="h-4 w-4 text-primario" />
                    {h.texto}
                  </button>
                ))}
              </div>
            )}
          </div>

          <label htmlFor="mensaje" className="sr-only">
            Escribe tu duda o adjunta la foto del ejercicio
          </label>
          <textarea
            id="mensaje"
            ref={area}
            value={texto}
            onChange={(e) => onTexto(e.target.value)}
            onPaste={(e) => {
              const fotos = Array.from(e.clipboardData.files).filter((f) =>
                f.type.startsWith('image/'),
              );
              if (fotos.length > 0) {
                e.preventDefault();
                void anadir(fotos);
              }
            }}
            onKeyDown={(e) => {
              const enviar =
                e.key === 'Enter' && (e.metaKey || e.ctrlKey || (!e.shiftKey && enviaConEnter()));
              if (enviar) {
                e.preventDefault();
                if (!vacio && !enCurso) onEnviar();
              }
            }}
            rows={1}
            maxLength={8000}
            placeholder={marcador}
            disabled={enCurso}
            className="max-h-[180px] min-h-10 flex-1 resize-none bg-transparent py-2 leading-snug text-texto outline-none placeholder:text-texto-tenue disabled:opacity-60"
          />

          {enCurso ? (
            <button
              type="button"
              onClick={onParar}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-borde bg-superficie text-texto-suave transition hover:text-texto"
              aria-label="Parar"
            >
              <span aria-hidden="true" className="h-3 w-3 rounded-[3px] bg-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={vacio}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primario text-sobre-primario transition hover:bg-primario-fuerte disabled:opacity-35"
              aria-label="Enviar"
            >
              <Icono nombre="enviar" className="h-5 w-5" />
            </button>
          )}
        </form>

        {/* Contexto de la consulta: siempre a la vista, editable en un toque. */}
        <div ref={cajaAjustes} className="relative flex items-center justify-between gap-2 py-1.5">
          <button
            type="button"
            onClick={() => setAjustes((v) => !v)}
            aria-expanded={ajustes}
            className="flex min-h-8 items-center gap-1.5 rounded-lg px-1.5 text-xs text-texto-tenue transition hover:text-texto"
          >
            <Icono nombre="ajustes" className="h-3.5 w-3.5" />
            <span className="font-medium text-texto-suave">
              {ETIQUETA_CURSO[preferencias.curso]} · {ETIQUETA_MATERIA[preferencias.materia]} ·
              Nivel {preferencias.nivel}
            </span>
          </button>

          <p className="hidden text-xs text-texto-tenue sm:block">
            Arrastra o pega una foto aquí mismo
          </p>

          {ajustes && (
            <div className="absolute bottom-10 left-0 z-30 w-full max-w-sm rounded-tarjeta border border-borde bg-superficie p-4 shadow-[var(--sombra)]">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="curso" className="block text-sm font-medium text-texto">
                    Curso
                  </label>
                  <select
                    id="curso"
                    value={preferencias.curso}
                    onChange={(e) => onPreferencias({ curso: e.target.value as Curso })}
                    className="mt-1 min-h-10 w-full rounded-xl border border-borde bg-superficie-2 px-2 text-sm text-texto"
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
                    value={preferencias.materia}
                    onChange={(e) => onPreferencias({ materia: e.target.value as Materia })}
                    className="mt-1 min-h-10 w-full rounded-xl border border-borde bg-superficie-2 px-2 text-sm text-texto"
                  >
                    {MATERIAS.map((m) => (
                      <option key={m} value={m}>
                        {ETIQUETA_MATERIA[m]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3">
                <p className="mb-1 text-sm font-medium text-texto">Cómo te lo explico</p>
                <Segmentado
                  etiqueta="Nivel de explicación"
                  valor={preferencias.nivel}
                  onCambio={(nivel) => onPreferencias({ nivel })}
                  opciones={NIVELES.map((n) => ({
                    valor: n,
                    texto: n,
                    titulo: `${NIVEL_DESCRIPCION[n].titulo}: ${NIVEL_DESCRIPCION[n].detalle}`,
                  }))}
                />
                <p className="mt-1.5 text-xs text-texto-tenue">
                  {NIVEL_DESCRIPCION[preferencias.nivel].titulo}:{' '}
                  {NIVEL_DESCRIPCION[preferencias.nivel].detalle}
                </p>
              </div>
            </div>
          )}
        </div>

        <p className="pb-1 text-center text-[0.7rem] leading-snug text-texto-tenue">
          Compruebo las cuentas en el servidor y aviso cuando no puedo confirmar algo, pero no
          sustituyo a tu profesorado. Fotos {formatearTamano(MAX_BYTES_ORIGEN)} máx.
        </p>

        <input
          ref={inputArchivo}
          type="file"
          accept={TIPOS_ACEPTADOS.join(',')}
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) void anadir(Array.from(e.target.files));
            e.target.value = '';
          }}
        />
        <input
          ref={inputCamara}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) void anadir(Array.from(e.target.files));
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}
