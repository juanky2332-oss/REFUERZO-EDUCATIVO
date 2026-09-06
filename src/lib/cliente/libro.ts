'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { FichaLibro, PeticionApuntes } from '@/lib/ai/schemas';
import type { ImagenPreparada } from '@/lib/cliente/imagenes';

/**
 * El libro o los apuntes del alumno, guardados en su navegador.
 *
 * Sirve para lo que no se puede resolver de otra forma: que las respuestas
 * sigan SU libro. La aplicación no conoce ninguna editorial ni puede conocerla,
 * así que la única manera honesta de ir de la mano de un libro concreto es
 * trabajar sobre las páginas que él mismo fotografía.
 *
 * Se lee UNA vez, al subirlas, y se guarda la ficha en texto. Las consultas
 * posteriores la llevan como contexto: reenviar las fotos en cada mensaje
 * costaría una fortuna y no aportaría nada.
 *
 * Vive en `localStorage`, igual que las preferencias: no hay cuentas ni
 * servidor de perfiles, y esas páginas son suyas.
 */

const CLAVE = 'refuerzo-educativo:libro';

export type ResultadoLibro = { ok: true; libro: FichaLibro } | { ok: false; error: string };

/** Valida lo guardado: un dato corrupto no debe romper la pantalla. */
export function interpretarLibro(bruto: string | null): FichaLibro | null {
  if (!bruto) return null;
  try {
    const d: unknown = JSON.parse(bruto);
    if (!d || typeof d !== 'object') return null;

    const l = d as Partial<FichaLibro>;
    // Sin contenido no hay nada que seguir: una ficha vacía sólo serviría para
    // que la interfaz dijera que está siguiendo un libro que no dice nada.
    if (typeof l.contenido !== 'string' || l.contenido.trim().length === 0) return null;

    return {
      titulo: typeof l.titulo === 'string' && l.titulo ? l.titulo : 'Mi libro',
      materia: (l.materia ?? 'desconocida') as FichaLibro['materia'],
      curso: (l.curso ?? 'desconocido') as FichaLibro['curso'],
      tema: typeof l.tema === 'string' ? l.tema : '',
      contenido: l.contenido,
      metodo: Array.isArray(l.metodo) ? l.metodo.filter((x) => typeof x === 'string') : [],
      vocabulario: Array.isArray(l.vocabulario)
        ? l.vocabulario.filter((x) => typeof x === 'string')
        : [],
      advertencias: Array.isArray(l.advertencias)
        ? l.advertencias.filter((x) => typeof x === 'string')
        : [],
    };
  } catch {
    return null;
  }
}

const oyentes = new Set<() => void>();
let ultimoBruto: string | null = null;
let ultimoValor: FichaLibro | null = null;
let inicializado = false;

function leer(): string | null {
  try {
    return window.localStorage.getItem(CLAVE);
  } catch {
    return null;
  }
}

/** `getSnapshot` tiene que devolver la misma referencia mientras nada cambie. */
function instantanea(): FichaLibro | null {
  const bruto = leer();
  if (!inicializado || bruto !== ultimoBruto) {
    ultimoBruto = bruto;
    ultimoValor = interpretarLibro(bruto);
    inicializado = true;
  }
  return ultimoValor;
}

function instantaneaServidor(): FichaLibro | null {
  return null;
}

function suscribir(alCambiar: () => void): () => void {
  oyentes.add(alCambiar);
  window.addEventListener('storage', alCambiar);
  return () => {
    oyentes.delete(alCambiar);
    window.removeEventListener('storage', alCambiar);
  };
}

export function useLibro(): {
  libro: FichaLibro | null;
  guardar: (libro: FichaLibro | null) => void;
} {
  const libro = useSyncExternalStore(suscribir, instantanea, instantaneaServidor);

  const guardar = useCallback((siguiente: FichaLibro | null) => {
    try {
      if (siguiente) window.localStorage.setItem(CLAVE, JSON.stringify(siguiente));
      else window.localStorage.removeItem(CLAVE);
    } catch {
      // Navegación privada: se aplica en esta sesión aunque no se pueda guardar.
      ultimoBruto = siguiente ? JSON.stringify(siguiente) : null;
      ultimoValor = siguiente;
      inicializado = true;
    }
    for (const o of oyentes) o();
  }, []);

  return { libro, guardar };
}

/** Manda las páginas al servidor para que las lea. Devuelve, no lanza. */
export async function leerPaginas(
  imagenes: ImagenPreparada[],
  contexto: Pick<PeticionApuntes, 'curso' | 'materia' | 'editorial'>,
  senal?: AbortSignal,
): Promise<ResultadoLibro> {
  try {
    const res = await fetch('/api/apuntes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...contexto,
        imagenes: imagenes.map((i) => ({ mime: i.mime, base64: i.base64, nombre: i.nombre })),
      }),
      signal: senal,
    });

    const datos: unknown = await res.json();
    if (!res.ok) {
      const e = datos as { error?: string };
      return { ok: false, error: e.error ?? 'No he podido leer esas páginas.' };
    }
    return { ok: true, libro: (datos as { libro: FichaLibro }).libro };
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      return { ok: false, error: 'Se ha cancelado.' };
    }
    return { ok: false, error: 'Se ha cortado la conexión. Inténtalo otra vez.' };
  }
}
