USE CustomerOrdersDB;
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'Customers' AND xtype = 'U')
BEGIN
    CREATE TABLE Customers (
        Id        INT            NOT NULL IDENTITY(1,1),
        Name      NVARCHAR(150)  NOT NULL,
        Email     NVARCHAR(150)  NOT NULL,
        Phone     NVARCHAR(20)   NULL,
        Address   NVARCHAR(300)  NULL,
        IsActive  BIT            NOT NULL DEFAULT 1,
        CreatedAt DATETIME2      NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT PK_Customers       PRIMARY KEY (Id),
        CONSTRAINT UQ_Customers_Email UNIQUE (Email)
    );

    CREATE INDEX IX_Customers_IsActive ON Customers (IsActive);
    CREATE INDEX IX_Customers_Name     ON Customers (Name);
END
GO