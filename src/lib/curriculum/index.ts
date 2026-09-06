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

import type { Curso, Fuente, Materia } from '@/lib/types';
import { FUENTE_CURRICULO, SABERES } from './murcia';

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
 * Norma que fija el currículo de la ESO en la Región de Murcia.
 *
 * Esto NO es el contenido de la norma —eso sigue sin codificarse a mano, y por
 * los mismos motivos—: es la referencia para poder mandar al usuario al sitio
 * correcto en vez de soltarle un «mira el BORM». La diferencia importa: decir
 * qué decreto está vigente es verificable de un vistazo; decir qué pone dentro,
 * no.
 *
 * Comprobado el 2026-09-06 contra el BORM. Si alguien lee esto mucho después,
 * conviene revisar que no haya una modificación más reciente.
 */
export const NORMAS_CURRICULO: {
  titulo: string;
  organismo: string;
  url: string;
  publicado: string;
  nota: string;
}[] = [
  {
    titulo:
      'Decreto n.º 235/2022, de 7 de diciembre, por el que se establece la ordenación y el currículo de la Educación Secundaria Obligatoria en la Comunidad Autónoma de la Región de Murcia',
    organismo: 'Comunidad Autónoma de la Región de Murcia',
    url: 'https://www.borm.es/services/anuncio/ano/2022/numero/6346/pdf?id=813663',
    publicado: 'BORM n.º 283, de 9 de diciembre de 2022',
    nota: 'Currículo autonómico de la ESO en Murcia. Es la fuente de qué se da en cada curso.',
  },
  {
    titulo:
      'Decreto n.º 158/2024, de 1 de agosto, por el que se modifica el Decreto n.º 235/2022',
    organismo: 'Comunidad Autónoma de la Región de Murcia',
    url: 'https://www.borm.es/services/anuncio/ano/2024/numero/4052/pdf?id=829230',
    publicado: 'BORM n.º 181, de 5 de agosto de 2024',
    nota: 'Modificación posterior del currículo. Hay que leerla junto al Decreto 235/2022.',
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
  buscar(
    consulta: string,
    opciones?: { materia?: Materia; curso?: Curso },
  ): Promise<FragmentoCurricular[]>;
}

export interface FragmentoCurricular {
  texto: string;
  fuente: Fuente;
}

/**
 * Proveedor con el currículo de Murcia ya descargado.
 *
 * Se busca por materia y curso, no por palabras: el texto del decreto es
 * abstracto («sentido numérico») y una búsqueda por término fallaría justo en
 * las preguntas que importan. Lo que devuelve es el bloque entero de saberes
 * del curso, que es lo que hace falta para decir qué entra y qué no.
 *
 * Cubre 1.º y 2.º de ESO en las tres materias de esta aplicación. Para
 * cualquier otra cosa —promoción, titulación, número de suspensos— devuelve
 * vacío a propósito: eso está en otras partes de la norma que no se han
 * incorporado, y responderlo de memoria es justo lo que no se hace aquí.
 */
export const proveedorMurcia: ProveedorCurriculo = {
  nombre: 'Currículo ESO de la Región de Murcia (Decreto 235/2022)',
  async buscar(_consulta, opciones) {
    const coincidencias = SABERES.filter(
      (s) =>
        (!opciones?.materia || s.materia === opciones.materia) &&
        (!opciones?.curso || s.curso === opciones.curso),
    );

    return coincidencias.map((s) => ({
      texto: s.saberes,
      fuente: {
        titulo: FUENTE_CURRICULO.titulo,
        organismo: FUENTE_CURRICULO.organismo,
        url: FUENTE_CURRICULO.url,
        consultadaEn: FUENTE_CURRICULO.consultadaEn,
        queAfirma: `Saberes básicos de ${nombreMateria(s.materia)} en ${nombreCurso(s.curso)}.`,
      },
    }));
  },
};

function nombreMateria(m: Materia): string {
  if (m === 'matematicas') return 'Matemáticas';
  if (m === 'fisica_quimica') return 'Física y Química';
  if (m === 'biologia_geologia') return 'Biología y Geología';
  return 'la materia';
}

function nombreCurso(c: Curso): string {
  if (c === '1eso') return '1.º de ESO';
  if (c === '2eso') return '2.º de ESO';
  return 'la etapa';
}

let proveedorActivo: ProveedorCurriculo | null = proveedorMurcia;

/** Punto de extensión: se llama desde el arranque cuando haya proveedor real. */
export function registrarProveedorCurriculo(p: ProveedorCurriculo | null): void {
  proveedorActivo = p;
}

export function hayProveedorCurriculo(): boolean {
  return proveedorActivo !== null;
}

export async function buscarEnCurriculo(
  consulta: string,
  opciones?: { materia?: Materia; curso?: Curso },
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
      'Tu pregunta depende de normativa o del currículo oficial vigente. No dispongo ahora mismo del texto ' +
      'de esa norma, y prefiero no darte de memoria algo que puede haber cambiado o ser inexacto. En la ' +
      'Región de Murcia el currículo de la ESO lo fija el Decreto 235/2022, de 7 de diciembre, modificado ' +
      'por el Decreto 158/2024, de 1 de agosto. Te dejo los enlaces para leerlo de primera mano. Si ' +
      'quieres, pégame el texto o hazle una foto y trabajo sobre él.',
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
