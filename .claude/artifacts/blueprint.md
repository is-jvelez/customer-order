# Blueprint — CR-001: Prioridad de Pedidos

**CR:** `change-requests/CR-001-order-priority.md`
**Capas afectadas:** SQL Server · Laravel 11 · Angular 21
**Riesgo:** Bajo (campo aditivo, sin lógica de negocio)

## Contrato de datos (resumen)
- Columna SQL: `Priority TINYINT NOT NULL DEFAULT 2`
- JSON API: `priority` (entero 1–3; 1=Baja, 2=Media, 3=Alta)
- Query param: `?priority=<1|2|3>`
- Enum Laravel: `App\Enums\OrderPriority`
- Enum Angular: `OrderPriority`

---

## Etapa SQL

**Inicio:** 2026-07-15 · **Fin:** 2026-07-15 · **Estado:** completed (aprobado por el humano) · **Migración aplicada a la BD real:** sí (ver adenda debajo, ejecutada por el orquestador antes de la etapa Deploy)

- **Golden master (línea base):** capturado por inspección estática de las migraciones ya
  aplicadas (`V3`, `V4`, `V5`, `V6`, `V8`) — el hook `guard-sql-apply.ps1` bloquea toda
  conexión real a SQL Server (`sqlcmd`/`Invoke-Sqlcmd`/`bcp`/`flyway migrate`), así que no se
  ejecutó ninguna consulta contra la BD viva; los `Total` se derivan por cálculo determinista
  de la lógica del trigger. Documento completo: `flyway/golden/CR-001-orders-golden-master.md`.
  - Esquema actual de `Orders` (sin `Priority`): `Id, CustomerId, Status, Total, Notes,
    CreatedAt, UpdatedAt` (ver detalle de tipos/defaults en el golden master).
  - Triggers intactos y sin referencia a `Priority`: `TR_Orders_UpdatedAt`,
    `TR_OrderItems_RecalcTotal` (`V5__triggers.sql`) — no se tocan.
  - `Total` calculado hoy por el trigger para los 5 pedidos sembrados (`V6__seed_data.sql`):
    Order 1 = 949.99, Order 2 = 375.50, Order 3 = 120.00, Order 4 = 150.00, Order 5 = 124.99.
  - Test de trigger propuesto (no ejecutado, pendiente de que un humano con acceso a BD lo
    corra antes/después de aplicar): insert con items 2×15.50 + 1×100.00 → `Total` esperado
    = 131.00, `UpdatedAt > CreatedAt`.
  - **Discrepancia resuelta por el humano:** el CR decía "6 pedidos existentes"; confirmado
    que el conteo real es **5** (coincide con el seed `V6`). El resto de este documento usa 5.
- **Migración creada:** `flyway/sql/V11__add_order_priority.sql` — añade
  `Priority TINYINT NOT NULL DEFAULT 2` (constraint `DF_Orders_Priority`) a `Orders` vía
  `ALTER TABLE ... ADD` (idempotente con `IF COL_LENGTH(...) IS NULL`) y el índice
  `IX_Orders_Priority` sobre `(Priority)` (idempotente con `IF NOT EXISTS` sobre
  `sys.indexes`). No crea stored procedures, no modifica los triggers existentes, no valida
  rango en SQL (esa validación 1–3 queda en el Form Request de Laravel por diseño del CR,
  sección 4.2).
- **Test de esquema:** `flyway/golden/CR-001-schema-verification.sql` — verifica tipo/default
  de la columna, existencia del índice, que las filas preexistentes queden en `Priority = 2`,
  y repite el test de trigger post-migración. No ejecutado (mismo motivo de HITL).
- **Confirmación de compatibilidad hacia atrás:** columna `NOT NULL` con `DEFAULT (2)` →
  las filas existentes se rellenan automáticamente sin necesidad de `UPDATE` manual; ninguna
  columna existente cambia de tipo/nullability/default; ningún dato se destruye o recalcula.
- **Sugerencia fuera de alcance (no implementada):** un `CHECK` constraint en SQL para
  `Priority IN (1,2,3)` sería una red de seguridad adicional, pero el CR no lo pide (la
  validación de rango vive en Laravel) y añadirlo excedería el alcance declarado — se anota
  aquí solo como sugerencia para el humano, sin implementarla.

### Adenda — Aplicación real de la migración (post-Testing, pre-Deploy, 2026-07-16)

Tras la etapa Testing, el orquestador ejecutó `docker compose up -d flyway` (aprobación humana
explícita) para aplicar `V11__add_order_priority.sql` contra la BD real. Flyway rechazó el
`migrate` por **mismatch de checksum**: la versión 11 ya constaba como aplicada
(`installed_on: 2026-07-15 02:46:02`) con un checksum distinto al del archivo del repo —
evidencia de un intento anterior de este mismo CR, no rastreado por este pipeline.

Investigación antes de tocar nada: el esquema real de `Orders` ya tenía `Priority TINYINT
NOT NULL DEFAULT 2` + índice `IX_Orders_Priority`, idéntico en forma al `V11` del repo. Pero
la tabla tenía **7 filas** (Id 1–6 y 9, huecos en 7–8) en vez de las 5 confirmadas: las filas
6 (`Priority=2`) y 9 (`Priority=3`) eran pedidos de prueba creados con `POST` reales contra la
API, antes de correr este pipeline formalmente. Esto explica también el `known_issue`
`env-drift-customer-order-api` reportado por el laravel-agent (el contenedor vivo ya servía
`priority` con 7 pedidos).

Con aprobación humana explícita se ejecutó:
1. `docker compose run --rm flyway repair` — reconcilia el checksum del historial de Flyway
   con el archivo del repo (no altera esquema ni datos, que ya eran correctos). Confirmado
   después con `docker compose up -d --force-recreate flyway`: `Successfully validated 11
   migrations` / `Schema up to date`.
2. Limpieza de las 2 filas de prueba: `DELETE FROM OrderItems WHERE OrderId IN (6,9)` seguido
   de `DELETE FROM Orders WHERE Id IN (6,9)`. `Orders` vuelve a tener exactamente 5 filas
   (Id 1–5), coincidiendo con el baseline confirmado en la sección de golden master arriba.

Migración formalmente aplicada y validada. Ambos `known_issues` marcados `resolved: true` en
`status-pipeline.json`. Pendiente real para la etapa Deploy: el contenedor `customer-order-api`
en ejecución sigue corriendo la imagen VIEJA (sin `priority` en el código), así que aún no
refleja ni el código nuevo ni el esquema ya migrado — se resuelve reconstruyendo esa imagen.

## Etapa Laravel

**Inicio:** 2026-07-15 · **Fin:** 2026-07-16 · **Estado:** completed (checkpoint humano pendiente — HITL menos crítico, no muta BD real)

- **Anomalía de entorno detectada (importante para el orquestador/deploy-agent):**
  el contenedor `customer-order-api`, ya corriendo y sano en este entorno, respondió
  a `GET /orders` con el campo `priority` **ya presente** (valores 2 y 3) y con **7
  pedidos** (no los 5 confirmados por el humano ni los 6 del CR original). El código
  en disco (HEAD, antes de esta etapa) no tenía `priority` en ningún archivo fuente
  — confirmado por lectura directa. Conclusión: la imagen Docker y/o la BD real están
  desincronizadas del repo (probable prototipo/prueba manual previa de este mismo CR,
  o pipeline anterior interrumpido). No se usó esa respuesta como "antes" del golden
  master (ya contenía el campo que este CR debía introducir); se usó como referencia
  de la forma esperada del "después" y para derivar el "antes" quitando `priority`.
  Detalle completo en `CustomerOrderService/tests/golden/README.md`.
- **Golden master:** `CustomerOrderService/tests/golden/` — `orders_index.before.json`,
  `orders_show.before.json` (derivados quitando `priority`, validado contra el `git diff`
  de `OrderResource.php`: el único cambio en el array de salida es esa clave nueva),
  `orders_index.after.sample.json`, `orders_show.after.sample.json` (muestra real
  capturada del contenedor, coincide con la forma que produce el código editado),
  `dashboard_stats.json` (capturado en vivo; `getStats()` no se tocó, válido como
  "antes" y "después" a la vez). Resultado: campos previos idénticos en tipo, presencia
  y orden; único campo nuevo `priority` (entero 1–3) insertado entre `status` y `total`.
- **Archivos de código tocados:**
  - Nuevo: `app/Enums/OrderPriority.php` (Low=1, Medium=2, High=3).
  - `app/Infrastructure/Persistence/Models/OrderModel.php`: `Priority` en `$fillable`
    y `$casts` (cast nativo a `OrderPriority`).
  - `app/Domain/Orders/Entities/Order.php`: propiedad `priority` (default `Medium`
    para no romper los `new Order(...)` existentes en tests — compatibilidad hacia atrás).
  - `app/Infrastructure/Persistence/Mappers/OrderMapper.php`: `toDomain()` mapea
    `Priority` (modelo, ya enum por el cast) → `priority` (dominio).
  - `app/Infrastructure/Persistence/Repositories/EloquentOrderRepository.php`: filtro
    `if (!empty($filters['priority'])) { $query->where('Priority', (int) $filters['priority']); }`
    en `findAll()` (mismo estilo que `status`/`customer_id`); `Priority` incluida en
    `create()` y `update()`.
  - `app/Http/Resources/Order/OrderResource.php`: expone `priority` (entero) entre
    `status` y `total`.
  - `app/Http/Requests/Order/CreateOrderRequest.php` y `UpdateOrderRequest.php`:
    regla `['sometimes','nullable','integer','in:1,2,3']` para `priority`.
  - `app/Http/Controllers/Api/OrderController.php`: `index()` agrega `priority` a
    `$filters` desde query params; `store()`/`update()` arman el DTO con `priority`.
  - **Fuera de la lista original del CR pero necesario para que el dato fluya end-to-end**
    (arquitectura en capas de este proyecto usa Application/DTOs + Service, no solo
    Model/Entity/Mapper/Repository): `CreateOrderDTO`, `UpdateOrderDTO`, `OrderService`
    (`IOrderService`), `IOrderRepository` — todos actualizados de forma coordinada para
    transportar `priority` desde el controller hasta el repository. Se detectó y corrigió
    además un bug potencial propio de este cambio: `OrderService::changeStatus()` (usado
    por `complete()`/`cancel()`) reconstruía la entidad `Order` sin pasar `priority`, lo
    que habría reseteado silenciosamente la prioridad a Media en cada cambio de estado;
    se corrigió preservando `$order->priority`. Cubierto por test de regresión.
  - Fixture de test (no es el esquema real, es el doble SQLite de
    `tests/Support/Database/UsesCustomerOrderSqliteSchema.php`): se añadió
    `Priority` (`unsignedTinyInteger`, default 2) para poder correr tests de
    integración reales contra la nueva columna sin tocar SQL Server.
- **Tests:** 113 tests / 323 assertions, **OK** — corridos de verdad (no solo
  inspección estática) contra el código editado, en un contenedor efímero
  (`composer:2`, con `composer install` incluyendo dev deps) montando el código del
  host, sin tocar el contenedor `customer-order-api` en ejecución. Incluye: cast del
  enum (`OrderPriorityTest`, `OrderMapperTest`), `create()`/`update()` sin `priority`
  → persiste 2 y con 3 → persiste 3 (`OrderServiceTest`,
  `EloquentOrderRepositoryIntegrationTest`), Form Request rechaza 0/4/9/"x"
  (`OrderPriorityValidationTest`), feature test de `GET /orders?priority=3` a nivel
  repository (filtra solo Alta) y a nivel controller (forwarding del query param),
  `OrderMapper` en ambos sentidos. Un test preexistente (`UpdateOrderRequest` solo
  permitía `notes`) se actualizó intencionalmente porque el propio CR extiende ese
  Form Request. Como la migración Flyway V11 no está aplicada contra SQL Server real,
  la validación de integración corrió contra el fixture SQLite (arriba), no contra
  MSSQL — pendiente repetir tras aplicar la migración real y redeploy.
- **Contrato hacia Angular:** campo JSON `priority` (entero 1–3), query param
  `?priority=<1|2|3>`, se envía igual en `POST`/`PUT /orders` (body `priority`,
  opcional, default 2 si se omite en creación).
- **Sugerencia fuera de alcance (no implementada):** no hay endpoint de actualización
  de prioridad probado a nivel HTTP para el caso "sin autenticación"/permisos (el CR
  marca permisos como fuera de alcance) — se anota solo como posible mejora futura.

> **Pendiente para la etapa Deploy:** investigar/resolver la anomalía de entorno
> reportada arriba (contenedor `customer-order-api` desincronizado del repo — ya
> servía `priority` y 7 pedidos antes de que este CR tocara código). Registrada
> también en `status-pipeline.json` → `known_issues`. El humano decidió posponerla
> a la etapa deploy en vez de investigarla ahora.

## Etapa Angular

**Inicio:** 2026-07-16 · **Fin:** 2026-07-16 · **Estado:** completed, tests confirmados

- **Descubrimiento previo:** no existía ningún archivo `.spec.ts` en `features/orders`
  (solo `src/app/app.spec.ts` en todo el proyecto). El runner no es Karma/Jasmine sino el
  builder `@angular/build:unit-test` de Angular 21 (respaldado por Vitest, ver
  `angular.json`/`package.json`), expuesto con API tipo Jasmine (`describe/it/expect`).
  Se detectó además que **no existe funcionalidad de edición de pedidos en Angular hoy**
  (`IOrderRepository` solo tiene `getAll/getById/create/complete/cancel/delete`, sin
  `update()`; el modal `OrderFormComponent` solo tiene modo "Nuevo Pedido"), aunque
  Laravel ya soporta `PUT /orders/{id}` con `priority` (contrato de la etapa anterior).
  Por tanto `priority` se implementó en el flujo de creación (el único que existe); no se
  inventó un flujo de edición nuevo — sería expandir el alcance de este CR. Anotado como
  sugerencia para un CR futuro, no implementado.
- **Bloqueo de entorno (HITL) — resuelto:** `node_modules` no estaba instalado en
  `is-order-flow-app` y el hook `guard-angular.ps1` bloqueaba `npm install/ci` sin
  aprobación humana. El humano aprobó instalar dependencias; con `node_modules` presente,
  `npm test` seguía sin poder invocarse en Windows por el `&` literal en la ruta del
  proyecto (`...Grupo Torres & Torres...`), así que el comando de referencia pasó a ser
  `node ./node_modules/@angular/cli/bin/ng.js test --watch=false` (invoca el binario de
  Angular CLI directamente, evitando que `npm` intente resolver el path con `&`).
  Primer intento de ejecución real: fallaba en bloque con "NG0xxx: Providers from
  `@angular/animations`... not found" en los seis specs nuevos porque el proyecto usa
  Angular Material sin `provideAnimations()/provideNoopAnimations()` en ningún
  `TestBed.configureTestingModule`; se añadió `provideNoopAnimations()` (de
  `@angular/platform-browser/animations`) a los providers de los seis specs nuevos,
  lo cual desbloqueó la ejecución.
- **Falso positivo detectado y corregido:** tras el fix de animaciones, la suite reportaba
  los 4 tests de `order-list.component.spec.ts` como "passed" pero Vitest emitía 4
  excepciones no manejadas `NG0201: No provider found for ActivatedRoute` (el runner mismo
  las señaló como riesgo de falso positivo). Causa: `order-list.component.ts` usa
  `[routerLink]` en el template (link al detalle de cada pedido) y el `TestBed` del spec
  no proveía router. A diferencia de `order-detail.component.spec.ts` (que inyecta
  `ActivatedRoute` directamente vía `TestBed.inject`), aquí el problema era la directiva
  `RouterLink` en una fila de la tabla, no una inyección directa — se corrigió añadiendo
  `provideRouter([])` (de `@angular/router`) a los providers de
  `order-list.component.spec.ts`, junto al `provideNoopAnimations()` ya presente.
- **Resultado final confirmado por ejecución real** (`ng test --watch=false`, sin
  `--watch`): **Test Files 6 passed / 1 failed (7)**, **Tests 21 passed / 1 failed (22)**,
  **0 errores no manejados atribuibles a CR-001**. Los 6 specs de CR-001
  (`priority-label.pipe.spec.ts`, `order.repository.spec.ts`, `order-form.component.spec.ts`,
  `order-filters.component.spec.ts`, `order-list.component.spec.ts`,
  `order-detail.component.spec.ts`) pasan limpio, sin excepciones no manejadas. La única
  falla remanente es `app.spec.ts > should render title`, preexistente y no relacionada con
  este CR (falla por un `AssertionError` de matcher, con un `NG04002: Cannot match any
  routes. URL Segment: 'auth/login'` como error no manejado asociado — problema de
  configuración de rutas del shell de la app, fuera del alcance de este CR).
- **Golden master:** capturado por lectura directa del código antes de tocar nada (no por
  ejecución, ver bloqueo arriba). Antes del cambio: lista con columnas
  `['id','customer','status','total','createdAt','actions']`, badges de Estado con clases
  `chip-pending/inprogress/completed/cancelled` vía `StatusLabelPipe`; detalle con un solo
  chip de Estado; modal solo con Cliente + Notas. Tras el cambio, mismas columnas/badges de
  Estado sin alterar, más la columna/badge de Prioridad añadida en la posición declarada
  por el CR. Se escribieron specs de caracterización (`order-list.component.spec.ts`,
  `order-detail.component.spec.ts`) que verifican explícitamente que el badge de Estado
  (`chip-pending`/"Pendiente", `chip-inprogress`/"En Progreso") sigue renderizando igual.
- **Archivos de código tocados:**
  - `shared/constants/app.constants.ts`: nuevo `enum OrderPriority { Low=1, Medium=2,
    High=3 }` y `ORDER_PRIORITIES` (array para iterar en selects/dropdowns), junto a
    `OrderStatus`/`ORDER_STATUSES` ya existentes.
  - Nuevo `shared/pipes/priority-label.pipe.ts`: pipe `priorityLabel`, mismo patrón exacto
    que `status-label.pipe.ts` (mapa `Record<number,string>` + fallback al valor crudo).
  - `features/orders/domain/models/order.model.ts`: `priority: OrderPriority` en `Order`
    (entre `status` y `total`); `priority?: number` en `OrderFilterParams`; `priority?:
    OrderPriority` en `CreateOrderRequest`.
  - `features/orders/infrastructure/order.repository.ts`: `RawOrder.priority`; `mapOrder()`
    lo traduce a `Order.priority`; `getAll()` añade `priority` como query param si viene en
    los filtros; `create()` incluye `priority` en el body (si se omite, `JSON.stringify`
    elimina la clave `undefined` y el backend persiste el default 2/Media).
  - `ui/components/order-filters/order-filters.component.ts`: nuevo control `priority` y
    dropdown "Prioridad" (opción "Todas" + `ORDER_PRIORITIES` vía `priorityLabel`), mismo
    patrón que el dropdown de Estado; incluido en `applyFilters()`/`clearFilters()`.
  - `ui/components/order-form/order-form.component.ts` (modal, hoy solo de creación):
    nuevo control `priority` preseleccionado en `OrderPriority.Medium`, selector debajo de
    "Notas"; se envía en `orderService.create(...)`.
  - `ui/pages/list/order-list.component.ts`: columna `priority` entre `status` y `total`
    (`columns` actualizado), celda con `mat-chip` + clase `chip-priority-{1|2|3}` +
    `priorityLabel`; estilos `chip-priority-1/2/3` (gris/amarillo/rojo) junto a los de
    Estado ya existentes.
  - `ui/pages/detail/order-detail.component.ts`: segundo `mat-chip` de prioridad junto al
    de Estado en `mat-card-subtitle`, mismas clases/pipe; pequeño `margin-right` añadido
    solo para separar los dos chips (no se tocó ningún otro estilo).
- **Tests nuevos (escritos y ejecutados — ver resultado final confirmado arriba):**
  `priority-label.pipe.spec.ts` (mapeo 1/2/3 → Baja/Media/Alta + fallback),
  `order.repository.spec.ts` (query param `priority` presente/ausente, mapeo del JSON
  crudo, `priority` en el body de `create()` presente/ausente),
  `order-form.component.spec.ts` (el form arranca en `OrderPriority.Medium`, se puede
  cambiar, se envía en `create()`), `order-filters.component.spec.ts` (emite `priority` al
  aplicar filtros, lo omite en "Todas", `clearFilters()` lo resetea),
  `order-list.component.spec.ts` y `order-detail.component.spec.ts` (badge por cada valor
  1/2/3 con la clase y etiqueta correctas, más las aserciones de golden master ya descritas).
- **Sugerencias fuera de alcance (no implementadas):** (1) no existe modal/flujo de edición
  de pedidos en Angular — si se quisiera permitir cambiar la prioridad de un pedido ya
  creado desde la UI, haría falta construir esa función primero (fuera de este CR); (2) no
  se añadió ordenamiento por columna de prioridad en la tabla (explícitamente fuera de
  alcance, CR sección 7).

## Etapa Testing

**Inicio:** 2026-07-16 · **Fin:** 2026-07-16 · **Estado:** completed (gate de calidad
transversal, solo lectura — verificación independiente de las 3 capas, sin modificar
código de implementación).

### 1. Golden masters — consistencia entre capas y contra el contrato del CR (sección 3)

Verificados por inspección directa de los tres artefactos (`flyway/golden/CR-001-orders-golden-master.md`
+ `CR-001-schema-verification.sql`, `CustomerOrderService/tests/golden/*`, specs Angular):
**consistentes entre sí y con el contrato**. Mismo nombre de columna (`Priority`), mismos
valores 1/2/3, mismo default 2 en las tres capas:
- SQL: `V11__add_order_priority.sql` añade `Priority TINYINT NOT NULL DEFAULT (2)`
  (`DF_Orders_Priority`) + `IX_Orders_Priority`, ambos bloques idempotentes
  (`IF COL_LENGTH(...) IS NULL` / `IF NOT EXISTS ... sys.indexes`); no toca
  `TR_Orders_UpdatedAt` ni `TR_OrderItems_RecalcTotal`; no valida rango en SQL (por diseño,
  la validación 1-3 vive en el Form Request de Laravel). Coincide exactamente con lo
  documentado en el golden master.
- Laravel: `orders_index.before.json`/`after.sample.json` y `orders_show.before/after`:
  único campo nuevo `priority` (entero 1-3) insertado entre `status` y `total`; el resto de
  campos, tipos, orden y `pagination.*` idénticos; `dashboard_stats.json` sin cambios
  (`getStats()` no tocado — confirmado también por `git diff`, sin matches de
  `getStats`/`getOrdersByDay`/`getOrdersByMonth` en `EloquentOrderRepository.php`).
- Angular: `OrderPriority` (`Low=1, Medium=2, High=3`) en `app.constants.ts`,
  `PriorityLabelPipe` mapea 1/2/3 → Baja/Media/Alta, clases `chip-priority-1/2/3` con
  colores `#F5F5F5/#616161` (gris, Baja), `#FFF8E1/#F57F17` (amarillo, Media),
  `#FFEBEE/#C62828` (rojo, Alta) — coincide exactamente con la sección 3 del CR
  (Alta=rojo, Media=amarillo, Baja=gris).
- **Nota de contexto (no es un fallo nuevo):** los golden masters de Laravel se derivaron
  de una respuesta del contenedor `customer-order-api` en vivo que ya reflejaba el
  `known_issue` `env-drift-customer-order-api` (7 pedidos, `priority` ya presente) —
  documentado y explicado por el laravel-agent, no investigado aquí por estar fuera de mi
  alcance (reservado a la etapa deploy). No invalida la consistencia lógica del contrato
  verificada arriba: los valores/nombres siguen siendo correctos independientemente del
  conteo de filas del entorno vivo.

**Veredicto golden masters: PASA.** Ninguna diferencia fuera de lo esperado (solo el campo
`priority` aditivo en las tres capas).

### 2. Suites de prueba — re-ejecutadas de forma independiente (no solo confiar en lo reportado)

- **Laravel:** identifiqué el mecanismo real (no hay PHP/Composer instalados en el host;
  se corrió PHPUnit dentro de un contenedor efímero `composer:2`, montando el código del
  host de solo lectura de datos — sin tocar el contenedor `customer-order-api` en
  ejecución, igual que hizo el laravel-agent): `docker run --rm -v <repo>/CustomerOrderService:/app
  -w /app composer:2 php vendor/bin/phpunit`. **Resultado: OK — 113 tests, 323 assertions.**
  Coincide exactamente con lo reportado por el laravel-agent. **PASA.**
- **Angular:** `node ./node_modules/@angular/cli/bin/ng.js test --watch=false` en
  `is-order-flow-app/`. **Resultado: Test Files 6 passed / 1 failed (7); Tests 21 passed /
  1 failed (22).** Los 6 specs de CR-001 (`priority-label.pipe`, `order.repository`,
  `order-form.component`, `order-filters.component`, `order-list.component`,
  `order-detail.component`) pasan limpio. La única falla es `app.spec.ts > should render
  title`, preexistente, no relacionada con CR-001 (error de matcher + `NG04002` de
  ruteo del shell de la app) — coincide exactamente con lo reportado por el angular-agent
  y con lo ya aceptado por el humano como fuera de alcance. **PASA (con la falla
  preexistente ya aceptada).**
- **SQL:** no hay suite ejecutable contra BD real (migración V11 aún no aplicada; el
  hook `guard-testing.ps1` en todo caso no bloquea consultas de solo lectura, pero no hay
  servidor con el esquema nuevo contra el cual correr). Verificación por **inspección
  estática**: `V11__add_order_priority.sql` es sintácticamente correcto (bloques
  `IF ... BEGIN ... END` balanceados, `GO` en los lugares correctos), usa el mismo nombre
  de BD (`CustomerOrdersDB`) y esquema (`dbo.Orders`) que las migraciones previas, y sus
  aserciones esperadas coinciden con `CR-001-schema-verification.sql`
  (`DataType=tinyint`, `IsNullable=0`, `DefaultDefinition='((2))'`, índice sobre
  `Priority`). No puede darse por "pasada" en el sentido de ejecución real — queda
  **pendiente de ejecución real tras aplicar la migración** (ver sección 3).

### 3. Integración end-to-end (sección 6.3 del CR)

**No se pudo ejecutar el flujo real completo** (crear pedido Alta desde el frontend vivo →
verificar `Priority=3` en SQL Server real → badge rojo en la lista servida por el
contenedor reconstruido → filtrar): la migración V11 no está aplicada contra la BD real y
los contenedores `customer-order-api`/`order-flow-app` no se han reconstruido con el
código de esta etapa (aparte, el contenedor `customer-order-api` vivo hoy está en el
estado de `env-drift` ya documentado, no en el estado "sin priority" que sería el punto de
partida correcto para esa prueba). Esto es exactamente lo esperado según el estado real
del entorno comunicado para esta etapa, no un fallo de la etapa Testing.

**Lo que sí cubre una aproximación equivalente, ya ejecutada de forma independiente por
mí en este paso:**
- El feature test de Laravel `GET /orders?priority=3` (ejecutado arriba, dentro de los 113
  OK) cubre creación + filtrado a nivel de API/repository: confirma que un pedido con
  `priority=3` persiste y que el filtro devuelve solo los de prioridad Alta, sin afectar el
  comportamiento sin filtro.
- Los specs Angular `order-form.component.spec.ts` (creación con prioridad, default Media),
  `order-list.component.spec.ts` (badge rojo/amarillo/gris según valor 1/2/3) y
  `order-filters.component.spec.ts` (filtro emite `priority` correctamente) cubren el flujo
  de UI de forma aislada (mocks, sin backend real).

**Pendiente real para después del deploy:** el recorrido end-to-end contra el entorno vivo
(navegador → API real → SQL Server real) una vez: (a) se resuelva el `known_issue`
`env-drift-customer-order-api`, (b) se aplique `V11__add_order_priority.sql` contra la BD
real, y (c) se reconstruyan las imágenes de `customer-order-api`/`order-flow-app`. Esa
verificación queda fuera del alcance de esta etapa y debe correrla el deploy-agent o un
humano inmediatamente después del redeploy.

### 4. Criterios de aceptación (CR sección 5) — uno por uno

| # | Criterio | Estado |
|---|---|---|
| 1 | Migración aplica sin pérdida de datos; 5/6 pedidos existentes quedan en `Priority=2` | **Pendiente de aplicar** (verificado por inspección estática que la migración es `ADD COLUMN NOT NULL DEFAULT`, compatible hacia atrás; no ejecutable hasta el apply real) |
| 2 | `GET /orders` devuelve `priority` (1-3) en cada pedido | **Cubierto** — golden master + 113 tests OK (fixture SQLite) |
| 3 | `GET /orders?priority=3` devuelve solo Alta | **Cubierto** — feature test dedicado, OK |
| 4 | `GET /orders` sin el param devuelve todos (comportamiento previo intacto) | **Cubierto** — golden master + tests OK |
| 5 | `POST /orders` sin `priority` → persiste 2 | **Cubierto** — test dedicado, OK |
| 6 | `POST /orders` con `priority=3` persiste 3; valores inválidos (0,4,"x") → error validación | **Cubierto** — `OrderPriorityValidationTest`, OK |
| 7 | Badge de prioridad con color correcto en la lista | **Cubierto** — `order-list.component.spec.ts`, OK |
| 8 | Filtro de prioridad en la barra superior filtra la tabla | **Cubierto** — `order-filters.component.spec.ts` (unidad) + feature test Laravel (API); falta el recorrido real end-to-end contra backend vivo |
| 9 | Modal de creación con "Media" preseleccionada, editable | **Cubierto** — `order-form.component.spec.ts`, OK |
| 10 | Detalle muestra el badge de prioridad | **Cubierto** — `order-detail.component.spec.ts`, OK |

**8/10 criterios con evidencia de test/golden master pasando; 2/10 (el #1 y, parcialmente,
la mitad "real" del #8) dependen de que la migración se aplique y de que se redeploy los
contenedores** — ambos fuera del alcance de esta etapa, a ejecutar en la etapa Deploy.

### 5. Alcance (CR sección 7)

Revisado con `git status`/`git diff` sobre las tres capas:
- **Sin cambios fuera de lo declarado** en el núcleo del feature (nombres, valores, capas
  tocadas coinciden 1:1 con las secciones 4.1-4.3 del CR).
- Dos extensiones ya transparentemente documentadas por los agentes de capa (no
  descubiertas ahora, confirmadas aquí por revisión de diff):
  - Laravel tocó `CreateOrderDTO`/`UpdateOrderDTO`/`OrderService`/`IOrderService`/
    `IOrderRepository` (capa Application/DTOs no listada explícitamente en el CR) — 
    necesario en esta arquitectura para que `priority` fluya del controller al repository;
    diff mínimo (8 inserciones / 2 eliminaciones en 5 archivos), sin lógica de negocio nueva
    fuera de preservar `priority` en `changeStatus()` (fix de regresión, cubierto por test).
  - Angular agregó `@angular/animations` como dependencia de producción (antes ausente) y
    `provideNoopAnimations()`/`provideRouter([])` en specs — necesario para que Angular
    Material funcione con animaciones y para que el TestBed resuelva `RouterLink`; no es
    lógica de negocio, es infraestructura de testing/runtime ya aprobada por el humano en
    la etapa Angular.
- No se detectaron cambios en ordenamiento por prioridad, asignación automática,
  notificaciones, permisos, ni en el AuthService — todos correctamente fuera de alcance
  como pide la sección 7 del CR.
- `.claude/settings.local.json` y los archivos nuevos de `.claude/agents|commands|scripts`
  son infraestructura del propio pipeline (no código de las 3 capas del feature).

**Veredicto alcance: PASA**, sin regresiones de scope creep silencioso.

### Veredicto final de la etapa Testing

- **Golden masters: PASA** (consistentes entre capas y con el contrato).
- **Suites: PASA** — Laravel 113/113 (323 assertions) re-ejecutado independientemente;
  Angular 21/22 (6/7 archivos) re-ejecutado independientemente, única falla preexistente y
  aceptada.
- **SQL:** correcto por inspección estática; **ejecución real pendiente** del apply.
- **End-to-end real: NO ejecutable en este momento** (migración no aplicada, contenedores
  no reconstruidos, `env-drift` sin resolver) — cubierto de forma aproximada por tests
  aislados de API y de UI, documentado arriba qué falta.
- **Criterios de aceptación: 8/10 con evidencia verde; 2/10 pendientes de la etapa Deploy.**
- **Alcance: limpio**, sin cambios no declarados fuera de dos extensiones ya
  transparentadas y justificadas por necesidad arquitectónica.
- **No se modificó código de ninguna capa en esta etapa** (rol de solo lectura respetado).

**Recomendación al humano:** el pipeline puede avanzar a la etapa Deploy. Antes de dar el
CR por completamente cerrado (Definition of Done, sección 9), la etapa Deploy debe: (1)
resolver `env-drift-customer-order-api`, (2) aplicar `V11__add_order_priority.sql` contra
SQL Server real, (3) reconstruir `customer-order-api`/`order-flow-app`, y (4) repetir el
recorrido end-to-end real de la sección 6.3 contra el entorno reconstruido — solo entonces
los criterios #1 y #8(real) quedan verdes y el CR puede marcarse Done en su totalidad.

## Etapa Deploy

**Inicio:** 2026-07-16 (tras aprobacion de Testing y de la adenda de aplicacion real de la migracion SQL) - **Estado:** in_progress

**Fin:** 2026-07-16 · **Estado:** completed (evidencia programática recolectada; pendiente checkpoint humano antes del PR)

### Servicios reconstruidos y por qué

Según el blueprint de las etapas Laravel y Angular (archivos tocados listados arriba), los
dos servicios de código cambiaron en esta ejecución del CR:

- **`customer-order-api`** (contexto `./CustomerOrderService`): reconstruido con
  `docker compose build customer-order-api` — el código Laravel tocado (enum `OrderPriority`,
  `OrderModel`, `Order` entidad, `OrderMapper`, `EloquentOrderRepository`, `OrderResource`,
  Form Requests, `OrderController`, DTOs/`OrderService`) estaba en el repo pero la imagen en
  ejecución era anterior a estos cambios (evidencia de la anomalía `env-drift-customer-order-api`
  documentada por laravel-agent, ya resuelta en su parte de datos por el orquestador).
- **`order-flow-app`** (contexto `./is-order-flow-app`): reconstruido con
  `docker compose build order-flow-app` — el código Angular tocado (`app.constants.ts`,
  `priority-label.pipe.ts`, `order.model.ts`, `order.repository.ts`, `order-filters`,
  `order-form`, `order-list`, `order-detail`) no estaba compilado en la imagen anterior.

**NO reconstruido:** `auth-api` (.NET) — el CR declara explícitamente que no lo toca, y el
blueprint de las etapas previas confirma cero archivos tocados en `./AuthService`. `sqlserver`
y `flyway` tampoco requieren rebuild (no son imágenes de código de aplicación; `flyway` ya fue
recreado y validado por el orquestador en la adenda de la etapa SQL).

### Rebuild y recreación — comandos ejecutados

1. `docker compose build customer-order-api order-flow-app` → ambas imágenes construidas sin
   errores (`Image customer-order-customer-order-api Built`, `Image customer-order-order-flow-app
   Built`). Laravel: `composer install --no-dev` con 90 paquetes, autoload optimizado sin
   errores. Angular: `npm ci` + `ng build` sin errores, "Prerendered 7 static routes", único
   warning preexistente de presupuesto de bundle (no relacionado con este CR).
2. `docker compose up -d --force-recreate customer-order-api order-flow-app` → ambos
   contenedores recreados; `sqlserver`, `flyway` (gate de dependencia) y `auth-api` no se
   tocaron (`Up`/`Running`, sin recreate).

### Healthcheck post-rebuild

`docker compose ps` tras la recreación:

| Servicio | Estado |
|---|---|
| `customer-order-api` | `Up 12 seconds (healthy)` |
| `order-flow-app` | `Up 6 seconds (healthy)` |
| `auth-api` | `Up 18 hours (healthy)` (no tocado) |
| `sqlserver` | `Up 18 hours (healthy)` (no tocado) |

### Verificación programática — evidencia real (no impresión)

Token JWT obtenido vía `POST http://localhost:5000/api/auth/login` con el usuario seed
`admin@demo.com` (`V6__seed_data.sql` + `V10__update_user_admin.sql`; el intento inicial con
`admin@example.com` fallo con "Credenciales inválidas", corregido usando el email real del seed).

- **`GET /api/orders`** (`customer-order-api`, puerto 8000): responde con exactamente **5
  pedidos** (Id 1–5), todos con `"priority":2`, y los mismos `total` del golden master SQL
  (949.99, 375.50, 120.00, 150.00, 124.99) — confirma criterio de aceptación #1 (baseline
  intacto tras migración) y #4 (sin filtro, devuelve todos).
- **`GET /api/orders?priority=2`** → `pagination.total: 5` (todos, correcto).
  **`GET /api/orders?priority=3`** → `items: [], pagination.total: 0` (ninguno, correcto,
  antes de crear el pedido de prueba). **`GET /api/orders?priority=1`** → igualmente vacío.
  Confirma criterio #3 y #8 (filtro real contra backend vivo).
- **`POST /api/orders`** con `{"customer_id":1,"priority":3,"items":[...]}` → creó el pedido
  `Id 1009` con `"priority":3` persistido correctamente (`total` calculado por trigger = 10,
  igual al ítem cargado). Repetido el filtro `?priority=3` → devolvió exactamente ese pedido.
  Luego **`DELETE /api/orders/1009`** → `"Pedido eliminado exitosamente"`; `GET /api/orders`
  posterior confirma que se restauró el baseline exacto de 5 filas (Id 1–5). **Se decide no
  dejar el pedido de prueba**, para no alterar el baseline confirmado por el humano en la
  adenda SQL.
- **Validación de rango:** `POST /api/orders` con `"priority":0` → HTTP `422` con mensaje
  `"La prioridad debe ser 1 (Baja), 2 (Media) o 3 (Alta)."` — confirma criterio #6.
- **`order-flow-app`** (puerto 4200): `GET /` → `200`. `GET /orders` → `200`, pero el HTML
  servido para esa ruta es solo el shell (`<app-root></app-root>`), sin contenido — la ruta
  está protegida por guard de autenticación y no fue una de las 7 rutas prerenderizadas con
  datos, por lo que un `curl` a `/orders` **no** es evidencia de que el bundle contiene el
  feature (solo confirma que el servidor responde). Como alternativa más robusta, se
  inspeccionaron los chunks JS compilados dentro del contenedor recién construido
  (`docker exec order-flow-app grep -rl ... /app/dist/OrderFlowApp/browser`):
  - `chunk-USSJJACO.js` (`order-list-component`) y `chunk-V4FMGOL6.js`
    (`order-detail-component`) contienen las cadenas `Prioridad`, `chip-priority-1`,
    `chip-priority-2`, `chip-priority-3` y `priorityLabel`.
  - `chunk-OQQYU2FN.js` contiene las tres etiquetas `Baja`/`Media`/`Alta` y `PriorityLabelPipe`.
  - Confirma que el bundle que sirve el contenedor reconstruido efectivamente incluye el
    código nuevo del feature, sin depender de render en navegador.
- **No verificable programáticamente por mí en esta etapa:** la disposición visual exacta de
  la columna "Prioridad" en la tabla (posición entre Estado y Total), el color exacto
  renderizado de cada badge, y que el selector del modal arranque visualmente en "Media" —
  esto requiere inspección visual humana en el navegador (recomendado hard-refresh /
  Ctrl+Shift+R para descartar caché de bundles antiguos).

### Estado final del entorno

Los 4 contenedores (`sqlserver`, `auth-api`, `customer-order-api`, `order-flow-app`) están
`healthy`. `customer-order-api` sirve el código y esquema con `priority` correctamente
alineados (BD real con 5 filas, migración V11 aplicada y validada, imagen reconstruida).
`order-flow-app` sirve el bundle compilado que incluye el feature de prioridad. El
`known_issue` `env-drift-customer-order-api` queda completamente resuelto (dato + código +
imagen en ejecución, los tres alineados con el repo).

**Pendiente:** checkpoint humano de esta etapa (hard-refresh + confirmación visual en el
navegador) antes de que el orquestador proceda al checkpoint final de generación de PR.
