# Golden masters — CR-001 (Order Priority) — capa Laravel

Capturados/derivados el 2026-07-15/16, antes de tocar código, como línea base de
`GET /orders`, `GET /orders/{id}` y `GET /dashboard/stats` (endpoint real que
expone `getStats()`; el CR menciona `GET /orders/stats` pero esa ruta no existe
en `routes/api.php` — el stats de pedidos se sirve en `/api/dashboard/stats`,
delegando en `OrderService::getOrderStats()` -> `EloquentOrderRepository::getStats()`,
que es el método que el CR pide no tocar).

## Hallazgo importante (anomalía de entorno)

Al capturar la línea base golpeando el contenedor `customer-order-api` (que ya
estaba corriendo, sano, en este entorno) con un JWT válido minteado localmente,
la respuesta de `GET /orders` **ya incluía el campo `priority`** (con valores 2 y 3)
y mostraba **7 pedidos**, no los 5 confirmados por el humano para este CR ni los
6 originales del CR. Esto contradice explícitamente lo que se me indicó
("la migración no está aplicada todavía").

Conclusión: la imagen Docker de `customer-order-api` está **desincronizada del
repositorio** — corre código más avanzado que el HEAD actual (que no tiene
`priority` en ningún archivo fuente, confirmado leyendo `OrderResource.php`,
`EloquentOrderRepository.php`, etc. antes de editar). Esto es exactamente el
escenario que describe `CLAUDE.md`/`deploy-agent`: el código Laravel se copia a
la imagen al buildear, así que el contenedor puede quedar por delante o por
detrás del código en disco. No es algo que yo haya causado ni que deba corregir
en esta etapa — lo dejo anotado para que el orquestador/deploy-agent lo revise
(posible ejecución previa incompleta de este mismo pipeline, o un build manual
de prueba). **No usé esa respuesta contaminada como "antes"** porque ya contenía
el propio campo que este CR debía introducir.

## Metodología

- `orders_index.before.json` / `orders_show.before.json`: **derivados**, no
  capturados en crudo. Se construyeron tomando la respuesta real del contenedor
  (arriba) y quitando la clave `priority` de cada item, validado contra el
  `git diff` de `OrderResource.php`, que muestra que el único cambio en el
  array de salida es la línea `'priority' => $order->priority->value,` — ningún
  otro campo, orden o tipo se tocó. Por tanto "respuesta contaminada menos
  `priority`" es equivalente a la respuesta real pre-cambio.
- `dashboard_stats.json`: capturado **en vivo, sin derivar** — `getStats()` no
  fue tocado por este CR, así que esta respuesta es válida como "antes" y
  "después" simultáneamente (confirmado también por inspección: no se modificó
  `getStats()`, `getOrdersByDay()` ni `getOrdersByMonth()`).
- `orders_index.after.sample.json` / `orders_show.after.sample.json`: la
  respuesta real capturada del contenedor (con `priority`), usada como muestra
  de referencia de la forma esperada tras el cambio — coincide con lo que
  produce el código editado en esta etapa (mismo orden de claves: `priority`
  insertado justo después de `status`), verificado mediante la suite de tests
  (113 tests, 323 assertions, ver más abajo) que incluye aserciones explícitas
  sobre `data.items.0.priority`, `data.pagination.total`, etc.

## Resultado de la comparación

- Campos previos (`id`, `customer_id`, `status`, `total`, `notes`, `created_at`,
  `updated_at`, `items[].{id,description,quantity,unit_price}`, `pagination.*`):
  **idénticos** en tipo, presencia y orden relativo entre sí.
- Único campo nuevo: `priority` (entero 1–3), insertado entre `status` y `total`.
- `dashboard_stats`: **sin cambios** (no se tocó `getStats()`).

## Verificación pendiente contra la BD real

Estos golden masters de Laravel están validados a nivel de código (Eloquent
model + mapper + repository) usando el **fixture SQLite de pruebas**
(`tests/Support/Database/UsesCustomerOrderSqliteSchema`, actualizado en esta
etapa para incluir `Priority TINYINT NOT NULL DEFAULT 2`), no contra SQL Server
real. La migración Flyway V11 fue aprobada por el sql-agent pero, según se me
indicó, aún no se ha aplicado contra la base de datos real (más allá de la
anomalía del contenedor arriba documentada, que es un artefacto de imagen
Docker, no de la base de datos gestionada por Flyway). Cuando el orquestador
aplique la migración y el deploy-agent reconstruya la imagen, se debe repetir
esta captura contra `GET /orders` real para confirmar 1:1.
