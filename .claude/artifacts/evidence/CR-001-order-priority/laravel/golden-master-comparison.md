# Comparación golden master — Laravel (CR-001)

Comparación estructural entre los golden masters capturados ANTES de tocar código
(`golden-orders-index.json`, `golden-orders-show-1.json`, `golden-dashboard-stats.json`,
en este mismo directorio) y el comportamiento del código DESPUÉS de implementar el
contrato de la sección 4.2 del CR.

## Método

No se reconstruyó la imagen `customer-order-api` (eso es responsabilidad de la etapa
Deploy, todavía no ejecutada) para no adelantarme fuera de mi alcance. En su lugar, la
comparación se hizo:

1. Por lectura estática del `git diff` de `EloquentOrderRepository.php` (ver
   `phpunit-run-output.txt` y el resumen en el blueprint) — confirma que `findAll()`,
   `create()` y `update()` solo ganan las líneas de `Priority`, sin tocar la forma de
   `pagination` ni las claves ya existentes.
2. Por los tests unitarios/feature que ejercitan el `OrderResource` y el
   `OrderMapper` reales contra la entidad de dominio (`ResourceTransformationTest::
   test_OrderResourceAndCollection_ShouldTransformOrderWithItems_WhenToArrayIsCalled`,
   `OrderMapperTest`), que confirman los mismos campos que el golden master más
   `priority`.
3. Por los tests de integración (`EloquentOrderRepositoryIntegrationTest`) que corren
   contra un esquema SQLite equivalente al de SQL Server (mismas columnas PascalCase,
   incluida `Priority TINYINT DEFAULT 2`) y validan paginación, filtro `priority`,
   `create`/`update` con y sin prioridad explícita.

## Resultado — `GET /orders` (golden-orders-index.json)

Campos del golden (por item): `id, customer_id, status, total, notes, created_at,
updated_at, items[].{id,description,quantity,unit_price}`.
Campos de `pagination`: `total, per_page, current_page, last_page, from, to`.

Campos que produce el `OrderResource` actual (ver
`app/Http/Resources/Order/OrderResource.php`): los mismos, en el mismo orden, más
`priority` (entero 1-3) añadido al final del array. `pagination` no se tocó
(`EloquentOrderRepository::findAll()` construye ese array exactamente igual que antes).

**Diferencia esperada y única:** aparece la clave `priority` en cada item. Ningún otro
campo cambia de nombre, tipo, orden relativo o desaparece.

## Resultado — `GET /orders/{id}` (golden-orders-show-1.json)

Mismo `OrderResource`, mismo resultado: campos previos intactos + `priority` añadido.

## Resultado — stats (golden-dashboard-stats.json)

`EloquentOrderRepository::getStats()` no fue tocado (confirmado por `git diff` — solo
`findAll()`, `create()`, `update()` cambiaron). `DashboardControllerTest` no tiene
diferencias en el working tree (`git diff --stat` vacío para ese archivo). El golden de
stats sigue siendo válido sin cambios: `total_orders, pending_orders,
in_progress_orders, completed_orders, cancelled_orders, total_revenue,
total_customers, active_customers` — ninguno de estos se ve afectado por el CR, y no se
añadió `priority` aquí (correcto: el CR no lo pide y expandirlo sería alcance fuera de
lo declarado).

## Conclusión

El contrato "mismos campos previos + priority, nada más cambia" se cumple para los tres
endpoints golden. La verificación end-to-end contra el contenedor real con la imagen
reconstruida (bind real, no bind-mount) queda para la etapa Deploy, tal como indica
CLAUDE.md ("Laravel no usa bind-mount: el código se copia en la imagen al buildear").
