/**
 * Cliente de modelos multimodales.
 *
 * Habla directamente con la API REST del proveedor para no depender de la
 * superficie cambiante de un SDK, y para controlar tiempos, reintentos y coste
 * desde un único punto (regla 44).
 *
 * Proveedores soportados: OpenAI (por defecto) y Anthropic.
 * La clave NUNCA se escribe en el código: se lee de variables de entorno.
 */

export type Proveedor = 'openai' | 'anthropic';

export interface ParteTexto {
  tipo: 'texto';
  texto: string;
}

export interface ParteImagen {
  tipo: 'imagen';
  /** MIME real ya validado en el servidor. */
  mime: string;
  /** Contenido en base64, sin el prefijo data:. */
  base64: string;
}

export type ParteMensaje = ParteTexto | ParteImagen;

export interface MensajeIA {
  rol: 'user' | 'assistant';
  partes: ParteMensaje[];
}

export interface PeticionIA {
  system: string;
  mensajes: MensajeIA[];
  /** Pide al modelo que responda exclusivamente con un objeto JSON. */
  json?: boolean;
  maxTokens?: number;
  temperatura?: number;
  /** Etiqueta para los registros; nunca incluye contenido del usuario. */
  etiqueta: string;
  /** Sobrescribe el modelo por defecto (p. ej. tareas baratas). */
  modelo?: string;
  timeoutMs?: number;
}

export interface RespuestaIA {
  texto: string;
  modelo: string;
  proveedor: Proveedor;
  ms: number;
}

export type CodigoErrorIA =
  | 'sin_configurar'
  | 'timeout'
  | 'limite_proveedor'
  | 'proveedor'
  | 'respuesta_vacia';

export class ErrorIA extends Error {
  readonly codigo: CodigoErrorIA;
  readonly status?: number;

  constructor(message: string, codigo: CodigoErrorIA, status?: number) {
    super(message);
    this.name = 'ErrorIA';
    this.codigo = codigo;
    this.status = status;
  }
}

const TIMEOUT_POR_DEFECTO_MS = 90_000;

export interface ConfiguracionProveedor {
  proveedor: Proveedor;
  apiKey: string;
  modeloPrincipal: string;
  modeloRapido: string;
  baseUrl: string;
}

/**
 * Resuelve el proveedor a partir del entorno. Se evalúa en cada llamada (y no
 * al cargar el módulo) para funcionar en funciones serverless con variables
 * inyectadas en arranque en frío.
 */
export function configuracion(): ConfiguracionProveedor | null {
  const forzado = process.env.AI_PROVIDER?.trim().toLowerCase();
  const openai = process.env.OPENAI_API_KEY?.trim();
  const anthropic = process.env.ANTHROPIC_API_KEY?.trim();

  const usarAnthropic = forzado === 'anthropic' || (!forzado && !openai && !!anthropic);

  if (usarAnthropic && anthropic) {
    return {
      proveedor: 'anthropic',
      apiKey: anthropic,
      modeloPrincipal: process.env.AI_MODEL?.trim() || 'claude-sonnet-4-5',
      modeloRapido: process.env.AI_MODEL_FAST?.trim() || 'claude-haiku-4-5-20251001',
      baseUrl: process.env.ANTHROPIC_BASE_URL?.trim() || 'https://api.anthropic.com/v1',
    };
  }

  if (openai) {
    return {
      proveedor: 'openai',
      apiKey: openai,
      modeloPrincipal: process.env.AI_MODEL?.trim() || 'gpt-4o',
      modeloRapido: process.env.AI_MODEL_FAST?.trim() || 'gpt-4o-mini',
      baseUrl: process.env.OPENAI_BASE_URL?.trim() || 'https://api.openai.com/v1',
    };
  }

  return null;
}

export function iaConfigurada(): boolean {
  return configuracion() !== null;
}

/**
 * Los modelos de razonamiento de OpenAI (gpt-5.x, o1, o3, o4) rechazan
 * `max_tokens` y una `temperature` distinta de la de por defecto. Verificado en
 * la cuenta del proyecto: devuelven 400 con
 * "Unsupported parameter: 'max_tokens' ... Use 'max_completion_tokens' instead".
 */
export function esModeloRazonador(modelo: string): boolean {
  return /^(gpt-5|o1|o3|o4)/i.test(modelo);
}

async function fetchConTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const control = new AbortController();
  const t = setTimeout(() => control.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: control.signal });
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new ErrorIA('El proveedor de IA ha tardado demasiado en responder.', 'timeout');
    }
    throw new ErrorIA('No se ha podido contactar con el proveedor de IA.', 'proveedor');
  } finally {
    clearTimeout(t);
  }
}

export function cuerpoOpenAI(p: PeticionIA, modelo: string): Record<string, unknown> {
  const razonador = esModeloRazonador(modelo);
  const maxTokens = p.maxTokens ?? 4000;

  const mensajes: Record<string, unknown>[] = [{ role: 'system', content: p.system }];
  for (const m of p.mensajes) {
    mensajes.push({
      role: m.rol,
      content: m.partes.map((parte) =>
        parte.tipo === 'texto'
          ? { type: 'text', text: parte.texto }
          : {
              type: 'image_url',
              image_url: { url: `data:${parte.mime};base64,${parte.base64}`, detail: 'high' },
            },
      ),
    });
  }

  const cuerpo: Record<string, unknown> = { model: modelo, messages: mensajes };
  if (razonador) {
    cuerpo.max_completion_tokens = maxTokens;
    cuerpo.reasoning_effort = process.env.AI_REASONING_EFFORT?.trim() || 'medium';
  } else {
    cuerpo.max_tokens = maxTokens;
    cuerpo.temperature = p.temperatura ?? 0.2;
  }
  if (p.json) cuerpo.response_format = { type: 'json_object' };
  return cuerpo;
}

export function cuerpoAnthropic(p: PeticionIA, modelo: string): Record<string, unknown> {
  const mensajes: Record<string, unknown>[] = p.mensajes.map((m) => ({
    role: m.rol,
    content: m.partes.map((parte) =>
      parte.tipo === 'texto'
        ? { type: 'text', text: parte.texto }
        : {
            type: 'image',
            source: { type: 'base64', media_type: parte.mime, data: parte.base64 },
          },
    ),
  }));

  // Anthropic no tiene "modo JSON": se fuerza rellenando el turno del asistente.
  if (p.json) {
    mensajes.push({ role: 'assistant', content: [{ type: 'text', text: '{' }] });
  }

  return {
    model: modelo,
    max_tokens: p.maxTokens ?? 4000,
    temperature: p.temperatura ?? 0.2,
    system: p.system,
    messages: mensajes,
  };
}

/** Extrae el nombre del parámetro que el proveedor ha rechazado, si lo indica. */
export function parametroNoSoportado(mensaje: string): string | null {
  const patrones = [
    /Unsupported parameter: '([^']+)'/i,
    /Unsupported value: '([^']+)'/i,
    /'([a-z_]+)' is not supported/i,
  ];
  for (const patron of patrones) {
    const m = patron.exec(mensaje);
    if (m) return m[1];
  }
  return null;
}

export async function llamarIA(p: PeticionIA): Promise<RespuestaIA> {
  const cfg = configuracion();
  if (!cfg) {
    throw new ErrorIA(
      'No hay ningún proveedor de IA configurado. Define OPENAI_API_KEY o ANTHROPIC_API_KEY.',
      'sin_configurar',
    );
  }

  const modelo = p.modelo ?? cfg.modeloPrincipal;
  const timeoutMs = p.timeoutMs ?? TIMEOUT_POR_DEFECTO_MS;
  const inicio = Date.now();

  const url =
    cfg.proveedor === 'openai' ? `${cfg.baseUrl}/chat/completions` : `${cfg.baseUrl}/messages`;

  const cabeceras: Record<string, string> =
    cfg.proveedor === 'openai'
      ? { 'content-type': 'application/json', authorization: `Bearer ${cfg.apiKey}` }
      : {
          'content-type': 'application/json',
          'x-api-key': cfg.apiKey,
          'anthropic-version': '2023-06-01',
        };

  let cuerpo =
    cfg.proveedor === 'openai' ? cuerpoOpenAI(p, modelo) : cuerpoAnthropic(p, modelo);

  // Un único reintento adaptativo: si el proveedor rechaza un parámetro
  // concreto, se elimina y se reintenta. Nunca bucles infinitos (regla 45).
  for (let intento = 0; intento < 2; intento++) {
    const res = await fetchConTimeout(
      url,
      { method: 'POST', headers: cabeceras, body: JSON.stringify(cuerpo) },
      timeoutMs,
    );

    if (res.ok) {
      const datos: unknown = await res.json();
      const texto = extraerTexto(cfg.proveedor, datos, !!p.json);
      if (!texto.trim()) {
        throw new ErrorIA('El modelo ha devuelto una respuesta vacía.', 'respuesta_vacia');
      }
      return { texto, modelo, proveedor: cfg.proveedor, ms: Date.now() - inicio };
    }

    const detalle = await res.text().catch(() => '');

    if (res.status === 429 || res.status === 529 || res.status === 503) {
      throw new ErrorIA(
        'El servicio de IA está saturado en este momento.',
        'limite_proveedor',
        res.status,
      );
    }

    const parametro = res.status === 400 ? parametroNoSoportado(detalle) : null;
    if (parametro && intento === 0 && parametro in cuerpo) {
      const copia: Record<string, unknown> = { ...cuerpo };
      delete copia[parametro];
      if (parametro === 'max_tokens') copia.max_completion_tokens = p.maxTokens ?? 4000;
      if (parametro === 'temperature') delete copia.temperature;
      cuerpo = copia;
      continue;
    }

    throw new ErrorIA(
      `El proveedor de IA ha devuelto un error (${res.status}).`,
      'proveedor',
      res.status,
    );
  }

  throw new ErrorIA('No se ha podido obtener respuesta del proveedor de IA.', 'proveedor');
}

export function extraerTexto(proveedor: Proveedor, datos: unknown, json: boolean): string {
  const d = datos as {
    choices?: { message?: { content?: string | null } }[];
    content?: { type: string; text?: string }[];
  };

  if (proveedor === 'openai') {
    return d.choices?.[0]?.message?.content ?? '';
  }

  const texto = (d.content ?? [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text ?? '')
    .join('');
  // Se devuelve la llave inicial usada como prefill para que el JSON sea válido.
  return json ? `{${texto}` : texto;
}

/** Modelo barato para tareas auxiliares (clasificación, títulos). */
export function modeloRapido(): string | undefined {
  return configuracion()?.modeloRapido;
}
