require("dotenv").config();

const path = require("path");
const express = require("express");
const { buildSystemPrompt, MODES } = require("./src/prompts");
const { generateAnswer, generateDemo, providerName, AIError } = require("./src/ai");

const app = express();
const PORT = process.env.PORT || 3000;

const MAX_QUESTION_CHARS = Number(process.env.MAX_QUESTION_CHARS) || 60000;
const MAX_HISTORY_ITEMS = 10;

app.disable("x-powered-by");
app.use(express.json({ limit: "4mb" }));
app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));

/* ---------------------- Límite de solicitudes simple ---------------------- */
/* Evita que un mismo cliente sature la API. En memoria: suficiente para el MVP. */
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = Number(process.env.RATE_LIMIT_PER_MINUTE) || 12;
const hits = new Map();

function rateLimit(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || "anon";
  const now = Date.now();
  const entry = hits.get(ip) || { count: 0, reset: now + RATE_WINDOW_MS };

  if (now > entry.reset) {
    entry.count = 0;
    entry.reset = now + RATE_WINDOW_MS;
  }
  entry.count += 1;
  hits.set(ip, entry);

  if (entry.count > RATE_MAX) {
    return res.status(429).json({
      error: "El servicio alcanzó temporalmente su límite de solicitudes. Inténtalo más tarde.",
      code: "rate_limit",
    });
  }
  next();
}

/* -------------------------------- Validación ------------------------------ */

function sanitizeHistory(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((h) => h && typeof h.content === "string" && (h.role === "user" || h.role === "assistant"))
    .slice(-MAX_HISTORY_ITEMS)
    .map((h) => ({ role: h.role, content: h.content.slice(0, MAX_QUESTION_CHARS) }));
}

/* --------------------------------- Rutas --------------------------------- */

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    provider: providerName(),
    demo: providerName() === "demo",
    modes: MODES,
  });
});

app.post("/api/chat", rateLimit, async (req, res) => {
  const { mode, question, history } = req.body || {};

  if (typeof question !== "string" || !question.trim()) {
    return res.status(400).json({
      error: "Por favor, escribe una pregunta antes de continuar.",
      code: "empty_question",
    });
  }
  if (question.length > MAX_QUESTION_CHARS) {
    return res.status(413).json({
      error: `La pregunta es demasiado larga. El máximo es ${MAX_QUESTION_CHARS} caracteres.`,
      code: "too_long",
    });
  }
  if (typeof mode !== "string" || !MODES.includes(mode)) {
    return res.status(400).json({
      error: "Selecciona una herramienta válida: Word, Excel, PowerPoint o PDF.",
      code: "invalid_mode",
    });
  }

  const system = buildSystemPrompt(mode);

  try {
    const payload = {
      mode,
      question: question.trim(),
      history: sanitizeHistory(history),
      system,
    };
    const { text, provider } =
      providerName() === "demo" ? await generateDemo(payload) : await generateAnswer(payload);
    return res.json({ answer: text, mode, provider, demo: provider === "demo" });
  } catch (err) {
    const status = err instanceof AIError ? err.status : 500;
    const message =
      err instanceof AIError
        ? err.message
        : "Ocurrió un error al generar la respuesta. Inténtalo de nuevo.";
    // Log técnico solo en el servidor; al usuario no se le muestra detalle sensible.
    console.error(`[chat] ${err.code || "error"}:`, err.message);
    return res.status(status).json({ error: message, code: err.code || "server_error" });
  }
});

// 404 en JSON para rutas de API desconocidas
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Ruta no encontrada.", code: "not_found" });
});

// Fallback SPA: cualquier otra ruta devuelve la interfaz
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Manejo de JSON malformado
app.use((err, req, res, next) => {
  if (err && err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "La solicitud no tiene un formato válido.", code: "bad_json" });
  }
  console.error("[server]", err);
  res.status(500).json({ error: "Ocurrió un error al generar la respuesta.", code: "server_error" });
});

const server = app.listen(PORT, "0.0.0.0", () => {
  const provider = providerName();
  console.log(`Office AI Assistant escuchando en http://0.0.0.0:${PORT}`);
  console.log(`Proveedor de IA: ${provider}${provider === "demo" ? " (modo demostración, sin clave)" : ""}`);
});

module.exports = { app, server };
