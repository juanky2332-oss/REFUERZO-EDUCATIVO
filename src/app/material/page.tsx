import { permanentRedirect } from 'next/navigation';

/**
 * Ruta antigua. Crear ejercicios, exámenes y resúmenes ya no es una pantalla
 * aparte: se pide desde el botón + de la conversación y el material aparece en
 * el propio hilo, con la solución de cada pregunta a un clic.
 */
export default function PaginaMaterial() {
  permanentRedirect('/');
}
