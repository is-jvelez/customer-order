USE CustomerOrdersDB;
GO

-- Tipo de estado como CHECK constraint
-- Valores: Pending | InProgress | Completed | Cancelled
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'Orders' AND xtype = 'U')
BEGIN
    CREATE TABLE Orders (
        Id          INT            NOT NULL IDENTITY(1,1),
        CustomerId  INT            NOT NULL,
        Status      NVARCHAR(20)   NOT NULL DEFAULT 'Pending',
        Total       DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
        Notes       NVARCHAR(500)  NULL,
        CreatedAt   DATETIME2      NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt   DATETIME2      NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT PK_Orders            PRIMARY KEY (Id),
        CONSTRAINT FK_Orders_Customers  FOREIGN KEY (CustomerId)
            REFERENCES Customers(Id)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
        CONSTRAINT CK_Orders_Status CHECK (
            Status IN ('Pending', 'InProgress', 'Completed', 'Cancelled')
        ),
        CONSTRAINT CK_Orders_Total CHECK (Total >= 0)
    );

    CREATE INDEX IX_Orders_CustomerId ON Orders (CustomerId);
    CREATE INDEX IX_Orders_Status     ON Orders (Status);
    CREATE INDEX IX_Orders_CreatedAt  ON Orders (CreatedAt);
END
GO