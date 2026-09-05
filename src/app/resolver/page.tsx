import type { Metadata } from 'next';
import { Resolver } from '@/components/Resolver';

export const metadata: Metadata = {
  title: 'Resolver un ejercicio',
  description:
    'Sube la foto de tu ejercicio o escribe tu duda y recibe una explicación paso a paso, con el resultado comprobado.',
};

/**
 * El parámetro `modo` se lee aquí, en el servidor, y se pasa como prop.
 *
 * Con `useSearchParams` en el cliente, Next obliga a envolver la página en un
 * `Suspense` y el primer pintado era un «Cargando…» en blanco. Leyéndolo aquí,
 * la pantalla llega hecha.
 */
export default async function PaginaResolver({
  searchParams,
}: {
  searchParams: Promise<{ modo?: string | string[] }>;
}) {
  const { modo } = await searchParams;
  return <Resolver modo={typeof modo === 'string' ? modo : null} />;
}
