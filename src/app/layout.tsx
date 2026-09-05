import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Refuerzo Educativo — Apoyo de 1.º y 2.º de ESO',
    template: '%s · Refuerzo Educativo',
  },
  description:
    'Sube la foto de un ejercicio de Matemáticas, Física y Química o Biología y Geología y te lo explico paso a paso, comprobando la solución antes de dártela.',
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f7fb' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0f1d' },
  ],
};

const NAVEGACION = [
  { href: '/resolver', texto: 'Resolver' },
  { href: '/aprobar', texto: 'Aprobar' },
  { href: '/material', texto: 'Material' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <a className="saltar-al-contenido" href="#contenido">
          Saltar al contenido
        </a>

        <header className="no-imprimir sticky top-0 z-40 border-b border-borde bg-superficie/85 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2.5">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-semibold text-texto"
              aria-label="Refuerzo Educativo, ir al inicio"
            >
              <span
                aria-hidden="true"
                className="grid h-9 w-9 place-items-center rounded-xl bg-primario text-sm font-bold text-sobre-primario"
              >
                RE
              </span>
              <span className="leading-tight">
                Refuerzo Educativo
                <span className="block text-xs font-normal text-texto-tenue">1.º y 2.º de ESO</span>
              </span>
            </Link>

            <nav aria-label="Principal" className="flex items-center gap-0.5 text-sm">
              {NAVEGACION.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="rounded-lg px-2.5 py-2 font-medium text-texto-suave transition hover:bg-superficie-2 hover:text-texto sm:px-3"
                >
                  {n.texto}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main id="contenido" className="flex-1">
          {children}
        </main>

        <footer className="no-imprimir border-t border-borde bg-superficie">
          <div className="mx-auto max-w-5xl px-4 py-6 text-xs leading-relaxed text-texto-tenue">
            <p>
              Herramienta de apoyo al estudio. Comprueba las operaciones en el servidor y avisa
              cuando no puede confirmar algo, pero <strong>no sustituye a tu profesorado</strong>:
              si una respuesta aparece marcada como &laquo;necesita confirmación&raquo;, contrástala.
            </p>
            <p className="mt-2">
              No se guardan las fotos ni las conversaciones: se procesan para responderte y se
              descartan.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
