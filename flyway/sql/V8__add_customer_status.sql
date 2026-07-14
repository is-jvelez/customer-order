USE CustomerOrdersDB;
GO

-- Crear columna si no existe
IF COL_LENGTH('dbo.Customers', 'Status') IS NULL
BEGIN
    ALTER TABLE dbo.Customers
    ADD Status NVARCHAR(20) NOT NULL
        CONSTRAINT DF_Customers_Status DEFAULT 'Active';
END
GO

-- Crear CHECK constraint si no existe
IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'CHK_Customers_Status'
)
BEGIN
    ALTER TABLE dbo.Customers
    ADD CONSTRAINT CHK_Customers_Status
        CHECK (Status IN ('Active', 'Inactive', 'Suspended'));
END
GO