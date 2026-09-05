import { describe, expect, it } from 'vitest';
import { calcularConfianza } from '@/lib/pipeline/orquestador';
import { comprobar, comprobarLista } from '@/lib/pipeline/comprobar';
import type { Analisis, Verificacion } from '@/lib/types';

/**
 * Estas pruebas son las más importantes del proyecto: fijan que el sistema NUNCA
 * presente como seguro algo que no ha podido confirmar.
 */

const analisisLimpio: Analisis = {
  intencion: 'resolver',
  materia: 'matematicas',
  curso: '1eso',
  tema: 'Ecuaciones',
  enunciado: '3x + 2 = 14',
  datos: [],
  respuestaDelAlumno: null,
  calidadImagen: null,
  ambiguedades: [],
  bloqueantes: [],
  puedeResolverse: true,
  resumenTarea: 'Resolver una ecuación de primer grado.',
};

const verificacionCorrecta: Verificacion = {
  veredicto: 'correcta',
  errores: [],
  observaciones: [],
  resultadoCorregido: null,
  confianza: 'calculo_comprobado',
};

describe('comprobación numérica determinista', () => {
  it('valida una operación correcta', () => {
    const r = comprobar({
      descripcion: 'Despejar x',
      expresion: '(14-2)/3',
      valorEsperado: 4,
      tolerancia: 0.001,
    });
    expect(r.ok).toBe(true);
    expect(r.valorCalculado).toBe(4);
  });

  it('detecta que el modelo se ha equivocado en la cuenta', () => {
    const r = comprobar({
      descripcion: 'Despejar x',
      expresion: '(14-2)/3',
      valorEsperado: 5,
      tolerancia: 0.001,
    });
    expect(r.ok).toBe(false);
    expect(r.valorCalculado).toBe(4);
    expect(r.error).toBeTruthy();
  });

  it('no falla por el redondeo cuando la tolerancia declarada es cero', () => {
    const r = comprobar({
      descripcion: 'Tercio',
      expresion: '1/3',
      valorEsperado: 0.3333333333333333,
      tolerancia: 0,
    });
    expect(r.ok).toBe(true);
  });

  it('marca como fallida una expresión que no se puede evaluar', () => {
    const r = comprobar({
      descripcion: 'Con incógnita',
      expresion: '2x',
      valorEsperado: 4,
      tolerancia: 0.01,
    });
    expect(r.ok).toBe(false);
    expect(r.valorCalculado).toBeNull();
  });

  it('acota el número de comprobaciones por respuesta', () => {
    const muchas = Array.from({ length: 30 }, () => ({
      descripcion: 'x',
      expresion: '1+1',
      valorEsperado: 2,
      tolerancia: 0.01,
    }));
    expect(comprobarLista(muchas)).toHaveLength(12);
  });
});

describe('cálculo de la confianza mostrada', () => {
  it('acepta "comprobado mediante cálculo" cuando el servidor ha rehecho las cuentas', () => {
    const { confianza, incertidumbres } = calcularConfianza({
      verificacion: verificacionCorrecta,
      comprobaciones: [
        {
          descripcion: 'd',
          expresion: '2+2',
          valorEsperado: 4,
          tolerancia: 0.01,
          ok: true,
          valorCalculado: 4,
          error: null,
        },
      ],
      analisis: analisisLimpio,
      hayFuentes: false,
    });
    expect(confianza).toBe('calculo_comprobado');
    expect(incertidumbres).toHaveLength(0);
  });

  it('degrada a "necesita confirmación" si alguna cuenta no cuadra', () => {
    const { confianza, incertidumbres } = calcularConfianza({
      verificacion: verificacionCorrecta,
      comprobaciones: [
        {
          descripcion: 'Despejar x',
          expresion: '(14-2)/3',
          valorEsperado: 5,
          tolerancia: 0.01,
          ok: false,
          valorCalculado: 4,
          error: 'no cuadra',
        },
      ],
      analisis: analisisLimpio,
      hayFuentes: false,
    });
    expect(confianza).toBe('necesita_confirmacion');
    expect(incertidumbres.join(' ')).toContain('Despejar x');
  });

  it('degrada cuando la lectura de la imagen era ambigua', () => {
    const { confianza, incertidumbres } = calcularConfianza({
      verificacion: verificacionCorrecta,
      comprobaciones: [],
      analisis: {
        ...analisisLimpio,
        ambiguedades: [
          { fragmento: 'segundo dato', lecturaPrincipal: '3', lecturaAlternativa: '8' },
        ],
      },
      hayFuentes: false,
    });
    expect(confianza).toBe('necesita_confirmacion');
    expect(incertidumbres.join(' ')).toContain('podría decir 3 o 8');
  });

  it('degrada cuando el revisor no ha podido confirmar la solución', () => {
    const { confianza } = calcularConfianza({
      verificacion: { ...verificacionCorrecta, veredicto: 'dudosa' },
      comprobaciones: [],
      analisis: analisisLimpio,
      hayFuentes: false,
    });
    expect(confianza).toBe('necesita_confirmacion');
  });

  it('NUNCA marca "verificado" si el sistema no ha aportado ninguna fuente', () => {
    const { confianza } = calcularConfianza({
      verificacion: { ...verificacionCorrecta, confianza: 'verificado' },
      comprobaciones: [],
      analisis: analisisLimpio,
      hayFuentes: false,
    });
    expect(confianza).not.toBe('verificado');
    expect(confianza).toBe('conocimiento_estable');
  });

  it('permite "verificado" sólo cuando hay fuente aportada', () => {
    const { confianza } = calcularConfianza({
      verificacion: { ...verificacionCorrecta, confianza: 'verificado' },
      comprobaciones: [],
      analisis: analisisLimpio,
      hayFuentes: true,
    });
    expect(confianza).toBe('verificado');
  });

  it('rebaja "comprobado mediante cálculo" si no hubo ninguna comprobación real', () => {
    const { confianza } = calcularConfianza({
      verificacion: verificacionCorrecta,
      comprobaciones: [],
      analisis: analisisLimpio,
      hayFuentes: false,
    });
    expect(confianza).toBe('conocimiento_estable');
  });

  it('traslada al alumno lo que no se pudo leer de la imagen', () => {
    const { incertidumbres } = calcularConfianza({
      verificacion: verificacionCorrecta,
      comprobaciones: [],
      analisis: {
        ...analisisLimpio,
        calidadImagen: { legible: false, problemas: ['borrosa'], ilegible: ['el exponente'] },
      },
      hayFuentes: false,
    });
    expect(incertidumbres.join(' ')).toContain('el exponente');
  });

  it('no repite la misma incertidumbre dos veces', () => {
    const { incertidumbres } = calcularConfianza({
      verificacion: {
        ...verificacionCorrecta,
        veredicto: 'dudosa',
        errores: ['Falta una unidad', 'Falta una unidad'],
      },
      comprobaciones: [],
      analisis: analisisLimpio,
      hayFuentes: false,
    });
    expect(incertidumbres.filter((i) => i === 'Falta una unidad')).toHaveLength(1);
  });
});
