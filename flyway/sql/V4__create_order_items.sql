USE CustomerOrdersDB;
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'OrderItems' AND xtype = 'U')
BEGIN
    CREATE TABLE OrderItems (
        Id          INT            NOT NULL IDENTITY(1,1),
        OrderId     INT            NOT NULL,
        Description NVARCHAR(300)  NOT NULL,
        Quantity    INT            NOT NULL DEFAULT 1,
        UnitPrice   DECIMAL(10,2)  NOT NULL DEFAULT 0.00,

        CONSTRAINT PK_OrderItems          PRIMARY KEY (Id),
        CONSTRAINT FK_OrderItems_Orders   FOREIGN KEY (OrderId)
            REFERENCES Orders(Id)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
        CONSTRAINT CK_OrderItems_Quantity  CHECK (Quantity > 0),
        CONSTRAINT CK_OrderItems_UnitPrice CHECK (UnitPrice >= 0)
    );

    CREATE INDEX IX_OrderItems_OrderId ON OrderItems (OrderId);
END
GO