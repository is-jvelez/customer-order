# CR-001 — Prioridad de Pedidos

| Campo | Valor |
|---|---|
| **ID** | CR-001 |
| **Título** | Añadir prioridad (Baja / Media / Alta) a los pedidos |
| **Autor** | Jose Antonio Velez Gomez |
| **Fecha** | 2026-07-16 |
| **Estado** | Propuesto |
| **Capas afectadas** | SQL Server · Laravel 11 (CustomerOrderService) · Angular 21 (is-order-flow-app) |
| **Riesgo** | Bajo (campo aditivo, sin lógica de negocio) |

> Nota de stack: el API de Clientes/Pedidos es **Laravel 11 con Eloquent**. El AuthService (.NET 10) **no** se toca en este CR.

---

## 1. Qué

Añadir un atributo **Prioridad** a cada pedido, con tres valores posibles: **Baja**, **Media**, **Alta**. El usuario la selecciona al crear/editar un pedido; si no elige, el valor por defecto es **Media**. La prioridad se muestra en la lista y en el detalle, y se puede filtrar por ella.

Este primer CR es **manual** (el usuario elige la prioridad). La asignación automática por monto queda para un CR posterior.

## 2. Por qué

Los operadores necesitan distinguir visualmente qué pedidos atender primero. Hoy solo existe el Estado (Pendiente/En Progreso/etc.), que indica *en qué fase* está el pedido, no *qué tan urgente* es. Son dimensiones distintas.

## 3. Contrato de datos (fuente única de verdad — todas las capas deben respetar estos nombres exactos)

Este bloque existe para que ninguna capa invente nombres. Cada agente consume el contrato de la capa anterior.

| Concepto | Valor exacto |
|---|---|
| Nombre de columna SQL | `Priority` |
| Tipo SQL | `TINYINT NOT NULL DEFAULT 2` |
| Valores permitidos | `1` = Baja, `2` = Media, `3` = Alta |
| Valor por defecto | `2` (Media) |
| Campo en JSON de la API | `priority` (camelCase, entero 1–3) |
| Query param del filtro | `?priority=<1|2|3>` (opcional; si se omite, no filtra) |
| Enum en Laravel | `App\Enums\OrderPriority` (Low=1, Medium=2, High=3) |
| Enum/tipo en Angular | `OrderPriority` (`Low=1, Medium=2, High=3`) |
| Colores de badge (Angular) | Alta = rojo · Media = amarillo · Baja = gris/verde |
| Etiquetas UI (es) | 1→"Baja", 2→"Media", 3→"Alta" |

> **Regla dura:** si una capa necesita un nombre que no está en esta tabla, se detiene y pregunta. No se inventa.

## 4. Alcance por capa

### 4.1 SQL Server
> **Importante:** este proyecto **no usa stored procedures**. El acceso a datos y todo el filtrado se hacen desde Laravel con Eloquent Query Builder (ver `EloquentOrderRepository`). La capa SQL solo aporta **esquema** (tablas, columnas, índices) y **triggers** que calculan `Total` y `UpdatedAt`. Por tanto, en SQL solo hay cambio de esquema.

- Migración (vía Flyway) que añade la columna `Priority TINYINT NOT NULL DEFAULT 2` a la tabla `Orders`.
- Índice `IX_Orders_Priority` sobre `(Priority)` (el filtro real corre en Laravel, pero el índice ayuda al plan de ejecución de esa query).
- La migración **no debe** alterar ni recalcular datos existentes, ni tocar los triggers de `Total`/`UpdatedAt`. Los 5 pedidos actuales reciben `Priority = 2` automáticamente por el default.
- **No** se crea ni modifica ningún stored procedure (no existen).

### 4.2 Laravel 11 (CustomerOrderService)
> Arquitectura en capas (Domain / Infrastructure). El filtrado vive **aquí**, en `EloquentOrderRepository::findAll()`, junto a los filtros ya existentes (`status`, `customer_id`, `date_from`, `date_to`).

- Crear enum `App\Enums\OrderPriority` (Low=1, Medium=2, High=3).
- `OrderModel` (Eloquent): añadir `Priority` a `$fillable` y al `$casts` (cast al enum). Respetar la convención de columnas PascalCase del proyecto (`Status`, `CustomerId`, `Notes` → `Priority`).
- Entidad de dominio `Order`: añadir la propiedad `priority`.
- `OrderMapper`: mapear `Priority` (modelo) ↔ `priority` (dominio) en `toDomain()` y en el sentido de escritura.
- `EloquentOrderRepository`:
  - `findAll()`: añadir el bloque de filtro condicional, idéntico en estilo a los existentes:
    ```php
    if (!empty($filters['priority'])) {
        $query->where('Priority', (int) $filters['priority']);
    }
    ```
  - `create()`: incluir `'Priority' => $order->priority->value` en el `OrderModel::create([...])` (default 2 si no viene).
  - `update()`: incluir `Priority` en el `$model->update([...])` para permitir editar la prioridad.
- API Resource / DTO de respuesta: exponer `priority` en el JSON (entero 1–3).
- Form Request de creación/edición: `priority` opcional, entero, `in:1,2,3`; si falta, se persiste `2`.
- Endpoint `GET /orders`: leer `priority` de los query params y pasarlo dentro del array `$filters` a `findAll()`.
- **No** duplicar aquí ninguna lógica de cálculo (no hay: es manual). **No** tocar `getStats()` ni `getOrdersByDay/Month()`.

### 4.3 Angular 21 (is-order-flow-app)
- Modelo TypeScript: añadir `priority: OrderPriority` a la interfaz de Order.
- Servicio HTTP: enviar `priority` en create/update y como query param en el listado filtrado.
- **Lista de pedidos** (Image 1): nueva columna **"Prioridad"** entre "Estado" y "Total", renderizada como badge de color, reutilizando el patrón de badges existente de Estado.
- **Filtro** (barra superior): nuevo dropdown **"Prioridad"** junto a Estado/Cliente/Fecha, con opción "Todas".
- **Modal Nuevo Pedido** (Image 2): nuevo selector **"Prioridad"** debajo de "Notas", con **"Media" preseleccionada por defecto**.
- **Detalle del pedido**: mostrar el badge de prioridad junto al badge de estado.

## 5. Criterios de aceptación (verificables → convertibles en tests)

- [ ] La migración aplica sobre la BD actual sin pérdida de datos; los 5 pedidos existentes quedan en `Priority = 2`.
- [ ] `GET /orders` devuelve cada pedido con el campo `priority` (entero 1–3).
- [ ] `GET /orders?priority=3` devuelve **solo** pedidos con prioridad Alta.
- [ ] `GET /orders` sin el param devuelve todos (comportamiento previo intacto).
- [ ] `POST /orders` sin `priority` crea el pedido con `priority = 2`.
- [ ] `POST /orders` con `priority = 3` persiste 3; con un valor inválido (0, 4, "x") responde error de validación.
- [ ] En la lista, cada fila muestra el badge de prioridad con el color correcto.
- [ ] El filtro de prioridad en la barra superior filtra la tabla correctamente.
- [ ] El modal de creación muestra "Media" preseleccionada y permite cambiarla.
- [ ] El detalle muestra el badge de prioridad.

## 6. Estrategia de pruebas (obligatoria en cada etapa)

### 6.1 Golden master / characterization (capturar ANTES de tocar nada)
Antes de aplicar cualquier cambio, cada agente graba el comportamiento actual como línea base:

- **SQL (esquema + triggers, no hay SP):** capturar el estado de la tabla `Orders` (columnas, tipos, defaults) y el comportamiento de los triggers `Total`/`UpdatedAt`. Guardar como línea base: dado un pedido de prueba con items conocidos, cuál es el `Total` y el `UpdatedAt` que calculan los triggers hoy. Tras la migración, el mismo insert debe producir **exactamente el mismo** `Total`/`UpdatedAt` — añadir `Priority` no debe alterar esos cálculos.
- **Laravel:** guardar en `tests/golden/` la respuesta JSON de `GET /orders` y `GET /orders/{id}` actuales. Tras el cambio, mismos campos y valores **más** `priority`; nada más cambia (ni orden, ni formato, ni tipos de los campos previos, ni la estructura de `pagination`). Incluir también un golden de `GET /orders/stats` para confirmar que `getStats()` no se ve afectado.
- **Angular:** snapshot del render de la lista y el detalle para los estados existentes. Los pedidos ya existentes se ven igual salvo la nueva columna.

> El golden master grabado es el contrato de "lo que NO debe cambiar". Cualquier diferencia fuera de lo esperado detiene el pipeline.

### 6.2 Pruebas nuevas por capa
> Como **no hay stored procedures**, en SQL no se prueba lógica de filtrado (esa vive en Laravel). En SQL solo se valida la migración y que los triggers sigan intactos.

- **SQL (test de migración/esquema):**
  - Tras aplicar la migración, la columna `Priority` existe con tipo `TINYINT`, `NOT NULL` y default `2`.
  - Los 5 registros preexistentes quedaron en `Priority = 2`.
  - Insertar un pedido nuevo con items y confirmar que los triggers de `Total`/`UpdatedAt` calculan igual que en la línea base (golden master de 6.1).
- **Laravel (PHPUnit/Pest) — aquí vive la prueba del filtro:**
  - Cast del enum en `OrderModel`; `create()` sin `priority` → persiste `2`; con `3` → persiste `3`.
  - Form Request: rechaza `0`, `4`, `9` y valores no numéricos.
  - **Feature test de `findAll()` / `GET /orders?priority=3`**: devuelve solo pedidos Alta; sin el filtro, devuelve todos (comportamiento previo intacto).
  - `OrderMapper`: mapea `Priority` ↔ `priority` en ambos sentidos.
- **Angular (Jasmine/Karma o Jest):** el servicio envía el query param `priority`; el badge mapea valor→color; el selector del modal arranca en Media.

### 6.3 Integración end-to-end
- Crear un pedido con prioridad Alta desde el frontend → verificar que llega a SQL como `3` → verificar que aparece con badge rojo en la lista → filtrar por Alta y confirmar que aparece.

## 7. Fuera de alcance (NO tocar)

- Ordenamiento por prioridad.
- Asignación automática de prioridad por monto o fecha (será CR-002).
- Notificaciones o alertas por prioridad.
- Permisos/roles sobre quién puede cambiar la prioridad.
- Cambios de estilo/tema fuera del badge nuevo.
- El AuthService (.NET 10): este CR no lo toca.
- Cualquier refactor no relacionado con este campo.

> Si el agente detecta una "mejora obvia" fuera de este alcance, la anota como sugerencia pero **no la implementa**.

## 8. Rutas de referencia (dónde vive cada capa)

- Migración SQL: `./flyway/sql/`
- API Laravel (modelo, enum, resource, request, controller): `./CustomerOrderService/`
- Frontend Angular (modelo, servicio, lista, filtro, modal, detalle): `./is-order-flow-app/`

## 9. Definition of Done (global — el pipeline no termina hasta que todo esto se cumple)

- [ ] Migración aplica sin pérdida de datos.
- [ ] Todos los golden masters coinciden (salvo las diferencias esperadas y documentadas).
- [ ] Todas las pruebas unitarias (previas + nuevas) pasan en las 3 capas.
- [ ] La prueba de integración end-to-end pasa.
- [ ] Todos los criterios de aceptación de la sección 5 están marcados.
- [ ] No hay cambios fuera del alcance declarado.