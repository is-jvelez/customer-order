# Golden Master — Orders (antes de CR-001)

Capturado por: sql-agent · CR-001-order-priority
Fecha: 2026-07-15

## Método de captura

Este proyecto bloquea (vía `.claude/scripts/guard-sql-apply.ps1`, hook `PreToolUse` sobre
`Bash`) cualquier comando que hable con el servidor SQL real: `sqlcmd`, `Invoke-Sqlcmd`,
`bcp`, `flyway migrate`, `docker compose ... flyway`. Esto es intencional (HITL antes de
tocar la base de datos compartida) y el sql-agent no debe sortearlo.

Por lo tanto esta línea base se construyó por **inspección estática** de las migraciones
Flyway ya aplicadas (`./flyway/sql/V1`…`V10`), que son la fuente de verdad determinista del
esquema y de los datos semilla. No se ejecutó ninguna consulta contra la base de datos viva.
Los valores de `Total` se derivan por cálculo manual de la lógica del trigger (suma de
`Quantity * UnitPrice`), que es determinista. El valor de `UpdatedAt` **no** es un literal
fijo (el trigger usa `GETUTCDATE()`), así que el invariante capturado es de comportamiento,
no un timestamp concreto — ver sección "Test de trigger propuesto" para el paso que un
humano con acceso a la BD debe ejecutar para pinar el valor exacto antes/después de aplicar
la migración.

## 1. Esquema actual de `Orders` (fuente: V3__create_orders.sql, V8 no la toca)

| Columna | Tipo | Null | Default | Constraint |
|---|---|---|---|---|
| Id | INT IDENTITY(1,1) | NOT NULL | — | PK_Orders |
| CustomerId | INT | NOT NULL | — | FK_Orders_Customers → Customers(Id), CASCADE |
| Status | NVARCHAR(20) | NOT NULL | 'Pending' | CK_Orders_Status IN ('Pending','InProgress','Completed','Cancelled') |
| Total | DECIMAL(10,2) | NOT NULL | 0.00 | CK_Orders_Total CHECK (Total >= 0) |
| Notes | NVARCHAR(500) | NULL | — | — |
| CreatedAt | DATETIME2 | NOT NULL | GETUTCDATE() | — |
| UpdatedAt | DATETIME2 | NOT NULL | GETUTCDATE() | — |

Índices existentes: `IX_Orders_CustomerId`, `IX_Orders_Status`, `IX_Orders_CreatedAt`.

`Orders` NO tiene hoy columna `Priority`. Después de V11 tendrá exactamente:
`Priority TINYINT NOT NULL DEFAULT 2` (constraint `DF_Orders_Priority`) + índice
`IX_Orders_Priority`. Ninguna columna existente cambia de tipo, nullability ni default.

## 2. Triggers (fuente: V5__triggers.sql) — NO se tocan en esta migración

- `TR_Orders_UpdatedAt` (AFTER UPDATE ON Orders): pone `UpdatedAt = GETUTCDATE()` en las
  filas actualizadas.
- `TR_OrderItems_RecalcTotal` (AFTER INSERT, UPDATE, DELETE ON OrderItems): para cada
  `OrderId` afectado, recalcula `Orders.Total = ISNULL(SUM(Quantity*UnitPrice), 0.00)` y
  `Orders.UpdatedAt = GETUTCDATE()`.

Ninguno de los dos referencia `Priority` ni ninguna columna nueva; añadir `Priority` como
columna aditiva con default no puede alterar su comportamiento (no cambian `Orders` ni
`OrderItems` en su definición usada por el trigger).

## 3. Datos semilla actuales (fuente: V6__seed_data.sql) — `Total` calculado por el trigger

5 pedidos sembrados por V6. El `Total` mostrado es el que el trigger `TR_OrderItems_RecalcTotal`
calcula de forma determinista a partir de los items insertados en el mismo script:

| OrderId | CustomerId | Status | Items (Quantity × UnitPrice) | Total (calculado por trigger) |
|---|---|---|---|---|
| 1 | 1 | Pending | Laptop HP 15" (1×899.99) + Mouse inalámbrico (2×25.00) | 899.99 + 50.00 = **949.99** |
| 2 | 1 | Completed | Monitor LG 24" (1×350.00) + Cable HDMI 2m (3×8.50) | 350.00 + 25.50 = **375.50** |
| 3 | 2 | InProgress | Teclado mecánico (1×120.00) | **120.00** |
| 4 | 3 | Cancelled | Audífonos Sony (2×75.00) | **150.00** |
| 5 | 2 | Pending | Webcam Logitech (1×89.99) + Hub USB 7 puertos (1×35.00) | 89.99 + 35.00 = **124.99** |

`UpdatedAt` de cada fila = el `GETUTCDATE()` vigente en el momento en que Flyway ejecutó los
INSERT de `OrderItems` correspondientes (no es un literal capturable por inspección estática;
ver invariante de comportamiento arriba).

> **Discrepancia detectada (no resuelta aquí):** el CR (secciones 3, 4.1, 6.2) afirma
> "los 6 pedidos existentes" / "los 6 registros preexistentes". `V6__seed_data.sql`, que es
> la única fuente de datos semilla vía Flyway, solo inserta **5** pedidos. Es posible que
> exista un 6º pedido creado fuera de Flyway (uso manual de la app tras el seed) que esta
> inspección estática no puede ver. Esto no bloquea la migración (`ADD ... NOT NULL DEFAULT`
> aplica igual sin importar cuántas filas existan hoy), pero se anota para que el humano lo
> confirme en el checkpoint: cuenten filas reales en `Orders` antes de aprobar el apply.
> No se inventa un 6º registro ni se asume cuál es.

## 4. Test de trigger propuesto (NO ejecutado — requiere aprobación humana + acceso a BD)

Script de caracterización para que un humano (o el testing-agent, una vez autorizado) lo
corra **antes** y **después** de aplicar V11, y confirme que el resultado es idéntico salvo
por la nueva columna `Priority`:

```sql
USE CustomerOrdersDB;
GO
DECLARE @TestOrderId INT;

INSERT INTO Orders (CustomerId, Status, Notes)
VALUES (1, 'Pending', 'CR-001 golden master test order — no borrar sin revisar');

SET @TestOrderId = SCOPE_IDENTITY();

INSERT INTO OrderItems (OrderId, Description, Quantity, UnitPrice) VALUES
(@TestOrderId, 'Golden Master Item A', 2, 15.50),
(@TestOrderId, 'Golden Master Item B', 1, 100.00);

SELECT Id, CustomerId, Status, Total, Notes, CreatedAt, UpdatedAt
FROM Orders
WHERE Id = @TestOrderId;
GO
```

**Resultado esperado (invariante, antes Y después de V11):**
- `Total` = `2 * 15.50 + 1 * 100.00` = **131.00** (calculado por `TR_OrderItems_RecalcTotal`,
  sin tocar).
- `UpdatedAt` > `CreatedAt` (el trigger de items lo actualiza tras el insert de
  `OrderItems`), con valor = el `GETUTCDATE()` del momento del insert — no es un literal fijo,
  pero debe seguir siendo así después de la migración.
- Después de V11, la misma fila debe devolver además `Priority = 2` (el default), sin que
  `Total`/`UpdatedAt` cambien de fórmula.

Ver también `flyway/golden/CR-001-schema-verification.sql` para las aserciones de esquema
(columna, tipo, default, conteo de filas en 2).
