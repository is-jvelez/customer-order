USE CustomerOrdersDB;
GO

-- Vista: resumen de pedidos por estado
CREATE OR ALTER VIEW VW_OrdersSummary AS
SELECT
    Status,
    COUNT(*)        AS Total,
    SUM(Total)      AS Revenue
FROM Orders
GROUP BY Status;
GO

-- Vista: clientes con su conteo de pedidos
CREATE OR ALTER VIEW VW_CustomersActivity AS
SELECT
    c.Id,
    c.Name,
    c.Email,
    c.IsActive,
    COUNT(o.Id)     AS TotalOrders,
    SUM(o.Total)    AS TotalSpent
FROM Customers c
LEFT JOIN Orders o ON o.CustomerId = c.Id
GROUP BY c.Id, c.Name, c.Email, c.IsActive;
GO

-- Vista: pedidos por día (últimos 30 días)
CREATE OR ALTER VIEW VW_OrdersByDay AS
SELECT
    CAST(CreatedAt AS DATE)  AS OrderDate,
    COUNT(*)                 AS TotalOrders,
    SUM(Total)               AS DailyRevenue
FROM Orders
WHERE CreatedAt >= DATEADD(DAY, -30, GETUTCDATE())
GROUP BY CAST(CreatedAt AS DATE);
GO