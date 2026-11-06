const DEFAULT_TIMEOUT_MS = 45000;

/**
 * Cliente de IA con múltiples proveedores.
 * El proveedor se elige con la variable de entorno AI_PROVIDER.
 * La clave NUNCA sale del servidor.
 *
 * Proveedores soportados:
 *   gemini    -> GEMINI_API_KEY       (Google Gemini, tiene nivel gratuito)
 *   openai    -> OPENAI_API_KEY
 *   groq      -> GROQ_API_KEY         (nivel gratuito, compatible con OpenAI)
 *   anthropic -> ANTHROPIC_API_KEY
 *   demo      -> sin clave: respuestas simuladas para probar la interfaz
 */

class AIError extends Error {
  constructor(message, status = 502, code = "ai_error") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function providerName() {
  const explicit = (process.env.AI_PROVIDER || "").trim().toLowerCase();
  if (explicit) return explicit;
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return "demo";
}

async function callAPI(url, options) {
  const controller = new AbortController();
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err && err.name === "AbortError") {
      throw new AIError(
        "La respuesta está tardando más de lo esperado. Inténtalo nuevamente.",
        504,
        "timeout"
      );
    }
    throw new AIError(
      "No fue posible conectar con el servicio de IA. Inténtalo más tarde.",
      502,
      "network"
    );
  } finally {
    clearTimeout(timer);
  }

  const raw = await res.text();
  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = null;
  }

  if (res.status === 429) {
    throw new AIError(
      "El servicio alcanzó temporalmente su límite de solicitudes. Inténtalo más tarde.",
      429,
      "rate_limit"
    );
  }
  if (res.status === 401 || res.status === 403) {
    throw new AIError(
      "La clave de API del servidor no es válida o no tiene permisos.",
      502,
      "auth"
    );
  }
  if (!res.ok) {
    const detail = data?.error?.message || data?.message || "";
    throw new AIError(
      `El proveedor de IA devolvió un error${detail ? `: ${detail}` : "."}`,
      502,
      "upstream"
    );
  }
  return data;
}

/* ------------------------------- Proveedores ------------------------------ */

async function askGemini(system, question, history) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new AIError("Falta GEMINI_API_KEY en el servidor.", 500, "config");
  
  // Modelos obsoletos en Google AI Studio se mapean automáticamente a gemini-3.5-flash-lite
  let model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  if (model === "gemini-2.0-flash" || model === "gemini-2.5-flash" || model === "gemini-1.5-flash") {
    model = "gemini-3.5-flash-lite";
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

  const contents = [
    ...history.map((h) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }],
    })),
    { role: "user", parts: [{ text: question }] },
  ];

  const data = await callAPI(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
    }),
  });

  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
  if (!text.trim()) throw new AIError("La IA no devolvió contenido. Intenta de nuevo.", 502, "empty");
  return text.trim();
}

async function askOpenAICompatible({ system, question, history, baseURL, apiKey, model, extraHeaders }) {
  if (!apiKey) throw new AIError("Falta la clave de API en el servidor.", 500, "config");

  const messages = [
    { role: "system", content: system },
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: question },
  ];

  const data = await callAPI(baseURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(extraHeaders || {}),
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  const text = data?.choices?.[0]?.message?.content || "";
  if (!text.trim()) throw new AIError("La IA no devolvió contenido. Intenta de nuevo.", 502, "empty");
  return text.trim();
}

async function askAnthropic(system, question, history) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new AIError("Falta ANTHROPIC_API_KEY en el servidor.", 500, "config");

  const data = await callAPI("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest",
      max_tokens: 4096,
      system,
      messages: [
        ...history.map((h) => ({ role: h.role, content: h.content })),
        { role: "user", content: question },
      ],
    }),
  });

  const text = (data?.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
  if (!text.trim()) throw new AIError("La IA no devolvió contenido. Intenta de nuevo.", 502, "empty");
  return text.trim();
}

/* --------------------------------- Demo ---------------------------------- */

const DEMO_SAMPLES = {
  word: `## Carta formal para solicitar una reunión

**Asunto:** Solicitud de reunión para revisar la propuesta comercial

Estimado/a [Nombre del cliente]:

Reciba un cordial saludo. Me dirijo a usted en representación de [Nombre de la empresa] para solicitar una reunión con el objetivo de presentar nuestra propuesta de servicios y conocer sus necesidades actuales.

Proponemos un encuentro de 45 minutos durante la semana del [fecha], en el horario que mejor se ajuste a su agenda. Podemos realizarlo en sus oficinas o mediante videollamada.

Quedo atento/a a su confirmación y agradezco de antemano su tiempo y atención.

Atentamente,

[Nombre y apellido]
[Cargo] · [Teléfono] · [Correo electrónico]

---
*Formato sugerido en Word: "Asunto" en negrita, cuerpo con interlineado 1,15 y fuente Calibri 11; despedida separada por un espacio simple.*`,

  excel: `## Fórmula para aprobado / reprobado

\`\`\`excel
=SI(A2>=70;"Aprobado";"Reprobado")
\`\`\`

Versión en inglés:
\`\`\`excel
=IF(A2>=70,"Aprobado","Reprobado")
\`\`\`

**Explicación paso a paso**
1. \`A2>=70\` es la prueba lógica: compara la nota con 70.
2. Si es verdadera, devuelve el texto \`"Aprobado"\`.
3. Si es falsa, devuelve \`"Reprobado"\`.
4. En Excel en español el separador de argumentos suele ser el punto y coma (\`;\`).

**Ejemplo**

| A (Nota) | B (Resultado) |
|---|---|
| 85 | Aprobado |
| 64 | Reprobado |

*Consejo: si quieres el resultado en mayúsculas, envuelve la fórmula en \`MAYUSC()\` / \`UPPER()\`.*`,

  powerpoint: `## Esquema de 7 diapositivas: Introducción a la IA

**1. Portada**
- Título: "Inteligencia artificial: qué es y por qué importa"
- Visual: ilustración abstracta de redes neuronales.

**2. ¿Qué es la inteligencia artificial?**
- Definición en una frase
- Diferencia entre IA, machine learning y deep learning
- Visual: diagrama de círculos concéntricos.

**3. Cómo aprende un modelo**
- Datos → entrenamiento → modelo → predicción
- Ejemplo cotidiano: filtro de spam
- Visual: flechas de proceso en 4 pasos.

**4. Aplicaciones hoy**
- Salud, banca, educación, retail
- Un dato de impacto por sector
- Visual: 4 iconos con una cifra cada uno.

**5. Beneficios y límites**
- Eficiencia y automatización
- Sesgos, privacidad, costo energético
- Visual: tabla comparativa de dos columnas (verde / ámbar).

**6. Buenas prácticas para adoptarla**
- Empezar por un caso pequeño y medible
- Datos limpios y responsables
- Visual: checklist de 3 pasos.

**7. Cierre**
- Idea clave: "La IA amplifica criterio humano, no lo reemplaza"
- Llamado a la acción: definir un piloto en 30 días
- Visual: diapositiva con una única frase grande.`,

  pdf: `## Resumen del texto proporcionado

*(Modo demostración: no hay una API de IA configurada, así que este es un resumen de ejemplo.)*

**Ideas principales**
- El documento plantea el problema y su contexto.
- Se describen los objetivos y el alcance del trabajo.
- Se presentan resultados y conclusiones.

**Datos clave**
- Cifras y fechas citadas en el texto.

**Respuesta a tu pregunta**
- En el modo real, aquí aparecería el resumen del texto que pegaste, apoyado solo en su contenido.

Para obtener respuestas reales: crea un archivo \`.env\` con \`GEMINI_API_KEY=tu_clave\` (gratis en Google AI Studio) o configura otro proveedor.`,
};

function demoAnswer(mode) {
  return DEMO_SAMPLES[mode] || "Modo demostración activo. Configura una clave de API en el archivo .env para obtener respuestas reales.";
}

/* ------------------------------- API pública ------------------------------ */

/**
 * Genera una respuesta de IA.
 * @param {{mode:string, question:string, history?:Array<{role:string,content:string}>, system:string}} params
 * @returns {Promise<{text:string, provider:string}>}
 */
async function generateAnswer({ mode, question, history = [], system }) {
  const provider = providerName();

  switch (provider) {
    case "gemini":
      return { text: await askGemini(system, question, history), provider };
    case "openai":
      return {
        text: await askOpenAICompatible({
          system,
          question,
          history,
          baseURL: "https://api.openai.com/v1/chat/completions",
          apiKey: process.env.OPENAI_API_KEY,
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        }),
        provider,
      };
    case "groq":
      return {
        text: await askOpenAICompatible({
          system,
          question,
          history,
          baseURL: "https://api.groq.com/openai/v1/chat/completions",
          apiKey: process.env.GROQ_API_KEY,
          model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        }),
        provider,
      };
    case "anthropic":
      return { text: await askAnthropic(system, question, history), provider };
    case "demo":
      return { text: demoAnswer(mode), provider: "demo" };
    default:
      throw new AIError(`Proveedor de IA no soportado: ${provider}`, 500, "config");
  }
}

/**
 * Genera una respuesta simulada (modo demostración) con un pequeño retardo
 * para que la interfaz muestre correctamente el indicador de carga.
 */
async function generateDemo({ mode, question }) {
  const delay = Number(process.env.DEMO_DELAY_MS ?? 900);
  if (delay > 0) await new Promise((r) => setTimeout(r, delay));
  const body = demoAnswer(mode);
  const echo = question.length > 220 ? question.slice(0, 220) + "…" : question;
  return { text: body, provider: "demo", demoQuestion: echo };
}

module.exports = { generateAnswer, generateDemo, providerName, AIError };
