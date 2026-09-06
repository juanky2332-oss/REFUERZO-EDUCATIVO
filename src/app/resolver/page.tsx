import { permanentRedirect } from 'next/navigation';

/**
 * Ruta antigua. Resolver, corregir y mandar una foto ya no son tres sitios
 * distintos: todo ocurre en la conversación de la portada. Se mantiene el
 * redirección para no romper un enlace guardado.
 */
export default function PaginaResolver() {
  permanentRedirect('/');
}
