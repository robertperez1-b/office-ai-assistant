# ✨ Office AI Assistant

[![Licencia](https://img.shields.io/badge/licencia-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D%2018.0.0-brightgreen.svg)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/tests-11%2F11%20pass-success.svg)](tests/)

Plataforma inteligente de productividad ofimática y análisis documental con interfaz moderna de tres paneles (estilo **NotebookLM**). Integra asistencia especializada para **Microsoft Word, Excel, PowerPoint y análisis de PDFs/Documentos**, impulsada por modelos de lenguaje de última generación (Google Gemini, OpenAI, Anthropic y Groq).

> 📖 **¿Buscas el manual de usuario paso a paso?** Consulta el [**Manual de Usuario Completo**](MANUAL_DE_USUARIO.md) para aprender a usar cada herramienta, subir documentos y exportar reportes.

---

## 🌟 Características Principales

* **Diseño NotebookLM en 3 Paneles:**
  * **Panel de Fuentes (Izquierda):** Gestor documental con soporte multi-archivo (+10 formatos: PDF, Word `.docx`/`.doc`, Excel `.xlsx`/`.xls`/`.csv`, PowerPoint `.pptx`/`.ppt`, OpenDocument `.odt`, Texto `.txt`, Imágenes `.png`/`.jpg`).
  * **Lienzo de Chat (Centro):** Conversación fluida con renderizado Markdown enriquecido (bloques de código, tablas nativas, negritas, subtítulos), atajos de teclado y chips sugeridos.
  * **Studio de Herramientas y Exportación (Derecha):** Selector de perfiles de IA (Word, Excel, PowerPoint, PDF), acciones rápidas de análisis y bandeja de exportación multiformato.
* **Paneles Colapsables (Modo Enfoque):** Rieles laterales compactos de 52px que se ocultan y expanden con un solo clic.
* **Motor de IA Pedagógico:** En lugar de respuestas telegráficas o prefabricadas, la IA actúa como un consultor sénior que desglosa la lógica paso a paso, entrega fórmulas bilingües (Español / Inglés), explica errores comunes y sugiere mejores prácticas.
* **Exportación Profesional Multiformato:**
  * **Excel real (`.xlsx`):** Conversión directa de tablas a hojas de cálculo con auto-ajuste de columnas vía SheetJS.
  * **Word (`.doc`):** Descarga estructurada con formato editorial y estilos tipográficos.
  * **PDF e Impresión Limpia:** Estilos `@media print` dedicados que eliminan el dashboard, las fuentes y los botones, imprimiendo únicamente el documento con salto de página natural y soporte para orientación horizontal y vertical.
  * **Texto plano (`.txt`) y Copiado rápido al portapapeles.**
* **Seguridad y Privacidad:** La clave de la API reside únicamente en el servidor; nunca se expone al navegador web.
* **Modo Oscuro / Claro:** Detección de preferencia de sistema y conmutador manual persistente en `localStorage`.

---

## 🚀 Inicio Rápido (Local)

### Requisitos previos
* **Node.js** v18.0.0 o superior instalado.

### Instalación en 3 pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/robertperez1-b/office-ai-assistant.git
cd office-ai-assistant

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno y ejecutar
cp .env.example .env
npm start
```

Abre tu navegador en `http://localhost:3000`.

> **Nota:** Sin una clave de API configurada, la aplicación inicia en **Modo Demostración** con respuestas de ejemplo simuladas para probar la interfaz y los flujos de exportación.

---

## 🔑 Configuración de Proveedores de IA

Puedes obtener una clave gratuita en **Google AI Studio** o utilizar tu proveedor preferido configurando el archivo `.env`:

### Opción 1: Google Gemini (Recomendada y Gratuita)
1. Obtén tu clave en: [Google AI Studio](https://aistudio.google.com/apikey).
2. Configura tu `.env`:
   ```env
   AI_PROVIDER=gemini
   GEMINI_API_KEY=tu_clave_de_gemini
   GEMINI_MODEL=gemini-3.5-flash-lite
   ```

### Opción 2: OpenAI / Groq / Anthropic
```env
# OpenAI
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...

# Groq (Velocidad ultrarrápida, nivel gratuito)
AI_PROVIDER=groq
GROQ_API_KEY=gsk_...

# Anthropic Claude
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 📂 Arquitectura del Proyecto

```text
office-ai-assistant/
├── public/
│   ├── index.html          # Interfaz 3 paneles NotebookLM
│   ├── styles.css          # Estilos CSS modernos, modo oscuro e impresión limpia
│   └── app.js              # Lógica de cliente: extracción de archivos, SheetJS, chat
├── src/
│   ├── prompts.js          # Prompts especializados y pedagógicos por herramienta
│   └── ai.js               # Conector multimodelo (Gemini, OpenAI, Groq, Claude, Demo)
├── tests/
│   └── api.test.js         # Suite de pruebas automatizadas (11/11 tests)
├── MANUAL_DE_USUARIO.md    # Manual oficial y guía paso a paso para el usuario
├── server.js               # Servidor Express, seguridad, rate limiting y endpoints
├── vercel.json             # Manifiesto de despliegue para Vercel
├── .env.example            # Plantilla de variables de entorno
└── package.json            # Metadatos del proyecto y dependencias
```

---

## 🧪 Pruebas Automatizadas

El proyecto incluye pruebas unitarias y de integración que verifican las rutas del servidor, la validación de peticiones y la protección de credenciales:

```bash
npm test
```

Salida esperada:
```text
✔ GET /api/health informa los modos disponibles
✔ Pregunta de Word devuelve una respuesta
✔ Pregunta de Excel devuelve fórmula
✔ Pregunta vacía devuelve 400
✔ Modo inválido devuelve 400
✔ Pregunta demasiado larga devuelve 413
✔ JSON malformado devuelve 400
✔ Historial inválido no rompe la petición
✔ Ruta de API inexistente devuelve 404 JSON
✔ La página principal se sirve en /
✔ La clave de API no aparece en el frontend
# pass 11
# fail 0
```

---

## 🌐 Despliegue en la Nube

### Opción A: Render (Recomendado - Backend y Frontend juntos)
1. Conecta tu repositorio de GitHub en [Render.com](https://render.com).
2. Selecciona **Web Service**:
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
3. En la sección **Environment Variables**, añade:
   * `AI_PROVIDER` = `gemini`
   * `GEMINI_API_KEY` = *tu_clave_privada*
4. Haz clic en **Deploy Web Service**.

### Opción B: Vercel
El repositorio incluye el archivo [`vercel.json`](vercel.json) preconfigurado para serverless functions.
1. Importa el repositorio en [Vercel](https://vercel.com).
2. Añade `GEMINI_API_KEY` en los ajustes de variables de entorno del proyecto.
3. Despliega con un solo clic.

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.
