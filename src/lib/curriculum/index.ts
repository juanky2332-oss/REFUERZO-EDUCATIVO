/**
 * Capa curricular.
 *
 * Regla de diseño (regla 35 del proyecto): en esta aplicación NO se codifica a
 * mano el contenido de ninguna norma, decreto, criterio de evaluación ni saber
 * básico. Ese contenido caduca y afirmarlo de memoria sería inventarlo.
 *
 * Lo que sí vive aquí es:
 *   1. El registro de PORTALES OFICIALES donde está la fuente primaria.
 *   2. Un detector de consultas que dependen de normativa vigente.
 *   3. Un proveedor enchufable (`ProveedorCurriculo`) para que, cuando se
 *      incorpore un índice documental o una API de búsqueda, la aplicación pase
 *      a responder con fuente sin tocar el resto del código.
 *
 * Mientras no haya proveedor configurado, la aplicación responde a las
 * preguntas normativas diciendo que no puede confirmarlas y remitiendo al
 * portal oficial. Eso es intencionado (reglas 73 y 74).
 */

import type { Fuente, Materia } from '@/lib/types';

export interface PortalOficial {
  clave: string;
  nombre: string;
  organismo: string;
  url: string;
  ambito: 'estatal' | 'autonomico';
  /** Qué se puede encontrar aquí. No es una afirmación sobre su contenido. */
  paraQue: string;
}

/**
 * Portales institucionales de referencia. Se listan como punto de consulta, no
 * como respaldo de ninguna afirmación concreta: la aplicación nunca dice "según
 * el BOE, X" sin haber leído el texto.
 */
export const PORTALES_OFICIALES: PortalOficial[] = [
  {
    clave: 'boe',
    nombre: 'Boletín Oficial del Estado',
    organismo: 'Agencia Estatal BOE',
    url: 'https://www.boe.es',
    ambito: 'estatal',
    paraQue: 'Legislación estatal, incluida la normativa básica de ordenación y currículo de la ESO.',
  },
  {
    clave: 'educacion-gob',
    nombre: 'Ministerio de Educación, Formación Profesional y Deportes',
    organismo: 'Gobierno de España',
    url: 'https://www.educacionfpydeportes.gob.es',
    ambito: 'estatal',
    paraQue: 'Información oficial estatal sobre etapas, enseñanzas y ordenación académica.',
  },
  {
    clave: 'borm',
    nombre: 'Boletín Oficial de la Región de Murcia',
    organismo: 'Comunidad Autónoma de la Región de Murcia',
    url: 'https://www.borm.es',
    ambito: 'autonomico',
    paraQue: 'Publicación oficial de decretos y órdenes de la Región de Murcia, incluido el currículo autonómico.',
  },
  {
    clave: 'educarm',
    nombre: 'Educarm',
    organismo: 'Consejería de Educación de la Región de Murcia',
    url: 'https://www.educarm.es',
    ambito: 'autonomico',
    paraQue: 'Portal educativo de la Región de Murcia: currículo, materiales y normativa autonómica.',
  },
  {
    clave: 'carm',
    nombre: 'Portal de la CARM',
    organismo: 'Comunidad Autónoma de la Región de Murcia',
    url: 'https://www.carm.es',
    ambito: 'autonomico',
    paraQue: 'Sede y portal institucional de la Región de Murcia.',
  },
];

/**
 * Palabras que indican que la respuesta depende de normativa o de información
 * oficial que puede haber cambiado (reglas 7 y 8).
 */
const SENALES_NORMATIVA: RegExp[] = [
  /\bcurr[ií]culo\b/i,
  /\bcurricular\b/i,
  /\bnormativa\b/i,
  /\bdecreto\b/i,
  /\breal decreto\b/i,
  /\bley\s+(org[aá]nica|de educaci[oó]n)\b/i,
  /\bLOMLOE\b/i,
  /\bBOE\b/,
  /\bBORM\b/,
  /\bsaberes b[aá]sicos\b/i,
  /\bcompetencias espec[ií]ficas\b/i,
  /\bcriterios de (evaluaci[oó]n|calificaci[oó]n oficial)\b/i,
  /\bcriterios de promoci[oó]n\b/i,
  /\bqu[eé]\s+(entra|se da|hay que dar)\s+(en|para)\b.*\bESO\b/i,
  /\best[aá]\s+vigente\b/i,
  /\bvigente\b/i,
  /\bobligatorio por ley\b/i,
  /\bt[ií]tulo de la ESO\b/i,
  /\bn[uú]mero de (suspensos|materias)\b/i,
  /\b(titular|titulaci[oó]n|promocionar|promoci[oó]n|repetir curso)\b/i,
  /\bcu[aá]nt[ao]s?\s+(materias|asignaturas|suspensos)\b/i,
];

export function dependeDeNormativa(texto: string): boolean {
  if (!texto) return false;
  return SENALES_NORMATIVA.some((p) => p.test(texto));
}

/**
 * Proveedor de contenido curricular con respaldo documental.
 *
 * Implementaciones posibles: índice RAG sobre los decretos descargados, API de
 * búsqueda web con filtro de dominios oficiales, base documental interna.
 * Mientras no exista ninguna, se usa `proveedorNoConfigurado`.
 */
export interface ProveedorCurriculo {
  readonly nombre: string;
  /** Devuelve fragmentos con su fuente, o lista vacía si no encuentra nada. */
  buscar(consulta: string, opciones?: { materia?: Materia }): Promise<FragmentoCurricular[]>;
}

export interface FragmentoCurricular {
  texto: string;
  fuente: Fuente;
}

let proveedorActivo: ProveedorCurriculo | null = null;

/** Punto de extensión: se llama desde el arranque cuando haya proveedor real. */
export function registrarProveedorCurriculo(p: ProveedorCurriculo | null): void {
  proveedorActivo = p;
}

export function hayProveedorCurriculo(): boolean {
  return proveedorActivo !== null;
}

export async function buscarEnCurriculo(
  consulta: string,
  opciones?: { materia?: Materia },
): Promise<FragmentoCurricular[]> {
  if (!proveedorActivo) return [];
  try {
    return await proveedorActivo.buscar(consulta, opciones);
  } catch {
    // Un fallo del proveedor documental nunca debe convertirse en una respuesta
    // inventada: se devuelve vacío y la capa superior dirá que no puede confirmarlo.
    return [];
  }
}

/**
 * Mensaje honesto para cuando la consulta depende de normativa y no hay ninguna
 * fuente que la respalde. Se muestra tal cual al usuario.
 */
export function mensajeSinFuenteNormativa(ambito: 'ambos' | 'estatal' | 'autonomico' = 'ambos'): {
  mensaje: string;
  portales: PortalOficial[];
} {
  const portales = PORTALES_OFICIALES.filter((p) =>
    ambito === 'ambos' ? true : p.ambito === ambito,
  );

  return {
    mensaje:
      'Tu pregunta depende de normativa o del currículo oficial vigente. No dispongo ahora mismo de una ' +
      'fuente oficial verificada para responderla, y prefiero no darte de memoria algo que puede haber ' +
      'cambiado o ser inexacto. Te dejo dónde está la información de primera mano. Si quieres, pégame el ' +
      'texto del documento y trabajo sobre él.',
    portales,
  };
}

/**
 * Temas orientativos para acotar una consulta o generar material.
 *
 * IMPORTANTE: son SUGERENCIAS de uso habitual en el aula para ayudar al usuario
 * a escribir el tema, NO una transcripción del currículo oficial. La interfaz
 * los etiqueta como orientativos.
 */
export const TEMAS_ORIENTATIVOS: Record<Exclude<Materia, 'otra' | 'desconocida'>, string[]> = {
  matematicas: [
    'Números enteros',
    'Fracciones',
    'Números decimales',
    'Potencias y raíces',
    'Proporcionalidad y porcentajes',
    'Álgebra: expresiones y ecuaciones de primer grado',
    'Sistemas de dos ecuaciones',
    'Rectas y ángulos',
    'Figuras planas: perímetro y área',
    'Cuerpos geométricos: volumen',
    'Funciones y gráficas',
    'Estadística y probabilidad',
  ],
  fisica_quimica: [
    'La materia y sus estados',
    'Magnitudes y unidades del Sistema Internacional',
    'Densidad',
    'Mezclas y sustancias puras',
    'Disoluciones y concentración',
    'Átomos y elementos',
    'Cambios físicos y químicos',
    'Fuerzas y sus efectos',
    'Movimiento: velocidad y aceleración',
    'Energía y sus formas',
    'Calor y temperatura',
    'Electricidad y circuitos',
  ],
  biologia_geologia: [
    'La célula',
    'Los seres vivos y su clasificación',
    'Reinos: moneras, protoctistas, hongos, plantas y animales',
    'Nutrición en plantas y animales',
    'Los ecosistemas',
    'La biosfera',
    'Minerales y rocas',
    'La atmósfera',
    'La hidrosfera',
    'El relieve y su modelado',
    'La Tierra en el universo',
    'Función de relación y reproducción',
  ],
};
