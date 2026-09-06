import { describe, expect, it } from 'vitest';
import { admiteViaRapida, calcularConfianza, confianzaDeCharla } from '@/lib/pipeline/orquestador';
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
  esSeguimiento: false,
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

describe('avisos que vienen del revisor', () => {
  it('un fallo señalado con veredicto dudoso llega al alumno', () => {
    const { incertidumbres } = calcularConfianza({
      verificacion: {
        ...verificacionCorrecta,
        veredicto: 'dudosa',
        errores: ['No se ha convertido la unidad'],
      },
      comprobaciones: [],
      analisis: analisisLimpio,
      hayFuentes: false,
    });
    expect(incertidumbres).toContain('No se ha convertido la unidad');
  });

  it('con la solución dada por buena, el fallo del alumno no se convierte en aviso', () => {
    const { incertidumbres } = calcularConfianza({
      verificacion: {
        ...verificacionCorrecta,
        veredicto: 'correcta',
        errores: ['El alumno ha puesto 8 m/s en vez de 22,22 m/s'],
      },
      comprobaciones: [],
      analisis: analisisLimpio,
      hayFuentes: false,
    });
    expect(incertidumbres).toEqual([]);
  });

  it('un resultado corregido sí se avisa', () => {
    const { incertidumbres } = calcularConfianza({
      verificacion: {
        ...verificacionCorrecta,
        veredicto: 'corregida',
        errores: ['El resultado propuesto estaba mal redondeado'],
      },
      comprobaciones: [],
      analisis: analisisLimpio,
      hayFuentes: false,
    });
    expect(incertidumbres).toContain('El resultado propuesto estaba mal redondeado');
  });
});

describe('vía rápida de conversación', () => {
  it('sólo se usa para aclarar algo ya explicado y sin fotos nuevas', () => {
    expect(admiteViaRapida({ esSeguimiento: true, mensajesPrevios: 2, imagenes: 0 })).toBe(true);
  });

  it('una foto nueva siempre pasa por el pipeline completo', () => {
    expect(admiteViaRapida({ esSeguimiento: true, mensajesPrevios: 2, imagenes: 1 })).toBe(false);
  });

  it('sin conversación previa no hay nada que aclarar', () => {
    expect(admiteViaRapida({ esSeguimiento: true, mensajesPrevios: 0, imagenes: 0 })).toBe(false);
  });

  it('si el analizador no lo marca como seguimiento, se resuelve y se verifica', () => {
    expect(admiteViaRapida({ esSeguimiento: false, mensajesPrevios: 5, imagenes: 0 })).toBe(false);
  });

  it('nunca presume de cálculo comprobado: ahí no se ha recalculado nada', () => {
    const limpia = confianzaDeCharla({
      necesitaResolver: false,
      texto: 'Restar 2 deja 3x = 12.',
      puntos: [],
      sugerencias: [],
      incertidumbres: [],
    });
    expect(limpia).toBe('conocimiento_estable');
  });

  it('cualquier duda declarada la degrada', () => {
    const dudosa = confianzaDeCharla({
      necesitaResolver: false,
      texto: 'Creo que se refiere al segundo apartado.',
      puntos: [],
      sugerencias: [],
      incertidumbres: ['No estoy seguro de a qué apartado te refieres.'],
    });
    expect(dudosa).toBe('necesita_confirmacion');
  });
});
