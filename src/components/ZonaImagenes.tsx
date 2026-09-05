'use client';

import { useCallback, useId, useRef, useState } from 'react';
import { Icono } from './ui/Icono';
import { Boton } from './ui/primitivos';
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
 * (regla 30), y se puede girar o quitar cada foto.
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
          nuevas.push(await prepararImagen(archivo));
        } catch (e) {
          fallos.push(
            e instanceof ErrorImagen ? e.message : `No he podido leer «${archivo.name}».`,
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
    onCambio(imagenes.filter((i) => i.id !== id));
    setError(null);
  };

  const rotar = async (imagen: ImagenPreparada) => {
    setOcupado(true);
    try {
      const girada = await prepararImagen(imagen.original, (imagen.rotacion + 90) % 360);
      onCambio(imagenes.map((i) => (i.id === imagen.id ? { ...girada, id: imagen.id } : i)));
    } catch {
      setError('No he podido girar la imagen.');
    } finally {
      setOcupado(false);
    }
  };

  const lleno = imagenes.length >= MAXIMO;

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
          'rounded-tarjeta border-2 border-dashed px-4 py-5 text-center transition',
          arrastrando
            ? 'border-primario bg-primario-suave'
            : 'border-borde bg-superficie-2 hover:border-borde-fuerte',
          deshabilitado ? 'opacity-60' : '',
        ].join(' ')}
      >
        <span
          aria-hidden="true"
          className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-superficie text-primario shadow-[0_1px_2px_rgba(19,26,43,.08)]"
        >
          <Icono nombre="camara" />
        </span>

        <p id={idZona} className="mt-2.5 text-sm font-medium text-texto">
          Arrastra aquí la foto del ejercicio
        </p>

        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Boton
            type="button"
            variante="secundario"
            onClick={() => inputArchivo.current?.click()}
            disabled={deshabilitado || ocupado || lleno}
            aria-describedby={idZona}
          >
            Elegir imagen
          </Boton>
          <Boton
            type="button"
            variante="secundario"
            icono="camara"
            className="sm:hidden"
            onClick={() => inputCamara.current?.click()}
            disabled={deshabilitado || ocupado || lleno}
          >
            Hacer una foto
          </Boton>
        </div>

        <p className="mt-2.5 text-xs text-texto-tenue">
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
        <p
          className="mt-2 flex items-start gap-2 rounded-lg bg-error-suave px-3 py-2 text-sm text-error"
          role="alert"
        >
          <Icono nombre="aviso" className="mt-0.5 h-4 w-4 shrink-0" />
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
              {/* Previsualización local en base64: next/image no aporta nada aquí. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.previsualizacion}
                alt={`Previsualización de ${img.nombre}`}
                className="h-28 w-full bg-superficie-2 object-cover"
              />
              <div className="flex items-center justify-between gap-1 border-t border-borde px-2 py-1.5">
                <span className="truncate text-xs text-texto-tenue" title={img.nombre}>
                  {formatearTamano(img.bytes)}
                </span>
                <span className="flex gap-0.5">
                  <button
                    type="button"
                    onClick={() => void rotar(img)}
                    disabled={deshabilitado || ocupado}
                    aria-label={`Girar ${img.nombre}`}
                    className="grid h-9 w-9 place-items-center rounded-lg text-texto-suave transition hover:bg-superficie-2 hover:text-texto disabled:opacity-50"
                  >
                    <Icono nombre="girar" className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => eliminar(img.id)}
                    disabled={deshabilitado}
                    aria-label={`Quitar ${img.nombre}`}
                    className="grid h-9 w-9 place-items-center rounded-lg text-texto-suave transition hover:bg-error-suave hover:text-error disabled:opacity-50"
                  >
                    <Icono nombre="cerrar" className="h-4 w-4" />
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
