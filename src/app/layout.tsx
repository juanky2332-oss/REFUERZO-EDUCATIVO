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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <a className="saltar-al-contenido" href="#contenido">
          Saltar al contenido
        </a>

        <header className="no-imprimir border-b border-borde bg-superficie">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="flex items-center gap-2.5 font-semibold text-texto">
              <span
                aria-hidden="true"
                className="grid h-8 w-8 place-items-center rounded-lg bg-primario text-sobre-primario text-sm font-bold"
              >
                RE
              </span>
              <span className="leading-tight">
                Refuerzo Educativo
                <span className="block text-xs font-normal text-texto-tenue">
                  1.º y 2.º de ESO
                </span>
              </span>
            </Link>

            <nav aria-label="Principal" className="flex items-center gap-1 text-sm">
              <Link
                href="/resolver"
                className="rounded-lg px-3 py-2 font-medium text-texto-suave hover:bg-superficie-2 hover:text-texto"
              >
                Resolver
              </Link>
              <Link
                href="/material"
                className="rounded-lg px-3 py-2 font-medium text-texto-suave hover:bg-superficie-2 hover:text-texto"
              >
                Material
              </Link>
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
