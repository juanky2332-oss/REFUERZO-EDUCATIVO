/**
 * Saberes básicos de la ESO en la Región de Murcia.
 *
 * ESTO NO ESTÁ ESCRITO DE MEMORIA. Es el texto del Decreto n.º 235/2022, de 7
 * de diciembre (BORM n.º 283, de 9 de diciembre de 2022), extraído del PDF
 * oficial del BORM el 6 de septiembre de 2026.
 *
 * Por qué está aquí, si la regla del proyecto es no codificar normativa a mano:
 * esa regla existe para no AFIRMAR de memoria lo que dice una norma. Esto es lo
 * contrario. Es la norma, copiada, con su fuente al lado y comprobable línea a
 * línea contra el BORM. Sin ella, la aplicación no sabía qué entra en cada
 * curso y lo suponía; con ella, el material y las explicaciones se ajustan a lo
 * que de verdad se da en un instituto de Murcia. Cualquier libro de texto que
 * se use en la Región está obligado a ceñirse a este decreto, así que es el
 * suelo común de todos ellos.
 *
 * CADUCA. El Decreto 158/2024 ya lo modificó una vez. Quien lea esto bastante
 * después de 2026 tiene que volver al BORM y comprobarlo.
 *
 * Lo que este archivo NO es: el libro de ninguna editorial. No contiene
 * unidades, páginas ni ejercicios de nadie, y la aplicación no puede citarlos.
 */

import type { Curso, Materia } from '@/lib/types';

export const FUENTE_CURRICULO = {
  titulo:
    'Decreto n.º 235/2022, de 7 de diciembre, por el que se establece la ordenación y el currículo de la Educación Secundaria Obligatoria en la Comunidad Autónoma de la Región de Murcia',
  organismo: 'Comunidad Autónoma de la Región de Murcia',
  url: 'https://www.borm.es/services/anuncio/ano/2022/numero/6346/pdf?id=813663',
  consultadaEn: '2026-09-06',
} as const;

export interface SaberesDeCurso {
  materia: Materia;
  curso: Curso;
  /** Texto literal del decreto, sin reescribir. */
  saberes: string;
}

/**
 * En qué curso se imparte cada materia según este decreto.
 *
 * Sale de la propia estructura del anexo: desarrolla saberes básicos de
 * Biología y Geología para 1.º, 3.º y 4.º, y de Física y Química para 2.º, 3.º
 * y 4.º. En Murcia NO se dan las dos en los dos primeros cursos, y la
 * aplicación llevaba ofreciendo combinaciones que no existen.
 */
export const MATERIAS_POR_CURSO: Record<'1eso' | '2eso', Materia[]> = {
  '1eso': ['matematicas', 'biologia_geologia'],
  '2eso': ['matematicas', 'fisica_quimica'],
};

export const SABERES: SaberesDeCurso[] = [
  {
    materia: 'matematicas',
    curso: '1eso',
    saberes: `Saberes básicos
Los saberes básicos durante el primer curso de Educación Secundaria Obligatoria se han estructurado en los siguientes bloques competenciales:
A. Sentido numérico.
1. Cantidad.
- Realización de estimaciones con la precisión requerida.
- Números naturales, enteros, fraccionarios, decimales y raíces en la expresión de cantidades en contextos de la vida cotidiana.
- Diferentes formas de representación de números naturales, enteros, fraccionarios y decimales, incluida la recta numérica.
- Porcentajes mayores que 100 y menores que 1: interpretación.
2. Sentido de las operaciones.
- Estrategias de cálculo mental con números naturales, enteros, fracciones y decimales.
- Operaciones con números naturales, enteros, fraccionarios o decimales en situaciones contextualizadas.
- Relaciones inversas entre las operaciones (adición y sustracción; multiplicación y división; elevar al cuadrado y extraer la raíz cuadrada): comprensión y utilización en la simplificación y resolución de problemas.
- Efecto de las operaciones aritméticas con números naturales, enteros, fracciones y expresiones decimales.
- Propiedades de las operaciones (suma, resta, multiplicación, división y potenciación): cálculos de manera eficiente con números naturales, enteros, fraccionarios y decimales tanto mentalmente como de forma manual, con calculadora u hoja de cálculo.
- Realización de operaciones combinadas con números naturales, enteros, fraccionarios y decimales, con eficacia mediante el cálculo mental, algoritmos de lápiz y papel o métodos tecnológicos, utilizando la notación más adecuada y respetando la jerarquía de las operaciones.
3. Relaciones.
- Factores, múltiplos y divisores. Factorización en números primos y aplicación del mínimo común múltiplo y el máximo común divisor para resolver problemas:
estrategias y herramientas.
- Comparación y ordenación de enteros, fracciones, decimales y porcentajes:
situación exacta o aproximada en la recta numérica.
- Selección de la representación adecuada para una misma cantidad en cada situación o problema.
4. Razonamiento proporcional.
- Razones y proporciones: comprensión y representación de relaciones cuantitativas de proporcionalidad directa e inversa.
- Porcentajes: comprensión y resolución de problemas.
- Situaciones de proporcionalidad directa e inversa en diferentes contextos:
análisis y desarrollo de métodos para la resolución de problemas (aumentos y disminuciones porcentuales, rebajas y subidas de precios, porcentajes encadenados, impuestos, escalas, cambio de divisas, repartos proporcionales, velocidad y tiempo, etc.).
5. Educación financiera.
- Información numérica en contextos financieros sencillos: interpretación.
- Métodos para la toma de decisiones de consumo responsable: relaciones calidad- precio y valor-precio en contextos cotidianos.
B. Sentido de la medida.
1. Magnitud.
- Atributos mensurables de los objetos físicos y matemáticos: investigación y relación entre los mismos.
- Estrategias de elección de las unidades y operaciones adecuadas en problemas que impliquen medida.
2. Medición.
- Longitudes y áreas en figuras planas: deducción, interpretación y aplicación.
- Representaciones de objetos geométricos con propiedades fijadas, como las longitudes de los lados o las medidas de los ángulos.
3. Estimación y relaciones.
- Formulación de conjeturas sobre medidas o relaciones entre las mismas basadas en estimaciones.
- Estrategias para la toma de decisión justificada del grado de precisión requerida en situaciones de medida.
C. Sentido espacial.
1. Figuras geométricas de dos dimensiones.
- Figuras geométricas planas: descripción y clasificación en función de sus propiedades o características.
- Relaciones geométricas como la congruencia, la semejanza y la relación pitagórica en figuras planas: identificación y aplicación.
- Construcción de figuras geométricas con herramientas manipulativas y digitales (programas de geometría dinámica, realidad aumentada, etc.).
2. Movimientos y transformaciones en el plano.
- Transformaciones elementales como giros, traslaciones y simetrías en situaciones diversas utilizando herramientas tecnológicas o manipulativas (frisos, mosaicos, etc.).
D. Sentido algebraico.
1. Modelo matemático.
- Modelización de situaciones de la vida cotidiana usando representaciones matemáticas y el lenguaje algebraico.
2. Variable.
- Variable: comprensión del concepto en sus diferentes naturalezas.
3. Igualdad y desigualdad.
- Realización de operaciones con expresiones algebraicas sencillas.
- Estrategias de búsqueda e interpretación de soluciones en ecuaciones de primer grado con una incógnita en situaciones de la vida cotidiana.
- Ecuaciones de primer grado con una incógnita: resolución mediante el uso de la tecnología y algoritmos de lápiz y papel.
4. Pensamiento computacional.
- Generalización y transferencia de procesos de resolución de problemas a otras situaciones.
- Estrategias útiles en la interpretación y modificación de algoritmos.
- Estrategias de formulación de cuestiones susceptibles de ser analizadas mediante programas y otras herramientas.
E. Sentido socioafectivo.
1. Creencias, actitudes y emociones.
- Gestión emocional: emociones que intervienen en el aprendizaje de las matemáticas. Autoconciencia y autorregulación.
- Estrategias de fomento de la curiosidad, la iniciativa, la perseverancia y la resiliencia en el aprendizaje de las matemáticas.
- Estrategias de fomento de la flexibilidad cognitiva: apertura a cambios de estrategia y transformación del error en oportunidad de aprendizaje.
2. Trabajo en equipo y toma de decisiones.
- Técnicas cooperativas para optimizar el trabajo en equipo y compartir y construir conocimiento matemático.
- Conductas empáticas y estrategias de gestión de conflictos.
- Métodos para la toma de decisiones adecuadas para resolver situaciones problemáticas.
- Reflexión sobre los resultados obtenidos: revisión de las operaciones utilizadas, asignación de unidades a los resultados, comprobación e interpretación de las soluciones en el contexto de la situación, búsqueda de otras formas de resolución, etc.
3. Inclusión, respeto y diversidad.
- Actitudes inclusivas y aceptación de la diversidad presente en el aula y en la sociedad.
- La contribución de las matemáticas al desarrollo de los distintos ámbitos del conocimiento humano desde una perspectiva de género.`,
  },
  {
    materia: 'matematicas',
    curso: '2eso',
    saberes: `Saberes básicos
Los saberes básicos durante el segundo curso de Educación Secundaria Obligatoria se han estructurado en los siguientes bloques competenciales:
A. Sentido numérico.
1. Cantidad.
- Números grandes y pequeños: notación exponencial y científica y uso de la calculadora.
- Realización de estimaciones con la precisión requerida reconociendo los errores de aproximación.
- Números racionales, decimales y raíces en la expresión de cantidades en contextos de la vida cotidiana.
- Diferentes formas de representación de números racionales y decimales, incluida la recta numérica.
- Porcentajes mayores que 100 y menores que 1: interpretación.
2. Sentido de las operaciones.
- Estrategias de cálculo mental con números racionales y decimales.
- Operaciones con números racionales o decimales en situaciones contextualizadas.
- Definición y manipulación de potencias de exponente entero y raíces cuadradas.
- Relaciones inversas entre las operaciones (adición y sustracción; multiplicación y división; elevar al cuadrado y extraer la raíz cuadrada): comprensión y utilización en la simplificación y resolución de problemas.
- Efecto de las operaciones aritméticas con números racionales y expresiones decimales.
- Propiedades de las operaciones (suma, resta, multiplicación, división y potenciación): cálculos de manera eficiente con números racionales y decimales tanto mentalmente como de forma manual, con calculadora u hoja de cálculo.
- Realización de operaciones combinadas con números racionales y decimales, con eficacia mediante el cálculo mental, algoritmos de lápiz y papel o métodos tecnológicos, utilizando la notación más adecuada y respetando la jerarquía de las operaciones.
3. Relaciones.
- Comparación y ordenación de números racionales, decimales y porcentajes:
situación exacta o aproximada en la recta numérica.
- Selección de la representación adecuada para una misma cantidad en cada situación o problema.
4. Razonamiento proporcional.
- Razones y proporciones: comprensión y representación de relaciones cuantitativas de proporcionalidad directa e inversa.
- Porcentajes: comprensión y resolución de problemas.
- Situaciones de proporcionalidad directa e inversa en diferentes contextos:
análisis y desarrollo de métodos para la resolución de problemas (aumentos y disminuciones porcentuales, rebajas y subidas de precios, porcentajes encadenados, impuestos, escalas, cambio de divisas, repartos proporcionales, velocidad y tiempo, etc.).
5. Educación financiera.
- Información numérica en contextos financieros sencillos: interpretación.
- Métodos para la toma de decisiones de consumo responsable: relaciones calidad- precio y valor-precio en contextos cotidianos.
B. Sentido de la medida.
1. Magnitud.
- Atributos mensurables de los objetos físicos y matemáticos: investigación y relación entre los mismos.
- Estrategias de elección de las unidades y operaciones adecuadas en problemas que impliquen medida.
2. Medición.
- Longitudes, áreas y volúmenes en figuras planas y tridimensionales: deducción, interpretación y aplicación.
- Representaciones planas de objetos tridimensionales en la visualización y resolución de problemas de áreas, entre otros.
- Representaciones de objetos geométricos con propiedades fijadas, como las longitudes de los lados o las medidas de los ángulos.
3. Estimación y relaciones.
- Formulación de conjeturas sobre medidas o relaciones entre las mismas basadas en estimaciones.
- Estrategias para la toma de decisión justificada del grado de precisión requerida en situaciones de medida.
C. Sentido espacial.
1. Figuras geométricas de dos y tres dimensiones.
- Figuras geométricas planas y tridimensionales: descripción y clasificación en función de sus propiedades o características.
- Relaciones geométricas como la congruencia, la semejanza y la relación pitagórica en figuras planas y tridimensionales: identificación y aplicación.
- Construcción de figuras geométricas con herramientas manipulativas y digitales (programas de geometría dinámica, realidad aumentada, etc.).
2. Localización y sistemas de representación.
- Relaciones espaciales: localización y descripción mediante coordenadas geométricas y otros sistemas de representación.
3. Movimientos y transformaciones en el espacio.
- Transformaciones elementales como giros, traslaciones y simetrías en situaciones diversas utilizando herramientas tecnológicas o manipulativas.
4. Visualización, razonamiento y modelización geométrica.
- Modelización geométrica: relaciones numéricas y algebraicas en la resolución de problemas.
- Reconocimiento, interpretación y análisis de gráficas funcionales.
D. Sentido algebraico.
1. Modelo matemático.
- Modelización de situaciones de la vida cotidiana usando representaciones matemáticas y el lenguaje algebraico.
- Estrategias de deducción de conclusiones razonables a partir de un modelo matemático.
2. Variable.
- Variable: comprensión del concepto en sus diferentes naturalezas.
3. Igualdad y desigualdad.
- Realización de operaciones con expresiones algebraicas.
- Relaciones lineales y cuadráticas en situaciones de la vida cotidiana o matemáticamente relevantes: expresión mediante álgebra simbólica.
- Equivalencia de expresiones algebraicas (fórmulas, polinomios, identidades notables, etc.) en la resolución de problemas basados en relaciones lineales y cuadráticas.
- Estrategias de búsqueda e interpretación de soluciones en ecuaciones y sistemas lineales y ecuaciones cuadráticas en situaciones de la vida cotidiana.
- Ecuaciones de primer y segundo grado con una incógnita: resolución mediante el uso de la tecnología y algoritmos de lápiz y papel.
- Resolución de problemas de sistemas de dos ecuaciones lineales con dos incógnitas (métodos algebraicos, gráficos, tecnológicos, etc.).
4. Relaciones y funciones lineales.
- Relaciones cuantitativas en situaciones de la vida cotidiana y clases de funciones que las modelizan.
- Relaciones lineales y cuadráticas: identificación y comparación de diferentes modos de representación, tablas, gráficas o expresiones algebraicas, y sus propiedades a partir de ellas.
- Estrategias de deducción de la información relevante de una función mediante el uso de diferentes representaciones simbólicas.
5. Pensamiento computacional.
- Generalización y transferencia de procesos de resolución de problemas a otras situaciones.
- Estrategias útiles en la interpretación y modificación de algoritmos.
- Estrategias de formulación de cuestiones susceptibles de ser analizadas mediante programas y otras herramientas.
E. Sentido estocástico.
1. Organización y análisis de datos.
- Estrategias de recogida y organización de datos de situaciones de la vida cotidiana que involucran una sola variable. Diferencia entre variable y valores individuales.
- Análisis e interpretación de tablas y gráficos estadísticos de variables cualitativas, cuantitativas discretas y cuantitativas continuas en contextos reales.
- Gráficos estadísticos: representación mediante diferentes tecnologías (calculadora, hoja de cálculo, aplicaciones, etc.) y elección del más adecuado, interpretación y obtención de conclusiones razonadas.
- Medidas de localización: interpretación y cálculo con apoyo tecnológico en situaciones reales.
F. Sentido socioafectivo.
1. Creencias, actitudes y emociones.
- Gestión emocional: emociones que intervienen en el aprendizaje de las matemáticas. Autoconciencia y autorregulación.
- Estrategias de fomento de la curiosidad, la iniciativa, la perseverancia y la resiliencia en el aprendizaje de las matemáticas.
- Estrategias de fomento de la flexibilidad cognitiva: apertura a cambios de estrategia y transformación del error en oportunidad de aprendizaje.
2. Trabajo en equipo y toma de decisiones.
- Técnicas cooperativas para optimizar el trabajo en equipo y compartir y construir conocimiento matemático.
- Conductas empáticas y estrategias de gestión de conflictos.
- Métodos para la toma de decisiones adecuadas para resolver situaciones problemáticas.
- Reflexión sobre los resultados obtenidos: revisión de las operaciones utilizadas, asignación de unidades a los resultados, comprobación e interpretación de las soluciones en el contexto de la situación, búsqueda de otras formas de resolución, etc.
3. Inclusión, respeto y diversidad.
- Actitudes inclusivas y aceptación de la diversidad presente en el aula y en la sociedad.
- La contribución de las matemáticas al desarrollo de los distintos ámbitos del conocimiento humano desde una perspectiva de género.`,
  },
  {
    materia: 'biologia_geologia',
    curso: '1eso',
    saberes: `Saberes básicos
A. Proyecto científico.
- Formulación de preguntas, y conjeturas científicas, como punto de partida para la formulación guiada de hipótesis, bajo una perspectiva científica.
- Estrategias para la búsqueda de información, la colaboración y la comunicación de procesos, resultados o ideas científicas: herramientas digitales y formatos de uso frecuente en ciencia (presentación, gráfica, vídeo, póster, informe, etc.).
- Fuentes fidedignas de información científica: reconocimiento y utilización.
- La respuesta a cuestiones científicas mediante la experimentación y el trabajo de campo: utilizando los instrumentos y espacios necesarios (laboratorio, aulas, entorno, etc.) de forma adecuada.
- Modelado como método de representación y comprensión de procesos o elementos de la naturaleza.
- Métodos de observación y de toma de datos de fenómenos naturales.
- Métodos básicos de análisis de resultados.
- La labor científica y las personas dedicadas a la ciencia: contribución a las ciencias biológicas y geológicas e importancia social. El papel de la mujer en la ciencia.
B. La célula.
- La célula como unidad estructural y funcional de los seres vivos. Composición común a todas las células.
- Estructuras comunes a todas las células.
- Los distintos tipos celulares: procariota, eucariota animal y eucariota vegetal.
Diferencias y similitudes.
- Observación y comparación de muestras microscópicas.
C. Seres vivos.
- Los seres vivos: diferenciación y clasificación en los principales reinos.
- Los principales grupos taxonómicos: observación de especies del entorno y clasificación a partir de sus características distintivas.
- Las especies del entorno: estrategias de identificación (guías, claves dicotómicas, herramientas digitales, visu, etc.).
- Los animales como seres sintientes: semejanzas y diferencias con los seres vivos no sintientes.
D. Ecología y sostenibilidad.
- Los ecosistemas del entorno, sus componentes bióticos y abióticos y los tipos de relaciones de los seres vivos entre sí (intraespecíficas e interespecíficas, especialmente las tróficas) y con su entorno.
- La importancia de la conservación de los ecosistemas, la biodiversidad y la implantación de un modelo de desarrollo sostenible. Las funciones de la atmósfera y la hidrosfera y su papel esencial para la vida en la Tierra.
- Las funciones de la atmósfera y la hidrosfera y su papel esencial para la vida en la Tierra.
- Análisis de las consecuencias del cambio climático sobre los ecosistemas.
- La importancia de los hábitos sostenibles (consumo responsable, gestión de residuos, respeto al medio ambiente, etc.) como elemento de responsabilidad individual frente al cambio climático.
E. Geología.
- La estructura básica de la geosfera.
- Conceptos de roca y mineral: características y propiedades.
- Estrategias de clasificación de las rocas: sedimentarias, metamórficas e ígneas.
El ciclo de las rocas.
- Rocas y minerales relevantes o del entorno: identificación.
- Usos de los minerales y las rocas: su utilización en la fabricación de materiales y objetos cotidianos.`,
  },
  {
    materia: 'fisica_quimica',
    curso: '2eso',
    saberes: `Saberes básicos
A. Las destrezas científicas básicas.
- Metodologías de la investigación científica: identificación y formulación de cuestiones, elaboración de hipótesis y comprobación experimental de las mismas.
- Trabajo experimental y proyectos de investigación: estrategias en la resolución de problemas y en el desarrollo de investigaciones mediante la indagación, la deducción, la búsqueda de evidencias y el razonamiento lógico-matemático, haciendo inferencias válidas de las observaciones y obteniendo conclusiones.
- Diversos entornos y recursos de aprendizaje científico como el laboratorio o los entornos virtuales: materiales, sustancias y herramientas tecnológicas.
- Normas de uso de cada espacio, asegurando y protegiendo así la salud propia y comunitaria, la seguridad en las redes y el respeto hacia el medio ambiente.
- El lenguaje científico: unidades del Sistema Internacional y sus símbolos.
Herramientas matemáticas básicas en diferentes escenarios científicos y de aprendizaje.
- Estrategias de interpretación y producción de información científica utilizando diferentes formatos y diferentes medios: desarrollo del criterio propio basado en lo que el pensamiento científico aporta a la mejora de la sociedad para hacerla más justa, equitativa e igualitaria.
- Valoración de la cultura científica y del papel de los científicos en los principales hitos históricos y actuales de la física y la química en el avance y la mejora de la sociedad.
B. La materia.
- Teoría cinético-molecular: aplicación a observaciones sobre la materia explicando sus propiedades, los estados de agregación, incluyendo las leyes de los gases, los cambios de estado y la formación de mezclas y disoluciones.
- Experimentos relacionados con los sistemas materiales: conocimiento y descripción de sus propiedades, tanto generales como específicas, su composición y su clasificación.
- Estructura atómica: desarrollo histórico de los modelos atómicos, existencia, formación y propiedades de los isótopos y ordenación de los elementos en la tabla periódica.
C. La energía.
- La energía: formulación de cuestiones e hipótesis sobre la energía, propiedades y manifestaciones que la describan como la causa de todos los procesos de cambio.
- Diseño y comprobación experimental de hipótesis relacionadas con el uso doméstico e industrial de la energía en sus distintas formas y las transformaciones entre ellas.
- Elaboración fundamentada de hipótesis sobre el medio ambiente y la sostenibilidad a partir de las diferencias entre fuentes de energía renovables y no renovables.
- Efectos del calor sobre la materia: análisis de los efectos y aplicación en situaciones cotidianas.
D. La interacción.
- Predicción de movimientos sencillos a partir de los conceptos de la cinemática, formulando hipótesis comprobables sobre valores futuros de estas magnitudes.
- Las fuerzas como agentes de cambio: relación de los efectos de las fuerzas, tanto en el estado de movimiento o de reposo de un cuerpo como produciendo deformaciones en los sistemas sobre los que actúan.
- Fenómenos gravitatorios, eléctricos y magnéticos: experimentos sencillos que evidencian la relación con las fuerzas de la naturaleza.
E. El cambio.
- Los sistemas materiales: análisis de los diferentes tipos de cambios que experimentan, relacionando las causas que los producen con las consecuencias que tienen.
- Interpretación macroscópica y microscópica de las reacciones químicas:
explicación de las relaciones de la química con el medio ambiente, la tecnología y la sociedad.
- Ley de conservación de la masa, aplicación de esta ley como evidencia experimental que permiten validar el modelo atómico-molecular de la materia.`,
  },
];

export function saberesDe(materia: Materia, curso: Curso): SaberesDeCurso | null {
  return SABERES.find((s) => s.materia === materia && s.curso === curso) ?? null;
}

/**
 * Aviso cuando la combinación de curso y materia no existe en Murcia.
 *
 * No se bloquea: alguien puede estar estudiando por su cuenta, venir de otra
 * comunidad o repasar de un curso anterior. Sólo se le dice, para que no se
 * prepare un examen de algo que ese año no le van a preguntar.
 */
export function avisoDeCombinacion(materia: Materia, curso: Curso): string | null {
  if (curso !== '1eso' && curso !== '2eso') return null;
  if (materia === 'otra' || materia === 'desconocida') return null;
  if (MATERIAS_POR_CURSO[curso].includes(materia)) return null;

  const nombre =
    materia === 'biologia_geologia'
      ? 'Biología y Geología'
      : materia === 'fisica_quimica'
        ? 'Física y Química'
        : 'Matemáticas';
  const otro = curso === '1eso' ? '2.º' : '1.º';

  return `En la Región de Murcia, ${nombre} no se da en ${curso === '1eso' ? '1.º' : '2.º'} de ESO, sino en ${otro}. Te ayudo igual, pero tenlo en cuenta si estás preparando un examen.`;
}
