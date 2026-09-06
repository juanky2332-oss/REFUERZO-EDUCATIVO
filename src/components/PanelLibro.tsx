'use client';

import { useState } from 'react';
import { Icono } from './ui/Icono';
import { Boton } from './ui/primitivos';
import type { FichaLibro } from '@/lib/ai/schemas';
import { useAdjuntos } from '@/lib/cliente/adjuntos';
import { TIPOS_ACEPTADOS } from '@/lib/cliente/imagenes';
import { leerPaginas } from '@/lib/cliente/libro';
import type { Curso, Materia } from '@/lib/types';

/**
 * «Mi libro»: las páginas del tema, fotografiadas por el alumno.
 *
 * Esta pantalla existe porque la alternativa era mentir. Nadie puede pedirle a
 * esta aplicación que «se sepa» el libro de una editorial: no lo tiene, no
 * puede tenerlo y fingirlo significaría inventarse unidades y ejercicios que
 * sonarían creíbles. Lo que sí puede es leer las páginas de verdad y ceñirse a
 * ellas, que además funciona con cualquier libro y con los apuntes de clase.
 */

const MAXIMO_PAGINAS = 8;

export function PanelLibro({
  libro,
  curso,
  materia,
  onGuardar,
  onCerrar,
}: {
  libro: FichaLibro | null;
  curso: Curso;
  materia: Materia;
  onGuardar: (libro: FichaLibro | null) => void;
  onCerrar: () => void;
}) {
  const adjuntos = useAdjuntos(MAXIMO_PAGINAS);
  const [editorial, setEditorial] = useState('');
  const [leyendo, setLeyendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function leer() {
    if (adjuntos.imagenes.length === 0) return;
    setLeyendo(true);
    setError(null);

    const r = await leerPaginas(adjuntos.imagenes, {
      curso,
      materia,
      editorial: editorial.trim(),
    });

    setLeyendo(false);
    if (r.ok) {
      adjuntos.limpiar();
      onGuardar(r.libro);
    } else {
      setError(r.error);
    }
  }

  return (
    <div className="rounded-tarjeta border border-primario/30 bg-superficie p-4 shadow-[var(--sombra)]">
      <div className="flex items-start justify-between gap-3">
        <p className="flex items-center gap-2 font-semibold text-texto">
          <span
            aria-hidden="true"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primario-suave text-primario"
          >
            <Icono nombre="libro" className="h-4 w-4" />
          </span>
          Mi libro
        </p>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-texto-tenue transition hover:bg-superficie-2 hover:text-texto"
        >
          <Icono nombre="cerrar" className="h-4 w-4" />
        </button>
      </div>

      {libro ? (
        <FichaActiva libro={libro} onQuitar={() => onGuardar(null)} />
      ) : (
        <p className="mt-1 text-sm leading-relaxed text-texto-suave">
          No me sé ningún libro de texto de memoria, y si te dijera que sí me inventaría las
          unidades y los ejercicios. Lo que sí puedo es leer el tuyo: hazle una foto a las páginas
          del tema y a partir de ahí uso su método, su notación y sus palabras. Vale también para
          tus apuntes de clase o los del profe.
        </p>
      )}

      <div className="mt-3 border-t border-borde pt-3">
        <label htmlFor="editorial" className="block text-sm font-medium text-texto">
          ¿De qué es? <span className="font-normal text-texto-tenue">(opcional)</span>
        </label>
        <input
          id="editorial"
          value={editorial}
          onChange={(e) => setEditorial(e.target.value)}
          disabled={leyendo}
          placeholder="Edelvives, apuntes de clase, fotocopias…"
          className="mt-1 min-h-11 w-full rounded-xl border border-borde bg-superficie-2 px-3 text-texto placeholder:text-texto-tenue disabled:opacity-60"
        />
        <p className="mt-1 text-xs text-texto-tenue">
          Sólo lo uso para ponerle nombre a la ficha. Lo que de verdad sigo es lo que se lea en las
          fotos.
        </p>
      </div>

      {adjuntos.imagenes.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {adjuntos.imagenes.map((img) => (
            <li key={img.id} className="relative">
              {/* Previsualización local en base64: next/image no aporta nada. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.previsualizacion}
                alt={`Página: ${img.nombre}`}
                className="h-20 w-16 rounded-lg border border-borde bg-superficie-2 object-cover"
              />
              <button
                type="button"
                onClick={() => adjuntos.quitar(img.id)}
                aria-label={`Quitar ${img.nombre}`}
                className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full border border-borde bg-superficie text-texto-suave shadow-sm transition hover:text-error"
              >
                <Icono nombre="cerrar" className="h-2.5 w-2.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {(adjuntos.error || error) && (
        <p className="mt-2 text-sm text-error" role="alert">
          {error ?? adjuntos.error}
        </p>
      )}

      {adjuntos.preparando && (
        <p className="mt-2 text-sm text-texto-suave" role="status">
          Preparando las fotos…
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-borde-fuerte bg-superficie px-4 text-sm font-semibold text-texto transition hover:border-primario/45">
          <Icono nombre="camara" className="h-4 w-4 text-primario" />
          {adjuntos.imagenes.length > 0 ? 'Añadir más páginas' : 'Fotografiar las páginas'}
          <input
            type="file"
            accept={TIPOS_ACEPTADOS.join(',')}
            multiple
            className="sr-only"
            disabled={leyendo}
            onChange={(e) => {
              if (e.target.files) void adjuntos.anadir(Array.from(e.target.files));
              e.target.value = '';
            }}
          />
        </label>

        <Boton
          type="button"
          onClick={() => void leer()}
          disabled={adjuntos.imagenes.length === 0 || leyendo}
          iconoDerecha="flecha"
        >
          {leyendo ? 'Leyéndolo…' : 'Leer estas páginas'}
        </Boton>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-texto-tenue">
        Hasta {MAXIMO_PAGINAS} páginas. Las leo una vez y me quedo con el texto; las fotos no se
        guardan en ningún sitio. Si una cuenta del libro está mal, te lo diré en vez de copiarla.
      </p>
    </div>
  );
}

function FichaActiva({ libro, onQuitar }: { libro: FichaLibro; onQuitar: () => void }) {
  return (
    <div className="mt-2 rounded-xl border border-exito/30 bg-exito-suave/50 px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-exito">
        <Icono nombre="comprobado" className="h-4 w-4 shrink-0" />
        Estoy siguiendo: {libro.titulo}
      </p>
      {libro.tema && <p className="mt-0.5 text-sm text-texto-suave">{libro.tema}</p>}

      {libro.metodo.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-sm text-texto-suave">
            Cómo he entendido que lo hace tu libro
          </summary>
          <ul className="mt-1.5 space-y-1 text-sm text-texto-suave">
            {libro.metodo.map((m, n) => (
              <li key={n} className="flex gap-2">
                <span aria-hidden="true">·</span>
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {libro.advertencias.length > 0 && (
        <p className="mt-2 text-sm text-texto-suave">
          <strong className="text-aviso">Ojo:</strong> {libro.advertencias.join(' ')}
        </p>
      )}

      <button
        type="button"
        onClick={onQuitar}
        className="mt-2 text-sm font-medium text-primario underline underline-offset-2"
      >
        Dejar de seguirlo
      </button>
    </div>
  );
}
