# Artefactos del pipeline

Esta carpeta contiene los artefactos que el pipeline genera en tiempo de ejecución:

- **`status-pipeline.json`** — estado de máquina del CR en curso (lo escribe SOLO el orquestador), incluida una clave `metrics` por etapa (duración, tool calls) que alimenta la sección de métricas del blueprint al cierre. Se genera al correr `/run-cr`. Puede ir en `.gitignore` (estado efímero de ejecución).
- **`blueprint.md`** — resumen ejecutivo legible para humanos (cada agente añade su párrafo, más la sección final `## Métricas de ejecución`). Se versiona junto al código como registro que acompaña al PR.
- **`evidence/<CR-id>/<etapa>/`** — evidencia cruda por etapa (logs de tests, respuestas de `curl`, capturas de pantalla), referenciada desde el blueprint por ruta relativa. Ver `evidence/README.md`. Se versiona junto al código.
- **`acceptance-criteria.json`** — checklist estructurado de los criterios de aceptación del CR (uno por criterio, con `status` y `evidence`), que el testing-agent produce/actualiza. Se versiona junto al código.

Todos se crean automáticamente al ejecutar `/run-cr <CR-id>`. Este README solo documenta su propósito.