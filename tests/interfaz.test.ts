import { describe, expect, it } from 'vitest';
import { PREFERENCIAS_POR_DEFECTO, interpretar } from '@/lib/cliente/preferencias';
import {
  empiezaConTodosLosPasos,
  esLineaDeFormula,
  pestanasDe,
  respuestaComoTexto,
} from '@/components/VistaRespuesta';
import { NOMBRE_HERRAMIENTA, historialDe, siguientesPasos } from '@/components/Chat';
import { vocabularioDe } from '@/components/VistaMaterial';
import type { MaterialGenerado } from '@/lib/ai/schemas';
import { repartirArchivos } from '@/lib/cliente/adjuntos';
import { sesionesParaPlazo } from '@/lib/material';
import type { RespuestaEducativa } from '@/lib/types';

describe('preferencias guardadas en el navegador', () => {
  it('lee unas preferencias válidas', () => {
    const guardadas = JSON.stringify({ curso: '2eso', materia: 'fisica_quimica', nivel: 'C' });
    expect(interpretar(guardadas)).toEqual({
      curso: '2eso',
      materia: 'fisica_quimica',
      nivel: 'C',
    });
  });

  it('ignora valores que no existen en lugar de propagarlos', () => {
    const raras = JSON.stringify({ curso: '4eso', materia: 'latin', nivel: 'Z' });
    expect(interpretar(raras)).toEqual(PREFERENCIAS_POR_DEFECTO);
  });

  it('resiste un dato corrupto, vacío o nulo', () => {
    expect(interpretar(null)).toEqual(PREFERENCIAS_POR_DEFECTO);
    expect(interpretar('')).toEqual(PREFERENCIAS_POR_DEFECTO);
    expect(interpretar('{no es json')).toEqual(PREFERENCIAS_POR_DEFECTO);
    expect(interpretar('"una cadena"')).toEqual(PREFERENCIAS_POR_DEFECTO);
    expect(interpretar('[1,2,3]')).toEqual(PREFERENCIAS_POR_DEFECTO);
  });

  it('conserva los campos válidos aunque falte alguno', () => {
    expect(interpretar(JSON.stringify({ nivel: 'A' }))).toEqual({
      ...PREFERENCIAS_POR_DEFECTO,
      nivel: 'A',
    });
  });
});

describe('detección de líneas con expresiones matemáticas', () => {
  it('reconoce una expresión', () => {
    expect(esLineaDeFormula('3x + 2 = 14')).toBe(true);
    expect(esLineaDeFormula('(14 - 2) / 3 = 4')).toBe(true);
    expect(esLineaDeFormula('d = 250 / 100 = 2,5')).toBe(true);
  });

  it('no confunde una frase normal con una fórmula', () => {
    expect(esLineaDeFormula('Por tanto el resultado es 4 y lo comprobamos')).toBe(false);
    expect(esLineaDeFormula('Restamos 2 en los dos lados de la igualdad')).toBe(false);
    expect(esLineaDeFormula('')).toBe(false);
    expect(esLineaDeFormula('Vamos paso a paso')).toBe(false);
  });

  it('exige que haya números y algún operador', () => {
    expect(esLineaDeFormula('a = b')).toBe(false);
    expect(esLineaDeFormula('12 34 56')).toBe(false);
  });
});

describe('exportación de la respuesta a texto plano', () => {
  const base: RespuestaEducativa = {
    titulo: 'Vamos paso a paso',
    queNosPiden: 'Resolver la ecuación',
    datos: ['3x + 2 = 14'],
    comoLoHacemos: 'Despejamos la x',
    pasos: [{ titulo: 'Restar 2', contenido: '3x = 12' }],
    resultado: 'x = 4',
    comprobacion: '3 · 4 + 2 = 14',
    recuerda: ['Lo que haces a un lado, al otro'],
    correccion: null,
    ejercicioSimilar: null,
    preguntaDeSeguimiento: null,
    confianza: 'calculo_comprobado',
    incertidumbres: [],
    fuentes: [],
    correccionDelMaterial: null,
  };

  it('incluye el procedimiento completo', () => {
    const t = respuestaComoTexto(base);
    expect(t).toContain('RESULTADO');
    expect(t).toContain('x = 4');
    expect(t).toContain('COMPROBACIÓN');
    expect(t).toContain('1. Restar 2');
  });

  it('pone las incertidumbres arriba del todo, antes que el resultado', () => {
    const t = respuestaComoTexto({ ...base, incertidumbres: ['No leo bien el segundo dato'] });
    expect(t.indexOf('OJO:')).toBeLessThan(t.indexOf('RESULTADO'));
  });
});

describe('reparto de sesiones de estudio', () => {
  it('nunca propone menos de tres sesiones aunque quede un día', () => {
    expect(sesionesParaPlazo(1)).toBe(3);
    expect(sesionesParaPlazo(2)).toBe(3);
  });

  it('crece con el plazo pero sin desmadrarse', () => {
    expect(sesionesParaPlazo(5)).toBe(6);
    expect(sesionesParaPlazo(30)).toBe(10);
  });

  it('siempre devuelve un entero dentro del rango que admite la API', () => {
    for (let d = 1; d <= 30; d++) {
      const s = sesionesParaPlazo(d);
      expect(Number.isInteger(s)).toBe(true);
      expect(s).toBeGreaterThanOrEqual(1);
      expect(s).toBeLessThanOrEqual(20);
    }
  });
});

describe('pestañas de una respuesta', () => {
  const base: RespuestaEducativa = {
    titulo: 'Vamos paso a paso',
    queNosPiden: 'Resolver la ecuación',
    datos: [],
    comoLoHacemos: '',
    pasos: [],
    resultado: 'x = 4',
    comprobacion: '3 · 4 + 2 = 14',
    recuerda: [],
    correccion: null,
    ejercicioSimilar: null,
    preguntaDeSeguimiento: null,
    confianza: 'calculo_comprobado',
    incertidumbres: [],
    fuentes: [],
    correccionDelMaterial: null,
  };

  it('no enseña pestañas sin contenido detrás', () => {
    expect(pestanasDe(base)).toEqual([]);
  });

  it('la primera pestaña, la que se abre al llegar, siempre tiene contenido', () => {
    const conPasos = pestanasDe({ ...base, pasos: [{ titulo: 'Restar 2', contenido: '3x = 12' }] });
    expect(conPasos[0].clave).toBe('pasos');
    expect(conPasos[0].contador).toBe(1);

    const soloRepaso = pestanasDe({ ...base, recuerda: ['Operaciones inversas'] });
    expect(soloRepaso[0].clave).toBe('repaso');
  });

  it('la comprobación nunca se esconde detrás de una pestaña', () => {
    const claves = pestanasDe({ ...base, comprobacion: 'Sustituyo x = 4' }).map((p) => p.clave);
    expect(claves).not.toContain('comprobacion');
  });

  it('con pocos pasos se enseñan todos y con muchos se navega de uno en uno', () => {
    expect(empiezaConTodosLosPasos(3)).toBe(true);
    expect(empiezaConTodosLosPasos(4)).toBe(false);
  });
});

describe('historial que viaja al servidor', () => {
  it('resume la respuesta en vez de mandarla entera', () => {
    const h = historialDe([
      { tipo: 'usuario', id: '1', texto: 'Resuelve 3x + 2 = 14', miniaturas: [] },
      {
        tipo: 'respuesta',
        id: '2',
        respuesta: {
          titulo: 'Ecuación',
          queNosPiden: 'Hallar x',
          datos: [],
          comoLoHacemos: '',
          pasos: [{ titulo: 'Restar 2', contenido: 'texto largo que no debe viajar entero' }],
          resultado: 'x = 4',
          comprobacion: '',
          recuerda: [],
          correccion: null,
          ejercicioSimilar: null,
          preguntaDeSeguimiento: null,
          confianza: 'calculo_comprobado',
          incertidumbres: [],
          fuentes: [],
          correccionDelMaterial: null,
        },
      },
    ]);

    expect(h).toHaveLength(2);
    expect(h[1].rol).toBe('asistente');
    expect(h[1].texto).toContain('Resultado: x = 4');
    expect(h[1].texto).not.toContain('texto largo que no debe viajar entero');
  });

  it('un mensaje sin texto se anuncia como foto, para que no llegue vacío', () => {
    const h = historialDe([{ tipo: 'usuario', id: '1', texto: '', miniaturas: ['data:,'] }]);
    expect(h[0].texto).toBe('(envió una foto)');
  });

  it('el material generado no arrastra la conversación', () => {
    const h = historialDe([
      { tipo: 'usuario', id: '1', texto: 'Hola', miniaturas: [] },
      {
        tipo: 'material',
        id: '2',
        peticion: {
          tipo: 'ejercicios',
          materia: 'matematicas',
          curso: '1eso',
          tema: 'Fracciones',
          cantidad: 6,
          dias: null,
        },
        material: {
          titulo: 'Ficha',
          materia: 'matematicas',
          curso: '1eso',
          tema: 'Fracciones',
          instrucciones: '',
          duracionMinutos: null,
          preguntas: [{ numero: 1, enunciado: 'Suma', puntuacion: 1, solucion: '', criterioCorreccion: '' }],
          loQueHayQueAprender: [],
          notasDidacticas: [],
        },
      },
    ]);
    expect(h).toHaveLength(1);
  });

  it('no manda más de ocho turnos', () => {
    const muchas = Array.from({ length: 20 }, (_, i) => ({
      tipo: 'usuario' as const,
      id: String(i),
      texto: `mensaje ${i}`,
      miniaturas: [],
    }));
    expect(historialDe(muchas)).toHaveLength(8);
  });
});

describe('reparto de fotos adjuntas', () => {
  it('acepta lo que cabe y lo dice cuando recorta', () => {
    expect(repartirArchivos(0, 2)).toEqual({ cabe: 2, aviso: null });
    expect(repartirArchivos(3, 3).cabe).toBe(1);
    expect(repartirArchivos(3, 3).aviso).toContain('Sólo he cogido 1');
  });

  it('con la lista llena no acepta ninguna y avisa', () => {
    const r = repartirArchivos(4, 1);
    expect(r.cabe).toBe(0);
    expect(r.aviso).toContain('máximo 4 fotos');
  });
});

describe('cómo se llama cada cosa en el material', () => {
  const base: MaterialGenerado = {
    titulo: 'Práctica de fracciones',
    materia: 'matematicas',
    curso: '1eso',
    tema: 'Fracciones',
    instrucciones: '',
    duracionMinutos: null,
    preguntas: [
      { numero: 1, enunciado: 'Suma 1/2 + 1/4', puntuacion: 2, solucion: '3/4', criterioCorreccion: '' },
    ],
    loQueHayQueAprender: [],
    notasDidacticas: [],
  };

  it('en un examen o unos ejercicios se habla de preguntas y de solución', () => {
    const v = vocabularioDe(base);
    expect(v.esCuestionario).toBe(true);
    expect(v.elemento).toBe('pregunta');
    expect(v.verRespuesta).toBe('Ver solución');
    expect(v.verTodas).toBe('Ver todas las soluciones');
  });

  it('un plan de estudio tiene sesiones, no preguntas con solución', () => {
    const v = vocabularioDe({
      ...base,
      titulo: 'Plan de estudio para el examen',
      preguntas: base.preguntas.map((p) => ({ ...p, puntuacion: 0 })),
    });
    expect(v.esCuestionario).toBe(false);
    expect(v.elemento).toBe('sesión');
    expect(v.respuesta).not.toMatch(/soluci/i);
  });

  it('un resumen tiene apartados con contenido', () => {
    const v = vocabularioDe({
      ...base,
      titulo: 'Resumen del tema',
      preguntas: base.preguntas.map((p) => ({ ...p, puntuacion: 0 })),
    });
    expect(v.elemento).toBe('apartado');
    expect(v.esCuestionario).toBe(false);
  });
});

describe('el plural del botón «ver todas» está escrito, no fabricado', () => {
  const base: MaterialGenerado = {
    titulo: 'Práctica',
    materia: 'matematicas',
    curso: '1eso',
    tema: 'Fracciones',
    instrucciones: '',
    duracionMinutos: null,
    preguntas: [
      { numero: 1, enunciado: 'Suma', puntuacion: 1, solucion: '3/4', criterioCorreccion: '' },
    ],
    loQueHayQueAprender: [],
    notasDidacticas: [],
  };

  it('ningún tipo de material produce un plural inventado', () => {
    const variantes = [
      base,
      { ...base, titulo: 'Plan de estudio', preguntas: base.preguntas.map((p) => ({ ...p, puntuacion: 0 })) },
      { ...base, titulo: 'Resumen', preguntas: base.preguntas.map((p) => ({ ...p, puntuacion: 0 })) },
    ];
    for (const m of variantes) {
      const v = vocabularioDe(m);
      expect(v.verTodas).not.toMatch(/ns|óns/);
      expect(v.verTodas.length).toBeLessThan(40);
    }
  });
});

describe('qué se ofrece después de cada material', () => {
  it('un plan de estudio no se queda en buenas intenciones', () => {
    expect(siguientesPasos('plan_estudio')).toEqual(['ejercicios', 'examen']);
  });

  it('nunca se ofrece repetir lo que se acaba de generar', () => {
    for (const tipo of ['ejercicios', 'examen', 'resumen', 'plan_estudio'] as const) {
      expect(siguientesPasos(tipo)).not.toContain(tipo);
    }
  });

  it('todo lo que se ofrece tiene un nombre que enseñar en el botón', () => {
    for (const tipo of ['ejercicios', 'examen', 'resumen', 'plan_estudio'] as const) {
      for (const siguiente of siguientesPasos(tipo)) {
        expect(NOMBRE_HERRAMIENTA[siguiente]).toBeTruthy();
      }
    }
  });
});
