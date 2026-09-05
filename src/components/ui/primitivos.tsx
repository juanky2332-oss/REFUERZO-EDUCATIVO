/**
 * Piezas visuales compartidas.
 *
 * Toda la aplicación se construye con estas cuatro cosas para que las tres
 * pantallas se sientan el mismo producto y no tres maquetaciones parecidas.
 */

import { Icono, type NombreIcono } from './Icono';

// --- Tarjeta ------------------------------------------------------------------

export function Tarjeta({
  children,
  className = '',
  elevada = false,
  as: Etiqueta = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  elevada?: boolean;
  as?: 'div' | 'section' | 'article' | 'li';
}) {
  return (
    <Etiqueta
      className={[
        'rounded-tarjeta border border-borde bg-superficie',
        elevada ? 'shadow-[var(--sombra)]' : '',
        className,
      ].join(' ')}
    >
      {children}
    </Etiqueta>
  );
}

// --- Botón --------------------------------------------------------------------

type Variante = 'primario' | 'secundario' | 'sutil';
type Tamano = 'md' | 'lg';

const VARIANTES: Record<Variante, string> = {
  primario:
    'bg-primario text-sobre-primario hover:bg-primario-fuerte shadow-[0_1px_2px_rgba(19,26,43,.14)]',
  secundario:
    'border border-borde-fuerte bg-superficie text-texto hover:bg-superficie-2 hover:border-primario/40',
  sutil: 'text-texto-suave hover:bg-superficie-2 hover:text-texto',
};

const TAMANOS: Record<Tamano, string> = {
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-13 px-6 text-base',
};

interface PropsBoton extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamano?: Tamano;
  icono?: NombreIcono;
  iconoDerecha?: NombreIcono;
}

export function Boton({
  variante = 'primario',
  tamano = 'md',
  icono,
  iconoDerecha,
  className = '',
  children,
  ...resto
}: PropsBoton) {
  return (
    <button
      {...resto}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition',
        'disabled:cursor-not-allowed disabled:opacity-45',
        VARIANTES[variante],
        TAMANOS[tamano],
        className,
      ].join(' ')}
    >
      {icono && <Icono nombre={icono} className="h-[1.15em] w-[1.15em] shrink-0" />}
      {children}
      {iconoDerecha && <Icono nombre={iconoDerecha} className="h-[1.15em] w-[1.15em] shrink-0" />}
    </button>
  );
}

// --- Control segmentado --------------------------------------------------------

export function Segmentado<T extends string>({
  valor,
  opciones,
  onCambio,
  etiqueta,
  className = '',
}: {
  valor: T;
  opciones: { valor: T; texto: string; titulo?: string }[];
  onCambio: (v: T) => void;
  etiqueta: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={etiqueta}
      className={`inline-flex w-full gap-1 rounded-xl border border-borde bg-superficie-2 p-1 ${className}`}
    >
      {opciones.map((o) => {
        const activo = valor === o.valor;
        return (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={activo}
            title={o.titulo}
            onClick={() => onCambio(o.valor)}
            className={[
              'min-h-10 flex-1 rounded-lg px-2 text-sm font-semibold transition',
              activo
                ? 'bg-superficie text-primario shadow-[0_1px_3px_rgba(19,26,43,.12)]'
                : 'text-texto-tenue hover:text-texto',
            ].join(' ')}
          >
            {o.texto}
          </button>
        );
      })}
    </div>
  );
}

// --- Encabezado de sección -----------------------------------------------------

export function TituloSeccion({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-texto-tenue">{children}</h2>
  );
}
