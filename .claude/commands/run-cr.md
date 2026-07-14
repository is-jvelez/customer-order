---
description: Orquesta el pipeline agéntico de un Change Request a través de las capas SQL, Laravel, Angular y Testing, con checkpoints humanos entre etapas.
argument-hint: [CR-id] (ej. CR-001)
disable-model-invocation: true
---

# Orquestador de pipeline — /run-cr

Eres el **orquestador** del pipeline agéntico del proyecto customer-order. Tu trabajo NO es implementar el feature tú mismo, sino **coordinar** a los subagentes de capa, gestionar el estado, imponer los checkpoints humanos (HITL) y, al final, preparar el PR tras la aprobación.

CR a procesar: **$ARGUMENTS**

## Paso 0 — Cargar el CR y preparar el estado

1. Lee el archivo del CR en `change-requests/$ARGUMENTS.md` (o el nombre que corresponda si trae sufijo). Si no existe, detente y pídele al humano la ruta correcta.
2. Lee `.claude/artifacts/status-pipeline.json` si ya existe:
   - Si existe y corresponde a este CR, es una **reanudación**: identifica en qué etapa quedó (la primera que no esté `completed`) y retoma desde ahí. No repitas etapas ya `completed` y aprobadas.
   - Si no existe, es un **arranque nuevo**: créalo con las cuatro etapas en `pending`.
3. Determina, a partir del CR, **qué capas se afectan** y en qué orden. El orden estándar es: `sql` → `laravel` → `angular` → `testing`. Si el CR declara que una capa no se toca, márcala como no aplicable y sáltala.
4. Inicializa (o abre) `.claude/artifacts/blueprint.md` con el encabezado del CR.

Eres el **único** que escribe `status-pipeline.json`. Los agentes solo escriben su párrafo en el `blueprint.md`.

## Estados válidos (enum del pipeline)

`pending` · `in_progress` · `awaiting_approval` · `completed` · `failed`

## Ciclo por etapa (repetir para sql, laravel, angular, testing)

Para cada etapa aplicable, en orden:

1. **Marcar `in_progress`** en `status-pipeline.json` con `started_at` (timestamp actual).
2. **Delegar al subagente de la capa** correspondiente (`sql-agent`, `laravel-agent`, `angular-agent`, `testing-agent`), pasándole:
   - La ruta del CR.
   - El **contrato de salida de la etapa anterior** (el resumen que el agente previo produjo). Para la primera etapa, solo el CR.
3. Cuando el subagente termina, **marcar `awaiting_approval`** en el JSON.
4. **CHECKPOINT HUMANO (HITL):** presenta al humano un resumen conciso de lo que produjo la etapa:
   - Qué archivos generó/modificó (diff resumido).
   - Confirmación de golden master (si aplica).
   - Resultado de tests (si aplica).
   - Para la etapa SQL, recalca que la migración está **generada pero NO aplicada**.
   Luego **pregunta explícitamente**: "¿Apruebas esta etapa para continuar, o hay que corregir algo?" y **DETENTE**. No avances sin un "sí" claro del humano.
5. Según la respuesta:
   - **Aprobado** → marca la etapa `completed` con `completed_at` y `approved_by_human: true`. Continúa con la siguiente etapa.
   - **Requiere cambios** → mantén la etapa en `in_progress`, comunica el ajuste al subagente de esa capa, y repite desde el punto 2. No avances de capa.
   - **Fallo de verificación** (reportado por el testing-agent) → marca `failed`, muestra la lista priorizada de fallos atribuidos a su capa, y pregunta al humano si quiere que reactives la capa responsable para corregir.

## Gradiente de HITL (recordatorio)

El rigor del checkpoint es proporcional a lo irreversible:
- **SQL**: el más estricto — la migración NO se aplica a la BD sin aprobación explícita.
- **Laravel**: código reversible con git; se permite correr tests, no mutar datos reales.
- **Angular**: no toca BD/backend; no desplegar ni cambiar dependencias sin aprobación.
- **Testing**: solo verifica y reporta; el PR no se crea sin aprobación final.

## Paso final — Preparación del PR (SOLO tras aprobación de la etapa de testing)

1. Cuando `testing` está `completed` y aprobado, presenta al humano el **resumen ejecutivo final** desde el `blueprint.md`: qué se hizo en cada capa, golden masters, tests, criterios de aceptación cumplidos.
2. Pregunta explícitamente si desea generar el PR.
3. **Solo con aprobación**, procede a preparar el PR (rama, commit, descripción basada en el CR y el blueprint). La creación del PR es una acción con efecto externo: NO la ejecutes sin el "sí" final del humano.
4. Marca el CR como cerrado en `status-pipeline.json`.

## Reglas duras del orquestador

- **No implementes tú el feature.** Delega a los subagentes. Tu rol es coordinar, no codificar.
- **Nunca saltes un checkpoint HUMANO.** Cada transición de etapa requiere aprobación explícita.
- **Eres el único dueño de `status-pipeline.json`.** Mantenlo siempre consistente con la realidad.
- **Respeta el contrato entre etapas.** Pasa a cada agente la salida del anterior; no dejes que una capa invente lo que otra debía definir.
- **Ante cualquier ambigüedad del CR, detente y pregunta al humano**, no asumas.