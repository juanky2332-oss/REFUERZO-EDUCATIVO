import { describe, expect, it } from 'vitest';
import { PREFERENCIAS_POR_DEFECTO, interpretar } from '@/lib/cliente/preferencias';
import { esLineaDeFormula, respuestaComoTexto } from '@/components/VistaRespuesta';
import { sesionesParaPlazo } from '@/components/Aprobar';
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
