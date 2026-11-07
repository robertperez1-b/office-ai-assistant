/* ===========================================================
   Office AI Assistant — Lógica del Cliente (NotebookLM Style)
   =========================================================== */

(() => {
  "use strict";

  /* ------------------------------- Constantes ------------------------------ */
  const MAX_CHARS = 60000;
  const REQUEST_TIMEOUT_MS = 60000;

  const EXAMPLES = {
    word: [
      "Redacta una carta formal solicitando una reunión ejecutiva.",
      "Corrige la gramática y el tono de este fragmento: [pega tu texto]",
      "Resume este texto en tres conclusiones clave: [pega tu texto]",
    ],
    excel: [
      "Fórmula que muestre «Aprobado» si A2 es mayor o igual a 70.",
      "¿Cómo sumar solo las ventas mayores a 1000 en la columna C?",
      "Crea una fórmula BUSCARX para obtener el precio según el código.",
    ],
    powerpoint: [
      "Estructura una presentación de 6 diapositivas sobre Inteligencia Artificial.",
      "Guion de 5 diapositivas para presentar métricas de ventas trimestrales.",
      "Convierte este temario en títulos y viñetas para diapositivas: [pega texto]",
    ],
    pdf: [
      "Resume exhaustivamente el contenido del PDF adjunto.",
      "Extrae las ideas principales, fechas y cifras más importantes.",
      "¿Cuáles son las conclusiones y recomendaciones del documento?",
    ],
  };

  const MODE_NAMES = {
    word: "Word",
    excel: "Excel",
    powerpoint: "PowerPoint",
    pdf: "PDF"
  };

  /* --------------------------------- Estado -------------------------------- */
  const state = {
    mode: "word",
    loading: false,
    lastAnswer: "",
    lastQuestion: "",
    history: [],
    controller: null,
    sources: [], // Array de fuentes multiformato: { id, name, ext, type, size, meta, text }
  };

  /* -------------------------------- Elementos ------------------------------ */
  const $ = (id) => document.getElementById(id);
  const els = {
    body: document.body,

    // Barra superior
    themeBtn: $("themeBtn"),
    clearBtn: $("clearBtn"),
    mobileToggleLeft: $("mobileToggleLeft"),
    mobileToggleRight: $("mobileToggleRight"),

    // Panel izquierdo (Fuentes)
    panelLeft: $("panelLeft"),
    toggleLeftBtn: $("toggleLeftBtn"),
    pdfFileInput: $("pdfFileInput"),
    addSourceBtn: $("addSourceBtn"),
    emptyAddLink: $("emptyAddLink"),
    pdfDropzone: $("pdfDropzone"),
    sourceList: $("sourceList"),
    sourceEmpty: $("sourceEmpty"),
    sourcesCounterBadge: $("sourcesCounterBadge"),
    clearSourcesBtn: $("clearSourcesBtn"),

    // Panel central (Lienzo / Chat)
    centerPane: $("centerPane"),
    chatWelcome: $("chatWelcome"),
    output: $("output"),
    pregunta: $("pregunta"),
    sendBtn: $("sendBtn"),
    examples: $("examples"),
    counter: $("counter"),
    welcomeChips: Array.from(document.querySelectorAll(".welcome-chip")),

    // Panel derecho (Studio)
    panelRight: $("panelRight"),
    toggleRightBtn: $("toggleRightBtn"),
    modeButtons: Array.from(document.querySelectorAll(".mode-card")),
    pdfQuickSection: $("pdfQuickSection"),
    chipSummarizePdf: $("chipSummarizePdf"),
    chipKeyPointsPdf: $("chipKeyPointsPdf"),
    chipConvertToWord: $("chipConvertToWord"),
    chipConvertToTxt: $("chipConvertToTxt"),
    exportPdfBtn: $("exportPdfBtn"),
    exportWordBtn: $("exportWordBtn"),
    exportExcelBtn: $("exportExcelBtn"),
    downloadBtn: $("downloadBtn"),
    copyBtn: $("copyBtn"),
    printBtn: $("printBtn"),
    providerBadge: $("providerBadge"),

    // Notificaciones
    toast: $("toast"),
  };

  // Configurar worker de PDF.js
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }

  /* ------------------------------ Persistencia ----------------------------- */
  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem(key);
        return v === null ? fallback : v;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch {}
    },
  };

  /* --------------------------------- Utilidades ---------------------------- */
  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  let toastTimer = null;
  function toast(message, isError = false) {
    els.toast.textContent = message;
    els.toast.classList.toggle("error", isError);
    els.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove("show"), 3000);
  }

  /**
   * Renderizador de Markdown simple y seguro
   */
  function renderMarkdown(markdown) {
    if (!markdown) return "";

    const blocks = [];
    let text = String(markdown).replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
      const idx = blocks.push(`<pre><code>${escapeHTML(code.replace(/\n$/, ""))}</code></pre>`) - 1;
      return `\u0000BLOCK${idx}\u0000`;
    });

    text = escapeHTML(text);

    const lines = text.split("\n");
    const out = [];
    let listType = null;
    let inTable = false;
    let inQuote = false;

    const closeList = () => {
      if (listType) {
        out.push(`</${listType}>`);
        listType = null;
      }
    };
    const closeTable = () => {
      if (inTable) {
        out.push("</tbody></table>");
        inTable = false;
      }
    };
    const closeQuote = () => {
      if (inQuote) {
        out.push("</blockquote>");
        inQuote = false;
      }
    };
    const closeAll = () => {
      closeList();
      closeTable();
      closeQuote();
    };

    const inline = (s) =>
      s
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/(^|[\s(])__([^_]+)__/g, "$1<strong>$2</strong>")
        .replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<em>$2</em>")
        .replace(/(^|[\s(])_([^_\n]+)_/g, "$1<em>$2</em>")
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        .replace(/\u0000BLOCK(\d+)\u0000/g, (_, i) => blocks[Number(i)] ?? "");

    const splitRow = (line) =>
      line.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) { closeAll(); continue; }

      if (/^\u0000BLOCK\d+\u0000$/.test(line)) {
        closeAll();
        out.push(line.replace(/\u0000BLOCK(\d+)\u0000/g, (_, n) => blocks[Number(n)] ?? ""));
        continue;
      }

      const h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) {
        closeAll();
        const level = Math.min(Math.max(h[1].length + 1, 2), 4);
        out.push(`<h${level}>${inline(h[2])}</h${level}>`);
        continue;
      }

      if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
        closeAll();
        out.push("<hr>");
        continue;
      }

      // Tablas
      if (line.includes("|") && /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test((lines[i + 1] || "").trim())) {
        closeAll();
        const header = splitRow(line);
        out.push('<div class="table-container"><table><thead><tr>' + header.map((c) => `<th>${inline(c)}</th>`).join("") + "</tr></thead><tbody>");
        inTable = true;
        i++;
        continue;
      }
      if (inTable && line.includes("|")) {
        const cells = splitRow(line);
        out.push("<tr>" + cells.map((c) => `<td>${inline(c)}</td>`).join("") + "</tr>");
        continue;
      }
      if (inTable) closeTable();

      // Citas
      if (/^(?:>|&gt;)\s?/.test(line)) {
        closeList();
        if (!inQuote) { out.push("<blockquote>"); inQuote = true; }
        out.push(`<p>${inline(line.replace(/^(?:>|&gt;)\s?/, ""))}</p>`);
        continue;
      }
      closeQuote();

      // Listas
      const ul = line.match(/^[-*+]\s+(.*)$/);
      const ol = line.match(/^(\d+)[.)]\s+(.*)$/);
      if (ul) {
        if (listType !== "ul") { closeList(); out.push("<ul>"); listType = "ul"; }
        out.push(`<li>${inline(ul[1])}</li>`);
        continue;
      }
      if (ol) {
        if (listType !== "ol") { closeList(); out.push("<ol>"); listType = "ol"; }
        out.push(`<li>${inline(ol[2])}</li>`);
        continue;
      }
      closeList();

      out.push(`<p>${inline(line)}</p>`);
    }
    closeAll();

    return `<div class="md">${out.join("")}</div>`;
  }

  /* ----------------------------- Actualización UI -------------------------- */
  function showWelcome() {
    els.chatWelcome.hidden = false;
    els.output.hidden = true;
    els.output.innerHTML = "";
  }

  function showLoading() {
    els.chatWelcome.hidden = true;
    els.output.hidden = false;
    els.output.setAttribute("aria-busy", "true");
    els.output.innerHTML = `
      <div class="loading-box">
        <div class="loading-text">
          Generando respuesta con ${escapeHTML(MODE_NAMES[state.mode])}
          <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
        </div>
        <div class="skeleton" aria-hidden="true">
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
        </div>
      </div>
    `;
  }

  function showError(message) {
    els.chatWelcome.hidden = true;
    els.output.hidden = false;
    els.output.setAttribute("aria-busy", "false");
    els.output.innerHTML = `
      <div class="notice" role="alert">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <div>
          <strong>Error al generar respuesta</strong>
          <p>${escapeHTML(message)}</p>
        </div>
      </div>
    `;
  }

  function showAnswer(text, provider) {
    els.chatWelcome.hidden = true;
    els.output.hidden = false;
    els.output.setAttribute("aria-busy", "false");
    els.output.innerHTML = renderMarkdown(text);
    els.output.scrollTop = 0;

    if (provider) {
      els.providerBadge.hidden = false;
      els.providerBadge.textContent = provider === "demo" ? "modo demo" : provider;
      els.providerBadge.classList.toggle("demo", provider === "demo");
    }
  }

  function updateActionButtons() {
    const hasAnswer = Boolean(state.lastAnswer);
    const hasSources = state.sources.length > 0;
    const hasQuestion = Boolean(els.pregunta.value.trim());

    els.copyBtn.disabled = !hasAnswer || state.loading;
    els.exportPdfBtn.disabled = !hasAnswer || state.loading;
    els.exportWordBtn.disabled = !hasAnswer || state.loading;
    els.exportExcelBtn.disabled = !hasAnswer || state.loading;
    els.downloadBtn.disabled = !hasAnswer || state.loading;
    els.printBtn.disabled = !hasAnswer || state.loading;

    els.clearBtn.disabled = state.loading || (!hasAnswer && !hasQuestion && !hasSources);
  }

  function setLoading(isLoading) {
    state.loading = isLoading;
    els.sendBtn.disabled = isLoading;
    els.sendBtn.classList.toggle("loading", isLoading);
    els.pregunta.setAttribute("aria-busy", String(isLoading));
    els.modeButtons.forEach((b) => { b.disabled = isLoading; });
    updateActionButtons();
  }

  function updateCounter() {
    const len = els.pregunta.value.length;
    els.counter.textContent = `${len} / ${MAX_CHARS}`;
    els.counter.classList.toggle("over", len > MAX_CHARS * 0.95);
  }

  /* ------------------------------- Selección ------------------------------- */
  function selectMode(mode, { focus = false, announce = true } = {}) {
    if (!MODE_NAMES[mode]) return;
    state.mode = mode;
    els.body.dataset.mode = mode;

    els.modeButtons.forEach((btn) => {
      const active = btn.dataset.mode === mode;
      btn.setAttribute("aria-checked", String(active));
      btn.tabIndex = active ? 0 : -1;
      if (active && focus) btn.focus();
    });

    // Sincronizar estado activo en el riel colapsado de herramientas
    document.querySelectorAll("[data-rail-mode]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.railMode === mode);
    });

    renderExamples();
    els.pregunta.placeholder = {
      word: "Haz una pregunta para redactar o corregir textos con Word…",
      excel: "Pide fórmulas, funciones o análisis para Excel…",
      powerpoint: "Solicita un esquema de diapositivas para PowerPoint…",
      pdf: state.sources.length > 0 
        ? `Pregunta sobre tus fuentes cargadas (${state.sources.length}) o pide un resumen…`
        : "Haz una pregunta o añade documentos en la barra izquierda para analizarlos…",
    }[mode];

    store.set("oaa:mode", mode);
    if (announce) toast(`Modo: ${MODE_NAMES[mode]}`);
  }

  function renderExamples() {
    const list = EXAMPLES[state.mode] || [];
    els.examples.innerHTML = '<span class="examples-label">Sugerencias:</span>';
    list.forEach((example) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.textContent = example.length > 46 ? example.slice(0, 46) + "…" : example;
      chip.title = example;
      chip.addEventListener("click", () => {
        els.pregunta.value = example;
        updateCounter();
        els.pregunta.focus();
        updateActionButtons();
      });
      els.examples.appendChild(chip);
    });
  }

  /* ------------------- Procesamiento Multiformato (+10 Fuentes) ------------------- */
  function getFileType(filename) {
    const ext = filename.split(".").pop().toLowerCase();
    if (ext === "pdf") return { type: "pdf", badge: "PDF", class: "pdf" };
    if (["docx", "doc", "odt"].includes(ext)) return { type: "word", badge: ext.toUpperCase(), class: "word" };
    if (["xlsx", "xls", "csv"].includes(ext)) return { type: "excel", badge: ext.toUpperCase(), class: "excel" };
    if (["pptx", "ppt"].includes(ext)) return { type: "ppt", badge: ext.toUpperCase(), class: "ppt" };
    if (["png", "jpg", "jpeg"].includes(ext)) return { type: "image", badge: "IMG", class: "image" };
    if (["txt", "md", "json", "log"].includes(ext)) return { type: "text", badge: "TXT", class: "text" };
    return { type: "doc", badge: ext.slice(0, 4).toUpperCase(), class: "word" };
  }

  function formatFileSize(bytes) {
    if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  }

  async function parseSourceFile(file) {
    const ext = file.name.split(".").pop().toLowerCase();
    const info = getFileType(file.name);
    const sizeFormatted = formatFileSize(file.size);

    let extractedText = "";
    let meta = sizeFormatted;

    // 1. PDF vía PDF.js
    if (ext === "pdf") {
      if (!window.pdfjsLib) throw new Error("PDF.js no disponible.");
      const buffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
      const pages = pdf.numPages;
      let text = "";
      for (let i = 1; i <= pages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const str = content.items.map((it) => it.str).join(" ");
        if (str.trim()) text += `[Página ${i}]\n${str.trim()}\n\n`;
      }
      extractedText = text.trim();
      const words = extractedText ? extractedText.split(/\s+/).length : 0;
      meta = `${pages} págs · ${words.toLocaleString("es")} palabras · ${sizeFormatted}`;
    }
    // 2. Word (.docx) vía Mammoth.js
    else if (ext === "docx" && window.mammoth) {
      const buffer = await file.arrayBuffer();
      const res = await window.mammoth.extractRawText({ arrayBuffer: buffer });
      extractedText = res.value.trim();
      const words = extractedText ? extractedText.split(/\s+/).length : 0;
      meta = `${words.toLocaleString("es")} palabras · ${sizeFormatted}`;
    }
    // 3. Excel (.xlsx, .xls, .csv) vía SheetJS
    else if (["xlsx", "xls", "csv"].includes(ext) && window.XLSX) {
      const buffer = await file.arrayBuffer();
      const wb = window.XLSX.read(buffer, { type: "array" });
      let sheetText = "";
      wb.SheetNames.forEach((name) => {
        const ws = wb.Sheets[name];
        const csv = window.XLSX.utils.sheet_to_csv(ws);
        if (csv.trim()) sheetText += `[Hoja: ${name}]\n${csv.trim()}\n\n`;
      });
      extractedText = sheetText.trim();
      meta = `${wb.SheetNames.length} hoja(s) · ${sizeFormatted}`;
    }
    // 4. Archivos de texto plano (.txt, .csv sin xlsx)
    else if (["txt", "csv", "json", "md"].includes(ext)) {
      extractedText = await file.text();
      const words = extractedText ? extractedText.split(/\s+/).length : 0;
      meta = `${words.toLocaleString("es")} palabras · ${sizeFormatted}`;
    }
    // 5. Imágenes (.png, .jpg, .jpeg)
    else if (["png", "jpg", "jpeg"].includes(ext)) {
      extractedText = `[IMAGEN ADJUNTA: ${file.name} (${sizeFormatted}, formato ${ext.toUpperCase()})]`;
      meta = `Imagen · ${sizeFormatted}`;
    }
    // 6. Formatos adicionales (pptx, doc, odt)
    else {
      try {
        const text = await file.text();
        extractedText = text.slice(0, 50000);
        meta = `Documento · ${sizeFormatted}`;
      } catch {
        extractedText = `[DOCUMENTO: ${file.name}]`;
        meta = sizeFormatted;
      }
    }

    return {
      id: "src_" + Math.random().toString(36).substring(2, 9),
      name: file.name,
      ext,
      type: info.type,
      badge: info.badge,
      badgeClass: info.class,
      size: sizeFormatted,
      meta,
      text: extractedText,
    };
  }

  async function processIncomingFiles(fileList) {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    toast(`Procesando ${files.length} archivo(s)…`);

    let loadedCount = 0;
    for (const file of files) {
      try {
        const parsed = await parseSourceFile(file);
        // Evitar duplicados con el mismo nombre y tamaño
        const existingIdx = state.sources.findIndex((s) => s.name === parsed.name && s.size === parsed.size);
        if (existingIdx >= 0) {
          state.sources[existingIdx] = parsed;
        } else {
          state.sources.push(parsed);
        }
        loadedCount++;
      } catch (err) {
        console.error(`Error al procesar ${file.name}:`, err);
      }
    }

    renderSources();
    updateActionButtons();

    if (loadedCount > 0) {
      toast(`${loadedCount} fuente(s) agregada(s) correctamente.`);
    } else {
      toast("No se pudo procesar ningún archivo.", true);
    }
  }

  function renderSources() {
    const count = state.sources.length;

    // Actualizar indicador en el riel colapsado
    const railCounter = $("railSourcesCount");
    if (railCounter) {
      railCounter.hidden = count === 0;
      railCounter.textContent = count;
    }

    if (count === 0) {
      els.sourceList.innerHTML = "";
      els.sourceEmpty.hidden = false;
      els.sourcesCounterBadge.hidden = true;
      els.clearSourcesBtn.hidden = true;
      els.pdfQuickSection.hidden = true;
      return;
    }

    els.sourceEmpty.hidden = true;
    els.sourcesCounterBadge.hidden = false;
    els.sourcesCounterBadge.textContent = count;
    els.clearSourcesBtn.hidden = false;
    els.pdfQuickSection.hidden = false;

    // Renderizar tarjetas de cada fuente en el panel izquierdo
    els.sourceList.innerHTML = state.sources
      .map(
        (src) => `
        <div class="source-card" data-id="${src.id}">
          <div class="source-card-badge ${src.badgeClass}">${src.badge}</div>
          <div class="source-card-meta">
            <div class="source-card-title" title="${escapeHTML(src.name)}">${escapeHTML(src.name)}</div>
            <div class="source-card-sub">${escapeHTML(src.meta)}</div>
          </div>
          <button type="button" class="source-card-del" data-del="${src.id}" title="Quitar este documento">×</button>
        </div>
      `
      )
      .join("");

    // Asignar eventos de eliminación individual
    els.sourceList.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        removeSource(btn.dataset.del);
      });
    });
  }

  function removeSource(id) {
    state.sources = state.sources.filter((s) => s.id !== id);
    renderSources();
    toast("Fuente eliminada.");
    updateActionButtons();
  }

  function clearAllSources() {
    state.sources = [];
    if (els.pdfFileInput) els.pdfFileInput.value = "";
    renderSources();
    toast("Todas las fuentes han sido removidas.");
    updateActionButtons();
  }

  /* ----------------------------- Envío y Chat ------------------------------ */
  async function generateWithPrompt(customPrompt) {
    if (state.loading) return;
    const promptToSend = customPrompt || els.pregunta.value.trim();

    if (!promptToSend && state.sources.length === 0) {
      els.pregunta.focus();
      toast("Escribe una consulta o añade fuentes antes de continuar.", true);
      return;
    }

    // Si hay fuentes pero no se escribió pregunta, generar un análisis global estructurado
    const finalPrompt =
      promptToSend ||
      "Resume de forma clara y exhaustiva el contenido de las fuentes adjuntas, destacando ideas principales, datos y conclusiones.";

    // Limpiar el campo de entrada inmediatamente para dejarlo despejado
    els.pregunta.value = "";
    updateCounter();

    // Construir contexto con todas las fuentes cargadas (+10 fuentes soportadas)
    let payloadQuestion = finalPrompt;
    if (state.sources.length > 0) {
      let sourcesContext = `[FUENTES ADJUNTAS: ${state.sources.length} documento(s) disponible(s)]\n\n`;
      state.sources.forEach((src, idx) => {
        sourcesContext += `--- DOCUMENTO ${idx + 1}: "${src.name}" (${src.badge}, ${src.meta}) ---\n${src.text}\n\n`;
      });
      payloadQuestion = `${sourcesContext}SOLICITUD DEL USUARIO:\n${finalPrompt}`;
    }

    if (payloadQuestion.length > 60000) {
      showError(`El contenido total de las fuentes supera el límite permitido (${payloadQuestion.length} caracteres). Reduce el número o tamaño de documentos.`);
      return;
    }

    setLoading(true);
    showLoading();

    state.controller = new AbortController();
    const timeoutId = setTimeout(() => state.controller?.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: state.controller.signal,
        body: JSON.stringify({
          mode: state.mode,
          question: payloadQuestion,
          history: state.history,
        }),
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        showError(data?.error || "Ocurrió un error al generar la respuesta.");
        toast("Error en la solicitud.", true);
        return;
      }

      const answer = (data?.answer || "").trim();
      if (!answer) {
        showError("La IA no devolvió contenido. Intenta reformular tu consulta.");
        return;
      }

      state.lastAnswer = answer;
      state.lastQuestion = finalPrompt;
      state.history = [
        ...state.history,
        { role: "user", content: finalPrompt },
        { role: "assistant", content: answer },
      ].slice(-8);

      showAnswer(answer, data.provider);

      if (data.demo) {
        toast("Modo demostración: agrega tu API key en .env para respuestas en vivo.");
      }
    } catch (err) {
      if (err?.name === "AbortError") {
        showError("La solicitud tardó más de lo esperado. Por favor reintenta.");
      } else {
        showError("No se pudo conectar con el servidor local. Verifica que la app esté corriendo.");
      }
    } finally {
      clearTimeout(timeoutId);
      state.controller = null;
      setLoading(false);
      updateActionButtons();
    }
  }

  async function generate() {
    let userQuestion = els.pregunta.value.trim();
    if (state.sources.length > 0 && !userQuestion) {
      userQuestion = "Resume de forma exhaustiva los documentos adjuntos, destacando conclusiones e ideas principales.";
    }
    await generateWithPrompt(userQuestion);
  }

  /* ------------------------------- Exportaciones --------------------------- */
  async function copyAnswer() {
    if (!state.lastAnswer) return;
    try {
      await navigator.clipboard.writeText(state.lastAnswer);
      toast("Respuesta copiada al portapapeles.");
    } catch {
      toast("No se pudo copiar automáticamente.", true);
    }
  }

  function exportToPDF() {
    if (!state.lastAnswer) return;
    const element = els.output.querySelector(".md");
    if (!element) return;

    if (window.html2pdf) {
      toast("Generando archivo PDF…");
      const opt = {
        margin: [12, 12, 12, 12],
        filename: `office-ai-${state.mode}-${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      const wrapper = document.createElement("div");
      wrapper.style.fontFamily = "'Segoe UI', Arial, sans-serif";
      wrapper.style.color = "#111827";
      wrapper.style.padding = "8px";
      wrapper.innerHTML = `
        <div style="border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 16px;">
          <h2 style="margin: 0; color: #2563eb;">Office AI Assistant</h2>
          <p style="margin: 4px 0 0; font-size: 11px; color: #6b7280;">
            Modo: ${MODE_NAMES[state.mode]} | Fecha: ${new Date().toLocaleString("es")}
          </p>
        </div>
        <div>${element.innerHTML}</div>
      `;

      window.html2pdf().set(opt).from(wrapper).save()
        .then(() => toast("PDF descargado correctamente."))
        .catch(() => window.print());
    } else {
      window.print();
    }
  }

  function exportToWord(customHtml, customFilename) {
    const contentHtml = customHtml || els.output.querySelector(".md")?.innerHTML;
    if (!contentHtml && !state.lastAnswer) return;

    const filename = customFilename || `office-ai-${state.mode}-${new Date().toISOString().slice(0, 10)}.doc`;

    const wordTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:w="urn:schemas-microsoft-com:office:word" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>Documento Office AI</title>
        <style>
          body { font-family: 'Calibri', Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #1f2937; }
          h1, h2, h3 { color: #1e40af; font-weight: bold; margin-top: 14pt; margin-bottom: 6pt; }
          table { border-collapse: collapse; width: 100%; margin: 12pt 0; }
          th, td { border: 1px solid #94a3b8; padding: 6pt 8pt; text-align: left; vertical-align: top; }
          th { background-color: #f1f5f9; font-weight: bold; color: #0f172a; }
          code, pre { font-family: 'Consolas', monospace; background-color: #f8fafc; padding: 4pt; border: 1px solid #e2e8f0; }
          ul, ol { margin-left: 20pt; }
          blockquote { border-left: 3pt solid #2563eb; background: #f8fafc; padding-left: 10pt; margin: 8pt 0; color: #334155; }
        </style>
      </head>
      <body>
        <div style="border-bottom: 2pt solid #2563eb; padding-bottom: 8pt; margin-bottom: 14pt;">
          <h2 style="margin: 0; color: #2563eb;">Office AI Assistant — ${MODE_NAMES[state.mode]}</h2>
          <p style="margin: 4pt 0 0; font-size: 9pt; color: #64748b;">${new Date().toLocaleString("es")}</p>
        </div>
        ${contentHtml || state.lastAnswer}
      </body>
      </html>
    `;

    const blob = new Blob(["\ufeff" + wordTemplate], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(`Word descargado (${filename}).`);
  }

  function exportToExcel() {
    if (!state.lastAnswer) return;

    const tables = els.output.querySelectorAll("table");
    const filename = `office-ai-datos-${state.mode}-${new Date().toISOString().slice(0, 10)}.xlsx`;

    // 1. Exportación oficial con SheetJS (genera archivos nativos .xlsx de Microsoft Excel)
    if (window.XLSX) {
      const wb = window.XLSX.utils.book_new();

      if (tables.length > 0) {
        // Exportar cada tabla HTML encontrada a hojas reales de Excel
        tables.forEach((table, tIdx) => {
          const sheetName = tables.length === 1 ? "Datos" : `Tabla ${tIdx + 1}`;
          const ws = window.XLSX.utils.table_to_sheet(table, { raw: false });

          // Auto-ajustar ancho de columnas para que no se corten los textos
          const range = window.XLSX.utils.decode_range(ws["!ref"] || "A1");
          const cols = [];
          for (let C = range.s.c; C <= range.e.c; ++C) {
            let maxLen = 12;
            for (let R = range.s.r; R <= range.e.r; ++R) {
              const cell = ws[window.XLSX.utils.encode_cell({ r: R, c: C })];
              if (cell && cell.v) {
                const len = String(cell.v).length;
                if (len > maxLen) maxLen = Math.min(len + 2, 50);
              }
            }
            cols.push({ wch: maxLen });
          }
          ws["!cols"] = cols;

          window.XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
        });

        window.XLSX.writeFile(wb, filename);
        toast(`Libro Excel (.xlsx) con ${tables.length} tabla(s) descargado correctamente.`);
        return;
      } else {
        // Si no hay tabla HTML, estructurar los puntos clave en filas de Excel
        const lines = state.lastAnswer.split("\n");
        const rows = [["Contenido", "Detalle"]];
        lines.forEach((l) => {
          const clean = l.replace(/^[*-]\s+/, "").trim();
          if (clean) {
            if (clean.includes(":") || clean.includes("|") || clean.includes(";")) {
              const parts = clean.split(/[:|;]/).map((p) => p.trim());
              rows.push(parts);
            } else {
              rows.push([clean]);
            }
          }
        });

        const ws = window.XLSX.utils.aoa_to_sheet(rows);
        ws["!cols"] = [{ wch: 30 }, { wch: 60 }, { wch: 30 }];
        window.XLSX.utils.book_append_sheet(wb, ws, "Resumen");
        window.XLSX.writeFile(wb, filename);
        toast("Archivo Excel (.xlsx) estructurado descargado.");
        return;
      }
    }

    // 2. Fallback CSV
    let csvContent = "";
    if (tables.length > 0) {
      tables.forEach((table, tIdx) => {
        if (tIdx > 0) csvContent += "\r\n\r\n";
        const rows = table.querySelectorAll("tr");
        rows.forEach((row) => {
          const cells = Array.from(row.querySelectorAll("th, td")).map((c) => {
            let val = c.textContent.trim().replace(/"/g, '""');
            return `"${val}"`;
          });
          csvContent += cells.join(";") + "\r\n";
        });
      });
    }

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `office-ai-datos-${state.mode}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Archivo Excel descargado.");
  }

  function downloadAnswer() {
    if (!state.lastAnswer) return;
    const header =
      `Office AI Assistant — ${MODE_NAMES[state.mode]}\n` +
      `Fecha: ${new Date().toLocaleString("es")}\n` +
      `Pregunta: ${state.lastQuestion}\n` +
      `${"=".repeat(50)}\n\n`;

    const blob = new Blob([header + state.lastAnswer + "\n"], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `office-ai-${state.mode}-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Archivo .txt descargado.");
  }

  function convertSourcesToWord() {
    if (state.sources.length === 0) {
      toast("Añade primero una o más fuentes.", true);
      return;
    }
    const combinedHtml = state.sources
      .map(
        (s) =>
          `<h2>Fuente: ${escapeHTML(s.name)}</h2>` +
          s.text
            .split("\n\n")
            .map((p) => `<p>${escapeHTML(p).replace(/\n/g, "<br>")}</p>`)
            .join("")
      )
      .join("<hr/>");
    exportToWord(combinedHtml, `fuentes-convertidas-${new Date().toISOString().slice(0, 10)}.doc`);
  }

  function convertSourcesToTxt() {
    if (state.sources.length === 0) {
      toast("Añade primero una o más fuentes.", true);
      return;
    }
    const combinedTxt = state.sources
      .map((s) => `=== FUENTE: ${s.name} (${s.badge}) ===\n\n${s.text}\n\n`)
      .join("=".repeat(40) + "\n\n");
    const blob = new Blob([combinedTxt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fuentes-convertidas-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Archivo .txt con todas las fuentes descargado.");
  }

  function clearAll() {
    state.lastAnswer = "";
    state.lastQuestion = "";
    state.history = [];
    state.controller?.abort();
    els.pregunta.value = "";
    clearAllSources();
    updateCounter();
    showWelcome();
    updateActionButtons();
    els.pregunta.focus();
    toast("Lienzo reiniciado.");
  }

  function toggleTheme() {
    const isLight = els.body.classList.toggle("light-theme");
    store.set("oaa:theme", isLight ? "light" : "dark");
    toast(isLight ? "Tema claro activado" : "Tema oscuro activado");
  }

  /* --------------------------------- Eventos ------------------------------- */
  // Selector de herramientas
  els.modeButtons.forEach((btn, index) => {
    btn.addEventListener("click", () => selectMode(btn.dataset.mode));
    btn.addEventListener("keydown", (event) => {
      const keys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % els.modeButtons.length;
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + els.modeButtons.length) % els.modeButtons.length;
      selectMode(els.modeButtons[next].dataset.mode, { focus: true, announce: false });
    });
  });

  // Alternar paneles laterales
  els.toggleLeftBtn?.addEventListener("click", () => {
    els.panelLeft.classList.toggle("collapsed-left");
  });
  els.toggleRightBtn?.addEventListener("click", () => {
    els.panelRight.classList.toggle("collapsed-right");
  });

  // Móvil: toggle paneles
  els.mobileToggleLeft?.addEventListener("click", () => {
    els.panelLeft.classList.toggle("mobile-open");
    els.panelRight.classList.remove("mobile-open");
  });
  els.mobileToggleRight?.addEventListener("click", () => {
    els.panelRight.classList.toggle("mobile-open");
    els.panelLeft.classList.remove("mobile-open");
  });

  // Cerrar paneles móviles al hacer clic en el centro
  els.centerPane?.addEventListener("click", (e) => {
    if (window.innerWidth <= 900) {
      els.panelLeft.classList.remove("mobile-open");
      els.panelRight.classList.remove("mobile-open");
    }
  });

  // Botón Enviar
  els.sendBtn.addEventListener("click", generate);

  // Botones de exportación y acciones
  els.copyBtn.addEventListener("click", copyAnswer);
  els.exportPdfBtn.addEventListener("click", exportToPDF);
  els.exportWordBtn.addEventListener("click", () => exportToWord());
  els.exportExcelBtn.addEventListener("click", exportToExcel);
  els.downloadBtn.addEventListener("click", downloadAnswer);
  els.printBtn.addEventListener("click", () => window.print());
  els.clearBtn.addEventListener("click", clearAll);
  els.themeBtn.addEventListener("click", toggleTheme);

  // Manejo de carga de fuentes multiformato
  const openFilePicker = () => els.pdfFileInput.click();
  els.addSourceBtn?.addEventListener("click", openFilePicker);
  els.emptyAddLink?.addEventListener("click", openFilePicker);
  els.pdfDropzone?.addEventListener("click", openFilePicker);
  els.clearSourcesBtn?.addEventListener("click", clearAllSources);

  els.pdfFileInput?.addEventListener("change", (e) => {
    if (e.target.files?.length) {
      processIncomingFiles(e.target.files);
      e.target.value = "";
    }
  });

  // Drag and drop multiformato
  ["dragenter", "dragover"].forEach((evt) => {
    els.pdfDropzone?.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      els.pdfDropzone.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach((evt) => {
    els.pdfDropzone?.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      els.pdfDropzone.classList.remove("dragover");
    });
  });

  els.pdfDropzone?.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    els.pdfDropzone.classList.remove("dragover");
    if (e.dataTransfer?.files?.length) {
      processIncomingFiles(e.dataTransfer.files);
    }
  });

  // Acciones rápidas con las fuentes cargadas
  els.chipSummarizePdf?.addEventListener("click", () => {
    generateWithPrompt("Resume de forma exhaustiva y estructurada todas las fuentes adjuntas, destacando antecedentes, puntos clave y conclusiones.");
  });
  els.chipKeyPointsPdf?.addEventListener("click", () => {
    generateWithPrompt("Extrae los puntos clave, métricas, fechas, participantes y acuerdos más relevantes de las fuentes adjuntas en una lista organizada.");
  });
  els.chipConvertToWord?.addEventListener("click", convertSourcesToWord);
  els.chipConvertToTxt?.addEventListener("click", convertSourcesToTxt);

  // Chips de bienvenida
  els.welcomeChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const q = chip.dataset.query;
      if (q) {
        generateWithPrompt(q);
      }
    });
  });

  // Input events
  els.pregunta.addEventListener("input", () => {
    updateCounter();
    updateActionButtons();
  });

  els.pregunta.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      generate();
    }
  });

  // Eventos de interacción con el Riel Colapsado (NotebookLM Style)
  $("railAddSourceBtn")?.addEventListener("click", openFilePicker);
  $("railExpandLeftBtn")?.addEventListener("click", () => {
    els.panelLeft.classList.remove("collapsed-left");
  });

  document.querySelectorAll("[data-rail-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectMode(btn.dataset.railMode);
      els.panelRight.classList.remove("collapsed-right");
    });
  });

  $("railExportBtn")?.addEventListener("click", () => {
    exportToExcel();
  });

  $("railCopyBtn")?.addEventListener("click", () => {
    copyAnswer();
  });

  /* --------------------------------- Arranque ------------------------------ */
  const savedMode = store.get("oaa:mode", "word");
  const savedTheme = store.get("oaa:theme", "dark");
  if (savedTheme === "light") els.body.classList.add("light-theme");

  selectMode(MODE_NAMES[savedMode] ? savedMode : "word", { announce: false });
  renderSources();
  updateCounter();
  showWelcome();
  updateActionButtons();

  // Comprobar salud del backend
  fetch("/api/health")
    .then((r) => (r.ok ? r.json() : null))
    .then((info) => {
      if (!info) return;
      if (info.demo) {
        els.providerBadge.hidden = false;
        els.providerBadge.textContent = "modo demo";
        els.providerBadge.classList.add("demo");
      }
    })
    .catch(() => {});
})();