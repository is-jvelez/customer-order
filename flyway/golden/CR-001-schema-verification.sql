-- CR-001-schema-verification.sql
-- Test de migracion/esquema para CR-001 (columna Priority en Orders).
--
-- NO fue ejecutado por el sql-agent: el hook guard-sql-apply.ps1 bloquea
-- cualquier comando (sqlcmd / Invoke-Sqlcmd / bcp / flyway migrate) que hable
-- con el servidor SQL real, a proposito, hasta que un humano apruebe aplicar
-- V11__add_order_priority.sql. Este script queda listo para que, una vez
-- aprobado y aplicado V11, un humano o el testing-agent lo corra y confirme
-- los criterios de aceptacion de la seccion 6.2 del CR.
--
-- Comparar el resultado de cada bloque contra
-- flyway/golden/CR-001-orders-golden-master.md

USE CustomerOrdersDB;
GO

-- 1) La columna Priority existe con el tipo/nullability/default correctos.
SELECT
    c.name            AS ColumnName,
    ty.name           AS DataType,
    c.is_nullable     AS IsNullable,
    dc.definition     AS DefaultDefinition
FROM sys.columns c
JOIN sys.types ty          ON ty.user_type_id = c.user_type_id
LEFT JOIN sys.default_constraints dc ON dc.parent_object_id = c.object_id
                                     AND dc.parent_column_id = c.column_id
WHERE c.object_id = OBJECT_ID('dbo.Orders') AND c.name = 'Priority';
-- Esperado: DataType = tinyint, IsNullable = 0, DefaultDefinition = '((2))'
GO

-- 2) El indice IX_Orders_Priority existe sobre (Priority).
SELECT i.name AS IndexName, c.name AS ColumnName
FROM sys.indexes i
JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
JOIN sys.columns c        ON c.object_id = ic.object_id AND c.column_id = ic.column_id
WHERE i.object_id = OBJECT_ID('dbo.Orders') AND i.name = 'IX_Orders_Priority';
-- Esperado: 1 fila, ColumnName = Priority
GO

-- 3) Todos los pedidos preexistentes quedaron en Priority = 2 (default).
--    Confirmar tambien el conteo real de filas (ver discrepancia "5 vs 6"
--    anotada en el golden master: V6__seed_data.sql solo siembra 5 pedidos).
SELECT COUNT(*) AS TotalOrders,
       SUM(CASE WHEN Priority = 2 THEN 1 ELSE 0 END) AS OrdersWithDefaultPriority
FROM Orders;
-- Esperado: TotalOrders == OrdersWithDefaultPriority (todas las filas previas en 2)
GO

-- 4) Los triggers de Total/UpdatedAt siguen calculando igual que el golden
--    master (ver flyway/golden/CR-001-orders-golden-master.md, seccion 4).
--    Repetir el insert de prueba documentado alli y comparar Total (=131.00)
--    y que UpdatedAt > CreatedAt; ademas ahora debe aparecer Priority = 2.
DECLARE @TestOrderId INT;

INSERT INTO Orders (CustomerId, Status, Notes)
VALUES (1, 'Pending', 'CR-001 post-migration trigger check — no borrar sin revisar');

SET @TestOrderId = SCOPE_IDENTITY();

INSERT INTO OrderItems (OrderId, Description, Quantity, UnitPrice) VALUES
(@TestOrderId, 'Golden Master Item A', 2, 15.50),
(@TestOrderId, 'Golden Master Item B', 1, 100.00);

SELECT Id, CustomerId, Status, Total, Priority, Notes, CreatedAt, UpdatedAt
FROM Orders
WHERE Id = @TestOrderId;
-- Esperado: Total = 131.00, Priority = 2, UpdatedAt > CreatedAt
GO
