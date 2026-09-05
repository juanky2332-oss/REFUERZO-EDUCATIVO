import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Resolver } from '@/components/Resolver';

export const metadata: Metadata = {
  title: 'Resolver un ejercicio',
  description:
    'Sube la foto de tu ejercicio o escribe tu duda y recibe una explicación paso a paso, con el resultado comprobado.',
};

export default function PaginaResolver() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-10 text-texto-suave">Cargando…</div>
      }
    >
      <Resolver />
    </Suspense>
  );
}
