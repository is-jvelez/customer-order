USE CustomerOrdersDB;
GO

-- Trigger: actualiza UpdatedAt en Orders cuando se edita la orden
CREATE OR ALTER TRIGGER TR_Orders_UpdatedAt
ON Orders
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Orders
    SET UpdatedAt = GETUTCDATE()
    FROM Orders o
    INNER JOIN inserted i ON o.Id = i.Id;
END
GO

-- Trigger: recalcula el Total de la orden al insertar/editar/borrar items
CREATE OR ALTER TRIGGER TR_OrderItems_RecalcTotal
ON OrderItems
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @AffectedOrderIds TABLE (OrderId INT);

    INSERT INTO @AffectedOrderIds (OrderId)
    SELECT DISTINCT OrderId FROM inserted
    UNION
    SELECT DISTINCT OrderId FROM deleted;

    UPDATE Orders
    SET
        Total     = ISNULL((
            SELECT SUM(Quantity * UnitPrice)
            FROM OrderItems
            WHERE OrderId = o.Id
        ), 0.00),
        UpdatedAt = GETUTCDATE()
    FROM Orders o
    INNER JOIN @AffectedOrderIds a ON o.Id = a.OrderId;
END
GO