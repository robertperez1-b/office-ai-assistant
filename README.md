# ✨ Office AI Assistant

Aplicación web que permite seleccionar **Word, Excel, PowerPoint o PDF**, escribir una pregunta y recibir una respuesta especializada generada por inteligencia artificial.

El frontend es HTML + CSS + JavaScript puro; el backend Node.js/Express protege la clave de la API: **la clave nunca se envía al navegador**.

```text
Usuario → HTML/CSS/JS → /api/chat (tu backend) → API de IA → backend → usuario
```

---

## 1. Cómo ejecutarlo en tu computadora

Requisitos: Node.js 18 o superior.

```bash
cd office-ai-assistant
npm install
cp .env.example .env      # y coloca tu clave en .env
npm start                 # http://localhost:3000
```

Sin clave configurada la app arranca en **modo demostración**: la interfaz funciona completa, pero las respuestas son de ejemplo. Es útil para probar y hacer capturas sin gastar cuota.

### Conseguir una clave (opción gratuita)

**Google Gemini** — https://aistudio.google.com/apikey → crear clave gratis.

En `.env`:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=tu_clave_privada
```

Otras opciones: `openai`, `groq` (nivel gratuito), `anthropic`.
Si dejas `AI_PROVIDER` vacío, el backend detecta el proveedor según la clave que encuentre.

---

## 2. Estructura del proyecto

```text
office-ai-assistant/
├── public/
│   ├── index.html        # Interfaz (selector, pregunta, respuesta)
│   ├── styles.css        # Estilos, modo oscuro y diseño adaptable
│   └── app.js            # Lógica del cliente: fetch, estados, copiar, descargar
├── src/
│   ├── prompts.js        # Instrucciones especializadas por herramienta
│   └── ai.js             # Cliente de IA (Gemini / OpenAI / Groq / Anthropic / demo)
├── tests/
│   └── api.test.js       # Pruebas automáticas del backend
├── server.js             # Servidor Express: /api/chat, /api/health, validación
├── .env.example          # Plantilla de variables de entorno
├── .gitignore            # Excluye node_modules y .env
├── vercel.json           # Configuración para desplegar en Vercel
└── package.json
```

---

## 3. API del backend

### `POST /api/chat`

```json
{
  "mode": "excel",
  "question": "Genera una fórmula para calcular el promedio",
  "history": [{ "role": "user", "content": "..." }]
}
```

Respuesta correcta:

```json
{ "answer": "## Fórmula ...", "mode": "excel", "provider": "gemini", "demo": false }
```

Respuesta de error (siempre con mensaje comprensible y sin detalles técnicos):

| Código | `code` | Mensaje al usuario |
|---|---|---|
| 400 | `empty_question` | Por favor, escribe una pregunta antes de continuar. |
| 400 | `invalid_mode` | Selecciona una herramienta válida… |
| 400 | `bad_json` | La solicitud no tiene un formato válido. |
| 413 | `too_long` | La pregunta es demasiado larga… |
| 429 | `rate_limit` | El servicio alcanzó temporalmente su límite de solicitudes… |
| 502 / 504 | `auth`, `timeout`, `network` | Mensajes genéricos y seguros |
| 500 | `server_error` | Ocurrió un error al generar la respuesta. |

### `GET /api/health`

Devuelve el proveedor activo y los modos disponibles. El frontend lo usa para mostrar la etiqueta «modo demostración».

---

## 4. Funciones incluidas

**Esenciales**
- Campo de pregunta con contador de caracteres (máx. 8000) y validación de vacío.
- Selector Word / Excel / PowerPoint / PDF con color propio por herramienta (y navegación con flechas del teclado).
- Botón «Generar respuesta» con indicador de carga animado (esqueleto + puntos).
- Área de respuesta con formato Markdown (títulos, listas, tablas, bloques de código).
- Mensajes de error claros para pregunta vacía, timeout, límite de API, error de conexión y error de servidor.
- Botón **Copiar** (con alternativa para navegadores sin permiso de portapapeles).
- Botón **Limpiar** conversación.
- Diseño adaptable: móvil, tablet y computadora.

**Opcionales implementados**
- Ejemplos de preguntas por herramienta (chips clicables).
- Descargar la respuesta como `.txt`.
- Modo oscuro (respeta la preferencia del sistema y se recuerda).
- Historial de conversación enviado al backend para dar continuidad (últimos 8 mensajes).
- Botón «Generar respuesta» se desactiva durante la solicitud y se bloquean duplicados.
- `Ctrl + Enter` / `Cmd + Enter` para enviar.
- Límite de solicitudes por IP (12/min por defecto) y timeout de 45 s en el servidor.

**Pendiente para una segunda versión:** subir archivos PDF y extraer su texto, exportar la respuesta a PDF, inicio de sesión e historial persistente en base de datos.

---

## 5. Pruebas

```bash
npm test
```

Cubre: health, respuesta por modo, pregunta vacía, modo inválido, pregunta demasiado larga, JSON malformado, historial corrupto, ruta inexistente, entrega de la página y **verificación de que no se filtra ninguna clave al frontend**.

Prueba manual rápida: abre la app, envía una pregunta por cada herramienta, prueba con el campo vacío, presiona varias veces el botón (no debe duplicar solicitudes), copia y descarga la respuesta, y cambia el tamaño de la ventana a 375 px de ancho.

---

## 6. Despliegue

### Opción recomendada: Render (backend + frontend juntos)

1. Sube el proyecto a GitHub (verifica que `.env` **no** esté en el repositorio).
2. En Render: *New → Web Service* → conecta el repositorio.
3. Configuración:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment Variables:** `GEMINI_API_KEY` (o la de tu proveedor) y `AI_PROVIDER=gemini`
4. Deploy. La URL pública queda lista; el frontend se sirve desde `public/` y la API desde el mismo dominio.

### Opción Vercel

El proyecto incluye `vercel.json`. Importa el repositorio, agrega `GEMINI_API_KEY` en *Settings → Environment Variables* y despliega. El frontend estático se sirve desde `public/` y `/api/chat` corre como función serverless (`server.js`).

### Opción Railway

*New Project → Deploy from GitHub*, agrega las variables de entorno y Railway detecta `npm start` automáticamente. El puerto se toma de `process.env.PORT`.

> ⚠️ **Nunca** pongas la clave en `public/app.js` ni la subas en `.env`. `.gitignore` ya excluye `.env`, `node_modules` y `.vercel`.

---

## 7. Criterios del MVP

| Criterio | Estado |
|---|---|
| La interfaz funciona en computadora y móvil | ✅ |
| El usuario puede seleccionar una herramienta | ✅ |
| No se permiten preguntas vacías | ✅ |
| La consulta llega correctamente al backend | ✅ |
| El backend se conecta a la API de IA | ✅ (configurando la clave) |
| La respuesta se muestra en pantalla | ✅ |
| Los errores se comunican claramente | ✅ |
| La clave de API no está expuesta | ✅ |
| URL pública | ⏳ pendiente: haz el despliegue con los pasos de la sección 6 |

---

## 8. Variables de entorno

| Variable | Descripción | Por defecto |
|---|---|---|
| `AI_PROVIDER` | `gemini`, `openai`, `groq`, `anthropic` o `demo` | autodetectado |
| `GEMINI_API_KEY` / `OPENAI_API_KEY` / `GROQ_API_KEY` / `ANTHROPIC_API_KEY` | Claves privadas | — |
| `GEMINI_MODEL` | Modelo de Gemini | `gemini-2.0-flash` |
| `PORT` | Puerto del servidor | `3000` |
| `MAX_QUESTION_CHARS` | Longitud máxima de la pregunta | `8000` |
| `AI_TIMEOUT_MS` | Tiempo máximo de espera a la IA | `45000` |
| `RATE_LIMIT_PER_MINUTE` | Solicitudes por IP por minuto | `12` |

Hecho con HTML, CSS, JavaScript, Node.js y Express. Licencia MIT.
