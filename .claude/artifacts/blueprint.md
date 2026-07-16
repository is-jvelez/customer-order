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
