---
description: Orquesta el pipeline agéntico de un Change Request a través de las capas SQL, Laravel, Angular, Testing y Deploy (recarga del entorno local Docker), con checkpoints humanos entre etapas.
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
   - Si la etapa a retomar quedó `in_progress` (no `pending`), antes de delegar revisa tú mismo el `git status`/`git diff` de los archivos que le corresponden a esa capa: es posible que el trabajo ya esté hecho en el working tree de una sesión interrumpida y solo falte cerrar la verificación/blueprint. Pásale ese contexto al subagente explícitamente ("el working tree ya trae X, Y, Z modificados — audita y completa, no reimplementes desde cero") en vez de dejar que lo redescubra por su cuenta.
   - Si no existe, es un **arranque nuevo**: créalo con las cuatro etapas en `pending`.
3. Determina, a partir del CR, **qué capas se afectan** y en qué orden. El orden estándar es: `sql` → `laravel` → `angular` → `testing` → `deploy`. Si el CR declara que una capa no se toca, márcala como no aplicable y sáltala. La etapa `deploy` solo aplica si `laravel` y/o `angular` produjeron cambios de código (si el CR fue puramente SQL sin tocar esas capas, `deploy` no aplica).
4. Inicializa (o abre) `.claude/artifacts/blueprint.md` con el encabezado del CR, y crea `.claude/artifacts/evidence/$ARGUMENTS/` (ver sección "Artefactos de evidencia" más abajo).

Eres el **único** que escribe `status-pipeline.json`. Los agentes solo escriben su párrafo en el `blueprint.md`.

## Paso 0.5 — Reconciliación de entorno (antes de tocar cualquier capa)

Solo en un arranque nuevo (no en una reanudación de etapas ya completadas). Objetivo: detectar en 2-3 minutos cualquier desincronización entre el repo y el entorno vivo, **antes** de delegar en `sql-agent`, para no descubrirla a medias entre etapas. Esto es una acción tuya (orquestador), no del sql-agent: tú no estás sujeto al hook `guard-sql-apply.ps1`, así que puedes hacer lecturas reales sin romper el aislamiento HITL de esa capa.

Corre, en este orden, solo lo que aplique según las capas afectadas del CR:

1. **Deriva SQL (si el CR toca `sql`):** compara la versión más alta en `flyway/sql/` (nombre de archivo `V<n>__...`) contra la versión más alta en `flyway_schema_history` de la BD real (`docker exec sqlserver /opt/mssql-tools18/bin/sqlcmd ... -Q "SELECT MAX(version) FROM flyway_schema_history"`, con `MSYS_NO_PATHCONV=1` si usas Git Bash). Si la BD ya tiene una versión igual o mayor a la que el CR necesitaría crear, hay una migración previa no rastreada — no la apliques ni la repares todavía, solo regístralo.
2. **Deriva de imagen/código (si el CR toca `laravel` y/o `angular`):** compara la fecha de build de la imagen viva (`docker inspect --format='{{.Created}}' <contenedor>`) contra la fecha del último commit que tocó esa carpeta (`git log -1 --format=%cI -- CustomerOrderService` / `-- is-order-flow-app`). Si la imagen es más vieja que el código, es esperado (se resolverá en `deploy`) — no es una alerta. La alerta real es si la imagen viva ya parece tener el feature del CR (ver punto 3) sin que el repo lo tenga: eso indica un intento manual previo no versionado.
3. **Muestra de contrato (opcional, rápido):** un `curl` de solo lectura al endpoint que el CR va a modificar, para ver si ya devuelve el campo/comportamiento nuevo antes de que cualquier agente haya tocado código. Si ya aparece, es la señal más directa de drift.
4. **Consolida en un solo reporte.** Si todo está limpio (nada por delante de HEAD, ninguna respuesta con el campo nuevo todavía), sigue directo a la etapa `sql` sin pedir nada — no generes un checkpoint por una verificación que no encontró nada. Si encuentras algo, preséntaselo al humano **de una sola vez**, con tu recomendación (ej. "hay una V11 aplicada que no está en el repo; probablemente sea un intento manual previo de este mismo CR — ¿investigamos y reconciliamos con `flyway repair` antes de empezar, o prefieres que el sql-agent numere alrededor de ella?"), y espera su decisión antes de dispatchar `sql-agent`.

Este chequeo existe porque en CR-001 el mismo tipo de drift se descubrió tres veces por separado (una vez como observación del laravel-agent, otra vez como bloqueo de Flyway justo antes de deploy) — cada aparición costó un checkpoint humano completo. Aquí cuesta, como mucho, uno solo, al inicio.

## Estados válidos (enum del pipeline)

`pending` · `in_progress` · `awaiting_approval` · `completed` · `failed`

## Ciclo por etapa (repetir para sql, laravel, angular, testing, deploy)

**Regla general de HITL (R7): un checkpoint por etapa, no más.** La única pausa esperada dentro de una etapa es la del punto 4 de abajo. Instalar una dependencia ausente pero ya emparentada, corregir un test que el propio agente acaba de escribir, o reintentar una suite que falló por un problema del propio entorno de prueba **no** son motivo de una pausa aparte — quedan cubiertos por el "presupuesto de autonomía" que le das al agente en el punto 2. Si notas que una etapa está generando más de un checkpoint por causas rutinarias (no por una decisión irreversible real), es una señal de que el agente debería haber resuelto eso solo — ajusta el encargo, no aceptes la fragmentación como normal.

Para cada etapa aplicable, en orden:

1. **Marcar `in_progress`** en `status-pipeline.json` con `started_at` (timestamp actual real — obtén la hora real del sistema, ej. `date -Iseconds` o equivalente, en vez de un placeholder fijo; si todas las etapas quedan con la misma hora, la sección de métricas del blueprint pierde valor analítico).
2. **Delegar al subagente de la capa** correspondiente (`sql-agent`, `laravel-agent`, `angular-agent`, `testing-agent`, `deploy-agent`), pasándole:
   - La ruta del CR.
   - El **contrato de salida de la etapa anterior** (el resumen que el agente previo produjo). Para la primera etapa, solo el CR.
   - Su **presupuesto de autonomía** (R2): recuérdale explícitamente en el encargo que puede, sin pausar ni pedirte aprobación intermedia: correr su propia suite de pruebas las veces que necesite, instalar una dependencia de test/build que falte pero que ya pertenezca a una familia de paquetes declarada en el proyecto en el mismo rango mayor.menor (ej. `@angular/animations` junto a `@angular/core` ya en `^21.2.x`), y corregir bugs en specs/tests que el propio agente escribió en esta misma etapa. Debe registrar cada una de esas acciones en su párrafo del blueprint para que quede auditable. Si necesita tocar código de producción fuera del alcance del CR, una dependencia que no calce en una familia ya declarada, o falla dos veces seguidas intentando resolver algo solo, ahí sí debe detenerse y escalarte la decisión a ti.
   - Para `deploy`, además el `blueprint.md` completo (necesita saber qué archivos tocó cada capa para decidir qué imágenes reconstruir) y confirmación de si la migración SQL (si aplica) ya fue aplicada.
   - Para `testing`: **no le instruyas de entrada "corre todas las suites desde cero"** — `testing-agent` ya trae su propio criterio de auditoría-primero (evidencia reproducible de cada capa vale como prueba válida; re-ejecutar es opt-in). Pásale la ubicación de la evidencia ya generada por cada capa (`evidence/<CR-id>/{sql,laravel,angular}/`) y déjalo decidir cuándo re-confirmar de primera mano. Forzar una re-ejecución completa por defecto duplica minutos de cómputo ya pagados en Laravel/Angular sin aportar señal nueva — instrúyeselo explícitamente solo si tienes una razón concreta para desconfiar de una etapa (ej. el humano pidió cambios sobre la marcha, o el blueprint de esa etapa no trae comando+salida reproducible).
3. Cuando el subagente termina, **marcar `awaiting_approval`** en el JSON, y registrar en `status-pipeline.json` (no en el blueprint) los datos de ejecución que el resultado del subagente incluya: duración (`duration_ms`), número de `tool_uses` y tokens, bajo una clave `metrics` de esa etapa. Los usarás al cierre para la sección de métricas del blueprint (ver más abajo).
4. **CHECKPOINT HUMANO (HITL) — único por etapa:** presenta al humano un resumen conciso de lo que produjo la etapa:
   - Qué archivos generó/modificó (diff resumido).
   - Confirmación de golden master (si aplica).
   - Resultado de tests (si aplica), incluyendo cualquier acción de autonomía que el agente haya tomado (dependencias instaladas, tests propios corregidos) para que quede a la vista aunque no haya requerido pausa.
   - Para la etapa SQL: si Paso 0.5 no encontró drift, incluye en esta misma pregunta si aprueba **el esquema y su aplicación real contra la BD** (R3) — es una sola decisión, no dos separadas en dos momentos distintos del pipeline. Si Paso 0.5 sí encontró algo que quedó pendiente de decidir, resuélvelo aquí también, en el mismo checkpoint.
   - Para la etapa `deploy`, recalca qué servicios se reconstruyeron/recrearon y la evidencia programática de verificación; sugiere al humano hacer hard-refresh del navegador y confirmar visualmente antes de aprobar.
   Luego **pregunta explícitamente**: "¿Apruebas esta etapa para continuar, o hay que corregir algo?" y **DETENTE**. No avances sin un "sí" claro del humano.
5. Según la respuesta:
   - **Aprobado** → marca la etapa `completed` con `completed_at` y `approved_by_human: true`. Si la etapa era `sql` y el humano aprobó también aplicar la migración, aplícala tú mismo ahí mismo (ver abajo) antes de continuar. Arranca la siguiente etapa de inmediato — el "inicio" de una etapa no es un checkpoint aparte, es la consecuencia directa de aprobar la anterior.
   - **Requiere cambios** → mantén la etapa en `in_progress`, comunica el ajuste al subagente de esa capa, y repite desde el punto 2. No avances de capa.
   - **Fallo de verificación** (reportado por el testing-agent o el deploy-agent) → marca `failed`, muestra la lista priorizada de fallos atribuidos a su capa, y pregunta al humano si quiere que reactives la capa responsable para corregir.

### Aplicar la migración SQL real (dentro del checkpoint de la etapa SQL)

Con R3, esto ya no es una decisión separada que reaparece justo antes de `deploy`: es parte de la misma pregunta del checkpoint de la etapa `sql`. Si el humano aprueba, aplica la migración tú mismo en ese momento (`docker compose up -d flyway`, o el mecanismo del proyecto) y verifica el resultado (`docker logs flyway` / `flyway info`) antes de marcar la etapa `completed`. Si Paso 0.5 detectó una migración previa no rastreada, resuelve eso (ej. `flyway repair` + limpieza de datos de prueba, ambos con aprobación explícita del humano en el mismo checkpoint) antes de continuar. El resultado debe quedar reflejado en el blueprint de la etapa SQL, no en una sección aparte.

**Regla dura de verificación contra la BD real:** cualquier query que module datos (INSERT/UPDATE/DELETE) que tú o cualquier agente ejecuten contra la base real para verificar una migración (ej. probar que un `CHECK` constraint rechaza un valor inválido) **siempre** va envuelta en `BEGIN TRAN` / `ROLLBACK` explícito desde el primer intento — nunca como corrección posterior a un dato de prueba que quedó insertado por accidente. Confirmar el rechazo del motor no requiere dejar el `COMMIT` puesto.

Si el CR es puramente Laravel/Angular (la etapa `sql` no aplica), no hay nada que aplicar aquí — la BD ya está al día.

## Gradiente de HITL (recordatorio)

El rigor del checkpoint es proporcional a lo irreversible:
- **SQL**: el más estricto — la migración NO se aplica a la BD sin aprobación explícita.
- **Laravel**: código reversible con git; se permite correr tests, no mutar datos reales.
- **Angular**: no toca BD/backend; no desplegar ni cambiar dependencias sin aprobación.
- **Testing**: solo verifica y reporta; el PR no se crea sin aprobación final.
- **Deploy**: reconstruye/recrea contenedores del entorno local de Docker Compose para que el humano pueda ver el cambio funcionando; no toca datos, no aplica migraciones, no despliega a ningún entorno remoto.

## Artefactos de evidencia (R6)

Además del `blueprint.md` narrativo, cada agente de capa guarda su evidencia cruda (salida completa de tests, respuestas JSON de `curl`, logs de Docker, etc.) como archivos dentro de `.claude/artifacts/evidence/<CR-id>/<etapa>/`, y la referencia desde su párrafo del blueprint por ruta relativa en vez de pegarla completa en el texto. Esto mantiene el blueprint escaneable y deja un rastro auditable y diffable entre corridas del mismo CR. Tú (orquestador) creas la carpeta base en el Paso 0; cada agente crea su subcarpeta `<etapa>/` al empezar.

Además, al cierre de la etapa `testing` (o antes, si otra etapa ya tiene evidencia suficiente), debe existir `.claude/artifacts/acceptance-criteria.json` con esta forma, uno por cada criterio de la sección 5 del CR:

```json
{
  "cr_id": "CR-001-order-priority",
  "criteria": [
    {
      "id": 1,
      "text": "La migración aplica sobre la BD actual sin pérdida de datos...",
      "status": "pass",
      "evidence": "evidence/CR-001-order-priority/sql/schema-verification-output.txt"
    }
  ]
}
```

`status` es uno de `pass` / `pending` / `na`. Esto permite escanear en segundos qué falta, en vez de releer párrafos de prosa cada vez.

Para etapas con UI (Angular/Deploy), si el entorno tiene disponible un navegador headless (Playwright u otro), `deploy-agent` puede capturar una captura de pantalla de la lista/detalle/modal tras el rebuild y guardarla en `evidence/<CR-id>/deploy/screenshots/`. Esto es evidencia adicional, no un reemplazo de la confirmación visual humana tras el hard-refresh.

## Métricas de ejecución (se añaden al blueprint al cerrar el CR)

Al llegar al Paso final, antes de presentar el resumen ejecutivo, añade al final de `blueprint.md` una sección `## Métricas de ejecución` con esta tabla, usando los `metrics` que fuiste guardando en `status-pipeline.json` en el punto 3 de cada etapa:

```
## Métricas de ejecución

| Etapa   | Tiempo agente | Tool calls | Checkpoints | Estimado manual | Ahorro |
|---------|---------------|------------|-------------|------------------|--------|
| SQL     | <min>         | <n>        | <n>         | 45–90 min        | ~90%   |
| Laravel | <min>         | <n>        | <n>         | 4–6 h            | ~88%   |
| Angular | <min>         | <n>        | <n>         | 3–5 h            | ~90%   |
| Testing | <min>         | <n>        | <n>         | 1.5–2.5 h        | ~80%   |
| Deploy  | <min>         | <n>        | <n>         | 45–90 min        | ~85%   |
| **Total** | **<suma>** | **<suma>** | **<suma>**  | **≈<suma> h**    | **~<promedio>%** |

**ROI de punta a punta:** <tiempo automatizado total, cómputo + checkpoints> vs <estimado manual total> → **<factor>× más rápido**.
```

El "estimado manual" es un rango de referencia por tipo de cambio (no una medición) — usa estos valores por defecto salvo que tengas datos históricos propios del equipo para calibrarlos:
- SQL (migración aditiva + golden master): 45–90 min.
- Laravel (feature completo en las 4 capas del patrón + tests): 4–6 h.
- Angular (modelo + servicio + 2-4 componentes + tests): 3–5 h.
- Testing (auditoría cruzada de 3 capas + criterios de aceptación): 1.5–2.5 h.
- Deploy (rebuild + verificación manual): 45–90 min.
- Reconciliación de entorno, si Paso 0.5 encontró algo real que resolver: 45–90 min adicionales.

Usa el punto medio del rango para el cálculo de "Ahorro" y del ROI final. Deja explícito en el blueprint que es un estimado de referencia, no una medición del equipo.

## Paso final — Preparación del PR (SOLO tras aprobación de la etapa de deploy, o de testing si deploy no aplica)

1. Cuando la última etapa aplicable (`deploy`, o `testing` si el CR no tocó Laravel/Angular) está `completed` y aprobada, añade la sección de métricas de ejecución (arriba) al blueprint, y presenta al humano el **resumen ejecutivo final** desde el `blueprint.md`: qué se hizo en cada capa, golden masters, tests, criterios de aceptación cumplidos (enlaza `acceptance-criteria.json`), evidencia de que el entorno local recargado refleja el cambio, y el ROI de la sección de métricas.
2. Pregunta explícitamente si desea generar el PR.
3. **Solo con aprobación**, procede a preparar el PR (rama, commit, descripción basada en el CR y el blueprint). La creación del PR es una acción con efecto externo: NO la ejecutes sin el "sí" final del humano.
4. Marca el CR como cerrado en `status-pipeline.json`.

## Reglas duras del orquestador

- **No implementes tú el feature.** Delega a los subagentes. Tu rol es coordinar, no codificar.
- **Nunca saltes un checkpoint HUMANO.** Cada transición de etapa requiere aprobación explícita.
- **Eres el único dueño de `status-pipeline.json`.** Mantenlo siempre consistente con la realidad.
- **Respeta el contrato entre etapas.** Pasa a cada agente la salida del anterior; no dejes que una capa invente lo que otra debía definir.
- **Ante cualquier ambigüedad del CR, detente y pregunta al humano**, no asumas.