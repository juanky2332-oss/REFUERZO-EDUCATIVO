'use client';

import { useRef, useState } from 'react';
import { Icono } from './ui/Icono';
import { Boton } from './ui/primitivos';
import { useAdjuntos } from '@/lib/cliente/adjuntos';
import { TIPOS_ACEPTADOS, type ImagenPreparada } from '@/lib/cliente/imagenes';

/**
 * Caja para preguntar desde dentro de otra cosa: una pregunta del material, un
 * apartado de un resumen.
 *
 * Es la barra de escritura del chat en pequeño, y acepta lo mismo: texto, una
 * foto hecha con el móvil, un recorte pegado con Ctrl+V o un archivo arrastrado
 * encima. El sitio donde estás preguntando ya aporta el contexto, así que aquí
 * sólo hace falta decir qué no te sale.
 */

export interface ConsultaEscrita {
  texto: string;
  imagenes: ImagenPreparada[];
}

export function PanelConsulta({
  marcador,
  textoBoton,
  ocupado = false,
  onEnviar,
}: {
  marcador: string;
  textoBoton: string;
  ocupado?: boolean;
  onEnviar: (consulta: ConsultaEscrita) => void;
}) {
  const [texto, setTexto] = useState('');
  const [arrastrando, setArrastrando] = useState(false);
  const adjuntos = useAdjuntos();
  const inputArchivo = useRef<HTMLInputElement>(null);
  const inputCamara = useRef<HTMLInputElement>(null);

  const vacio = !texto.trim() && adjuntos.imagenes.length === 0;

  function enviar() {
    if (vacio || ocupado) return;
    onEnviar({ texto: texto.trim(), imagenes: adjuntos.imagenes });
    setTexto('');
    adjuntos.limpiar();
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setArrastrando(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setArrastrando(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setArrastrando(false);
        if (e.dataTransfer.files.length > 0) void adjuntos.anadir(Array.from(e.dataTransfer.files));
      }}
      className={`rounded-tarjeta border p-3 transition ${
        arrastrando ? 'border-primario bg-primario-suave' : 'border-borde bg-superficie-2'
      }`}
    >
      {adjuntos.imagenes.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-2">
          {adjuntos.imagenes.map((img) => (
            <li key={img.id} className="relative">
              {/* Previsualización local en base64: next/image no aporta nada. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.previsualizacion}
                alt={`Foto adjunta: ${img.nombre}`}
                className="h-14 w-14 rounded-lg border border-borde bg-superficie object-cover"
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

      {adjuntos.preparando && (
        <p className="mb-2 text-sm text-texto-suave" role="status">
          Preparando la foto…
        </p>
      )}

      {adjuntos.error && (
        <p className="mb-2 text-sm text-error" role="alert">
          {adjuntos.error}
        </p>
      )}

      <label className="sr-only" htmlFor={`consulta-${marcador.length}`}>
        Tu duda
      </label>
      <textarea
        id={`consulta-${marcador.length}`}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onPaste={(e) => {
          const fotos = Array.from(e.clipboardData.files).filter((f) =>
            f.type.startsWith('image/'),
          );
          if (fotos.length > 0) {
            e.preventDefault();
            void adjuntos.anadir(fotos);
          }
        }}
        rows={2}
        maxLength={4000}
        placeholder={marcador}
        disabled={ocupado}
        className="w-full resize-y rounded-xl border border-borde bg-superficie px-3 py-2 text-sm text-texto placeholder:text-texto-tenue disabled:opacity-60"
      />

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <span className="flex gap-1">
          <BotonAdjuntar
            onClick={() => inputCamara.current?.click()}
            disabled={ocupado}
            icono="camara"
            className="sm:hidden"
          >
            Hacer foto
          </BotonAdjuntar>
          <BotonAdjuntar
            onClick={() => inputArchivo.current?.click()}
            disabled={ocupado}
            icono="imagen"
          >
            Foto o recorte
          </BotonAdjuntar>
        </span>

        <Boton type="button" onClick={enviar} disabled={vacio || ocupado} iconoDerecha="flecha">
          {textoBoton}
        </Boton>
      </div>

      <p className="mt-1.5 text-xs text-texto-tenue">
        También puedes pegar un recorte con Ctrl+V o arrastrar la imagen aquí encima.
      </p>

      <input
        ref={inputArchivo}
        type="file"
        accept={TIPOS_ACEPTADOS.join(',')}
        multiple
        className="sr-only"
        onChange={(e) => {
          if (e.target.files) void adjuntos.anadir(Array.from(e.target.files));
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
          if (e.target.files) void adjuntos.anadir(Array.from(e.target.files));
          e.target.value = '';
        }}
      />
    </div>
  );
}

function BotonAdjuntar({
  children,
  onClick,
  disabled,
  icono,
  className = '',
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  icono: 'camara' | 'imagen';
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-borde bg-superficie px-3 text-xs font-semibold text-texto-suave transition hover:border-primario/45 hover:text-primario disabled:opacity-45 ${className}`}
    >
      <Icono nombre={icono} className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}
