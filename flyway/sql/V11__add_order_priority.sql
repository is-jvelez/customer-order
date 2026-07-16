USE CustomerOrdersDB;
GO

-- CR-001: agrega la columna Priority a Orders.
-- Valores: 1 = Baja, 2 = Media, 3 = Alta. Default 2 (Media).
-- La validacion de rango (1-3) vive en Laravel (Form Request), no en SQL
-- -- ver change-requests/CR-001-order-priority.md seccion 4.2. Este proyecto
-- no usa stored procedures y esta migracion no crea ninguno.
-- No modifica los triggers TR_Orders_UpdatedAt ni TR_OrderItems_RecalcTotal
-- (V5__triggers.sql): ambos siguen intactos y su calculo de Total/UpdatedAt
-- no se ve afectado por esta columna aditiva.
IF COL_LENGTH('dbo.Orders', 'Priority') IS NULL
BEGIN
    ALTER TABLE dbo.Orders
    ADD Priority TINYINT NOT NULL
        CONSTRAINT DF_Orders_Priority DEFAULT (2);
END
GO

-- Indice para el filtro ?priority=<1|2|3> que ejecuta
-- EloquentOrderRepository::findAll() (el filtrado en si vive en Laravel).
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_Orders_Priority' AND object_id = OBJECT_ID('dbo.Orders')
)
BEGIN
    CREATE INDEX IX_Orders_Priority ON dbo.Orders (Priority);
END
GO
