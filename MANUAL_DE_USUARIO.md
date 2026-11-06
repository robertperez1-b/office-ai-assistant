# 📖 Manual de Usuario Completo — Office AI Assistant

Bienvenido a la guía oficial de usuario de **Office AI Assistant**, la plataforma inteligente de asistencia ofimática y análisis documental con interfaz inspirada en NotebookLM.

Este manual detalla paso a paso el funcionamiento de la aplicación, el uso de sus herramientas especializadas, la gestión de fuentes documentales y los métodos de exportación profesional.

---

## 📑 Tabla de Contenidos

1. [Visión General y Propósito](#1-visión-general-y-propósito)
2. [Recorrido por la Interfaz (3 Paneles)](#2-recorrido-por-la-interfaz-3-paneles)
   - [Panel Izquierdo: Fuentes](#panel-izquierdo-fuentes)
   - [Panel Central: Chat y Lienzo de Trabajo](#panel-central-chat-y-lienzo-de-trabajo)
   - [Panel Derecho: Studio de Herramientas y Exportación](#panel-derecho-studio-de-herramientas-y-exportación)
   - [Rieles Colapsables (Modo Enfoque)](#rieles-colapsables-modo-enfoque)
3. [Formatos de Archivo Soportados](#3-formatos-de-archivo-soportados)
4. [Guía de Herramientas Especializadas](#4-guía-de-herramientas-especializadas)
   - [Modo Word (Redacción y Edición)](#-modo-word-redacción-y-edición)
   - [Modo Excel (Fórmulas y Análisis)](#-modo-excel-fórmulas-y-análisis)
   - [Modo PowerPoint (Storytelling y Diapositivas)](#-modo-powerpoint-storytelling-y-diapositivas)
   - [Modo PDF (Análisis Documental)](#-modo-pdf-análisis-documental)
5. [Opciones de Exportación Profesional](#5-opciones-de-exportación-profesional)
   - [Exportar a Excel (.xlsx real)](#exportar-a-excel-xlsx)
   - [Exportar a Word (.doc)](#exportar-a-word-doc)
   - [Impresión Limpia y Guardado en PDF](#impresión-limpia-y-guardado-en-pdf)
   - [Copiar y Descargar en Texto Plano](#copiar-y-descargar-en-texto-plano)
6. [Atajos de Teclado y Productividad](#6-atajos-de-teclado-y-productividad)
7. [Preguntas Frecuentes y Solución de Problemas](#7-preguntas-frecuentes-y-solución-de-problemas)

---

## 1. Visión General y Propósito

**Office AI Assistant** ha sido diseñado para eliminar la fricción al trabajar con la suite ofimática (Microsoft Office y Google Workspace) y al procesar grandes volúmenes de documentación técnica, académica o corporativa.

A diferencia de los asistentes conversacionales estándar que ofrecen respuestas cortas o genéricas, Office AI Assistant opera como un **consultor pedagógico**:
* Desglosa el funcionamiento interno de cada solución.
* Enseña la lógica detrás de cada fórmula o estructura.
* Analiza múltiples documentos simultáneamente para responder consultas basadas exclusivamente en la evidencia provista.

---

## 2. Recorrido por la Interfaz (3 Paneles)

La pantalla se distribuye en tres columnas ergonómicas de trabajo:

```text
┌───────────────────────┬─────────────────────────────────┬───────────────────────┐
│       FUENTES         │         CHAT / LIENZO           │        STUDIO         │
│  (Gestor documental) │    (Conversación con IA)        │ (Herramientas & Exp.) │
│                       │                                 │                       │
│  [+ Añadir fuentes]   │  Mensajes, fórmulas, tablas,    │  [Word]  [Excel]      │
│  - Documento 1        │  desgloses paso a paso y        │  [PPT]   [PDF]        │
│  - Documento 2        │  análisis contextual            │                       │
│                       │                                 │  [Exportar: PDF/XLSX] │
│  [◨ Ocultar panel]    │  [ Caja de texto + Enviar ]     │  [◨ Ocultar panel]    │
└───────────────────────┴─────────────────────────────────┴───────────────────────┘
```

### Panel Izquierdo: Fuentes
Es el repositorio de conocimiento del asistente para tu sesión.
* **Botón `+ Añadir fuentes` o Zona de Arrastre (Drag & Drop):** Permite subir archivos directamente desde tu computadora.
* **Tarjeta de Fuente:** Muestra el icono según el formato, el nombre del archivo y sus estadísticas calculadas en tiempo real (número de páginas, conteo de palabras o dimensiones).
* **Eliminación individual:** Haz clic en la cruz `✕` de cualquier fuente para descartarla del análisis.
* **Contador dinámico:** Supervisa cuántas fuentes activas tienes cargadas en la sesión.

### Panel Central: Chat y Lienzo de Trabajo
Es el espacio donde interactúas con la inteligencia artificial:
* **Estado de Bienvenida:** Cuando no hay mensajes, muestra accesos directos para iniciar rápidamente una redacción, consultar una fórmula, estructurar una presentación o resumir documentos.
* **Caja de Entrada Inteligente:** 
  * Se adapta a las fuentes seleccionadas: muestra un marcador con el nombre del documento activo (ej. *«Pregunta sobre "Informe_Financiero.pdf"...»*).
  * Cuenta con un **contador de caracteres en tiempo real** (hasta 60.000 caracteres) para permitir consultas complejas con datos pegados.
  * Botón de envío que se deshabilita automáticamente mientras la IA está generando una respuesta.
* **Chips de Sugerencias:** Preguntas rápidas predefinidas como *«Resume exhaustivamente el contenido»*, *«Extrae las ideas principales, fechas y cifras»*, etc.

### Panel Derecho: Studio de Herramientas y Exportación
Permite dirigir el perfil de la IA y descargar los resultados en formatos ofimáticos nativos:
* **Selector de Herramienta Activa:** Cambia entre **Word**, **Excel**, **PowerPoint** y **PDF**. El color de acento y la especialización de la respuesta se ajustan al instante.
* **Acciones Rápidas con el PDF / Documento:**
  * `= Resumir PDF`: Genera una síntesis ejecutiva estructurada.
  * `Puntos clave`: Extrae listas de hitos, fechas y datos cuantitativos.
  * `Convertir a Word`: Reestructura el texto para pegarlo en un procesador de textos.
  * `Convertir a .txt`: Extrae texto limpio sin formato.
* **Bandeja de Exportación:** Opciones de descarga directa (PDF, Word, Excel, TXT, Copiar e Imprimir).

### Rieles Colapsables (Modo Enfoque)
* Puedes ocultar el panel izquierdo o el panel derecho haciendo clic en el icono de panel `◨` ubicado en la cabecera de cada uno.
* Al colapsarse, el panel se reduce a un **riel vertical compacto de 52px**.
* Para restaurar el panel a su tamaño completo, haz clic en el botón de reapertura situado en el riel.

---

## 3. Formatos de Archivo Soportados

Office AI Assistant admite la carga simultánea de **más de 10 formatos documentales diferentes**:

| Formato | Extensiones | Procesamiento realizado |
|---|---|---|
| **Documentos PDF** | `.pdf` | Extracción página por página del texto digital. |
| **Microsoft Word** | `.docx`, `.doc` | Extracción de párrafos estructurados y tablas vía Mammoth. |
| **OpenDocument Text** | `.odt` | Extracción de contenido textual de suites de código abierto. |
| **Hojas de Cálculo** | `.xlsx`, `.xls`, `.csv` | Conversión a tablas de datos estructuradas mediante SheetJS. |
| **Presentaciones** | `.pptx`, `.ppt` | Extracción de diapositivas y textos clave. |
| **Texto Plano** | `.txt` | Lectura de archivos de configuración, notas y registros. |
| **Imágenes** | `.png`, `.jpg`, `.jpeg` | Registro metadato y visualización con resolución. |

---

## 4. Guía de Herramientas Especializadas

### 📝 Modo Word (Redacción y Edición)
Ideal para profesionales, redactores y estudiantes que requieren producir textos con alto impacto.

* **¿Para qué usarlo?**
  * Redacción de cartas formales, solicitudes, circulares, correos ejecutivos e informes técnicos.
  * Corrección de estilo, ortografía y enriquecimiento de vocabulario.
  * Adaptación de registros (formal, académico, persuasivo, institucional).
* **Qué esperar de la IA:**
  * Entrega el texto final pulido y listo para usar.
  * Proporciona una **justificación estilística**: explica qué conectores usó, cómo estructuró los argumentos y qué estilos de párrafo (Títulos, interlineados, márgenes) se recomiendan en Microsoft Word.

### 📊 Modo Excel (Fórmulas y Análisis)
Diseñado para eliminar las frustraciones con fórmulas complejas y hojas de cálculo.

* **¿Para qué usarlo?**
  * Creación y depuración de fórmulas (simples y avanzadas).
  * Consultas sobre `BUSCARX`, `BUSCARV`, `INDICE / COINCIDIR`, `SI.CONJUNTO`, `SUMAR.SI.CONJUNTO`, matrices dinámicas (`FILTRAR`, `UNICOS`).
  * Organización de datos para Tablas Dinámicas y modelado financiero.
* **Qué esperar de la IA:**
  * **Fórmulas bilingües:** La fórmula se entrega en un bloque de código en **Español** y con su equivalente en **Inglés**.
  * **Sintaxis regional:** Indica el uso de punto y coma (`;`) o coma (`,`) según el país.
  * **Desglose didáctico:** Explica argumento por argumento qué hace la función y qué resultado esperar.
  * **Diagnóstico de errores:** Consejos para prevenir errores comunes como `#N/D`, `#¡VALOR!` o referencias circulares.

### 🖥️ Modo PowerPoint (Storytelling y Diapositivas)
Ayuda a transformar ideas o documentos extensos en presentaciones ejecutivas convincentes.

* **¿Para qué usarlo?**
  * Estructuración de ponencias, pitch decks comerciales, defensas de tesis y reuniones corporativas.
  * Síntesis de documentos largos en láminas con buen ritmo visual.
* **Qué esperar de la IA:**
  * Diapositivas numeradas con títulos atractivos y jerarquía visual equilibrada.
  * **Sugerencias de dirección de arte:** Qué gráficos, diagramas de flujo, líneas de tiempo o iconos convienen en cada diapositiva para cautivar a la audiencia.
  * **Notas completas para el orador:** Guía para el presentador con consejos de entonación, transiciones y posibles preguntas del público.

### 📑 Modo PDF (Análisis Documental)
Permite dialogar con tus documentos y obtener información verídica al instante.

* **¿Para qué usarlo?**
  * Leer informes financieros, normativas legales, manuales de usuario o investigaciones académicas.
  * Hacer preguntas específicas sobre cláusulas, fechas, cifras o conclusiones.
* **Qué esperar de la IA:**
  * **Fidelidad absoluta:** Se basa únicamente en el contenido de los documentos que hayas subido; si un dato no está en el archivo, te lo dirá honestamente sin inventar cifras.
  * **Citas y referencias:** Señala la sección o página donde se localiza el dato respaldado.

---

## 5. Opciones de Exportación Profesional

Una vez que la IA genera la respuesta en el panel central, puedes exportarla desde la sección **Exportar / Acciones** del Studio:

### Exportar a Excel (.xlsx)
* Si la respuesta contiene tablas Markdown o datos estructurados, el asistente los procesa mediante SheetJS y genera un archivo `.xlsx` nativo.
* **Auto-ajuste de columnas:** Las columnas del Excel se configuran automáticamente al ancho de los datos más largos para que la hoja quede lista para presentar.
* Si hay varias tablas en una respuesta, se exportan organizadas con filas separadoras legibles.

### Exportar a Word (.doc)
* Genera un archivo `.doc` compatible con Microsoft Word y Google Docs que preserva la jerarquía de títulos (`H1`, `H2`), negritas, listas y tablas con formato limpio.

### Impresión Limpia y Guardado en PDF
* Al hacer clic en **Imprimir** (o presionar `Ctrl + P`), la aplicación activa reglas `@media print` optimizadas:
  * **Ocultamiento inteligente:** Oculta automáticamente las barras laterales, los botones de acción, las tarjetas de fuentes y la caja de texto.
  * **Solo el documento:** En la vista previa de impresión únicamente aparece el texto de la respuesta, con tipografía nítida sobre fondo blanco.
  * **Soporte Vertical y Horizontal:** Si tu documento contiene tablas anchas, puedes cambiar la orientación a **Horizontal (Landscape)** en el diálogo de impresión sin que nada se corte.
  * **Saltos de página inteligentes:** El texto fluye de manera natural entre hojas consecutivas sin solapamientos.

### Copiar y Descargar en Texto Plano
* **Copiar respuesta:** Copia el texto completo al portapapeles con un solo clic.
* **Descargar .txt:** Guarda la respuesta como archivo de texto plano UTF-8.

---

## 6. Atajos de Teclado y Productividad

| Atajo | Acción |
|---|---|
| `Ctrl + Enter` (o `Cmd + Enter`) | Enviar la consulta de inmediato desde la caja de texto. |
| `Ctrl + P` (o `Cmd + P`) | Abrir diálogo de impresión limpia / guardar en PDF. |
| `Escape` | Cancelar selección o cerrar menús modales si estuvieran abiertos. |
| Icono Luna / Sol `🌙 / ☀️` | Alternar entre **Modo Oscuro** (Dark Mode) y **Modo Claro** (Light Mode). La preferencia se guarda automáticamente en tu navegador. |
| Botón `Limpiar` | Vacía el historial de conversación actual para comenzar un tema nuevo. |

---

## 7. Preguntas Frecuentes y Solución de Problemas

#### 1. ¿Qué hago si la respuesta dice «Modo demostración»?
Significa que el servidor no tiene configurada una clave de IA en el archivo `.env`. Para activar respuestas con inteligencia artificial real:
1. Obtén una clave gratuita en [Google AI Studio](https://aistudio.google.com/apikey).
2. Agrega la variable en tu archivo `.env`: `GEMINI_API_KEY=tu_clave_aqui`.
3. Reinicia el servidor con `npm start`.

#### 2. ¿Puedo subir varios documentos a la vez?
Sí. Puedes seleccionar y arrastrar más de 10 archivos a la vez (por ejemplo, 3 PDFs, 2 Excel y 1 Word). La IA tendrá en cuenta toda la información combinada para responder tus consultas.

#### 3. ¿Mis documentos o mi clave de API son visibles para otros?
No. La arquitectura de Office AI Assistant procesa las peticiones en el backend; la clave de API nunca llega al navegador del usuario, y las fuentes cargadas residen en la sesión local de tu navegador.

#### 4. ¿Por qué al imprimir no se ve el dashboard oscuro?
El sistema incluye estilos de impresión editorial diseñados para ahorrar tinta y generar documentos limpios. El fondo oscuro, los paneles y los botones se ocultan intencionalmente para que el PDF o la hoja impresa luzca como un informe profesional.

---

*Office AI Assistant — Tu asistente ofimático inteligente y pedagógico.*
