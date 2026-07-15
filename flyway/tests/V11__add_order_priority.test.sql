-- Test de migracion/esquema para V11__add_order_priority.sql (CR-001)
-- NO es una migracion Flyway (vive fuera de ./flyway/sql, no se ejecuta con `flyway migrate`).
-- Ejecutar manualmente CONTRA UN ENTORNO DE PRUEBA tras aplicar V11, para verificar:
--   1) La columna Priority existe con el tipo/default correctos.
--   2) Los registros preexistentes quedaron en Priority = 2.
--   3) El CHECK constraint rechaza valores fuera de 1-3.
--   4) Los triggers TR_Orders_UpdatedAt / TR_OrderItems_RecalcTotal siguen calculando
--      Total/UpdatedAt exactamente igual que en el golden master pre-migracion
--      (ver blueprint.md, seccion SQL, para los valores de referencia).
--
-- Todo el bloque de prueba corre dentro de una transaccion con ROLLBACK final:
-- no deja datos residuales en la base.

USE CustomerOrdersDB;
GO

SET NOCOUNT ON;
BEGIN TRANSACTION;

------------------------------------------------------------
-- 1) La columna Priority existe: TINYINT, NOT NULL, DEFAULT 2
------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Orders'
      AND COLUMN_NAME = 'Priority'
      AND DATA_TYPE = 'tinyint'
      AND IS_NULLABLE = 'NO'
)
    THROW 50001, 'FALLO: columna Orders.Priority no existe o no es TINYINT NOT NULL', 1;
ELSE
    PRINT 'OK: Orders.Priority existe como TINYINT NOT NULL';

IF NOT EXISTS (
    SELECT 1
    FROM sys.default_constraints dc
    JOIN sys.columns c
      ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.Orders')
      AND c.name = 'Priority'
      AND dc.definition = '((2))'
)
    THROW 50002, 'FALLO: el DEFAULT de Orders.Priority no es 2', 1;
ELSE
    PRINT 'OK: DEFAULT de Orders.Priority es 2';

------------------------------------------------------------
-- 2) Registros preexistentes (los 6 pedidos del entorno de dev) -> Priority = 2
------------------------------------------------------------
IF EXISTS (SELECT 1 FROM Orders WHERE Priority <> 2)
    THROW 50003, 'FALLO: hay pedidos preexistentes con Priority distinto de 2', 1;
ELSE
    PRINT 'OK: todos los pedidos preexistentes tienen Priority = 2';

------------------------------------------------------------
-- 3) CHECK constraint rechaza valores fuera de 1-3
------------------------------------------------------------
BEGIN TRY
    INSERT INTO Orders (CustomerId, Status, Notes, Priority) VALUES (1, 'Pending', 'test invalid priority', 9);
    THROW 50004, 'FALLO: se permitio insertar Priority = 9 (deberia violar CK_Orders_Priority)', 1;
END TRY
BEGIN CATCH
    IF ERROR_NUMBER() = 50004
        THROW;
    PRINT 'OK: CK_Orders_Priority rechaza Priority = 9 como se esperaba';
END CATCH;

------------------------------------------------------------
-- 4) Golden master de triggers: Total/UpdatedAt calculan igual que antes de V11
------------------------------------------------------------
DECLARE @NewOrderId INT;

-- Insert sin especificar Priority -> debe tomar el default 2, sin afectar el trigger de Total
INSERT INTO Orders (CustomerId, Status, Notes) VALUES (1, 'Pending', 'GOLDEN MASTER TEST - CR-001');
SET @NewOrderId = SCOPE_IDENTITY();

IF (SELECT Priority FROM Orders WHERE Id = @NewOrderId) <> 2
    THROW 50005, 'FALLO: pedido nuevo sin Priority explicito no tomo el default 2', 1;

INSERT INTO OrderItems (OrderId, Description, Quantity, UnitPrice) VALUES
    (@NewOrderId, 'Golden Master Item A', 2, 15.25),
    (@NewOrderId, 'Golden Master Item B', 1, 100.00);
-- Total esperado (golden master pre-V11): 2*15.25 + 1*100.00 = 130.50

IF (SELECT Total FROM Orders WHERE Id = @NewOrderId) <> 130.50
    THROW 50006, 'FALLO: TR_OrderItems_RecalcTotal no calculo 130.50 tras insertar items', 1;
ELSE
    PRINT 'OK: TR_OrderItems_RecalcTotal calcula 130.50 (igual que el golden master pre-V11)';

DELETE FROM OrderItems WHERE OrderId = @NewOrderId AND Description = 'Golden Master Item A';
-- Total esperado tras borrar un item: solo queda Item B = 100.00

IF (SELECT Total FROM Orders WHERE Id = @NewOrderId) <> 100.00
    THROW 50007, 'FALLO: TR_OrderItems_RecalcTotal no recalculo a 100.00 tras borrar un item', 1;
ELSE
    PRINT 'OK: TR_OrderItems_RecalcTotal recalcula a 100.00 tras DELETE (igual que golden master)';

DECLARE @UpdatedAtBefore DATETIME2 = (SELECT UpdatedAt FROM Orders WHERE Id = @NewOrderId);
WAITFOR DELAY '00:00:01';
UPDATE Orders SET Notes = 'GOLDEN MASTER TEST - updated' WHERE Id = @NewOrderId;

IF (SELECT UpdatedAt FROM Orders WHERE Id = @NewOrderId) <= @UpdatedAtBefore
    THROW 50008, 'FALLO: TR_Orders_UpdatedAt no actualizo UpdatedAt tras UPDATE directo', 1;
ELSE
    PRINT 'OK: TR_Orders_UpdatedAt actualiza UpdatedAt tras UPDATE directo (igual que golden master)';

PRINT '--- TODAS LAS VERIFICACIONES DE V11 PASARON ---';

ROLLBACK TRANSACTION;
GO
