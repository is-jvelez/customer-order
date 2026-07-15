# Blueprint — CR-001 — Prioridad de Pedidos

**CR:** `change-requests/CR-001-order-priority.md`
**Fecha de inicio del pipeline:** 2026-07-15
**Capas afectadas:** SQL Server · Laravel 11 · Angular 21
**Riesgo declarado:** Bajo (campo aditivo, sin lógica de negocio)

## Contrato de datos (resumen)

| Concepto | Valor |
|---|---|
| Columna SQL | `Priority TINYINT NOT NULL DEFAULT 2` |
| Índice | `IX_Orders_Priority` |
| Valores | 1=Baja, 2=Media, 3=Alta |
| Campo JSON | `priority` (entero 1–3) |
| Query param | `?priority=<1|2|3>` |
| Enum Laravel | `App\Enums\OrderPriority` |
| Enum Angular | `OrderPriority` |
| Badge colores | Alta=rojo, Media=amarillo, Baja=gris/verde |

## Registro de etapas

_(cada agente añade su párrafo aquí al completar su etapa)_

---
