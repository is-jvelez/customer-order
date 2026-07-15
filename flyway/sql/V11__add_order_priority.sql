USE CustomerOrdersDB;
GO

-- CR-001: Prioridad de pedidos (Baja=1, Media=2, Alta=3). Manual, sin logica de calculo.
-- No crea ni modifica stored procedures (este proyecto no los usa).
-- No toca TR_Orders_UpdatedAt ni TR_OrderItems_RecalcTotal.

-- Crear columna Priority si no existe
IF COL_LENGTH('dbo.Orders', 'Priority') IS NULL
BEGIN
    ALTER TABLE dbo.Orders
    ADD Priority TINYINT NOT NULL
        CONSTRAINT DF_Orders_Priority DEFAULT (2);
END
GO

-- Crear CHECK constraint para restringir a los 3 valores permitidos (1=Baja,2=Media,3=Alta)
IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'CK_Orders_Priority'
)
BEGIN
    ALTER TABLE dbo.Orders
    ADD CONSTRAINT CK_Orders_Priority
        CHECK (Priority IN (1, 2, 3));
END
GO

-- Indice para apoyar el filtro por prioridad (el filtrado en si vive en Laravel/Eloquent)
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
