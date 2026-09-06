import { permanentRedirect } from 'next/navigation';

/**
 * Ruta antigua. El plan de estudio se pide desde el botón + de la conversación,
 * y desde el propio plan se encadenan la práctica y el simulacro.
 */
export default function PaginaAprobar() {
  permanentRedirect('/');
}
