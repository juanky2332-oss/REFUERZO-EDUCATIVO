'use client';

import { useSyncExternalStore } from 'react';
import { CURSOS, MATERIAS, NIVELES, type Curso, type Materia, type Nivel } from '@/lib/types';

/**
 * Preferencias de trabajo del usuario (curso, materia y nivel de explicación).
 *
 * Se guardan en `localStorage` del propio navegador para no tener que elegirlas
 * en cada visita. NO son datos personales y no salen del dispositivo: no hay
 * cuentas, ni servidor de perfiles, ni identificadores (regla 43).
 *
 * Se leen con `useSyncExternalStore`, que es el mecanismo que React ofrece para
 * suscribirse a un almacén externo: da el valor por defecto al renderizar en el
 * servidor —donde `localStorage` no existe— y el real en el navegador, sin
 * desajuste de hidratación y sin un efecto que provoque un render en cascada.
 * Además mantiene sincronizadas dos pestañas abiertas a la vez.
 */

const CLAVE = 'refuerzo-educativo:preferencias';

export interface Preferencias {
  curso: Curso;
  materia: Materia;
  nivel: Nivel;
}

export const PREFERENCIAS_POR_DEFECTO: Preferencias = {
  curso: 'desconocido',
  materia: 'desconocida',
  nivel: 'B',
};

/** Valida lo que hubiera guardado: un dato corrupto no debe romper la pantalla. */
export function interpretar(bruto: string | null): Preferencias {
  if (!bruto) return PREFERENCIAS_POR_DEFECTO;
  try {
    const datos: unknown = JSON.parse(bruto);
    if (!datos || typeof datos !== 'object') return PREFERENCIAS_POR_DEFECTO;

    const p = datos as Partial<Preferencias>;
    return {
      curso: CURSOS.includes(p.curso as Curso)
        ? (p.curso as Curso)
        : PREFERENCIAS_POR_DEFECTO.curso,
      materia: MATERIAS.includes(p.materia as Materia)
        ? (p.materia as Materia)
        : PREFERENCIAS_POR_DEFECTO.materia,
      nivel: NIVELES.includes(p.nivel as Nivel)
        ? (p.nivel as Nivel)
        : PREFERENCIAS_POR_DEFECTO.nivel,
    };
  } catch {
    return PREFERENCIAS_POR_DEFECTO;
  }
}

const oyentes = new Set<() => void>();

/**
 * `getSnapshot` tiene que devolver siempre la MISMA referencia mientras el valor
 * no cambie, o React entraría en un bucle de renders. Por eso se cachea el
 * último texto leído junto con el objeto que produjo.
 */
let ultimoBruto: string | null = null;
let ultimoValor: Preferencias = PREFERENCIAS_POR_DEFECTO;
let inicializado = false;

function leerAlmacen(): string | null {
  try {
    return window.localStorage.getItem(CLAVE);
  } catch {
    // Navegación privada o almacenamiento bloqueado por el navegador.
    return null;
  }
}

function instantanea(): Preferencias {
  const bruto = leerAlmacen();
  if (!inicializado || bruto !== ultimoBruto) {
    ultimoBruto = bruto;
    ultimoValor = interpretar(bruto);
    inicializado = true;
  }
  return ultimoValor;
}

function instantaneaServidor(): Preferencias {
  return PREFERENCIAS_POR_DEFECTO;
}

function suscribir(alCambiar: () => void): () => void {
  oyentes.add(alCambiar);
  // Mantiene sincronizadas varias pestañas del mismo navegador.
  window.addEventListener('storage', alCambiar);
  return () => {
    oyentes.delete(alCambiar);
    window.removeEventListener('storage', alCambiar);
  };
}

function avisar() {
  for (const oyente of oyentes) oyente();
}

export function usePreferencias(): [Preferencias, (cambios: Partial<Preferencias>) => void] {
  const preferencias = useSyncExternalStore(suscribir, instantanea, instantaneaServidor);

  function actualizar(cambios: Partial<Preferencias>) {
    const nuevas = { ...instantanea(), ...cambios };
    try {
      window.localStorage.setItem(CLAVE, JSON.stringify(nuevas));
    } catch {
      // Si el navegador no deja guardar, se aplica igualmente en esta sesión.
      ultimoBruto = JSON.stringify(nuevas);
      ultimoValor = nuevas;
      inicializado = true;
    }
    avisar();
  }

  return [preferencias, actualizar];
}
