# Blueprint — CR-001: Prioridad de Pedidos

**CR:** `change-requests/CR-001-order-priority.md`
**Capas afectadas:** SQL Server · Laravel 11 · Angular 21
**Riesgo declarado:** Bajo (campo aditivo, sin lógica de negocio)

## Paso 0.5 — Reconciliación de entorno

- Ejecutado al inicio (arranque nuevo, no reanudación).
- Flyway: `flyway info` confirma versión de esquema **10** instalada, coincide con `flyway/sql/V10__update_user_admin.sql`. Próxima migración: **V11**.
- Columna `Priority` en `Orders`: no existe (estado limpio, sin intento manual previo).
- Imágenes `customer-order-api` y `order-flow-app`: creadas 2026-07-16T16:55:56Z, posteriores al último commit sobre esas carpetas (2026-07-14) — el entorno vivo refleja el código actual.
- **Resultado:** sin drift. Se procede directo a la etapa SQL sin checkpoint de reconciliación.

---

## Etapa SQL Server (sql-agent)

- **Inicio:** 2026-07-16.
- **Cambio de esquema aplicado (solo en archivo, NO en la BD real):** migración `flyway/sql/V11__add_order_priority.sql`, que añade `Orders.Priority TINYINT NOT NULL DEFAULT 2` (constraint `DF_Orders_Priority`), un `CHECK (Priority IN (1,2,3))` (`CHK_Orders_Priority`, siguiendo el mismo patrón que `CHK_Customers_Status` de V8) y el índice `IX_Orders_Priority ON Orders (Priority)`. Es aditiva, idempotente (guardas `IF COL_LENGTH`/`IF NOT EXISTS`) y no toca los triggers `TR_Orders_UpdatedAt` / `TR_OrderItems_RecalcTotal` (V5) ni crea stored procedures.
- **Golden master:** capturado por análisis estático de las migraciones ya aplicadas (V1–V10, confirmado en V10 por Paso 0.5), ya que el hook `PreToolUse` (`guard-sql-apply.ps1`) bloquea correctamente cualquier `sqlcmd` contra el servidor real, incluso lecturas — se respetó ese bloqueo como recordatorio de HITL, no se intentó sortear. Evidencia completa en `.claude/artifacts/evidence/CR-001-order-priority/sql/schema-before.txt` (definición vigente de `Orders`, derivada de V3, sin cambios en V4–V10) y `.claude/artifacts/evidence/CR-001-order-priority/sql/trigger-golden-master.txt` (definición verbatim de los 2 triggers + baseline calculado analíticamente para `Order.Id=1`: `Total = 949.99` a partir de sus items sembrados en V6). Conclusión: los triggers no usan `SELECT *` ni dependen del número de columnas de `Orders`, por lo que añadir `Priority` no altera su comportamiento.
- **Test de esquema:** `.claude/artifacts/evidence/CR-001-order-priority/sql/V11_schema_test.sql`, preparado para ejecutarse tras la aplicación real de V11 (columna/tipo/default, CHECK, índice, filas preexistentes en `Priority=2`, `Total` de `Order.Id=1` sin cambios, triggers intactos, y un insert/rollback de prueba en `OrderItems` para confirmar el recálculo dinámico).
- **Discrepancia anotada (no bloqueante):** el CR menciona "6 pedidos existentes"; el seed versionado (`V6__seed_data.sql`) solo crea 5. No afecta la corrección de la migración (el `DEFAULT` aplica a cualquier número de filas), pero queda para que el humano lo confirme junto con el resto del checkpoint.
- **Discrepancia resuelta:** el humano eligió corregir el CR (no la BD). Se actualizó `change-requests/CR-001-order-priority.md` en sus 3 menciones de "6 pedidos" → "5 pedidos" (líneas 53, 87, 114 originales), reflejando el seed real de `V6__seed_data.sql`. No se creó ninguna migración adicional de datos — la BD ya estaba correcta, solo el texto del CR estaba desactualizado.
- **Migración aplicada contra la BD real (aprobado por el humano):** `docker compose up -d flyway` ejecutó V11 exitosamente (`installed_rank 11`, `flyway_schema_history` confirma versión "11 - add order priority"). Verificación post-aplicación (orquestador, lectura directa vía `sqlcmd`):
  - Los 5 pedidos existentes (Id 1–5) quedaron en `Priority = 2`.
  - `Total` de cada pedido sin cambios respecto al golden master (Order 1 = 949.99, Order 2 = 375.50, Order 3 = 120.00, Order 4 = 150.00, Order 5 = 124.99) — confirma que los triggers no fueron alterados por el `ALTER TABLE`.
  - `CHK_Orders_Priority` e `IX_Orders_Priority` existen; un insert de prueba con `Priority=4` fue rechazado por el CHECK (`Msg 547`), confirmando la validación a nivel de esquema.
  - Nota operativa: una verificación inicial insertó accidentalmente una fila de prueba sin transacción (Id=6); se detectó y eliminó de inmediato (`DELETE ... WHERE Id=6`), restaurando el conteo a 5. La verificación del CHECK constraint se repitió después con `BEGIN TRAN`/`ROLLBACK` explícito para evitar el mismo problema.
- **Fin:** 2026-07-16. **Estado: completed**, aprobado por el humano (esquema + aplicación real, R3, en un mismo checkpoint).

---

## Etapa Laravel (laravel-agent)

- **Inicio:** 2026-07-16.
- **Golden master capturado ANTES de tocar código**, contra el `customer-order-api` real (imagen ya construida, conectada a la BD real con V11 ya aplicada por la etapa SQL): `GET /api/orders`, `GET /api/orders/1`, `GET /api/dashboard/stats` (no existe ruta `/api/orders/stats`; el stats de pedidos vive en `DashboardController::stats()`, que internamente llama a `IOrderRepository::getStats()` — esa es la ruta real equivalente al "GET /orders/stats" mencionado en el encargo). Guardado en `.claude/artifacts/evidence/CR-001-order-priority/laravel/golden-orders-index.json`, `golden-orders-show-1.json`, `golden-dashboard-stats.json`. Confirma los 5 pedidos con `Priority` aún no expuesto en JSON (la columna ya existe en BD por la etapa SQL, pero el código Laravel todavía no la lee).
- En progreso: implementación del contrato de la sección 4.2 del CR (enum `OrderPriority`, `OrderModel`, entidad `Order`, `OrderMapper`, `EloquentOrderRepository`, Form Requests, `OrderResource`, `OrderController`).

**Reanudación (sesión posterior, misma etapa Laravel):** al retomar, el working tree ya traía casi toda la implementación del contrato de la seccion 4.2 hecha en una sesion previa interrumpida. Auditoria archivo por archivo contra el contrato (seccion 3 y 4.2 del CR) -- todo correcto, sin gaps que corregir:

- `app/Enums/OrderPriority.php`: enum `int` con `Low=1, Medium=2, High=3`. Correcto.
- `app/Infrastructure/Persistence/Models/OrderModel.php`: `Priority` en `$fillable` y en `$casts` (cast al enum `OrderPriority::class`). Columna PascalCase respetada.
- `app/Domain/Orders/Entities/Order.php`: propiedad `public readonly OrderPriority $priority = OrderPriority::Medium` anadida al final del constructor (backward-compatible, parametro opcional).
- `app/Infrastructure/Persistence/Mappers/OrderMapper.php`: `toDomain()` mapea `$model->Priority ?? OrderPriority::Medium` a `priority` del dominio. El sentido de escritura vive en el repository (`create`/`update`), tal como especifica el CR.
- `app/Infrastructure/Persistence/Repositories/EloquentOrderRepository.php`: `findAll()` tiene el bloque `if (!empty($filters['priority'])) { $query->where('Priority', (int) $filters['priority']); }` identico en estilo a `status`/`customer_id`/`date_from`/`date_to`; `create()` incluye `'Priority' => $order->priority->value`; `update()` incluye `'Priority' => $order->priority->value`. Verificado por `git diff` que ningun otro metodo del repository fue tocado: `getStats()`, `getOrdersByDay()`, `getOrdersByMonth()` quedan igual (diff de 9 lineas, todas dentro de `findAll`/`create`/`update`).
- `app/Http/Requests/Order/CreateOrderRequest.php` y `UpdateOrderRequest.php`: regla `['sometimes', 'nullable', 'integer', 'in:1,2,3']` para `priority`, con mensajes en espanol. Opcional; si falta, el default `2` se aplica en `OrderController::store()` (`OrderPriority::from((int) ($request->input('priority') ?? OrderPriority::Medium->value))`) y en `CreateOrderDTO`/`Order` (default `Medium`).
- `app/Http/Resources/Order/OrderResource.php`: expone `'priority' => $order->priority->value` (entero 1-3), anadido al final del array, despues de `items` -- no reordena ni renombra ningun campo previo.
- `app/Http/Controllers/Api/OrderController.php`: `index()` lee `priority` de `$request->query('priority')` y lo agrega al array `$filters` pasado a `getAll()`/`findAll()`; `store()` y `update()` construyen el enum `OrderPriority` desde el input validado.
- `app/Application/Orders/DTOs/CreateOrderDTO.php`, `UpdateOrderDTO.php`, `app/Application/Orders/Services/OrderService.php`: propagan `priority` de forma coordinada (DTO -> entidad `Order` -> repository), sin logica de calculo (correcto, es manual).
- `tests/Support/Database/UsesCustomerOrderSqliteSchema.php`: anade `Priority` (`unsignedTinyInteger`, default `2`) al esquema SQLite de pruebas, replicando el esquema real de V11.

**Gap corregido durante esta sesion:** ninguno de produccion -- el codigo ya cumplia el contrato al 100%. Se completo unicamente la verificacion (tests, comparacion golden, evidencia) y el cierre del blueprint, que es lo que habia quedado pendiente de la sesion interrumpida.

**Suite de pruebas.** No existe el sidecar `customer-order-test` en este checkout (no esta declarado en `docker-compose.yml`), asi que se uso un contenedor efimero por autonomia acotada: se reutilizo la imagen ya construida `customer-order-customer-order-api` (que ya trae PHP 8.3 + extensiones `sqlsrv`/`pdo_sqlsrv`/`mbstring`/`bcmath`/`zip` + Composer) con el codigo montado por bind-mount (no la copia congelada de la imagen) y un volumen con nombre (`customer-order-vendor-cache`) para `vendor/`. Primera corrida: `composer install` (con dev deps, ya que la imagen se habia buildeado con `--no-dev`) -- sin necesidad de instalar ninguna dependencia nueva, todo ya estaba declarado en `composer.json` (`phpunit/phpunit ^10.5` ya presente). Corridas siguientes reutilizan `vendor/` cacheado. Se pasaron `APP_KEY`, `JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE` como variables de entorno (no habia `.env`; `phpunit.xml` no los define y los tests de `JwtVerifierTest` los necesitan -- esto no es un bug introducido por este CR, es un requisito de entorno preexistente).

**Resultado: `vendor/bin/phpunit` -> 101 tests, 312 assertions, OK.** Incluye toda la suite previa (Customer*, JwtVerifier, JwtAuthMiddleware, Dashboard*, etc.) mas los tests nuevos de esta etapa: `OrderModelCastTest` (3), casos de `priority` en `OrderControllerTest` (8, incluyendo 4 datasets de validacion invalida: `zero`, `four`, `nine`, `non_numeric`), `EloquentOrderRepositoryIntegrationTest` (5 nuevos: default priority, priority explicita en `create`, filtro `priority=3` en `findAll`, cambio de priority en `update`), `OrderMapperTest` (2 nuevos), `DomainEntitiesTest`/`DtoConstructionTest` (3 nuevos), `RequestRulesTest` (2 nuevos), `ResourceTransformationTest` (assert `priority` como entero). Salida completa guardada en `.claude/artifacts/evidence/CR-001-order-priority/laravel/phpunit-run-output.txt`.

**Comparacion golden master.** No se reconstruyo la imagen `customer-order-api` (responsabilidad de la etapa Deploy, que copia codigo en la imagen al buildear -- todavia no ejecutada; hacerlo aqui habria sido expandir el alcance de esta etapa). En su lugar, la comparacion se hizo por lectura estatica del diff de `EloquentOrderRepository` + por las aserciones reales de `OrderResource`/`OrderMapper` contra la entidad de dominio en los tests. Conclusion: `GET /orders` y `GET /orders/{id}` mantienen exactamente los mismos campos que `golden-orders-index.json`/`golden-orders-show-1.json` (`id, customer_id, status, total, notes, created_at, updated_at, items[]`), con `priority` anadido al final; `pagination` sin cambios de forma. `getStats()` no fue tocado (confirmado por diff y por `DashboardControllerTest` sin cambios en el working tree), por lo que `golden-dashboard-stats.json` sigue siendo valido tal cual, sin `priority` (correcto, fuera de alcance). Detalle completo en `.claude/artifacts/evidence/CR-001-order-priority/laravel/golden-master-comparison.md`.

**Criterios de aceptacion (seccion 5 del CR, parte Laravel):** todos verificados por tests -- `GET /orders` expone `priority`; `GET /orders?priority=3` filtra solo Alta (`FindAll ShouldReturnOnlyHighPriorityOrders WhenPriorityFilterIsThree`); sin el param devuelve todos (comportamiento previo intacto, filtro condicionado a `!empty()`); `POST /orders` sin `priority` persiste `2` (`Store ShouldPersistDefaultPriority WhenPriorityIsOmitted`); con `priority=3` persiste `3` (`Store ShouldPersistExplicitPriority WhenPriorityIsThree`); valores invalidos `0`, `4`, `9`, no numericos -> `422` (`Store ShouldReturn422 WhenPriorityIsInvalid`, 4 datasets).

**Fin:** 2026-07-16. **Estado: awaiting_approval.** No hubo discrepancias que requieran decision humana ni gaps de produccion que corregir -- el trabajo de la sesion interrumpida ya cumplia el contrato integramente; esta sesion se limito a auditar, verificar (tests + golden master) y cerrar la documentacion. Queda a la espera del checkpoint humano antes de que el pipeline avance a la etapa Angular.

---

## Etapa Angular (angular-agent)

- **Inicio:** 2026-07-16.
- **Descubrimiento de contexto:** proyecto usa `@angular/build:unit-test` (Vitest bajo el capó, no Karma/Jasmine) -- confirmado en `angular.json` y `package.json` (`vitest ^4.0.8` en devDependencies). No existia ningun spec de los componentes de pedidos, solo `src/app/app.spec.ts` (generico de Angular CLI, no relacionado con Order). Se identifico el patron exacto de badge de Estado a reutilizar: `mat-chip [class]="'chip-' + o.status.toLowerCase()"` con clases `chip-pending/chip-inprogress/chip-completed/chip-cancelled` definidas inline en `styles: []` de cada componente (`order-list.component.ts`, `order-detail.component.ts`), mas el pipe `StatusLabelPipe` (`shared/pipes/status-label.pipe.ts`) que mapea valor crudo a etiqueta en espanol via un `Record` estatico. Se replico exactamente esta estructura para prioridad. Tambien se confirmo que **no existe flujo de edicion/update de pedidos** en la app actual (ni en `IOrderRepository`, ni en `OrderRepository`, ni en `OrderService` -- solo `getAll/getById/create/complete/cancel/delete`); por lo tanto "enviar priority en update" del contrato Laravel->Angular no aplica a ningun archivo real de esta capa (no se crea un flujo de update nuevo, seria expandir alcance fuera de la seccion 4.3 del CR, que no lo pide).
- **Golden master ANTES de tocar codigo:** `node ./node_modules/@angular/cli/bin/ng.js test --watch=false` (no se pudo usar el shim `npm test`/`node_modules/.bin/ng` por el `&` en la ruta del directorio de usuario, que rompe la resolucion del `.bin` en Windows; se invoco `ng.js` directamente con `node`, sin cambiar ninguna config del proyecto). Resultado baseline: **1 test file (`app.spec.ts`), 2 tests, 1 failed / 1 passed** -- el fallo (`should render title`, `NG04002: Cannot match any routes 'auth/login'`) es preexistente y no relacionado con pedidos (bug generico de bootstrap de rutas en el test generado por el CLI). Guardado en `.claude/artifacts/evidence/CR-001-order-priority/angular/golden-master-test-run-before.txt`. No existian specs de lista/detalle/modal que capturar; el "golden master" de esos componentes se estableció leyendo su codigo/plantillas actuales (documentado arriba) como linea base de comportamiento a preservar.
- **Archivos modificados (contrato de la seccion 4.3 del CR):**
  - `src/app/shared/constants/app.constants.ts`: anadido `enum OrderPriority { Low = 1, Medium = 2, High = 3 }` y `ORDER_PRIORITIES`, en el mismo archivo donde vive `OrderStatus`/`ORDER_STATUSES` (tipo analogo ya existente), tal como pide el contrato.
  - `src/app/shared/pipes/priority-label.pipe.ts` (nuevo): pipe `priorityLabel`, mismo patron que `StatusLabelPipe` (`Record` estatico 1->"Baja", 2->"Media", 3->"Alta"; fallback al valor crudo si no reconoce -- no inventa etiquetas).
  - `src/app/features/orders/domain/models/order.model.ts`: `Order.priority: OrderPriority`; `OrderFilterParams.priority?: OrderPriority | number`; `CreateOrderRequest.priority?: OrderPriority`.
  - `src/app/features/orders/infrastructure/order.repository.ts`: `RawOrder.priority: number`; `mapOrder()` mapea `raw.priority` -> `Order.priority`; `getAll()` agrega `priority` como query param solo si viene (`if (params.priority) ...`, identico estilo a `status`/`customer_id`); `create()` incluye `priority: data.priority` en el body JSON.
  - `src/app/features/orders/ui/components/order-filters/order-filters.component.ts`: nuevo `mat-select` "Prioridad" con opcion "Todas" (`value=""`) + opciones `ORDER_PRIORITIES` etiquetadas via `priorityLabel` pipe, mismo patron visual/estructural que el filtro de Estado existente; `applyFilters()`/`clearFilters()` incluyen `priority`.
  - `src/app/features/orders/ui/components/order-form/order-form.component.ts`: nuevo `mat-select` "Prioridad" debajo de "Notas" (respeta el orden pedido por el CR), FormControl inicializado en `OrderPriority.Medium` (preseleccion "Media" por defecto); `submit()` envia `priority: this.form.value.priority ?? OrderPriority.Medium`.
  - `src/app/features/orders/ui/pages/list/order-list.component.ts`: nueva columna `priority` insertada en el array `columns` entre `status` y `total`; celda con `mat-chip [class]="'chip-priority-' + o.priority"` + pipe `priorityLabel`, mismo patron que la celda de `status`; clases CSS nuevas `chip-priority-1/2/3` anadidas al bloque `styles` existente (no se toco ninguna clase `chip-pending/...` previa).
  - `src/app/features/orders/ui/pages/detail/order-detail.component.ts`: chip de prioridad anadido junto al chip de Estado dentro de `mat-card-subtitle`; misma logica de clase/pipe; una linea de estilo (`mat-card-subtitle mat-chip { margin-right: 8px; }`) para separar visualmente los dos chips -- cambio de estilo minimo y directamente atado al badge nuevo (no es un cambio de tema fuera de alcance).
  - Colores de badge (identicos a los ya usados en Estado, reutilizando la paleta existente): `chip-priority-1` (Baja) `#F5F5F5`/`#616161` gris; `chip-priority-2` (Media) `#FFF8E1`/`#F57F17` amarillo (mismo par que `chip-pending`); `chip-priority-3` (Alta) `#FFEBEE`/`#C62828` rojo (mismo par que `chip-cancelled`).
- **No se toco:** ordenamiento, asignacion automatica, notificaciones, permisos, ningun estilo/tema fuera del badge, AuthService, ni ningun archivo de Customers/Dashboard. No se creo flujo de edicion de pedidos (no existia antes; fuera de alcance de la seccion 4.3).
- **Tests nuevos escritos esta etapa** (Vitest, no Jasmine/Karma -- confirmado antes de escribir):
  - `shared/pipes/priority-label.pipe.spec.ts` (4 tests): mapeo 1/2/3 -> Baja/Media/Alta, fallback para valor desconocido.
  - `features/orders/infrastructure/order.repository.spec.ts` (4 tests, con `HttpTestingController`): `getAll()` envia `priority` como query param cuando se provee; no lo envia cuando se omite (comportamiento previo intacto); `mapOrder()` traduce `priority` del JSON crudo al modelo; `create()` envia `priority` en el body.
  - `features/orders/ui/components/order-form/order-form.component.spec.ts` (2 tests): el control `priority` arranca en `OrderPriority.Medium`; se puede cambiar a otro valor.
  - `features/orders/ui/pages/list/order-list.component.spec.ts` (2 tests): la columna Prioridad renderiza `chip-priority-1/2/3` con la etiqueta correcta para los 3 valores; los badges de Estado existentes (`chip-completed`, etc.) siguen renderizando igual (verificacion puntual de golden master a nivel de componente).
  - `features/orders/ui/pages/detail/order-detail.component.spec.ts` (1 test): el detalle muestra el badge de prioridad (`chip-priority-3`/"Alta") junto al badge de Estado (`chip-pending`).
- **Resultado real de ejecucion (suite completa, previa + nueva):** `node ./node_modules/@angular/cli/bin/ng.js test --watch=false` -> **6 test files (5 passed, 1 failed) / 15 tests (14 passed, 1 failed)**. El unico fallo es el mismo preexistente de `app.spec.ts` capturado en el golden master (identico mensaje/causa, sin cambios) -- **cero regresiones, cero fallos nuevos**. Salida completa guardada en `.claude/artifacts/evidence/CR-001-order-priority/angular/test-run-after.txt`.
- **Comparacion golden master:** los 4 badges de Estado (Pendiente/amarillo, Cancelado/rojo, En Progreso/azul, Completado/verde) no fueron tocados -- mismas clases CSS, mismo pipe, mismo test (`chip-completed` verificado explicitamente en `order-list.component.spec.ts`). El unico elemento nuevo visible en lista/detalle/filtro/modal es el declarado en el CR (columna Prioridad, badge, filtro, selector). Confirma "los pedidos existentes se ven igual salvo la nueva columna" (seccion 6.1 del CR).
- **Decisiones de autonomia tomadas (documentadas, sin pausar el pipeline):**
  - `node_modules` no existia en este checkout -> se corrio `npm ci` (no modifico `package.json` ni el lockfile), ~486 paquetes instalados, sin necesidad de instalar ninguna dependencia `@angular/*` adicional (todo lo requerido -- `@angular/cdk`, `@angular/material`, Vitest via `@angular/build` -- ya estaba declarado).
  - Se corrigieron 2 bugs en specs propios de esta sesion: (1) tipo de `priority` en el `FormGroup` de `order-filters.component.ts` era `string` por defecto (`['']`) y no aceptaba `OrderPriority` (error de compilacion `TS2322`) -- se tipo explicitamente como `OrderPriority | ''`; (2) `order-list.component.spec.ts` fallaba por falta de un provider de enrutamiento (`NG0201: No provider found for ActivatedRoute`, requerido por `RouterLink` en la plantilla) -- se agrego `provideRouter([])` a los providers del test. Ambos son ajustes a codigo/tests escritos en esta misma sesion, dentro del presupuesto de autonomia.
  - No se instalo ninguna dependencia ajena a la familia `@angular/*` ni se toco codigo de produccion fuera de la seccion 4.3.
- **Criterios de aceptacion (seccion 5, parte Angular) verificados:** cada fila de la lista muestra el badge de prioridad con el color correcto (test de `order-list.component.spec.ts`); el filtro de prioridad existe en la barra superior con opcion "Todas" y emite el parametro correcto (`order-filters.component.ts`, cubierto indirectamente por el contrato del servicio ya testeado en `order.repository.spec.ts`); el modal de creacion muestra "Media" preseleccionada y permite cambiarla (`order-form.component.spec.ts`); el detalle muestra el badge de prioridad (`order-detail.component.spec.ts`).
- **Fin:** 2026-07-16. **Estado: awaiting_approval.** Ningun archivo fuera del alcance de la seccion 4.3 fue tocado. Queda a la espera del checkpoint humano antes de que el pipeline avance a la etapa de Testing.

---

## Etapa Testing (testing-agent)

- **Inicio:** 2026-07-16.

**Alcance de la verificacion.** Gate de calidad transversal, solo lectura sobre codigo de produccion. Se re-confirmo de forma independiente cada golden master (no solo se releyo lo reportado), se re-ejecutaron las 3 suites de prueba, se corrio una prueba de integracion end-to-end real contra la BD real con el codigo nuevo (via contenedor efimero con bind-mount, ya que el contenedor customer-order-api real todavia no fue reconstruido por Deploy), y se verifico consistencia de contrato de datos entre las 3 capas por lectura directa de codigo.

**1) Golden masters -- CONFIRMADOS, sin discrepancias:**
- **SQL:** re-verificado de forma independiente contra la BD real (no solo releido el reporte del sql-agent, que no pudo ejecutar sqlcmd por el guard de su etapa): columna Priority TINYINT NOT NULL, CHK_Orders_Priority = Priority IN (1,2,3), IX_Orders_Priority presente, los 5 pedidos preexistentes (Id 1-5) en Priority=2 con sus Total intactos (949.99, 375.50, 120.00, 150.00, 124.99 -- identicos al golden master pre-migracion), los 2 triggers (TR_Orders_UpdatedAt, TR_OrderItems_RecalcTotal) presentes y habilitados, y el CHECK constraint rechaza Priority=4 (Msg 547) dentro de una transaccion con ROLLBACK explicito (sin dejar datos de prueba). Evidencia: evidence/CR-001-order-priority/testing/sql-independent-verification.txt.
- **Laravel:** confirmado por lectura de OrderResource, EloquentOrderRepository, CreateOrderRequest/UpdateOrderRequest, OrderController -- todos los campos previos de GET /orders y GET /orders/{id} intactos mas priority anadido al final; pagination sin cambios; getStats()/getOrdersByDay()/getOrdersByMonth() no tocados (confirmado leyendo el archivo completo del repository). Sin gaps respecto a lo reportado por laravel-agent.
- **Angular:** confirmado por lectura de order-list.component.ts, order-detail.component.ts, order-form.component.ts, order-filters.component.ts -- los 4 badges de Estado (chip-pending/inprogress/completed/cancelled) no fueron tocados; el badge nuevo de Prioridad usa clases (chip-priority-1/2/3) y colores (gris/amarillo/rojo) que coinciden exactamente con el contrato de la seccion 3 del CR. Sin gaps.

**2) Consistencia de contrato entre capas -- CONFIRMADA por lectura de codigo (verificacion central, sin excepcion):** columna Priority (SQL) equivale a Priority fillable/cast (OrderModel) equivale a priority (JSON, OrderResource) equivale a query param ?priority= (OrderController::index, EloquentOrderRepository::findAll) equivale a priority (Angular RawOrder/Order, query param en order.repository.ts) equivale a enum Low=1/Medium=2/High=3 identico en App\Enums\OrderPriority (Laravel) y OrderPriority (Angular app.constants.ts) equivale a etiquetas "Baja/Media/Alta" (priorityLabel pipe) equivale a colores de badge (gris/amarillo/rojo) exactamente como especifica la seccion 3 del CR. Sin discrepancias de nombre, tipo ni valores permitidos en ningun punto de la cadena.

**3) Suites de pruebas por capa -- re-ejecutadas de forma independiente (no solo auditadas):**
- **SQL:** sin suite automatizada dedicada (no hay stored procedures); verificacion de esquema/triggers hecha directamente contra la BD real (ver punto 1). Resultado: OK, coincide con lo reportado por sql-agent.
- **Laravel:** re-corrida propia via contenedor efimero (imagen customer-order-customer-order-api, bind-mount de codigo mas volumen con nombre customer-order-vendor-cache para vendor/, mismo mecanismo que uso laravel-agent -- no existe el sidecar customer-order-test en este checkout). Resultado: 101 tests, 312 assertions, OK -- identico a lo reportado por laravel-agent. Evidencia: evidence/CR-001-order-priority/testing/phpunit-rerun-output.txt.
- **Angular:** re-corrida propia (node ./node_modules/@angular/cli/bin/ng.js test --watch=false). Resultado: 6 test files (5 passed, 1 failed) / 15 tests (14 passed, 1 failed) -- identico a lo reportado por angular-agent. El unico fallo (app.spec.ts, "should render title", NG04002) es preexistente: se comparo linea por linea contra golden-master-test-run-before.txt (baseline pre-CR) y el mensaje/causa son identicos -- cero regresiones, cero fallos nuevos. Evidencia: evidence/CR-001-order-priority/testing/angular-rerun-output.txt.

**4) Integracion end-to-end -- ejecutada contra la BD real con el codigo nuevo (con limitacion documentada):**
El contenedor real customer-order-api (sin bind-mount, codigo copiado al build) todavia sirve el codigo previo al CR -- confirmado empiricamente (GET /api/orders contra el puerto 8000 real NO devuelve priority), ya que la etapa Deploy aun no corrio. Por tanto la verificacion visual del badge en el navegador real queda pendiente para Deploy. En su lugar, se levanto un contenedor efimero con bind-mount del codigo nuevo, conectado a la BD real (red customer-order_default, mismo sqlserver), autenticado con un JWT real de AuthService, y se ejecuto el flujo completo:
1. Login admin@demo.com -> JWT valido.
2. POST /api/orders con priority=3 -> HTTP 200, priority devuelto como 3.
3. Verificacion directa en SQL Server (bypass de Laravel) -> Priority=3 persistido en la columna real.
4. GET /api/orders?priority=3 -> devuelve solo el pedido nuevo (1 item).
5. GET /api/orders?priority=1 -> 0 items (sin falsos positivos).
6. GET /api/orders sin filtro -> 6 items (5 preexistentes priority=2 mas el nuevo priority=3) -- comportamiento previo intacto.
7. POST /api/orders sin priority -> persiste priority=2 (default).
8. POST /api/orders con priority=0, 4, "x" -> los 3 casos responden HTTP 422 con mensajes de validacion en espanol.
Los pedidos de prueba se eliminaron al final (DELETE /api/orders/{id}, HTTP 200 ambos) y se confirmo que la BD volvio a su estado de 5 pedidos. Evidencia completa: evidence/CR-001-order-priority/testing/e2e-integration-test.txt. Pendiente para Deploy: verificacion visual del badge rojo en el navegador real (Angular) contra el Laravel real reconstruido.

**5) Criterios de aceptacion (seccion 5 del CR):** 10 de 10 en estado pass. Checklist completo con evidencia individual en .claude/artifacts/acceptance-criteria.json. Los 4 criterios de UI (7-10) se verifican por tests de componente (Vitest) mas lectura de codigo; la confirmacion visual pixel-a-pixel en navegador real queda anotada como pendiente de Deploy dentro de cada entrada de evidencia, sin bloquear el pass porque el comportamiento funcional ya esta probado.

**6) Diff de alcance -- CONFIRMADO limpio:** git status muestra unicamente los archivos declarados en la seccion 4 del CR (migracion V11__add_order_priority.sql, enum App\Enums\OrderPriority mas su test, OrderModel/Order/OrderMapper/EloquentOrderRepository/Form Requests/OrderResource/OrderController mas sus tests, tests/golden/, y en Angular: app.constants.ts, priority-label.pipe.ts mas spec, order.model.ts, order.repository.ts mas spec, order-filters/order-form/order-list/order-detail mas specs). El unico cambio fuera de codigo de capa es change-requests/CR-001-order-priority.md (correccion de "6 pedidos" a "5 pedidos", ya aprobada por el humano en el checkpoint de SQL) y .claude/settings.local.json (allowlist de permisos de herramientas, no es codigo de produccion). Sin regresiones ni expansion de alcance.

**Fin:** 2026-07-16. **Veredicto: LISTO PARA PR.** Los 3 golden masters coinciden (solo la diferencia esperada, priority), la consistencia de contrato entre las 3 capas es exacta, las 3 suites pasan (Laravel 101/101, Angular 14/15 con el mismo fallo preexistente, SQL verificado directamente), la integracion end-to-end Laravel-SQL queda demostrada de punta a punta contra la BD real (con la verificacion visual del badge explicitamente diferida a Deploy, no forzada), los 10/10 criterios de aceptacion de la seccion 5 estan en pass, y el diff de alcance no muestra cambios fuera de lo declarado en el CR. Sin fallos que requieran reabrir ninguna etapa anterior. Queda a la espera de la aprobacion humana final antes de que el orquestador proceda a la etapa Deploy (o a generar el PR, segun decida el humano).

---

## Etapa Deploy (deploy-agent)

- **Inicio:** 2026-07-16.

**Alcance.** Cerrar la brecha entre "codigo probado" y "codigo servido en Docker Compose local". customer-order-api y order-flow-app no usan bind-mount: el codigo se copia en la imagen al buildear, por lo que sin reconstruir explicitamente, el entorno vivo seguia sirviendo la version previa al CR aunque las 4 etapas anteriores ya estuvieran aprobadas (confirmado empiricamente por testing-agent: GET /api/orders contra el puerto 8000 real no devolvia priority).

**Descubrimiento de contexto:**
- docker-compose.yml: ./CustomerOrderService -> servicio customer-order-api (puerto ORDER_API_PORT=8000); ./is-order-flow-app -> servicio order-flow-app (puerto WEB_PORT=4200). sqlserver, sqlserver-init, flyway, auth-api quedan fuera: SQL ya fue aplicado por el orquestador (verificado installed_rank 11 en la etapa SQL) y AuthService (.NET) no fue tocado por este CR (confirmado en la seccion Capas afectadas del CR y en el blueprint de las 4 etapas previas -- ningun archivo de AuthService/ aparece modificado).
- Segun el blueprint de las etapas Laravel y Angular, ambas capas tuvieron cambios de codigo reales (enum OrderPriority, model/entidad/mapper/repository/requests/resource/controller en Laravel; enum/pipe/modelo/repository/filtro/form/lista/detalle en Angular). Por tanto se reconstruyeron ambos servicios.
- No se toco la capa SQL (la migracion V11 ya estaba aplicada por el orquestador antes de esta etapa, confirmado en el blueprint de la etapa SQL) ni auth-api.

**1) Rebuild de imagenes:** docker compose build customer-order-api order-flow-app. Exit code 0, ambos servicios reportan Built. Log completo: .claude/artifacts/evidence/CR-001-order-priority/deploy/build-log.txt.

**2) Recreacion de contenedores:** docker compose up -d customer-order-api order-flow-app. Ambos contenedores Recreated/Started/Healthy (dependencias sqlserver/flyway/auth-api ya estaban sanas, no se reiniciaron). Log completo: .claude/artifacts/evidence/CR-001-order-priority/deploy/up-log.txt.

**3) Healthcheck:** docker compose ps tras el rebuild muestra los 4 servicios Up ... (healthy), incluyendo customer-order-api y order-flow-app con "About a minute" de antiguedad (contenedores nuevos). Evidencia: .claude/artifacts/evidence/CR-001-order-priority/deploy/post-rebuild-ps.txt.

**4) Evidencia de que las imagenes realmente cambiaron (antes/despues):**
- customer-order-customer-order-api: creada 2026-07-14T13:43:26Z (antes) -> 2026-07-16T21:46:57Z (despues del rebuild).
- customer-order-order-flow-app: creada 2026-07-14T13:42:14Z (antes) -> 2026-07-16T21:47:33Z (despues del rebuild).
Evidencia: .claude/artifacts/evidence/CR-001-order-priority/deploy/pre-rebuild-state.txt y post-rebuild-image-dates.txt.

**5) Verificacion programatica post-rebuild (backend, Laravel real, puerto 8000):**
- Login real contra auth-api (admin@demo.com) para obtener un JWT valido.
- Pre-rebuild (linea base): GET /api/orders con JWT valido devuelve los 5 pedidos existentes, sin el campo priority en ninguno. Evidencia: pre-rebuild-orders-response.json.
- Post-rebuild: GET /api/orders devuelve los mismos 5 pedidos, ahora cada uno con priority=2 (default Media, consistente con el golden master de SQL que dejo los 5 pedidos preexistentes en Priority=2). Evidencia: post-rebuild-orders-response.json.
- Filtro negativo: GET /api/orders?priority=3 antes de crear ningun pedido nuevo devuelve 0 items preexistentes con prioridad Alta (ninguno de los 5 la tiene), confirmando que el filtro no da falsos positivos.
- Filtro positivo end-to-end: POST /api/orders con priority=3 (pedido temporal id=11) responde HTTP 200, priority=3 en la respuesta. GET /api/orders?priority=3 devuelve exactamente 1 item (id=11, priority=3), pagination.total=1. Confirma que el filtro EloquentOrderRepository::findAll() funciona contra el contenedor real reconstruido, no solo en tests.
- Limpieza: DELETE /api/orders/11 responde HTTP 200. GET /api/orders sin filtro vuelve a mostrar pagination.total=5 (BD restaurada a su estado de 5 pedidos, sin dejar datos de prueba).
- Evidencia completa: .claude/artifacts/evidence/CR-001-order-priority/deploy/post-rebuild-priority-filter.txt.

**6) Verificacion programatica post-rebuild (frontend, Angular real, puerto 4200):**
- curl -I http://localhost:4200/ responde HTTP 200 (servidor SSR de Express responde). Dado que es una SPA con guard de autenticacion client-side, un curl a /orders solo devuelve el shell HTML inicial (confirmado, no trae datos server-rendered dependientes de sesion): no es evidencia suficiente de que el bundle tiene el cambio, tal como advierte el contrato de esta etapa.
- Evidencia mas robusta usada en su lugar: inspeccion directa de los chunks compilados dentro del contenedor ya reconstruido: docker exec order-flow-app grep -rl chip-priority- /app/dist encontro 4 archivos (2 chunks server, 2 chunks browser). grep -rl priorityLabel (nombre del pipe nuevo) encontro 6 archivos. grep -rlo Baja (etiqueta del pipe) encontro coincidencias en el chunk server y en el chunk browser que ya matcheaban priorityLabel. Esto confirma que el bundle que sirve el contenedor recien construido incluye las clases CSS (chip-priority-1/2/3), el pipe (priorityLabel) y las etiquetas en espanol (Baja) del contrato de la seccion 3 del CR.
- Evidencia completa: .claude/artifacts/evidence/CR-001-order-priority/deploy/post-rebuild-frontend-curl.txt y post-rebuild-angular-bundle-grep.txt.

**7) Evidencia visual (screenshot):** omitida. Playwright no esta instalado en is-order-flow-app (ni en node_modules ni en package.json); npx playwright lo habria descargado/instalado de cero, lo cual excede herramienta ya instalada en el proyecto segun el alcance de esta etapa. No se instalo tooling nuevo. Esto no bloquea la etapa (explicitamente opcional); la confirmacion visual queda, como siempre, a cargo del hard-refresh del humano.

**No reconstruido (y por que):**
- sqlserver, sqlserver-init: sin cambios de codigo, no aplica rebuild (son imagenes de terceros).
- flyway: la migracion V11 ya fue aplicada contra la BD real por el orquestador en la etapa SQL (installed_rank 11 confirmado); no se volvio a ejecutar flyway migrate en esta etapa (no es responsabilidad de deploy-agent aplicar migraciones).
- auth-api: ningun archivo de AuthService/ aparece modificado en el diff de las 4 etapas previas; el CR declara explicitamente que no lo toca. No se reconstruyo.

**Hallazgos / bloqueos:** ninguno. Ambos builds terminaron con exit code 0 en el primer intento (sin necesidad de reintento por cache corrupta ni ningun otro problema transitorio). No hubo errores de compilacion ni de configuracion que escalar al orquestador.

**Fin:** 2026-07-16. **Estado: completed, aprobado por el humano** tras hard-refresh y confirmacion visual en http://localhost:4200 (columna Prioridad en la lista, badge en el detalle, filtro en la barra superior, selector Media preseleccionado en el modal de creacion). Servicios reconstruidos: customer-order-api, order-flow-app (ambos healthy). Evidencia programatica confirma que el entorno vivo ya sirve el campo priority (GET /api/orders lo expone, GET /api/orders?priority=3 filtra correctamente, POST /api/orders lo persiste) y que el bundle Angular compilado contiene las clases/pipe/etiquetas del badge de prioridad.

---

## Métricas de ejecución

| Etapa   | Tiempo agente | Tool calls | Checkpoints | Estimado manual | Ahorro |
|---------|---------------|------------|-------------|------------------|--------|
| SQL     | ~5 min        | 28         | 1           | 45–90 min        | ~93%   |
| Laravel | ~15 min       | 68         | 1           | 4–6 h            | ~95%   |
| Angular | ~57 min       | 84         | 1           | 3–5 h            | ~76%   |
| Testing | ~67 min       | 89         | 1           | 1.5–2.5 h        | ~45%   |
| Deploy  | ~39 min       | 49         | 1           | 45–90 min        | ~42%   |
| **Total** | **~183 min (≈3.05 h)** | **318** | **5** | **≈13.25 h**    | **~77%** |

**ROI de punta a punta:** ≈3.05 h de trabajo automatizado (cómputo de los 5 subagentes + 5 checkpoints humanos) vs ≈13.25 h de estimado manual de referencia → **≈4.3× más rápido**.

> Nota: "Estimado manual" es un rango de referencia por tipo de cambio (no una medición del equipo), tomado de los valores por defecto del pipeline: SQL 45–90 min, Laravel 4–6 h, Angular 3–5 h, Testing 1.5–2.5 h, Deploy 45–90 min. El Ahorro y el ROI se calculan contra el punto medio de cada rango. El Paso 0.5 de reconciliación de entorno no encontró drift, por lo que no se sumó tiempo adicional de reconciliación.
