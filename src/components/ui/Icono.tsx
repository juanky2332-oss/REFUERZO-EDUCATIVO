/**
 * Juego de iconos de la aplicación.
 *
 * Son SVG de trazo dibujados aquí a propósito, en lugar de emoji: un emoji se
 * dibuja distinto en cada sistema operativo, no hereda el color del texto y
 * abarata el aspecto de un producto que quiere transmitir confianza (regla 64).
 *
 * Todos comparten rejilla de 24, trazo de 1.75 y `currentColor`, así que se
 * colorean y se dimensionan con las clases de Tailwind del elemento que los usa.
 */

export type NombreIcono =
  | 'camara'
  | 'lapiz'
  | 'lupa'
  | 'birrete'
  | 'documento'
  | 'estrella'
  | 'comprobado'
  | 'aviso'
  | 'flecha'
  | 'girar'
  | 'cerrar'
  | 'imprimir'
  | 'copiar'
  | 'ajustes'
  | 'calendario'
  | 'reiniciar'
  | 'igual'
  | 'libro'
  | 'mas'
  | 'enviar'
  | 'imagen'
  | 'chat';

const TRAZOS: Record<NombreIcono, React.ReactNode> = {
  camara: (
    <>
      <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.2a1 1 0 0 0 .83-.45l.94-1.4A1 1 0 0 1 9.3 3.7h5.4a1 1 0 0 1 .83.45l.94 1.4a1 1 0 0 0 .83.45h1.2A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  lapiz: (
    <>
      <path d="M4 20h4l10.5-10.5a2.83 2.83 0 0 0-4-4L4 16z" />
      <path d="M14.5 5.5 18.5 9.5" />
    </>
  ),
  lupa: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  birrete: (
    <>
      <path d="M12 4 2.5 8.5 12 13l9.5-4.5z" />
      <path d="M6.5 10.8v4.9c0 .5.25.95.68 1.2 1.2.7 3.02 1.4 4.82 1.4s3.62-.7 4.82-1.4a1.4 1.4 0 0 0 .68-1.2v-4.9" />
      <path d="M21.5 8.5v5" />
    </>
  ),
  documento: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M8.5 13h7M8.5 16.5h4.5" />
    </>
  ),
  estrella: (
    <path d="m12 3.8 2.45 4.96 5.47.8-3.96 3.86.94 5.45L12 16.3l-4.9 2.57.94-5.45-3.96-3.86 5.47-.8z" />
  ),
  comprobado: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.2 2.4 2.4 4.6-4.9" />
    </>
  ),
  aviso: (
    <>
      <path d="M12 4.5 21 19.5H3z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </>
  ),
  flecha: <path d="M4.5 12h15m0 0-5.5-5.5M19.5 12 14 17.5" />,
  girar: (
    <>
      <path d="M20 11.5a8 8 0 1 0-2.2 6" />
      <path d="M20.5 5.5v5h-5" />
    </>
  ),
  cerrar: <path d="M6 6l12 12M18 6 6 18" />,
  imprimir: (
    <>
      <path d="M7 9V4h10v5" />
      <path d="M7 18H5.5A2.5 2.5 0 0 1 3 15.5v-4A2.5 2.5 0 0 1 5.5 9h13a2.5 2.5 0 0 1 2.5 2.5v4a2.5 2.5 0 0 1-2.5 2.5H17" />
      <path d="M7 14h10v6H7z" />
    </>
  ),
  copiar: (
    <>
      <path d="M9 9h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z" />
      <path d="M15 6.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h.5" />
    </>
  ),
  ajustes: (
    <>
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
      <circle cx="16" cy="7" r="2.2" />
      <circle cx="8" cy="17" r="2.2" />
    </>
  ),
  calendario: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8.5 3.5V6.5M15.5 3.5V6.5" />
    </>
  ),
  reiniciar: (
    <>
      <path d="M4 12a8 8 0 1 1 2.5 5.8" />
      <path d="M3.5 18.5v-5h5" />
    </>
  ),
  igual: <path d="M5.5 9.5h13M5.5 14.5h13" />,
  libro: (
    <>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10a3 3 0 0 1 3 3v12a2.5 2.5 0 0 0-2.5-2.5H5.5A1.5 1.5 0 0 1 4 15z" />
      <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H14a3 3 0 0 0-3 3v12a2.5 2.5 0 0 1 2.5-2.5h5A1.5 1.5 0 0 0 20 15z" />
    </>
  ),
  mas: <path d="M12 5.5v13M5.5 12h13" />,
  enviar: <path d="M12 19.5V5m0 0-6 6m6-6 6 6" />,
  imagen: (
    <>
      <rect x="3.2" y="4.8" width="17.6" height="14.4" rx="2.4" />
      <circle cx="8.6" cy="10" r="1.6" />
      <path d="m4.2 17.4 4.3-4.1a2 2 0 0 1 2.7-.05l3.2 2.9a2 2 0 0 0 2.7-.02l2.7-2.5" />
    </>
  ),
  chat: (
    <>
      <path d="M20.5 12.2c0 4-3.8 7.2-8.5 7.2a9.7 9.7 0 0 1-2.6-.35L4.2 20.5l1.3-3.4A6.9 6.9 0 0 1 3.5 12.2C3.5 8.2 7.3 5 12 5s8.5 3.2 8.5 7.2Z" />
    </>
  ),
};

interface Props {
  nombre: NombreIcono;
  className?: string;
  /** Texto para lectores de pantalla. Sin él, el icono se marca decorativo. */
  titulo?: string;
}

export function Icono({ nombre, className = 'h-5 w-5', titulo }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={titulo ? 'img' : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
      focusable="false"
    >
      {TRAZOS[nombre]}
    </svg>
  );
}
