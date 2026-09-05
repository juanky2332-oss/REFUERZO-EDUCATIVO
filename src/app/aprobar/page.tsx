import type { Metadata } from 'next';
import { Aprobar } from '@/components/Aprobar';

export const metadata: Metadata = {
  title: 'Quiero aprobar este tema',
  description:
    'Dinos qué entra en el examen y cuántos días faltan y te preparamos el plan de estudio, los contenidos esenciales, ejercicios de práctica y un simulacro.',
};

export default function PaginaAprobar() {
  return <Aprobar />;
}
