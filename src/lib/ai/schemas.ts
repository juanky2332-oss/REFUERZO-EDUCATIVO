/**
 * Esquemas de validación de todo lo que devuelve el modelo.
 *
 * La aplicación nunca ejecuta lógica sobre texto libre del modelo: primero se
 * valida contra estos esquemas (regla 60). Los campos accesorios usan `.catch()`
 * para que un fallo menor de formato no tire toda la respuesta, pero los campos
 * de los que depende una decisión (puedeResolverse, veredicto, confianza) se
 * validan de forma estricta y, si faltan, se toma la opción más prudente.
 */

import { z } from 'zod';
import { CONFIANZAS, CURSOS, INTENCIONES, MATERIAS } from '@/lib/types';

const texto = z.string().trim();
const listaTexto = z.array(texto).catch([]);

export const esquemaCalidadImagen = z.object({
  legible: z.boolean().catch(true),
  problemas: listaTexto,
  ilegible: listaTexto,
});

export const esquemaLecturaAmbigua = z.object({
  fragmento: texto,
  lecturaPrincipal: texto,
  lecturaAlternativa: texto,
});

export const esquemaAnalisis = z.object({
  intencion: z.enum(INTENCIONES).catch('indeterminada'),
  materia: z.enum(MATERIAS).catch('desconocida'),
  curso: z.enum(CURSOS).catch('desconocido'),
  tema: texto.nullable().catch(null),
  enunciado: texto.nullable().catch(null),
  datos: listaTexto,
  respuestaDelAlumno: texto.nullable().catch(null),
  calidadImagen: esquemaCalidadImagen.nullable().catch(null),
  ambiguedades: z.array(esquemaLecturaAmbigua).catch([]),
  bloqueantes: listaTexto,
  // Prudente por defecto: si el modelo no lo dice con claridad, no se resuelve.
  puedeResolverse: z.boolean().catch(false),
  // Prudente por defecto: ante la duda, pipeline completo con verificación.
  esSeguimiento: z.boolean().catch(false),
  resumenTarea: texto.catch(''),
});

/**
 * Respuesta conversacional corta. `necesitaResolver` es prudente por defecto:
 * si el modelo no lo declara con claridad, se descarta la vía rápida.
 */
export const esquemaRespuestaBreve = z.object({
  necesitaResolver: z.boolean().catch(true),
  texto: texto.catch(''),
  puntos: listaTexto,
  sugerencias: listaTexto,
  incertidumbres: listaTexto,
});

export const esquemaPaso = z.object({
  titulo: texto.catch(''),
  contenido: texto.catch(''),
});

export const esquemaComprobacionNumerica = z.object({
  descripcion: texto.catch(''),
  expresion: texto,
  valorEsperado: z.number().finite(),
  tolerancia: z.number().nonnegative().catch(1e-6),
});

export const esquemaResolucion = z.object({
  interpretacion: texto.catch(''),
  datos: listaTexto,
  incognita: texto.catch(''),
  estrategia: texto.catch(''),
  pasos: z.array(esquemaPaso).catch([]),
  resultado: texto.catch(''),
  comprobacion: texto.catch(''),
  comprobacionesNumericas: z.array(esquemaComprobacionNumerica).catch([]),
  unidades: texto.nullable().catch(null),
  advertencias: listaTexto,
});

export const esquemaVerificacion = z.object({
  // Prudente por defecto: sin veredicto explícito, se marca como dudosa.
  veredicto: z.enum(['correcta', 'corregida', 'dudosa']).catch('dudosa'),
  errores: listaTexto,
  observaciones: listaTexto,
  resultadoCorregido: texto.nullable().catch(null),
  confianza: z.enum(CONFIANZAS).catch('necesita_confirmacion'),
});

export const esquemaCorreccion = z.object({
  estado: z.enum(['correcto', 'parcial', 'incorrecto']).catch('parcial'),
  queHizoBien: listaTexto,
  dondeFalla: listaTexto,
  explicacion: texto.catch(''),
});

export const esquemaFuente = z.object({
  titulo: texto,
  organismo: texto.catch(''),
  url: z.string().url(),
  consultadaEn: texto.nullable().catch(null),
  queAfirma: texto.catch(''),
});

export const esquemaRespuestaEducativa = z.object({
  titulo: texto.catch('Vamos paso a paso'),
  queNosPiden: texto.catch(''),
  datos: listaTexto,
  comoLoHacemos: texto.catch(''),
  pasos: z.array(esquemaPaso).catch([]),
  resultado: texto.catch(''),
  comprobacion: texto.catch(''),
  recuerda: listaTexto,
  correccion: esquemaCorreccion.nullable().catch(null),
  ejercicioSimilar: texto.nullable().catch(null),
  preguntaDeSeguimiento: texto.nullable().catch(null),
  // La confianza real la fija el servidor, no el modelo; este valor es sólo
  // la propuesta del modelo y se sobrescribe en el orquestador.
  confianza: z.enum(CONFIANZAS).catch('necesita_confirmacion'),
  incertidumbres: listaTexto,
  fuentes: z.array(esquemaFuente).catch([]),
});

// --- Material generado (fichas, exámenes, resúmenes) --------------------------

export const esquemaPreguntaMaterial = z.object({
  numero: z.number().int().positive().catch(1),
  enunciado: texto,
  puntuacion: z.number().nonnegative().catch(1),
  solucion: texto.catch(''),
  criterioCorreccion: texto.catch(''),
});

export const esquemaMaterial = z.object({
  titulo: texto.catch('Material de trabajo'),
  materia: z.enum(MATERIAS).catch('desconocida'),
  curso: z.enum(CURSOS).catch('desconocido'),
  tema: texto.catch(''),
  instrucciones: texto.catch(''),
  duracionMinutos: z.number().int().positive().nullable().catch(null),
  preguntas: z.array(esquemaPreguntaMaterial).min(1),
  loQueHayQueAprender: listaTexto,
  notasDidacticas: listaTexto,
});

export type MaterialGenerado = z.infer<typeof esquemaMaterial>;
export type PreguntaMaterial = z.infer<typeof esquemaPreguntaMaterial>;

// --- Petición entrante -------------------------------------------------------

export const esquemaImagenEntrante = z.object({
  mime: z.string(),
  base64: z.string(),
  nombre: z.string().optional(),
});

export const esquemaPeticionSolve = z.object({
  texto: z.string().max(8000).optional().default(''),
  imagenes: z.array(esquemaImagenEntrante).max(4).optional().default([]),
  nivel: z.enum(['A', 'B', 'C', 'D']).optional().default('B'),
  curso: z.enum(CURSOS).optional().default('desconocido'),
  materia: z.enum(MATERIAS).optional().default('desconocida'),
  historial: z
    .array(
      z.object({
        rol: z.enum(['usuario', 'asistente']),
        texto: z.string().max(6000),
      }),
    )
    .max(20)
    .optional()
    .default([]),
});

export type PeticionSolve = z.infer<typeof esquemaPeticionSolve>;

export const esquemaPeticionGenerate = z.object({
  tipo: z.enum(['ejercicios', 'examen', 'resumen', 'ficha', 'test', 'plan_estudio']),
  materia: z.enum(MATERIAS),
  curso: z.enum(CURSOS),
  tema: z.string().min(2).max(300),
  nivel: z.enum(['A', 'B', 'C', 'D']).optional().default('B'),
  numeroPreguntas: z.number().int().min(1).max(20).optional().default(6),
  notas: z.string().max(2000).optional().default(''),
  /** Días que quedan hasta el examen. Ordena las sesiones de un plan de estudio. */
  diasDisponibles: z.number().int().min(1).max(120).nullable().optional().default(null),
});

export type PeticionGenerate = z.infer<typeof esquemaPeticionGenerate>;
