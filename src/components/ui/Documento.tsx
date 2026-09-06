/**
 * Envoltura de las páginas que sí son un documento largo.
 *
 * La aplicación fija la altura del cuerpo para que la conversación ocupe la
 * pantalla exacta. Estas páginas, que se leen e imprimen de arriba abajo,
 * necesitan su propio contenedor con desplazamiento.
 */
export function Documento({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 overflow-y-auto print:overflow-visible">
      {children}
      <PieLegal />
    </div>
  );
}

export function PieLegal() {
  return (
    <footer className="no-imprimir mt-10 border-t border-borde bg-superficie">
      <div className="mx-auto max-w-3xl px-4 py-6 text-xs leading-relaxed text-texto-tenue">
        <p>
          Herramienta de apoyo al estudio. Comprueba las operaciones en el servidor y avisa cuando
          no puede confirmar algo, pero <strong>no sustituye a tu profesorado</strong>: si una
          respuesta aparece marcada como &laquo;necesita confirmación&raquo;, contrástala.
        </p>
        <p className="mt-2">
          No se guardan las fotos ni las conversaciones: se procesan para responderte y se
          descartan.
        </p>
      </div>
    </footer>
  );
}
