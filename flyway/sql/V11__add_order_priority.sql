USE CustomerOrdersDB;
GO

-- CR-001: añade la prioridad manual del pedido (1=Baja, 2=Media, 3=Alta).
-- Columna aditiva, NOT NULL con DEFAULT para ser compatible hacia atrás:
-- las filas existentes reciben Priority = 2 (Media) automáticamente.
-- No modifica ni recalcula Total/UpdatedAt, no toca los triggers definidos
-- en V5__triggers.sql, no crea stored procedures.
IF COL_LENGTH('dbo.Orders', 'Priority') IS NULL
BEGIN
    ALTER TABLE dbo.Orders
    ADD Priority TINYINT NOT NULL
        CONSTRAINT DF_Orders_Priority DEFAULT 2;
END
GO

-- CHECK constraint: solo se permiten los 3 valores del contrato de datos
-- (1=Baja, 2=Media, 3=Alta). Mismo patrón usado en V8 para Customers.Status.
IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'CHK_Orders_Priority'
)
BEGIN
    ALTER TABLE dbo.Orders
    ADD CONSTRAINT CHK_Orders_Priority
        CHECK (Priority IN (1, 2, 3));
END
GO

-- Índice para soportar el filtro ?priority= que se resuelve en Laravel
-- (EloquentOrderRepository::findAll). El filtrado en sí NO vive aquí.
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_Orders_Priority'
      AND object_id = OBJECT_ID('dbo.Orders')
)
BEGIN
    CREATE INDEX IX_Orders_Priority ON dbo.Orders (Priority);
END
GO
