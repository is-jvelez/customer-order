# Artefactos del pipeline

Esta carpeta contiene los artefactos que el pipeline genera en tiempo de ejecución:

- **`status-pipeline.json`** — estado de máquina del CR en curso (lo escribe SOLO el orquestador). Se genera al correr `/run-cr`. Puede ir en `.gitignore` (estado efímero de ejecución).
- **`blueprint.md`** — resumen ejecutivo legible para humanos (cada agente añade su párrafo). Se versiona junto al código como registro que acompaña al PR.

Ambos se crean automáticamente al ejecutar `/run-cr <CR-id>`. Este README solo documenta su propósito.