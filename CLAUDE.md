# CLAUDE.md — Contexto del proyecto customer-order

Este archivo es el **contexto permanente** para todos los agentes y sesiones de Claude Code que trabajen en este repositorio. Define las convenciones, la arquitectura y las **reglas duras** que ningún agente debe violar. No es una orden de trabajo (eso son los CRs en `change-requests/`); es el manual del proyecto.

---

## 1. Qué es este proyecto

Aplicación web de gestión de **clientes y pedidos** con autenticación, compuesta por microservicios independientes y un frontend Angular. Todo se levanta con Docker Compose.

## 2. Stack tecnológico (versiones EXACTAS — no asumir otras)

| Capa | Tecnología | Servicio / carpeta |
|---|---|---|
| Base de datos | **Microsoft SQL Server** | contenedor `sqlserver` |
| Migraciones | **Flyway** | `./flyway/sql/` |
| Auth API | **.NET 10** | `./AuthService/` (contenedor `auth-api`) |
| Clientes/Pedidos API | **Laravel 11 (PHP 8)** | `./CustomerOrderService/` (contenedor `customer-order-api`) |
| Frontend | **Angular 21** | `./is-order-flow-app/` (contenedor `order-flow-app`) |
| Orquestación local | Docker Compose | `docker-compose.yml` |

> Si una versión reportada aquí no coincide con lo que encuentras en el código, **detente y pregunta** — no asumas.

## 3. Arquitectura y límites entre servicios

- **AuthService (.NET 10)**: registro, login, JWT. Es el emisor de tokens (`JWT_ISSUER: AuthService`).
- **CustomerOrderService (Laravel 11)**: CRUD de clientes y pedidos, filtros, estadísticas del dashboard. Valida el JWT emitido por AuthService.
- **Frontend (Angular 21)**: consume ambas APIs vía REST.
- Los dos backends comparten la **misma base de datos SQL Server** y un **JWT_SECRET** común.

### Regla dura de límites
- Un CR sobre **clientes/pedidos** NO toca el AuthService, salvo que el CR lo indique explícitamente.
- Un CR sobre **autenticación** NO toca el CustomerOrderService, salvo indicación explícita.

## 4. Convenciones de la capa SQL Server

- **NO se usan stored procedures.** Todo el acceso a datos y el filtrado se hacen desde Laravel con Eloquent Query Builder. No crear ni proponer SPs.
- Los **nombres de columnas son PascalCase**: `Id`, `CustomerId`, `Status`, `Notes`, `CreatedAt`, `UpdatedAt`, `Total`, `UnitPrice`, `Quantity`, `Description`, `OrderId`.
- **Existen triggers de SQL Server** que calculan `Total` y `UpdatedAt` en la tabla `Orders`. **No modificarlos ni interferir con ellos.** Cualquier cambio de esquema debe preservar su comportamiento exacto (verificar con golden master).
- Los cambios de esquema se hacen **solo vía migraciones Flyway** en `./flyway/sql/`, nunca con SQL manual fuera de Flyway.
- Las migraciones deben ser **compatibles hacia atrás**: columnas nuevas `NOT NULL` requieren `DEFAULT`; nunca destruir ni recalcular datos existentes.

## 5. Convenciones de la capa Laravel (CustomerOrderService)

- Arquitectura **en capas**: `Domain/` (entidades, interfaces) e `Infrastructure/` (Eloquent models, repositories, mappers).
- Patrón **Repository**: el acceso a datos vive en `App\Infrastructure\Persistence\Repositories\EloquentOrderRepository` (implementa `IOrderRepository`). **Todo el filtrado de pedidos vive aquí**, en `findAll(array $filters)`, con bloques condicionales del estilo:
  ```php
  if (!empty($filters['status'])) {
      $query->where('Status', $filters['status']);
  }
  ```
- **Separación model ↔ dominio**: `OrderModel` (Eloquent, columnas PascalCase) se traduce a la entidad de dominio `Order` mediante `OrderMapper`. Al añadir un campo, hay que tocarlo en model, entidad y mapper.
- Los Eloquent models usan columnas **PascalCase** (coinciden con SQL): `$fillable` y `$casts` usan esos nombres.
- Las respuestas JSON de la API usan **camelCase** para los campos (`priority`, no `Priority`).
- Validación de entrada en **Form Requests**.
- **No duplicar lógica de negocio en el frontend**; si hay cálculo/regla, vive en Laravel.
- Pruebas con **PHPUnit/Pest**. Los golden masters se guardan en `tests/golden/`.
- No tocar `getStats()`, `getOrdersByDay()`, `getOrdersByMonth()` salvo que el CR lo pida.

## 6. Convenciones de la capa Angular (is-order-flow-app)

- Angular 21. Componentes de pedidos: lista (con barra de filtros), detalle, y modal de creación/edición.
- **Badges de estado** ya resueltos y reutilizables: Pendiente=amarillo, Cancelado=rojo, En Progreso=azul, Completado=verde. Reutilizar este patrón para cualquier badge nuevo.
- Los servicios HTTP envían filtros como **query params** y mapean las respuestas camelCase a las interfaces TypeScript.
- Pruebas con **Jasmine/Karma** (o Jest si el proyecto ya lo usa — verificar antes).

## 7. Reglas duras transversales (aplican a TODOS los agentes)

1. **No inventar nombres.** Si un nombre (columna, campo, param, clase) no está en el CR ni en este archivo, detente y pregunta.
2. **Respetar el contrato de datos del CR** como fuente única de verdad para el feature en curso.
3. **Golden master primero.** Antes de modificar una capa, captura su comportamiento actual como línea base. Nada que estuviera funcionando debe cambiar salvo lo declarado en el CR.
4. **No expandir el alcance.** Si detectas una mejora fuera del CR, anótala como sugerencia; no la implementes.
5. **Compatibilidad hacia atrás** en datos y contratos de API.
6. **Cada capa corre sus pruebas** (previas + nuevas) antes de dar su etapa por terminada.
7. **Migraciones solo por Flyway.** Cambios de datos solo compatibles y reversibles conceptualmente.

## 8. Cómo se trabaja aquí (flujo agéntico)

- Los **CRs** viven en `change-requests/` y son el insumo que dispara el pipeline.
- Los **agentes** viven en `.claude/agents/` (uno por capa) y son maquinaria reutilizable: genéricos respecto al feature, específicos respecto a la capa.
- El **orquestador / slash command** vive en `.claude/commands/`, lee un CR y ejecuta los agentes en orden (SQL → Laravel → Angular → Testing) pasando el contrato de cada etapa a la siguiente, con checkpoints humanos entre capas.
- Un agente solo necesita conocer **su capa + los contratos vecinos**, no todo el sistema.

### Artefactos del pipeline (`.claude/artifacts/`)
El pipeline mantiene dos artefactos con propósitos distintos:

- **`.claude/artifacts/status-pipeline.json`** — **estado de máquina** para recuperación. Fuente única de verdad del avance. **Solo el orquestador lo escribe**, en cada transición de etapa; los agentes de capa NO lo tocan. Al reanudar un CR interrumpido, el orquestador lo lee para saber qué etapas ya se completaron y desde dónde retomar. Es efímero/derivable (puede ir en `.gitignore`).
- **`.claude/artifacts/blueprint.md`** — **resumen ejecutivo** legible para humanos. Registro narrativo de qué se hizo en cada etapa, cuándo empezó/terminó y su resultado. **Cada agente de capa añade su propio resumen** al terminar su etapa (construcción por acumulación). Se versiona junto al código; es el registro que acompaña al PR.

Regla de oro: si un programa lo consume para decidir el flujo → `status-pipeline.json` (JSON). Si un humano lo lee para entender → `blueprint.md` (Markdown).

**Estados válidos del pipeline** (enum compartido por orquestador y agentes, usado en `status-pipeline.json`):
`pending` · `in_progress` · `completed` · `failed` · `awaiting_approval`

- `pending`: etapa aún no iniciada.
- `in_progress`: etapa ejecutándose.
- `awaiting_approval`: etapa generó su salida y espera el checkpoint humano (HITL).
- `completed`: etapa terminada y aprobada por humano.
- `failed`: la etapa no pasó sus validaciones/golden masters.

## 9. Comandos útiles

- Levantar todo: `docker compose up -d`
- Variables en `.env` (ver `.env.example`): `SA_PASSWORD`, `DB_NAME`, `JWT_SECRET`, puertos, `LARAVEL_APP_KEY`.
- Migraciones: el servicio `flyway` corre `migrate` contra `./flyway/sql/`.