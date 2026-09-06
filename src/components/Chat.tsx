'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BurbujaBreve } from './BurbujaBreve';
import { PanelHerramienta, type PeticionHerramienta } from './PanelHerramienta';
import { Pensando } from './Pensando';
import { Redactor, type Herramienta } from './Redactor';
import { VistaMaterial } from './VistaMaterial';
import { VistaRespuesta } from './VistaRespuesta';
import { Icono, type NombreIcono } from './ui/Icono';
import type { MaterialGenerado } from '@/lib/ai/schemas';
import { useAdjuntos } from '@/lib/cliente/adjuntos';
import { generarMaterial } from '@/lib/cliente/generar';
import { usePreferencias } from '@/lib/cliente/preferencias';
import type {
  Analisis,
  Confianza,
  EventoStream,
  FasePipeline,
  MensajeHistorial,
  RespuestaBreve,
  RespuestaEducativa,
} from '@/lib/types';

/**
 * La aplicación entera, en una conversación.
 *
 * Antes había tres pantallas —escribir, mandar foto, pedir material— y el
 * alumno tenía que acertar con la correcta antes de poder preguntar nada. Aquí
 * sólo hay un sitio donde escribir: la foto es un adjunto, el material se pide
 * desde el mismo botón y la respuesta aparece en el hilo, con el contexto de lo
 * anterior. Las preguntas de seguimiento ya no repiten el ejercicio: el
 * servidor las reconoce y contesta en corto (regla 48).
 */

type Entrada =
  | { tipo: 'usuario'; id: string; texto: string; miniaturas: string[] }
  | { tipo: 'respuesta'; id: string; respuesta: RespuestaEducativa }
  | { tipo: 'breve'; id: string; mensaje: RespuestaBreve; confianza: Confianza }
  | { tipo: 'necesita_datos'; id: string; mensaje: string; analisis: Analisis }
  | { tipo: 'error'; id: string; mensaje: string }
  | { tipo: 'herramienta'; id: string; herramienta: Herramienta }
  | { tipo: 'material'; id: string; material: MaterialGenerado };

const ARRANQUES: { texto: string; icono: NombreIcono }[] = [
  { texto: 'Resuelve 3x + 2 = 14 y explícame por qué se cambia de signo', icono: 'lapiz' },
  {
    texto: 'Un cuerpo tiene 250 g y 100 cm3 de volumen. ¿Cuál es su densidad en kg/m3?',
    icono: 'igual',
  },
  { texto: 'Explícame la diferencia entre célula procariota y eucariota', icono: 'libro' },
  { texto: '¿Cómo paso 3/4 a decimal y a porcentaje?', icono: 'lupa' },
];

function nuevoId() {
  return Math.random().toString(36).slice(2, 10);
}

/** Resumen breve de una respuesta para arrastrarla como contexto sin gastar de más. */
export function resumirParaHistorial(r: RespuestaEducativa): string {
  return [
    `Explicación dada: ${r.queNosPiden}`,
    r.pasos.length > 0 ? `Pasos: ${r.pasos.map((p, i) => `${i + 1}) ${p.titulo}`).join('; ')}` : '',
    r.resultado ? `Resultado: ${r.resultado}` : '',
  ]
    .filter(Boolean)
    .join('\n')
    .slice(0, 1500);
}

/**
 * Convierte el hilo en el historial que viaja al servidor.
 *
 * Sólo van los últimos ocho turnos: es lo que hace falta para entender «no
 * entiendo el paso 2» y lo que evita que cada mensaje arrastre la conversación
 * entera. Las tarjetas de material no entran: ocupan muchísimo y no cambian el
 * sentido de una duda sobre un ejercicio.
 */
export function historialDe(entradas: Entrada[]): MensajeHistorial[] {
  const h: MensajeHistorial[] = [];

  for (const e of entradas) {
    if (e.tipo === 'usuario') h.push({ rol: 'usuario', texto: e.texto || '(envió una foto)' });
    else if (e.tipo === 'respuesta')
      h.push({ rol: 'asistente', texto: resumirParaHistorial(e.respuesta) });
    else if (e.tipo === 'breve') h.push({ rol: 'asistente', texto: e.mensaje.texto.slice(0, 1500) });
    else if (e.tipo === 'necesita_datos') h.push({ rol: 'asistente', texto: e.mensaje });
  }

  return h.slice(-8);
}

export function Chat() {
  const [texto, setTexto] = useState('');
  const adjuntos = useAdjuntos();
  const [preferencias, guardarPreferencias] = usePreferencias();

  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [enCurso, setEnCurso] = useState(false);
  const [faseActual, setFaseActual] = useState<FasePipeline | null>(null);
  const [generando, setGenerando] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);

  const abortar = useRef<AbortController | null>(null);
  const hilo = useRef<HTMLDivElement>(null);
  const fin = useRef<HTMLDivElement>(null);

  const hayConversacion = entradas.length > 0;
  const ocupado = enCurso || generando;

  const marcador = useMemo(
    () =>
      hayConversacion
        ? 'Pregunta lo que no hayas entendido…'
        : 'Escribe tu duda o adjunta la foto del ejercicio',
    [hayConversacion],
  );

  useEffect(() => {
    if (hayConversacion) fin.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [entradas, enCurso, hayConversacion]);

  useEffect(() => () => abortar.current?.abort(), []);

  const anadirEntrada = useCallback((e: Entrada) => setEntradas((prev) => [...prev, e]), []);

  const enviar = useCallback(async () => {
    if (ocupado) return;
    const mensaje = texto.trim();
    if (!mensaje && adjuntos.imagenes.length === 0) return;

    const control = new AbortController();
    abortar.current = control;

    const previas = entradas;
    anadirEntrada({
      tipo: 'usuario',
      id: nuevoId(),
      texto: mensaje,
      miniaturas: adjuntos.imagenes.map((i) => i.previsualizacion),
    });

    const cuerpo = {
      texto: mensaje,
      imagenes: adjuntos.imagenes.map((i) => ({
        mime: i.mime,
        base64: i.base64,
        nombre: i.nombre,
      })),
      nivel: preferencias.nivel,
      curso: preferencias.curso,
      materia: preferencias.materia,
      historial: historialDe(previas),
    };

    setTexto('');
    adjuntos.limpiar();
    setEnCurso(true);
    setFaseActual('analisis');

    function procesar(evento: EventoStream) {
      switch (evento.tipo) {
        case 'fase':
          if (evento.estado === 'inicio') setFaseActual(evento.fase);
          break;
        case 'respuesta':
          anadirEntrada({ tipo: 'respuesta', id: nuevoId(), respuesta: evento.respuesta });
          break;
        case 'mensaje':
          anadirEntrada({
            tipo: 'breve',
            id: nuevoId(),
            mensaje: evento.mensaje,
            confianza: evento.confianza,
          });
          break;
        case 'necesita_datos':
          anadirEntrada({
            tipo: 'necesita_datos',
            id: nuevoId(),
            mensaje: evento.mensaje,
            analisis: evento.analisis,
          });
          break;
        case 'error':
          anadirEntrada({ tipo: 'error', id: nuevoId(), mensaje: evento.mensaje });
          break;
        default:
          break;
      }
    }

    try {
      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(cuerpo),
        signal: control.signal,
      });

      if (!res.body) throw new Error('sin cuerpo');

      const lector = res.body.getReader();
      const decodificador = new TextDecoder();
      let resto = '';

      for (;;) {
        const { done, value } = await lector.read();
        if (done) break;

        resto += decodificador.decode(value, { stream: true });
        const lineas = resto.split('\n');
        resto = lineas.pop() ?? '';

        for (const linea of lineas) {
          if (!linea.trim()) continue;
          try {
            procesar(JSON.parse(linea) as EventoStream);
          } catch {
            // Una línea a medias no debe tumbar la lectura del resto.
          }
        }
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) {
        anadirEntrada({
          tipo: 'error',
          id: nuevoId(),
          mensaje:
            'Se ha cortado la conexión antes de terminar. Comprueba tu conexión y vuelve a intentarlo.',
        });
      }
    } finally {
      setEnCurso(false);
      setFaseActual(null);
      abortar.current = null;
    }
  }, [adjuntos, anadirEntrada, entradas, ocupado, preferencias, texto]);

  /** Abre la ficha de material dentro del hilo, sin sacar al alumno de aquí. */
  const abrirHerramienta = useCallback(
    (herramienta: Herramienta) => {
      setEntradas((prev) => [
        ...prev.filter((e) => e.tipo !== 'herramienta'),
        { tipo: 'herramienta', id: nuevoId(), herramienta },
      ]);
    },
    [],
  );

  const cerrarHerramienta = useCallback((id: string) => {
    setEntradas((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const generar = useCallback(
    async (id: string, peticion: PeticionHerramienta) => {
      setGenerando(true);
      const control = new AbortController();
      abortar.current = control;

      const r = await generarMaterial(
        {
          tipo: peticion.tipo,
          materia: peticion.materia,
          curso: peticion.curso,
          tema: peticion.tema,
          nivel: preferencias.nivel,
          numeroPreguntas: peticion.cantidad,
          diasDisponibles: peticion.dias,
        },
        control.signal,
      );

      setGenerando(false);
      abortar.current = null;

      setEntradas((prev) => {
        const sinFicha = prev.filter((e) => e.id !== id);
        return [
          ...sinFicha,
          r.ok
            ? { tipo: 'material' as const, id: nuevoId(), material: r.material }
            : { tipo: 'error' as const, id: nuevoId(), mensaje: r.error },
        ];
      });
    },
    [preferencias.nivel],
  );

  const usarSugerencia = useCallback((t: string) => setTexto(t), []);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={hilo}
        onDragOver={(e) => {
          if (ocupado) return;
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setArrastrando(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setArrastrando(false);
          if (!ocupado && e.dataTransfer.files.length > 0) {
            void adjuntos.anadir(Array.from(e.dataTransfer.files));
          }
        }}
        className={`relative flex-1 overflow-y-auto px-3 sm:px-4 ${
          arrastrando ? 'bg-primario-suave/60' : ''
        }`}
      >
        <div
          className={`mx-auto flex max-w-3xl flex-col py-5 ${
            hayConversacion ? '' : 'min-h-full justify-center'
          }`}
        >
          {hayConversacion ? (
            <div className="no-imprimir mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  abortar.current?.abort();
                  setEntradas([]);
                  adjuntos.limpiar();
                  setTexto('');
                }}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-borde bg-superficie px-3 text-xs font-semibold text-texto-suave transition hover:border-primario/40 hover:text-texto"
              >
                <Icono nombre="reiniciar" className="h-3.5 w-3.5" />
                Empezar de cero
              </button>
            </div>
          ) : (
            <Bienvenida onElegir={usarSugerencia} />
          )}

          <ol className="space-y-4">
            {entradas.map((e) => (
              <li key={e.id} className={e.tipo === 'usuario' ? 'flex justify-end' : ''}>
                {e.tipo === 'usuario' && <Mensaje entrada={e} />}

                {e.tipo === 'respuesta' && (
                  <div>
                    <VistaRespuesta respuesta={e.respuesta} />
                    {e.respuesta.preguntaDeSeguimiento && (
                      <div className="no-imprimir mt-2">
                        <p className="text-sm text-texto-suave">
                          {e.respuesta.preguntaDeSeguimiento}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {['No entiendo un paso', 'Ponme otro parecido', 'Más fácil'].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => usarSugerencia(s)}
                              className="min-h-9 rounded-full border border-borde bg-superficie px-3 text-sm text-texto-suave transition hover:border-primario/45 hover:text-texto"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {e.tipo === 'breve' && (
                  <BurbujaBreve
                    mensaje={e.mensaje}
                    confianza={e.confianza}
                    onSugerencia={usarSugerencia}
                  />
                )}

                {e.tipo === 'necesita_datos' && (
                  <div className="max-w-[92%] rounded-2xl rounded-tl-md border border-aviso/40 bg-aviso-suave px-4 py-3">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-aviso">
                      <Icono nombre="aviso" className="h-4 w-4 shrink-0" />
                      Necesito que me aclares algo
                    </p>
                    <p className="mt-1.5 whitespace-pre-wrap text-texto">{e.mensaje}</p>
                    {e.analisis.enunciado && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-texto-suave">
                          Ver lo que he conseguido leer
                        </summary>
                        <p className="mt-1.5 whitespace-pre-wrap rounded-xl bg-superficie px-3 py-2 text-sm text-texto-suave">
                          {e.analisis.enunciado}
                        </p>
                      </details>
                    )}
                  </div>
                )}

                {e.tipo === 'error' && (
                  <p
                    role="alert"
                    className="flex max-w-[92%] items-start gap-2 rounded-2xl rounded-tl-md border border-error/30 bg-error-suave px-4 py-3 text-sm text-error"
                  >
                    <Icono nombre="aviso" className="mt-0.5 h-4 w-4 shrink-0" />
                    {e.mensaje}
                  </p>
                )}

                {e.tipo === 'herramienta' && (
                  <PanelHerramienta
                    tipo={e.herramienta}
                    materiaInicial={preferencias.materia}
                    cursoInicial={preferencias.curso}
                    ocupado={generando}
                    onGenerar={(p) => void generar(e.id, p)}
                    onCancelar={() => cerrarHerramienta(e.id)}
                  />
                )}

                {e.tipo === 'material' && (
                  <div className="hoja rounded-tarjeta border border-borde bg-superficie p-4 shadow-[var(--sombra)] sm:p-5">
                    <VistaMaterial material={e.material} />
                  </div>
                )}
              </li>
            ))}
          </ol>

          {(enCurso || generando) && (
            <div className="mt-4">
              <Pensando fase={enCurso ? faseActual : null} generando={generando} />
            </div>
          )}

          <div ref={fin} className="h-2" />
        </div>

        {arrastrando && (
          <div className="pointer-events-none absolute inset-3 grid place-items-center rounded-tarjeta border-2 border-dashed border-primario bg-superficie/80">
            <p className="flex items-center gap-2 font-semibold text-primario">
              <Icono nombre="camara" className="h-5 w-5" />
              Suelta aquí la foto
            </p>
          </div>
        )}
      </div>

      <Redactor
        texto={texto}
        onTexto={setTexto}
        adjuntos={adjuntos}
        enCurso={ocupado}
        onEnviar={() => void enviar()}
        onParar={() => abortar.current?.abort()}
        preferencias={preferencias}
        onPreferencias={guardarPreferencias}
        onHerramienta={abrirHerramienta}
        marcador={marcador}
      />
    </div>
  );
}

function Mensaje({ entrada }: { entrada: Extract<Entrada, { tipo: 'usuario' }> }) {
  return (
    <div className="flex max-w-[85%] flex-col items-end gap-1.5">
      {entrada.miniaturas.length > 0 && (
        <div className="flex flex-wrap justify-end gap-1.5">
          {entrada.miniaturas.map((m, n) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={n}
              src={m}
              alt={`Foto ${n + 1} que has enviado`}
              className="h-24 w-24 rounded-xl border border-borde object-cover"
            />
          ))}
        </div>
      )}
      {entrada.texto && (
        <p className="whitespace-pre-wrap rounded-2xl rounded-br-md bg-primario px-4 py-2.5 text-sobre-primario">
          {entrada.texto}
        </p>
      )}
    </div>
  );
}

function Bienvenida({ onElegir }: { onElegir: (t: string) => void }) {
  return (
    <div className="no-imprimir pb-2">
      <h1 className="text-2xl font-bold tracking-tight text-texto sm:text-3xl">
        ¿Con qué te echo una mano?
      </h1>
      <p className="mt-2 max-w-xl text-texto-suave">
        Matemáticas, Física y Química y Biología y Geología de 1.º y 2.º de ESO. Manda la foto del
        ejercicio o escríbeme la duda: resuelvo, compruebo las cuentas y te lo explico. Si algo no
        lo puedo confirmar, te lo digo.
      </p>

      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
        {ARRANQUES.map((a) => (
          <li key={a.texto}>
            <button
              type="button"
              onClick={() => onElegir(a.texto)}
              className="group flex h-full w-full items-start gap-2.5 rounded-xl border border-borde bg-superficie px-3.5 py-3 text-left text-sm text-texto-suave transition hover:-translate-y-0.5 hover:border-primario/45 hover:text-texto"
            >
              <Icono nombre={a.icono} className="mt-0.5 h-4 w-4 shrink-0 text-primario" />
              {a.texto}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
