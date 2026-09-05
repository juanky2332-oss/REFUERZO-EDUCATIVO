import { Suspense } from 'react';
import type { Metadata } from 'next';
import { GeneradorMaterial } from '@/components/GeneradorMaterial';

export const metadata: Metadata = {
  title: 'Crear material',
  description:
    'Genera ejercicios, exámenes, resúmenes, fichas, tests y planes de estudio para 1.º y 2.º de ESO, con cuadernillo del alumno y solucionario separados.',
};

export default function PaginaMaterial() {
  return (
    <Suspense
      fallback={<div className="mx-auto max-w-3xl px-4 py-10 text-texto-suave">Cargando…</div>}
    >
      <GeneradorMaterial />
    </Suspense>
  );
}
