'use client';

import { useCallback, useId, useRef, useState } from 'react';
import {
  ErrorImagen,
  MAX_BYTES_ORIGEN,
  TIPOS_ACEPTADOS,
  formatearTamano,
  prepararImagen,
  type ImagenPreparada,
} from '@/lib/cliente/imagenes';

/**
 * Zona de subida de imágenes: arrastrar y soltar, selección de archivo y cámara
 * en el móvil. Siempre se muestra la previsualización antes de procesar nada
 * (regla 30) y se puede rotar o eliminar.
 */

const MAXIMO = 4;

interface Props {
  imagenes: ImagenPreparada[];
  onCambio: (imagenes: ImagenPreparada[]) => void;
  deshabilitado?: boolean;
}

export function ZonaImagenes({ imagenes, onCambio, deshabilitado = false }: Props) {
  const [arrastrando, setArrastrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const originales = useRef(new Map<string, File>());
  const inputArchivo = useRef<HTMLInputElement>(null);
  const inputCamara = useRef<HTMLInputElement>(null);
  const idZona = useId();

  const anadir = useCallback(
    async (archivos: FileList | File[]) => {
      setError(null);
      const lista = Array.from(archivos);
      const hueco = MAXIMO - imagenes.length;

      if (hueco <= 0) {
        setError(`Puedes enviar como máximo ${MAXIMO} imágenes a la vez.`);
        return;
      }

      setOcupado(true);
      const nuevas: ImagenPreparada[] = [];
      const fallos: string[] = [];

      for (const archivo of lista.slice(0, hueco)) {
        try {
          const preparada = await prepararImagen(archivo);
          originales.current.set(preparada.id, archivo);
          nuevas.push(preparada);
        } catch (e) {
          fallos.push(
            e instanceof ErrorImagen ? e.message : `No he podido leer "${archivo.name}".`,
          );
        }
      }

      setOcupado(false);
      if (fallos.length > 0) setError(fallos[0]);
      if (lista.length > hueco) {
        setError(`Sólo he añadido ${hueco}: el máximo son ${MAXIMO} imágenes.`);
      }
      if (nuevas.length > 0) onCambio([...imagenes, ...nuevas]);
    },
    [imagenes, onCambio],
  );

  const eliminar = (id: string) => {
    originales.current.delete(id);
    onCambio(imagenes.filter((i) => i.id !== id));
    setError(null);
  };

  const rotar = async (imagen: ImagenPreparada) => {
    const original = originales.current.get(imagen.id);
    if (!original) return;
    setOcupado(true);
    try {
      const girada = await prepararImagen(original, (imagen.rotacion + 90) % 360);
      onCambio(imagenes.map((i) => (i.id === imagen.id ? { ...girada, id: imagen.id } : i)));
    } catch {
      setError('No he podido girar la imagen.');
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          if (deshabilitado) return;
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          if (deshabilitado) return;
          e.preventDefault();
          setArrastrando(false);
          if (e.dataTransfer.files.length > 0) void anadir(e.dataTransfer.files);
        }}
        className={[
          'rounded-tarjeta border-2 border-dashed p-4 text-center transition',
          arrastrando ? 'border-primario bg-primario-suave' : 'border-borde bg-superficie-2',
          deshabilitado ? 'opacity-60' : '',
        ].join(' ')}
      >
        <p id={idZona} className="text-sm text-texto-suave">
          Arrastra aquí una foto del ejercicio, o
        </p>

        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => inputArchivo.current?.click()}
            disabled={deshabilitado || ocupado || imagenes.length >= MAXIMO}
            aria-describedby={idZona}
            className="min-h-11 rounded-lg border border-borde-fuerte bg-superficie px-4 text-sm font-medium text-texto hover:bg-superficie-2 disabled:opacity-50"
          >
            Elegir imagen
          </button>
          <button
            type="button"
            onClick={() => inputCamara.current?.click()}
            disabled={deshabilitado || ocupado || imagenes.length >= MAXIMO}
            className="min-h-11 rounded-lg border border-borde-fuerte bg-superficie px-4 text-sm font-medium text-texto hover:bg-superficie-2 disabled:opacity-50 sm:hidden"
          >
            Hacer una foto
          </button>
        </div>

        <p className="mt-2 text-xs text-texto-tenue">
          JPG, PNG, WEBP o GIF · hasta {formatearTamano(MAX_BYTES_ORIGEN)} · máximo {MAXIMO}
        </p>

        <input
          ref={inputArchivo}
          type="file"
          accept={TIPOS_ACEPTADOS.join(',')}
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) void anadir(e.target.files);
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
            if (e.target.files) void anadir(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {ocupado && (
        <p className="mt-2 text-sm text-texto-suave" role="status">
          Preparando la imagen…
        </p>
      )}

      {error && (
        <p className="mt-2 rounded-lg bg-error-suave px-3 py-2 text-sm text-error" role="alert">
          {error}
        </p>
      )}

      {imagenes.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {imagenes.map((img) => (
            <li
              key={img.id}
              className="overflow-hidden rounded-tarjeta border border-borde bg-superficie"
            >
              {/* Previsualización local en base64: next/image no aporta aquí. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.previsualizacion}
                alt={`Previsualización de ${img.nombre}`}
                className="h-28 w-full object-cover"
              />
              <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                <span className="truncate text-xs text-texto-tenue" title={img.nombre}>
                  {formatearTamano(img.bytes)}
                </span>
                <span className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => void rotar(img)}
                    disabled={deshabilitado || ocupado}
                    aria-label={`Girar ${img.nombre}`}
                    className="grid h-8 w-8 place-items-center rounded-md text-texto-suave hover:bg-superficie-2 disabled:opacity-50"
                  >
                    <span aria-hidden="true">↻</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => eliminar(img.id)}
                    disabled={deshabilitado}
                    aria-label={`Quitar ${img.nombre}`}
                    className="grid h-8 w-8 place-items-center rounded-md text-texto-suave hover:bg-error-suave hover:text-error disabled:opacity-50"
                  >
                    <span aria-hidden="true">✕</span>
                  </button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
