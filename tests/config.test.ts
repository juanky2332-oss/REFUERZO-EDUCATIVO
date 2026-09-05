import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LIMITES_POR_DEFECTO, enteroPositivo, texto } from '@/lib/config';
import { consumir, reiniciarLimites } from '@/lib/security/rate-limit';

/**
 * Regresión de un fallo que llegó a producción: una variable de entorno creada
 * sin valor en Vercel hacía que `Number('' ?? 20)` valiese 0, el límite de uso
 * bloqueaba el 100 % de las consultas y el usuario leía
 * «Espera Infinity segundos».
 */

const ORIGINAL = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe('lectura de enteros del entorno', () => {
  it('usa el valor cuando es un entero positivo válido', () => {
    process.env.PRUEBA_LIMITE = '35';
    expect(enteroPositivo('PRUEBA_LIMITE', 20)).toBe(35);
  });

  it('cae al valor por defecto si la variable no existe', () => {
    delete process.env.PRUEBA_LIMITE;
    expect(enteroPositivo('PRUEBA_LIMITE', 20)).toBe(20);
  });

  it('cae al valor por defecto si la variable está vacía (el fallo real)', () => {
    process.env.PRUEBA_LIMITE = '';
    expect(enteroPositivo('PRUEBA_LIMITE', 20)).toBe(20);
  });

  it('cae al valor por defecto con espacios, texto, cero, negativos o decimales', () => {
    for (const valor of ['   ', 'abc', '0', '-5', '2.5', 'NaN', 'Infinity']) {
      process.env.PRUEBA_LIMITE = valor;
      expect(enteroPositivo('PRUEBA_LIMITE', 20)).toBe(20);
    }
  });

  it('trata la cadena vacía como ausencia también para los textos', () => {
    process.env.PRUEBA_TEXTO = '   ';
    expect(texto('PRUEBA_TEXTO')).toBeUndefined();
    process.env.PRUEBA_TEXTO = ' gpt-4o ';
    expect(texto('PRUEBA_TEXTO')).toBe('gpt-4o');
  });
});

describe('el límite de uso resiste una configuración inválida', () => {
  beforeEach(() => reiniciarLimites());

  it('con un máximo de 0 no bloquea: usa el valor por defecto', () => {
    const r = consumir('ip', 0, 60_000);
    expect(r.permitido).toBe(true);
    expect(r.restantes).toBe(LIMITES_POR_DEFECTO.solve - 1);
  });

  it('con un máximo NaN o negativo tampoco bloquea', () => {
    expect(consumir('ip-nan', Number.NaN, 60_000).permitido).toBe(true);
    expect(consumir('ip-neg', -3, 60_000).permitido).toBe(true);
  });

  it('nunca devuelve un tiempo de espera infinito ni cero', () => {
    for (let i = 0; i < 3; i++) consumir('ip-tope', 3, 60_000);
    const bloqueado = consumir('ip-tope', 3, 60_000);
    expect(bloqueado.permitido).toBe(false);
    expect(Number.isFinite(bloqueado.reintentarEn)).toBe(true);
    expect(bloqueado.reintentarEn).toBeGreaterThan(0);
  });

  it('con una ventana absurda usa la ventana por defecto', () => {
    expect(consumir('ip-v', 5, 0).permitido).toBe(true);
    expect(consumir('ip-v2', 5, Number.NaN).permitido).toBe(true);
  });
});
