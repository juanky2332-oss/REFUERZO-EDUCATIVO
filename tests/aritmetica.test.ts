import { describe, expect, it } from 'vitest';
import { ErrorAritmetico, evaluar, intentarEvaluar } from '@/lib/pipeline/aritmetica';

describe('evaluador aritmético', () => {
  it('respeta la prioridad de las operaciones', () => {
    expect(evaluar('2+3*4')).toBe(14);
    expect(evaluar('(2+3)*4')).toBe(20);
    expect(evaluar('10-4-3')).toBe(3);
    expect(evaluar('100/10/2')).toBe(5);
  });

  it('resuelve potencias con asociatividad por la derecha', () => {
    expect(evaluar('2^3')).toBe(8);
    expect(evaluar('2^3^2')).toBe(512);
    expect(evaluar('-2^2')).toBe(-4);
  });

  it('acepta el menos unario y los signos encadenados', () => {
    expect(evaluar('-5+3')).toBe(-2);
    expect(evaluar('3*-2')).toBe(-6);
    expect(evaluar('--4')).toBe(4);
  });

  it('admite decimales con punto y con coma', () => {
    expect(evaluar('0.5+0.25')).toBe(0.75);
    expect(evaluar('1,5*2')).toBe(3);
    expect(evaluar('.5*4')).toBe(2);
  });

  it('normaliza los símbolos de multiplicación y división del enunciado', () => {
    expect(evaluar('6×7')).toBe(42);
    expect(evaluar('20÷4')).toBe(5);
    expect(evaluar('8−3')).toBe(5);
  });

  it('resuelve las funciones admitidas', () => {
    expect(evaluar('sqrt(16)')).toBe(4);
    expect(evaluar('abs(-7)')).toBe(7);
    expect(evaluar('round(2.6)')).toBe(3);
    expect(evaluar('max(3,9)')).toBe(9);
    expect(evaluar('pow(2,10)')).toBe(1024);
  });

  it('se queda con la parte izquierda cuando el modelo escribe una igualdad', () => {
    expect(evaluar('(14-2)/3 = 4')).toBe(4);
  });

  it('rechaza la división entre cero en lugar de devolver infinito', () => {
    expect(() => evaluar('5/0')).toThrow(ErrorAritmetico);
  });

  it('rechaza expresiones con incógnitas, porque no son comprobables', () => {
    expect(() => evaluar('2*x+1')).toThrow(ErrorAritmetico);
  });

  it('rechaza funciones no admitidas y llamadas a objetos del entorno', () => {
    expect(() => evaluar('alert(1)')).toThrow(ErrorAritmetico);
    expect(() => evaluar('process.exit(1)')).toThrow(ErrorAritmetico);
    expect(() => evaluar('constructor("return 1")()')).toThrow(ErrorAritmetico);
  });

  it('rechaza cadenas y caracteres ajenos a la aritmética', () => {
    expect(() => evaluar('"hola"')).toThrow(ErrorAritmetico);
    expect(() => evaluar('1; 2')).toThrow(ErrorAritmetico);
    expect(() => evaluar('')).toThrow(ErrorAritmetico);
  });

  it('rechaza paréntesis desequilibrados', () => {
    expect(() => evaluar('(2+3')).toThrow(ErrorAritmetico);
    expect(() => evaluar('2+3)')).toThrow(ErrorAritmetico);
  });

  it('rechaza expresiones desmesuradamente largas', () => {
    expect(() => evaluar('1+'.repeat(400) + '1')).toThrow(ErrorAritmetico);
  });

  it('distingue la coma decimal del separador de argumentos', () => {
    // Dentro de una funcion la coma separa argumentos...
    expect(evaluar('max(3,9)')).toBe(9);
    expect(evaluar('min(2,10)')).toBe(2);
    expect(evaluar('pow(2,3)')).toBe(8);
    // ...y fuera de ella sigue siendo el separador decimal espanol.
    expect(evaluar('1,5*2')).toBe(3);
    expect(evaluar('(1,5+0,5)*2')).toBe(4);
    // Dentro de argumentos la coma separa SIEMPRE, asi que un decimal ahi
    // debe escribirse con punto. El prompt del resolutor lo exige asi.
    expect(evaluar('max(1,5,2)')).toBe(5);
    expect(evaluar('max(1.5, 2)')).toBe(2);
  });

  it('intentarEvaluar informa del fallo en vez de lanzar', () => {
    expect(intentarEvaluar('2+2')).toEqual({ ok: true, valor: 4 });
    const r = intentarEvaluar('2+x');
    expect(r.ok).toBe(false);
  });
});
