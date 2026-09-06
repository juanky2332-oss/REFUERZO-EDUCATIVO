import type { Metadata } from 'next';
import { GeneradorMaterial } from '@/components/GeneradorMaterial';
import { Documento } from '@/components/ui/Documento';

export const metadata: Metadata = {
  title: 'Crear material',
  description:
    'Genera ejercicios, exámenes, resúmenes, fichas, tests y planes de estudio para 1.º y 2.º de ESO, con cuadernillo del alumno y solucionario separados.',
};

/** El tipo se lee en el servidor: ver la nota de `resolver/page.tsx`. */
export default async function PaginaMaterial({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string | string[] }>;
}) {
  const { tipo } = await searchParams;
  return (
    <Documento>
      <GeneradorMaterial tipoInicial={typeof tipo === 'string' ? tipo : null} />
    </Documento>
  );
}
