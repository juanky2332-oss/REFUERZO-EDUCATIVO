# Refuerzo Educativo

Herramienta web de apoyo al estudio para **1.º y 2.º de ESO** en Matemáticas, Física y Química
y Biología y Geología. El alumno hace una foto del ejercicio, la sube, y la aplicación lo lee,
lo resuelve, **comprueba el resultado** y se lo explica a su nivel.

Contexto educativo de referencia: España → Región de Murcia → Educación Secundaria Obligatoria.

---

## El principio que ordena todo el diseño

> No inventar. No suponer. No ocultar la incertidumbre.

Un error en una herramienta educativa perjudica directamente a un menor. Por eso la aplicación
prefiere decir «no puedo confirmarlo» antes que dar una respuesta plausible pero sin respaldo.
Eso no es una carencia: es la característica principal del producto.

Tres mecanismos lo sostienen, y **ninguno de ellos depende de que el modelo se porte bien**:

1. **Recálculo determinista en el servidor.** El modelo declara las operaciones en las que se
   apoya su resultado; el servidor las vuelve a calcular con su propio evaluador aritmético
   ([`src/lib/pipeline/aritmetica.ts`](src/lib/pipeline/aritmetica.ts), analizador descendente
   recursivo escrito a mano, sin `eval`). Si no cuadran, la respuesta se degrada.
2. **La confianza la decide el servidor, no el modelo.**
   [`calcularConfianza`](src/lib/pipeline/orquestador.ts) cruza el veredicto del revisor con el
   resultado del recálculo y con las ambigüedades de lectura. Es deliberadamente pesimista.
3. **Las fuentes se descartan si el sistema no ha aportado ninguna.** Garantía dura contra las
   URLs inventadas: si la aplicación no ha leído una fuente, en la respuesta no aparece ninguna.

---

## Funcionalidades

### Resolver (`/resolver`)

- Entrada por **texto, foto, captura o recorte**, y cualquier combinación de imagen + pregunta.
- Se puede enviar **sólo una foto**, sin escribir nada.
- Arrastrar y soltar, selector de archivos y **cámara en el móvil**; previsualización, giro y
  borrado antes de enviar.
- **Lectura honesta de la imagen**: si algo no se lee con seguridad, se dice cuál es el dato y se
  pregunta, en lugar de adivinarlo.
- **Corrección**: si en la foto aparece la respuesta del alumno, se compara con el procedimiento
  correcto y se clasifica en correcto / parcialmente correcto / incorrecto, explicando dónde falla.
- **Cuatro niveles de explicación** (A muy básico, B refuerzo, C consolidación, D ampliación).
- **Conversación con contexto**: «no entiendo el paso 2» se entiende como parte del mismo ejercicio.
- **Progreso real** durante la espera: cada paso que se muestra corresponde a una fase que se está
  ejecutando de verdad en el servidor.

### Crear material (`/material`)

Ejercicios, exámenes, resúmenes, fichas, tests y planes de estudio, con:

- **Cuadernillo del alumno** y **solucionario del profesor** en vistas separadas, listas para
  imprimir o guardar en PDF con el diálogo del navegador.
- La separación está garantizada **por construcción**: [`paraAlumno()`](src/lib/material.ts)
  reconstruye el material campo a campo sin las soluciones, así que la vista del alumno no las
  recibe y no puede filtrarlas ni al imprimir ni al copiar.
- Puntuación por pregunta, criterios de reparto de puntos y apartado
  **«⭐ Lo que tengo que aprender sí o sí»**.

---

## Arquitectura

```
Entrada (texto / imágenes)
        ↓
Validación en servidor (magic bytes, tamaño, límite de uso, esquema)
        ↓
[1] ANALIZAR    → calidad de la imagen, transcripción literal, ambigüedades, ¿se puede resolver?
        ↓                                    ├─ ¿normativa? → «no puedo confirmarlo» + portales oficiales
        ↓                                    └─ ¿faltan datos? → pregunta concreta al alumno
[2] RESOLVER    → datos, incógnita, pasos, resultado, operaciones comprobables
        ↓
[3] COMPROBAR   → el SERVIDOR recalcula la aritmética (determinista, sin IA)
        ↓
[4] VERIFICAR   → revisor independiente que parte de la sospecha, no de la confianza
        ↓
    calcularConfianza()  ← el servidor decide qué se muestra al usuario
        ↓
[5] EXPLICAR    → adaptación pedagógica al nivel A/B/C/D
        ↓
Respuesta en streaming (NDJSON) → interfaz
```

### Mapa del código

| Ruta | Qué hace |
| --- | --- |
| `src/app/page.tsx` | Pantalla de entrada: «¿Qué necesitas?» |
| `src/app/resolver/` · `src/components/Resolver.tsx` | Conversación multimodal |
| `src/app/material/` · `src/components/GeneradorMaterial.tsx` | Generador de material |
| `src/app/api/solve/route.ts` | Pipeline principal, respuesta NDJSON en streaming |
| `src/app/api/generate/route.ts` | Generación de material |
| `src/app/api/health/route.ts` | Estado del despliegue (sin datos sensibles) |
| `src/lib/pipeline/orquestador.ts` | Orquestación de las fases y cálculo de la confianza |
| `src/lib/pipeline/aritmetica.ts` | Evaluador aritmético determinista |
| `src/lib/pipeline/comprobar.ts` | Recálculo de las operaciones declaradas por el modelo |
| `src/lib/ai/provider.ts` | Cliente REST de OpenAI / Anthropic, con visión |
| `src/lib/ai/pedir.ts` | Petición con validación de esquema y un solo reintento |
| `src/lib/ai/prompts/` | Reglas del sistema y prompt de cada fase |
| `src/lib/ai/schemas.ts` | Esquemas Zod de todo lo que devuelve el modelo |
| `src/lib/security/` | Inyección de prompts, validación de subidas, límite de uso |
| `src/lib/curriculum/` | Capa curricular actualizable y detector de consultas normativas |
| `src/lib/material.ts` | Separación alumno / profesor |

### Stack

Next.js 16 (App Router) · React 19 · TypeScript en modo estricto · Tailwind CSS v4 · Zod ·
Vitest. Sin SDK de IA: se habla directamente con la API REST del proveedor, para no depender de
una superficie que cambia y para controlar tiempos, reintentos y coste desde un solo punto.

---

## Puesta en marcha

```bash
npm install
cp .env.example .env.local     # y rellena OPENAI_API_KEY o ANTHROPIC_API_KEY
npm run dev
```

En <http://localhost:3000>. Comprueba la configuración en `/api/health`.

### Variables de entorno

Todas están documentadas en [`.env.example`](.env.example). Las imprescindibles:

| Variable | Obligatoria | Por defecto | Para qué |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | una de las dos | — | Proveedor OpenAI |
| `ANTHROPIC_API_KEY` | una de las dos | — | Proveedor Anthropic |
| `AI_PROVIDER` | no | autodetectado | Fuerza `openai` o `anthropic` |
| `AI_MODEL` | no | `gpt-4o` / `claude-sonnet-4-5` | Modelo principal (**debe admitir imágenes**) |
| `AI_MODEL_FAST` | no | `gpt-4o-mini` / `claude-haiku-4-5-20251001` | Modelo barato para tareas auxiliares |
| `AI_REASONING_EFFORT` | no | `medium` | Sólo para gpt-5.x / o1 / o3 / o4 |
| `RATE_LIMIT_SOLVE` | no | `20` | Consultas por cliente y ventana |
| `RATE_LIMIT_GENERATE` | no | `10` | Generaciones por cliente y ventana |
| `RATE_LIMIT_VENTANA_MS` | no | `60000` | Duración de la ventana |

> Los modelos **gpt-5.x, o1, o3 y o4 rechazan `max_tokens`** y una `temperature` distinta de la
> de por defecto. El cliente lo detecta por el nombre del modelo y usa `max_completion_tokens`;
> además, si el proveedor rechaza un parámetro concreto, lo elimina y reintenta **una sola vez**.

---

## Verificación

```bash
npm run verify     # lint + typecheck + tests + build
```

o por separado: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

### Tests automáticos (60, sin coste de IA)

Cubren lo que no puede fallar en silencio:

- **Evaluador aritmético**: prioridad de operaciones, potencias, decimales con punto y con coma,
  y rechazo de `eval`, de identificadores del entorno y de expresiones con incógnitas.
- **Cálculo de la confianza**: que una cuenta que no cuadra, una lectura ambigua o un veredicto
  dudoso degraden la respuesta, y que **nunca** se marque «verificado» sin fuente aportada.
- **Seguridad**: caracteres invisibles, delimitación con nonce, ejecutables y PDF disfrazados de
  imagen, límites de tamaño y de uso.
- **Adaptación al proveedor**: `max_tokens` frente a `max_completion_tokens`.
- **Separación alumno / profesor**: que el cuadernillo no contenga ninguna solución.

### Banco de pruebas de extremo a extremo (gasta llamadas de IA)

```bash
npm run dev
node tests/manual/banco-pruebas.mjs http://localhost:3000
# opcional: IMAGEN_PRUEBA=/ruta/a/ejercicio.jpg node tests/manual/banco-pruebas.mjs
```

Comprueba con la API real que resuelve bien Matemáticas y Física y Química, que responde con
solvencia a una pregunta conceptual de Biología, que ante una consulta normativa dice que no puede
confirmarlo, que **no obedece a las instrucciones inyectadas** en el enunciado y que pregunta en
lugar de inventar cuando faltan datos.

---

## Despliegue en Vercel

1. Importa el repositorio en Vercel. Next.js 16 se detecta solo; no hace falta `vercel.json`.
2. Define en *Project Settings → Environment Variables* al menos `OPENAI_API_KEY` o
   `ANTHROPIC_API_KEY`, en Production y en Preview.
3. Despliega y comprueba `/api/health`: debe responder `"configurada": true`.

Las rutas `/api/solve` y `/api/generate` declaran `maxDuration = 120` porque el pipeline encadena
varias llamadas al modelo. En el plan gratuito el límite de la plataforma es menor; si ves cortes,
sube el plan o reduce `AI_MODEL` a un modelo más rápido.

---

## Privacidad y seguridad

La aplicación puede ser usada por menores, así que se ha diseñado con privacidad por defecto:

- **No se almacenan las imágenes ni las conversaciones.** Se procesan en memoria durante la
  petición y se descartan. No hay base de datos.
- **No se piden datos personales.** No hay registro ni cuentas.
- **Los registros no contienen contenido del usuario**: sólo tiempos, fases, contadores y códigos
  de error ([`src/lib/observabilidad.ts`](src/lib/observabilidad.ts)).
- **Validación en servidor, no sólo en el navegador**: tipo real del fichero por firma binaria,
  tamaño máximo, número de imágenes, esquema de la petición y límite de uso.
- **Inyección de prompts**: todo el contenido externo —incluido el texto leído dentro de una
  fotografía— se envuelve en bloques delimitados con un identificador aleatorio por petición y se
  trata como dato, nunca como instrucción. Verificado con una prueba adversarial real.
- Cabeceras `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` y `Permissions-Policy`.
- Ninguna clave vive en el código: sólo en variables de entorno, y `.env*` está en `.gitignore`.

---

## Currículo y normativa

**En este repositorio no hay ningún contenido normativo codificado a mano**, y es a propósito.
Afirmar de memoria qué dice un decreto o unos saberes básicos es inventarlo: esa información
cambia y sólo vale leída de la fuente.

Cuando una consulta depende de normativa vigente, la aplicación lo detecta
([`dependeDeNormativa`](src/lib/curriculum/index.ts)), no gasta el pipeline de resolución, y
responde diciendo que no puede confirmarlo, remitiendo al **BOE, BORM, Educarm, CARM** o al
Ministerio, y ofreciendo trabajar sobre el texto si el usuario lo pega.

Para que responda con fuente, hay que implementar `ProveedorCurriculo` (índice documental sobre
los decretos, o búsqueda restringida a dominios oficiales) y registrarlo con
`registrarProveedorCurriculo()`. En cuanto haya fragmentos con fuente, el pipeline los usa, los
cita y habilita el nivel de confianza «verificado». No hace falta tocar nada más.

Los temas que sugiere el generador de material son **orientativos**, de uso habitual en el aula, y
la interfaz los etiqueta como tales. No son una transcripción del currículo oficial.

---

## Limitaciones conocidas

Se listan aquí porque conviene saberlas, no porque estén escondidas:

- **Sin verificación web.** No hay ninguna API de búsqueda conectada, así que el nivel de confianza
  «verificado» no se alcanza nunca hoy y las consultas normativas siempre responden «no puedo
  confirmarlo». Es el comportamiento correcto mientras no haya fuente; deja de serlo en cuanto se
  registre un `ProveedorCurriculo`.
- **El límite de uso es por instancia.** Está en la memoria del proceso, así que en Vercel cada
  función serverless lleva su propia cuenta. Para un límite estricto y compartido hay que
  respaldarlo con Upstash Redis o Vercel KV; el punto de sustitución es `consumir()` en
  [`src/lib/security/rate-limit.ts`](src/lib/security/rate-limit.ts).
- **Sólo imágenes.** PDF y documentos de texto todavía no se admiten como entrada; el validador los
  rechaza con un mensaje claro en lugar de intentarlo y fallar.
- **El recálculo cubre la aritmética, no el álgebra.** Una expresión con incógnitas no es
  comprobable de forma determinista: en ese caso la respuesta no se etiqueta como «comprobado
  mediante cálculo», que es lo honesto.
- **La exportación a PDF usa el diálogo del navegador.** Hay hoja de estilos de impresión, pero no
  generación de PDF en servidor.
- **Sin perfil persistente.** El nivel y el curso se eligen en cada sesión; no hay seguimiento del
  aprendizaje entre visitas porque no hay almacenamiento de datos personales.

---

## Aviso

Esta herramienta **no sustituye al profesorado**. Cuando una respuesta aparece marcada como
«necesita confirmación», es que el sistema no ha podido comprobarla: contrástala antes de darla
por buena.
