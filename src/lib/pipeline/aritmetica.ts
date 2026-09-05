/**
 * Evaluador aritmético determinista.
 *
 * El modelo puede equivocarse calculando. Aquí se recalculan sus operaciones en
 * el servidor para poder afirmar "comprobado mediante cálculo" con fundamento
 * (reglas 14 y 15).
 *
 * Es un analizador descendente recursivo escrito a mano: NO se usa `eval` ni
 * `new Function`, porque la expresión procede en último término de contenido del
 * usuario y ejecutarla sería una vía de inyección de código.
 */

export class ErrorAritmetico extends Error {}

type Token =
  | { t: 'num'; v: number }
  | { t: 'id'; v: string }
  | { t: 'op'; v: string }
  | { t: '('; }
  | { t: ')'; }
  | { t: ','; };

const CONSTANTES: Record<string, number> = {
  pi: Math.PI,
  PI: Math.PI,
  e: Math.E,
};

const FUNCIONES: Record<string, (...a: number[]) => number> = {
  sqrt: Math.sqrt,
  raiz: Math.sqrt,
  abs: Math.abs,
  min: Math.min,
  max: Math.max,
  round: Math.round,
  redondear: Math.round,
  floor: Math.floor,
  ceil: Math.ceil,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  ln: Math.log,
  log: Math.log10,
  log10: Math.log10,
  exp: Math.exp,
  pow: Math.pow,
};

/** Longitud máxima admitida para una expresión, como defensa frente a abusos. */
const MAX_LONGITUD = 500;

/**
 * El separador decimal español (la coma) choca con el separador de argumentos
 * de las funciones: en "max(3,9)" la coma separa argumentos, pero en "1,5*2" es
 * un decimal. Se resuelve llevando una pila de contextos de paréntesis: dentro
 * de la llamada a una función la coma SIEMPRE separa; fuera, si va entre
 * dígitos, es un decimal.
 */
type Contexto = 'funcion' | 'grupo';

function tokenizar(entrada: string): Token[] {
  const tokens: Token[] = [];
  const contextos: Contexto[] = [];
  let i = 0;

  // Normalizaciones habituales de notación escolar y de salida del modelo.
  const s = entrada
    .replace(/ /g, ' ')
    .replace(/[×·]/g, '*')
    .replace(/[÷]/g, '/')
    .replace(/[−–—]/g, '-')
    .replace(/\^/g, '^')
    .trim();

  while (i < s.length) {
    const c = s[i];

    if (c === ' ' || c === '\t' || c === '\n') {
      i++;
      continue;
    }

    if (c >= '0' && c <= '9') {
      let j = i;
      while (j < s.length && /[0-9]/.test(s[j])) j++;
      const enArgumentos = contextos[contextos.length - 1] === 'funcion';
      const separadorDecimal =
        s[j] === '.' || (s[j] === ',' && !enArgumentos);
      if (j < s.length && separadorDecimal && /[0-9]/.test(s[j + 1] ?? '')) {
        j++;
        while (j < s.length && /[0-9]/.test(s[j])) j++;
      }
      const bruto = s.slice(i, j).replace(',', '.');
      tokens.push({ t: 'num', v: Number(bruto) });
      i = j;
      continue;
    }

    if (c === '.' && /[0-9]/.test(s[i + 1] ?? '')) {
      let j = i + 1;
      while (j < s.length && /[0-9]/.test(s[j])) j++;
      tokens.push({ t: 'num', v: Number(s.slice(i, j)) });
      i = j;
      continue;
    }

    if (/[a-zA-Z_]/.test(c)) {
      let j = i;
      while (j < s.length && /[a-zA-Z_0-9]/.test(s[j])) j++;
      tokens.push({ t: 'id', v: s.slice(i, j) });
      i = j;
      continue;
    }

    if ('+-*/^%'.includes(c)) {
      tokens.push({ t: 'op', v: c });
      i++;
      continue;
    }

    if (c === '(' || c === '[') {
      const anterior = tokens[tokens.length - 1];
      contextos.push(anterior?.t === 'id' ? 'funcion' : 'grupo');
      tokens.push({ t: '(' });
      i++;
      continue;
    }
    if (c === ')' || c === ']') {
      contextos.pop();
      tokens.push({ t: ')' });
      i++;
      continue;
    }
    if (c === ',' || c === ';') {
      tokens.push({ t: ',' });
      i++;
      continue;
    }

    throw new ErrorAritmetico(`Carácter no admitido en la expresión: "${c}"`);
  }

  return tokens;
}

/**
 * Gramática:
 *   expr    := term (('+' | '-') term)*
 *   term    := unario (('*' | '/' | '%') unario)*
 *   unario  := ('-' | '+') unario | potencia
 *   potencia:= primario ('^' unario)?      -- asociativa por la derecha
 *   primario:= num | id | id '(' args ')' | '(' expr ')'
 */
class Analizador {
  private pos = 0;

  constructor(private readonly tokens: Token[]) {}

  private mirar(): Token | undefined {
    return this.tokens[this.pos];
  }

  private consumir(): Token {
    const t = this.tokens[this.pos];
    if (!t) throw new ErrorAritmetico('Expresión incompleta.');
    this.pos++;
    return t;
  }

  analizar(): number {
    const v = this.expr();
    if (this.pos !== this.tokens.length) {
      throw new ErrorAritmetico('Sobran símbolos al final de la expresión.');
    }
    return v;
  }

  private expr(): number {
    let v = this.term();
    for (;;) {
      const t = this.mirar();
      if (t?.t === 'op' && (t.v === '+' || t.v === '-')) {
        this.consumir();
        const d = this.term();
        v = t.v === '+' ? v + d : v - d;
      } else break;
    }
    return v;
  }

  private term(): number {
    let v = this.unario();
    for (;;) {
      const t = this.mirar();
      if (t?.t === 'op' && (t.v === '*' || t.v === '/' || t.v === '%')) {
        this.consumir();
        const d = this.unario();
        if (t.v === '*') v = v * d;
        else if (t.v === '/') {
          if (d === 0) throw new ErrorAritmetico('División entre cero.');
          v = v / d;
        } else {
          if (d === 0) throw new ErrorAritmetico('Módulo con divisor cero.');
          v = v % d;
        }
      } else break;
    }
    return v;
  }

  private unario(): number {
    const t = this.mirar();
    if (t?.t === 'op' && (t.v === '-' || t.v === '+')) {
      this.consumir();
      const v = this.unario();
      return t.v === '-' ? -v : v;
    }
    return this.potencia();
  }

  private potencia(): number {
    const base = this.primario();
    const t = this.mirar();
    if (t?.t === 'op' && t.v === '^') {
      this.consumir();
      const exp = this.unario();
      return Math.pow(base, exp);
    }
    return base;
  }

  private primario(): number {
    const t = this.consumir();

    if (t.t === 'num') return t.v;

    if (t.t === '(') {
      const v = this.expr();
      const cierre = this.consumir();
      if (cierre.t !== ')') throw new ErrorAritmetico('Falta un paréntesis de cierre.');
      return v;
    }

    if (t.t === 'id') {
      const siguiente = this.mirar();
      if (siguiente?.t === '(') {
        this.consumir();
        const args: number[] = [];
        if (this.mirar()?.t !== ')') {
          args.push(this.expr());
          while (this.mirar()?.t === ',') {
            this.consumir();
            args.push(this.expr());
          }
        }
        const cierre = this.consumir();
        if (cierre.t !== ')') throw new ErrorAritmetico('Falta un paréntesis de cierre.');

        const fn = FUNCIONES[t.v] ?? FUNCIONES[t.v.toLowerCase()];
        if (!fn) throw new ErrorAritmetico(`Función no admitida: "${t.v}"`);
        return fn(...args);
      }

      const constante = CONSTANTES[t.v] ?? CONSTANTES[t.v.toLowerCase()];
      if (constante === undefined) {
        // Una incógnita sin valor no es un error del sistema: simplemente esta
        // expresión no es comprobable de forma determinista.
        throw new ErrorAritmetico(`La expresión contiene el símbolo "${t.v}", sin valor numérico.`);
      }
      return constante;
    }

    throw new ErrorAritmetico('Expresión mal formada.');
  }
}

/**
 * Evalúa una expresión aritmética.
 * @throws ErrorAritmetico si no es una expresión numérica cerrada y válida.
 */
export function evaluar(expresion: string): number {
  if (typeof expresion !== 'string' || !expresion.trim()) {
    throw new ErrorAritmetico('Expresión vacía.');
  }
  if (expresion.length > MAX_LONGITUD) {
    throw new ErrorAritmetico('Expresión demasiado larga.');
  }

  // Se admite "3+4 = 7" quedándose con la parte izquierda de la igualdad.
  const sinIgualdad = expresion.includes('=') ? expresion.split('=')[0] : expresion;

  const resultado = new Analizador(tokenizar(sinIgualdad)).analizar();

  if (!Number.isFinite(resultado)) {
    throw new ErrorAritmetico('El resultado no es un número finito.');
  }
  return resultado;
}

/** Evalúa sin lanzar: devuelve el valor o el motivo del fallo. */
export function intentarEvaluar(
  expresion: string,
): { ok: true; valor: number } | { ok: false; error: string } {
  try {
    return { ok: true, valor: evaluar(expresion) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Expresión no evaluable.' };
  }
}
