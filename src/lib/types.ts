/**
 * Modelo de dominio de REFUERZO EDUCATIVO.
 *
 * Toda la lógica crítica de la aplicación (confianza, incertidumbre, veredictos)
 * viaja en estructuras tipadas, nunca en texto libre. Ver regla 60 del proyecto.
 */

export const MATERIAS = [
  'matematicas',
  'fisica_quimica',
  'biologia_geologia',
  'otra',
  'desconocida',
] as const;
export type Materia = (typeof MATERIAS)[number];

export const CURSOS = ['1eso', '2eso', 'otro', 'desconocido'] as const;
export type Curso = (typeof CURSOS)[number];

/** Niveles de adaptación pedagógica (regla 19). */
export const NIVELES = ['A', 'B', 'C', 'D'] as const;
export type Nivel = (typeof NIVELES)[number];

export const NIVEL_DESCRIPCION: Record<Nivel, { titulo: string; detalle: string }> = {
  A: { titulo: 'Muy básico', detalle: 'Máximo apoyo, pasos muy pequeños y lenguaje sencillo.' },
  B: { titulo: 'Refuerzo', detalle: 'Práctica guiada con explicaciones completas.' },
  C: { titulo: 'Consolidación', detalle: 'Más autonomía, menos andamiaje.' },
  D: { titulo: 'Ampliación', detalle: 'Mayor profundidad y conexiones entre ideas.' },
};

/** Sistema de confianza (regla 5). Nunca porcentajes falsos. */
export const CONFIANZAS = [
  'verificado',
  'calculo_comprobado',
  'conocimiento_estable',
  'necesita_confirmacion',
] as const;
export type Confianza = (typeof CONFIANZAS)[number];

export const CONFIANZA_ETIQUETA: Record<Confianza, string> = {
  verificado: 'Verificado con fuente',
  calculo_comprobado: 'Comprobado mediante cálculo',
  conocimiento_estable: 'Conocimiento educativo estable',
  necesita_confirmacion: 'Necesita confirmación',
};

export const INTENCIONES = [
  'resolver',
  'explicar',
  'corregir',
  'generar_material',
  'preparar_examen',
  'normativa',
  'indeterminada',
] as const;
export type Intencion = (typeof INTENCIONES)[number];

/** Calidad de una imagen aportada por el usuario (regla 11). */
export interface CalidadImagen {
  legible: boolean;
  problemas: string[];
  /** Fragmentos concretos que no se pueden leer con seguridad. */
  ilegible: string[];
}

/** Lectura alternativa posible de un dato dudoso (regla 12). */
export interface LecturaAmbigua {
  fragmento: string;
  lecturaPrincipal: string;
  lecturaAlternativa: string;
}

/** Resultado de la fase de análisis de la entrada. */
export interface Analisis {
  intencion: Intencion;
  materia: Materia;
  curso: Curso;
  tema: string | null;
  /** Enunciado transcrito literalmente, sin corregir ni completar. */
  enunciado: string | null;
  datos: string[];
  /** Respuesta que el alumno ya había escrito, si la hay. */
  respuestaDelAlumno: string | null;
  calidadImagen: CalidadImagen | null;
  ambiguedades: LecturaAmbigua[];
  /** Preguntas que hay que hacer al usuario antes de poder resolver. */
  bloqueantes: string[];
  /** true si se puede continuar hacia la resolución. */
  puedeResolverse: boolean;
  /**
   * true sólo si la pregunta se responde con lo que YA se explicó en la
   * conversación previa (repetir un paso, aclarar una palabra) y no exige
   * resolver nada nuevo. Habilita la vía rápida de una sola llamada.
   */
  esSeguimiento: boolean;
  resumenTarea: string;
}

export interface PasoResolucion {
  titulo: string;
  contenido: string;
}

export interface Resolucion {
  interpretacion: string;
  datos: string[];
  incognita: string;
  estrategia: string;
  pasos: PasoResolucion[];
  resultado: string;
  /** Comprobación por un segundo método (regla 14). */
  comprobacion: string;
  /** Expresiones aritméticas verificables de forma determinista. */
  comprobacionesNumericas: ComprobacionNumerica[];
  unidades: string | null;
  advertencias: string[];
}

/**
 * Una comprobación aritmética que el servidor evalúa por su cuenta,
 * sin confiar en el cálculo mental del modelo (regla 15).
 */
export interface ComprobacionNumerica {
  descripcion: string;
  /** Expresión aritmética pura, p. ej. "3*(4+2)-5". */
  expresion: string;
  /** Valor que el modelo afirma que da la expresión. */
  valorEsperado: number;
  /** Tolerancia absoluta admitida. */
  tolerancia: number;
}

export interface ResultadoComprobacionNumerica extends ComprobacionNumerica {
  ok: boolean;
  valorCalculado: number | null;
  error: string | null;
}

export type Veredicto = 'correcta' | 'corregida' | 'dudosa';

/** Salida del revisor independiente (regla 59). */
export interface Verificacion {
  veredicto: Veredicto;
  errores: string[];
  observaciones: string[];
  /** Resultado corregido si el revisor detecta un fallo. */
  resultadoCorregido: string | null;
  confianza: Confianza;
}

export type EstadoCorreccion = 'correcto' | 'parcial' | 'incorrecto';

export interface CorreccionAlumno {
  estado: EstadoCorreccion;
  queHizoBien: string[];
  dondeFalla: string[];
  explicacion: string;
}

export interface Fuente {
  titulo: string;
  organismo: string;
  url: string;
  consultadaEn: string | null;
  queAfirma: string;
}

/** Respuesta final que consume la interfaz. */
export interface RespuestaEducativa {
  titulo: string;
  queNosPiden: string;
  datos: string[];
  comoLoHacemos: string;
  pasos: PasoResolucion[];
  resultado: string;
  comprobacion: string;
  recuerda: string[];
  correccion: CorreccionAlumno | null;
  ejercicioSimilar: string | null;
  preguntaDeSeguimiento: string | null;
  confianza: Confianza;
  incertidumbres: string[];
  fuentes: Fuente[];
}

/**
 * Respuesta corta de conversación: aclarar algo ya explicado.
 *
 * No puede contener resultados nuevos. Si el modelo detecta que para responder
 * haría falta resolver algo, marca `necesitaResolver` y el servidor descarta
 * esta respuesta y ejecuta el pipeline completo.
 */
export interface RespuestaBreve {
  necesitaResolver: boolean;
  texto: string;
  puntos: string[];
  sugerencias: string[];
  incertidumbres: string[];
}

export type FasePipeline =
  | 'analisis'
  | 'resolucion'
  | 'verificacion'
  | 'explicacion'
  | 'charla'
  | 'listo';

export const FASE_ETIQUETA: Record<FasePipeline, string> = {
  analisis: 'Leyendo y entendiendo lo que me has enviado…',
  resolucion: 'Resolviendo el ejercicio…',
  verificacion: 'Comprobando la solución…',
  explicacion: 'Preparando la explicación…',
  charla: 'Pensando la respuesta…',
  listo: 'Listo',
};

/** Eventos NDJSON que el endpoint /api/solve envía al navegador. */
export type EventoStream =
  | { tipo: 'fase'; fase: FasePipeline; estado: 'inicio' | 'fin'; etiqueta: string }
  | { tipo: 'analisis'; analisis: Analisis }
  | { tipo: 'necesita_datos'; analisis: Analisis; mensaje: string }
  | { tipo: 'comprobaciones'; resultados: ResultadoComprobacionNumerica[] }
  | { tipo: 'respuesta'; respuesta: RespuestaEducativa }
  | { tipo: 'mensaje'; mensaje: RespuestaBreve; confianza: Confianza }
  | { tipo: 'error'; mensaje: string; codigo: string };

export interface MensajeHistorial {
  rol: 'usuario' | 'asistente';
  texto: string;
}

export interface PerfilAlumno {
  curso: Curso;
  materia: Materia;
  nivel: Nivel;
  tema?: string;
  objetivo?: string;
  dificultadesObservadas?: string[];
}
