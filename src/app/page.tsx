import Link from 'next/link';
import { Icono, type NombreIcono } from '@/components/ui/Icono';
import { Tarjeta, TituloSeccion } from '@/components/ui/primitivos';

/**
 * Pantalla de entrada.
 *
 * Una acción principal grande y evidente —subir la foto— y el resto como
 * caminos secundarios. El usuario tiene que entender en segundos cómo empezar
 * sin leerse nada (regla 29).
 */

interface Opcion {
  href: string;
  icono: NombreIcono;
  titulo: string;
  descripcion: string;
}

const OPCIONES: Opcion[] = [
  {
    href: '/resolver',
    icono: 'lapiz',
    titulo: 'Escribir mi duda',
    descripcion: 'Cuéntame qué no entiendes y te lo explico desde el principio.',
  },
  {
    href: '/resolver?modo=corregir',
    icono: 'lupa',
    titulo: 'Corregir mi ejercicio',
    descripcion: 'Mándame lo que has hecho y te digo si está bien y dónde falla.',
  },
  {
    href: '/aprobar',
    icono: 'birrete',
    titulo: 'Quiero aprobar el tema',
    descripcion: 'Plan de estudio hasta el examen, con lo esencial y práctica.',
  },
  {
    href: '/material?tipo=ejercicios',
    icono: 'documento',
    titulo: 'Crear ejercicios',
    descripcion: 'Una tanda del tema, de menos a más difícil, con solucionario.',
  },
  {
    href: '/material?tipo=resumen',
    icono: 'estrella',
    titulo: 'Resumir un tema',
    descripcion: 'El resumen y lo que hay que aprender sí o sí.',
  },
  {
    href: '/material?tipo=examen',
    icono: 'libro',
    titulo: 'Simulacro de examen',
    descripcion: 'Un examen realista sobre 10 puntos, con criterios de corrección.',
  },
];

const PASOS = [
  {
    icono: 'camara' as NombreIcono,
    t: 'Leo con cuidado',
    d: 'Si la foto no se lee bien o un número es dudoso, te lo digo en vez de adivinarlo.',
  },
  {
    icono: 'lapiz' as NombreIcono,
    t: 'Resuelvo',
    d: 'Datos, qué se pide, procedimiento y resultado, sin saltarme pasos.',
  },
  {
    icono: 'igual' as NombreIcono,
    t: 'Compruebo',
    d: 'El servidor rehace las cuentas por su cuenta y una segunda revisión busca fallos.',
  },
  {
    icono: 'aviso' as NombreIcono,
    t: 'Aviso si dudo',
    d: 'Cuando no puedo confirmar algo, la respuesta sale marcada. Prefiero eso a colártela.',
  },
];

export default function Inicio() {
  return (
    <div className="lavado">
      <div className="mx-auto max-w-5xl px-4 pb-14 pt-10 sm:pt-16">
        {/* Portada */}
        <section className="max-w-2xl">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-borde bg-superficie/70 px-3 py-1 text-xs font-semibold text-texto-suave backdrop-blur">
            <Icono nombre="comprobado" className="h-3.5 w-3.5 text-exito" />
            Matemáticas · Física y Química · Biología y Geología
          </p>

          <h1 className="mt-4 text-[2rem] font-bold leading-[1.12] tracking-tight text-texto sm:text-5xl">
            Sube el ejercicio
            <span className="block text-primario">y te ayudo a entenderlo.</span>
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-texto-suave">
            Apoyo de 1.º y 2.º de ESO. Leo la foto, resuelvo,{' '}
            <strong className="font-semibold text-texto">compruebo el resultado</strong> y te lo
            explico a tu nivel. Si algo no lo puedo confirmar, te lo digo.
          </p>
        </section>

        {/* Acción principal */}
        <Link
          href="/resolver?modo=foto"
          className="group mt-8 flex items-center gap-4 rounded-2xl border border-primario/35 bg-superficie p-5 shadow-[var(--sombra)] transition hover:-translate-y-0.5 hover:border-primario sm:gap-5 sm:p-6"
        >
          <span
            aria-hidden="true"
            className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primario text-sobre-primario sm:h-16 sm:w-16"
          >
            <Icono nombre="camara" className="h-7 w-7 sm:h-8 sm:w-8" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-bold text-texto sm:text-xl">
              Hacer una foto del ejercicio
            </span>
            <span className="block text-sm text-texto-suave sm:text-base">
              Es la forma más rápida. Puedes mandar solo la foto, sin escribir nada.
            </span>
          </span>
          <Icono
            nombre="flecha"
            className="h-5 w-5 shrink-0 text-primario transition group-hover:translate-x-1"
          />
        </Link>

        {/* Resto de caminos */}
        <div className="mt-10">
          <TituloSeccion>O si prefieres otra cosa</TituloSeccion>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {OPCIONES.map((o) => (
              <li key={o.href}>
                <Link
                  href={o.href}
                  className="group flex h-full flex-col gap-2 rounded-tarjeta border border-borde bg-superficie p-5 transition hover:-translate-y-0.5 hover:border-primario/45 hover:shadow-[var(--sombra)]"
                >
                  <span
                    aria-hidden="true"
                    className="grid h-10 w-10 place-items-center rounded-xl bg-primario-suave text-primario"
                  >
                    <Icono nombre={o.icono} />
                  </span>
                  <span className="text-base font-semibold text-texto">{o.titulo}</span>
                  <span className="text-sm leading-relaxed text-texto-suave">{o.descripcion}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Cómo intenta no equivocarse */}
        <Tarjeta as="section" className="mt-12 p-6 sm:p-8" elevada>
          <TituloSeccion>Cómo intento no equivocarme</TituloSeccion>
          <p className="mt-2 max-w-2xl text-sm text-texto-suave">
            Un error en un ejercicio se copia en el cuaderno y se estudia mal. Por eso la
            comprobación no es una promesa: las cuentas se rehacen en el servidor y hay una segunda
            revisión que busca fallos.
          </p>

          <ol className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PASOS.map((p, i) => (
              <li key={p.t} className="relative">
                <span
                  aria-hidden="true"
                  className="grid h-9 w-9 place-items-center rounded-xl border border-borde bg-superficie-2 text-primario"
                >
                  <Icono nombre={p.icono} />
                </span>
                <p className="mt-3 text-sm font-semibold text-texto">
                  <span className="text-texto-tenue">{i + 1}. </span>
                  {p.t}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-texto-suave">{p.d}</p>
              </li>
            ))}
          </ol>
        </Tarjeta>
      </div>
    </div>
  );
}
