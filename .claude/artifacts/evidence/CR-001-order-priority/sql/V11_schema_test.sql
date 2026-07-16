-- Test de migración/esquema — CR-001-order-priority (V11)
-- ============================================================================
-- Este script NO fue ejecutado por el sql-agent contra la BD real (el hook
-- PreToolUse guard-sql-apply.ps1 bloquea cualquier `sqlcmd`, lectura o
-- escritura, contra el servidor). Queda preparado para que, tras la
-- aprobación humana y la aplicación real de V11 (vía `flyway migrate`
-- gestionado por el orquestador/humano), se ejecute como verificación
-- post-migración. Es de solo lectura salvo el bloque opcional (d) que usa
-- una transacción con ROLLBACK explícito, por lo que no deja datos
-- permanentes.
--
-- Cómo ejecutar (fuera de este agente, tras aprobación):
--   docker exec sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa \
--     -P "$SA_PASSWORD" -d CustomerOrdersDB -C -i V11_schema_test.sql
-- ============================================================================
USE CustomerOrdersDB;
GO

PRINT '--- (a) Columna Priority: tipo, nullability y default ---';
SELECT
    c.COLUMN_NAME,
    c.DATA_TYPE,
    c.IS_NULLABLE,
    dc.definition AS DefaultDefinition
FROM INFORMATION_SCHEMA.COLUMNS c
LEFT JOIN sys.default_constraints dc
    ON dc.parent_object_id = OBJECT_ID('dbo.Orders')
   AND dc.name = 'DF_Orders_Priority'
WHERE c.TABLE_NAME = 'Orders' AND c.COLUMN_NAME = 'Priority';
-- Esperado: DATA_TYPE = 'tinyint', IS_NULLABLE = 'NO',
--           DefaultDefinition contiene '2'.
GO

PRINT '--- (b) CHECK constraint de dominio (1,2,3) ---';
SELECT name, definition
FROM sys.check_constraints
WHERE name = 'CHK_Orders_Priority';
-- Esperado: definition equivalente a ([Priority]=(1) OR [Priority]=(2) OR [Priority]=(3))
GO

PRINT '--- (c) Índice IX_Orders_Priority ---';
SELECT i.name, i.type_desc, c.name AS ColumnName
FROM sys.indexes i
JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
WHERE i.name = 'IX_Orders_Priority';
-- Esperado: una fila, columna Priority.
GO

PRINT '--- (d) Filas preexistentes reciben Priority = 2 por el DEFAULT ---';
SELECT Id, CustomerId, Status, Priority
FROM Orders
WHERE Priority <> 2;
-- Esperado: 0 filas (todas las filas preexistentes, sean 5 o 6 según
-- schema-before.txt, deben tener Priority = 2).
GO

PRINT '--- (e) Golden master de triggers: Total de Order.Id = 1 sin cambios ---';
SELECT Id, Total
FROM Orders
WHERE Id = 1;
-- Esperado: Total = 949.99 (ver trigger-golden-master.txt, sección 2),
-- IDÉNTICO al valor antes de aplicar V11. Si difiere, el pipeline se detiene.
GO

PRINT '--- (f) Triggers siguen intactos (mismos 2, sin deshabilitar, sin nuevos) ---';
SELECT t.name, t.is_disabled, OBJECT_NAME(t.parent_id) AS ParentTable
FROM sys.triggers t
WHERE OBJECT_NAME(t.parent_id) IN ('Orders', 'OrderItems');
-- Esperado: TR_Orders_UpdatedAt (Orders, is_disabled=0),
--           TR_OrderItems_RecalcTotal (OrderItems, is_disabled=0).
--           Ningún trigger adicional.
GO

PRINT '--- (g) Recalculo dinámico: insertar item de prueba y revertir (no persiste) ---';
BEGIN TRANSACTION;

    -- Usa el pedido Id = 1 (ya tiene Total = 949.99 con sus 2 items actuales).
    INSERT INTO OrderItems (OrderId, Description, Quantity, UnitPrice)
    VALUES (1, 'TEST_ITEM_TEMPORAL_NO_PERSISTIR', 1, 100.00);

    -- El trigger TR_OrderItems_RecalcTotal debe recalcular Total.
    -- Esperado dentro de la transacción: 949.99 + 100.00 = 1049.99
    SELECT Id, Total AS TotalDentroDeTransaccion
    FROM Orders
    WHERE Id = 1;

ROLLBACK TRANSACTION;
-- Tras el ROLLBACK, Orders.Id = 1 vuelve a Total = 949.99 (verificar con (e)
-- de nuevo si se desea). No queda ningún dato de prueba permanente.
GO

PRINT '--- Fin de la verificación V11 ---';
