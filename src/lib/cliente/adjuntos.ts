'use client';

import { useCallback, useRef, useState } from 'react';
import {
  ErrorImagen,
  prepararImagen,
  type ImagenPreparada,
} from '@/lib/cliente/imagenes';

/**
 * Fotos adjuntas al mensaje que se está escribiendo.
 *
 * Vive en un hook y no dentro de la barra de escritura porque las fotos entran
 * por tres sitios distintos —el botón, Ctrl+V y arrastrarlas sobre la
 * conversación— y los tres tienen que compartir el mismo límite y el mismo
 * mensaje de error.
 */

export const MAXIMO_IMAGENES = 4;

export interface Adjuntos {
  imagenes: ImagenPreparada[];
  error: string | null;
  preparando: boolean;
  anadir: (archivos: File[]) => Promise<void>;
  quitar: (id: string) => void;
  rotar: (imagen: ImagenPreparada) => Promise<void>;
  limpiar: () => void;
}

/**
 * Decide qué se acepta de una tanda de ficheros y qué se le dice al usuario.
 *
 * Se separa del hook para poder probarlo: el aviso de «sólo he cogido N» es el
 * tipo de detalle que se rompe callando y deja al alumno creyendo que ha
 * mandado cuatro fotos cuando sólo han viajado dos.
 */
export function repartirArchivos(
  yaHay: number,
  entrantes: number,
  maximo: number = MAXIMO_IMAGENES,
): { cabe: number; aviso: string | null } {
  const hueco = maximo - yaHay;

  if (hueco <= 0) {
    return { cabe: 0, aviso: `Puedes mandar como máximo ${maximo} fotos.` };
  }
  if (entrantes > hueco) {
    return {
      cabe: hueco,
      aviso: `Sólo he cogido ${hueco}: el máximo son ${maximo} fotos.`,
    };
  }
  return { cabe: entrantes, aviso: null };
}

export function useAdjuntos(maximo: number = MAXIMO_IMAGENES): Adjuntos {
  const [imagenes, setImagenes] = useState<ImagenPreparada[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [preparando, setPreparando] = useState(false);

  /**
   * Espejo de la lista para consultarla dentro de `anadir` sin que el hueco
   * disponible se calcule con un valor caducado: preparar una foto tarda, y
   * mientras tanto pueden haber entrado otras por otra vía.
   */
  const actuales = useRef<ImagenPreparada[]>([]);
  const guardar = useCallback((siguiente: (prev: ImagenPreparada[]) => ImagenPreparada[]) => {
    setImagenes((prev) => {
      const lista = siguiente(prev);
      actuales.current = lista;
      return lista;
    });
  }, []);

  const anadir = useCallback(async (archivos: File[]) => {
    setError(null);
    const fotos = archivos.filter((a) => a.type.startsWith('image/'));
    if (fotos.length === 0) {
      if (archivos.length > 0) setError('Eso no es una imagen. Manda una foto del ejercicio.');
      return;
    }

    const { cabe, aviso } = repartirArchivos(actuales.current.length, fotos.length, maximo);
    if (cabe === 0) {
      setError(aviso);
      return;
    }

    setPreparando(true);
    const nuevas: ImagenPreparada[] = [];
    let fallo: string | null = null;

    for (const archivo of fotos.slice(0, cabe)) {
      try {
        nuevas.push(await prepararImagen(archivo));
      } catch (e) {
        fallo ??= e instanceof ErrorImagen ? e.message : `No he podido leer «${archivo.name}».`;
      }
    }

    setPreparando(false);
    setError(aviso ?? fallo);
    if (nuevas.length > 0) guardar((prev) => [...prev, ...nuevas].slice(0, maximo));
  }, [guardar, maximo]);

  const quitar = useCallback(
    (id: string) => {
      setError(null);
      guardar((prev) => prev.filter((i) => i.id !== id));
    },
    [guardar],
  );

  const rotar = useCallback(async (imagen: ImagenPreparada) => {
    try {
      const girada = await prepararImagen(imagen.original, (imagen.rotacion + 90) % 360);
      guardar((prev) => prev.map((i) => (i.id === imagen.id ? { ...girada, id: imagen.id } : i)));
    } catch {
      setError('No he podido girar la foto.');
    }
  }, [guardar]);

  const limpiar = useCallback(() => {
    guardar(() => []);
    setError(null);
  }, [guardar]);

  return { imagenes, error, preparando, anadir, quitar, rotar, limpiar };
}
