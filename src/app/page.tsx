import Link from 'next/link';

/**
 * Pantalla de entrada.
 *
 * Una sola pregunta arriba —¿qué necesitas?— y caminos evidentes. El usuario
 * tiene que entender en segundos cómo empezar (regla 29).
 */

interface Opcion {
  href: string;
  icono: string;
  titulo: string;
  descripcion: string;
  destacada?: boolean;
}

const OPCIONES: Opcion[] = [
  {
    href: '/resolver?modo=foto',
    icono: '📷',
    titulo: 'Subir una foto',
    descripcion: 'Haz una foto del ejercicio y te lo explico paso a paso.',
    destacada: true,
  },
  {
    href: '/resolver',
    icono: '✍️',
    titulo: 'Escribir mi pregunta',
    descripcion: 'Cuéntame qué no entiendes y te lo explico desde el principio.',
  },
  {
    href: '/resolver?modo=corregir',
    icono: '🔎',
    titulo: 'Corregir mi ejercicio',
    descripcion: 'Envíame lo que has hecho y te digo si está bien y dónde falla.',
  },
  {
    href: '/material?tipo=examen',
    icono: '🎓',
    titulo: 'Preparar un examen',
    descripcion: 'Simulacro con puntuación y solucionario para practicar.',
  },
  {
    href: '/material?tipo=ejercicios',
    icono: '📝',
    titulo: 'Crear ejercicios',
    descripcion: 'Una tanda de ejercicios del tema, de menos a más difícil.',
  },
  {
    href: '/material?tipo=resumen',
    icono: '⭐',
    titulo: 'Resumir un tema',
    descripcion: 'El resumen y lo que hay que aprender sí o sí.',
  },
];

export default function Inicio() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <section className="max-w-2xl">
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-texto sm:text-4xl">
          Sube el ejercicio y te ayudo a entenderlo.
        </h1>
        <p className="mt-4 text-lg text-texto-suave">
          Apoyo de Matemáticas, Física y Química y Biología y Geología para 1.º y 2.º de ESO.
          Leo la foto, resuelvo, <strong className="text-texto">compruebo el resultado</strong> y
          te lo explico a tu nivel.
        </p>
      </section>

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-texto-tenue">
        ¿Qué necesitas?
      </h2>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {OPCIONES.map((o) => (
          <li key={o.href}>
            <Link
              href={o.href}
              className={[
                'group flex h-full flex-col gap-1.5 rounded-tarjeta border p-5 transition',
                'hover:-translate-y-0.5 hover:shadow-md',
                o.destacada
                  ? 'border-primario bg-primario-suave'
                  : 'border-borde bg-superficie hover:border-borde-fuerte',
              ].join(' ')}
            >
              <span aria-hidden="true" className="text-2xl">
                {o.icono}
              </span>
              <span className="text-base font-semibold text-texto">{o.titulo}</span>
              <span className="text-sm text-texto-suave">{o.descripcion}</span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-12 rounded-tarjeta border border-borde bg-superficie p-6">
        <h2 className="text-base font-semibold text-texto">Cómo intento no equivocarme</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              n: '1',
              t: 'Leo con cuidado',
              d: 'Si la foto no se lee bien o un número es dudoso, te lo digo en vez de adivinarlo.',
            },
            {
              n: '2',
              t: 'Resuelvo',
              d: 'Datos, qué se pide, procedimiento y resultado, sin saltarme pasos.',
            },
            {
              n: '3',
              t: 'Compruebo',
              d: 'El servidor rehace las cuentas por su cuenta y una segunda revisión busca fallos.',
            },
            {
              n: '4',
              t: 'Te aviso si dudo',
              d: 'Cuando no puedo confirmar algo, la respuesta sale marcada. Prefiero eso a colártela.',
            },
          ].map((p) => (
            <li key={p.n} className="flex gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primario-suave text-xs font-bold text-primario"
              >
                {p.n}
              </span>
              <span>
                <span className="block text-sm font-semibold text-texto">{p.t}</span>
                <span className="block text-sm text-texto-suave">{p.d}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
