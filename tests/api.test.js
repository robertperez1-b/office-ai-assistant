/**
 * Pruebas de la API con el runner nativo de Node (node --test).
 * Se ejecutan en modo demostración: no requieren clave de IA.
 */
process.env.AI_PROVIDER = "demo";
process.env.DEMO_DELAY_MS = "0";

const test = require("node:test");
const assert = require("node:assert");
const { app } = require("../server.js");

let server;
let base;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => server.close());

const post = (body) =>
  fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

test("GET /api/health informa los modos disponibles", async () => {
  const res = await fetch(`${base}/api/health`);
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(data.modes, ["word", "excel", "powerpoint", "pdf"]);
});

test("Pregunta de Word devuelve una respuesta", async () => {
  const res = await post({ mode: "word", question: "Redacta una carta formal" });
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.ok(data.answer.length > 20);
  assert.strictEqual(data.mode, "word");
});

test("Pregunta de Excel devuelve fórmula", async () => {
  const res = await post({ mode: "excel", question: "Fórmula aprobado si A2>=70" });
  const data = await res.json();
  assert.match(data.answer, /SI\(|IF\(/);
});

test("Pregunta vacía devuelve 400", async () => {
  const res = await post({ mode: "word", question: "   " });
  const data = await res.json();
  assert.strictEqual(res.status, 400);
  assert.strictEqual(data.code, "empty_question");
});

test("Modo inválido devuelve 400", async () => {
  const res = await post({ mode: "notepad", question: "hola" });
  assert.strictEqual(res.status, 400);
});

test("Pregunta demasiado larga devuelve 413", async () => {
  const res = await post({ mode: "word", question: "a".repeat(70000) });
  assert.strictEqual(res.status, 413);
});

test("JSON malformado devuelve 400", async () => {
  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{no es json",
  });
  assert.strictEqual(res.status, 400);
});

test("Historial inválido no rompe la petición", async () => {
  const res = await post({
    mode: "pdf",
    question: "Resume este texto: hola mundo",
    history: [{ role: "hacker", content: "x" }, null, { role: "user" }],
  });
  assert.strictEqual(res.status, 200);
});

test("Ruta de API inexistente devuelve 404 JSON", async () => {
  const res = await fetch(`${base}/api/desconocida`);
  assert.strictEqual(res.status, 404);
  const data = await res.json();
  assert.strictEqual(data.code, "not_found");
});

test("La página principal se sirve en /", async () => {
  const res = await fetch(`${base}/`);
  const html = await res.text();
  assert.strictEqual(res.status, 200);
  assert.match(html, /Office AI Assistant/);
});

test("La clave de API no aparece en el frontend", async () => {
  const files = ["/", "/app.js", "/styles.css"];
  for (const file of files) {
    const text = await (await fetch(base + file)).text();
    assert.doesNotMatch(text, /AIza[0-9A-Za-z_-]{20,}|sk-[A-Za-z0-9]{20,}/);
  }
});
