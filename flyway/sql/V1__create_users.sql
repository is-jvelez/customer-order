USE CustomerOrdersDB;
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'Users' AND xtype = 'U')
BEGIN
    CREATE TABLE Users (
        Id           INT             NOT NULL IDENTITY(1,1),
        Email        NVARCHAR(150)   NOT NULL,
        PasswordHash NVARCHAR(255)   NOT NULL,
        CreatedAt    DATETIME2       NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT PK_Users        PRIMARY KEY (Id),
        CONSTRAINT UQ_Users_Email  UNIQUE (Email)
    );

    -- Índice para búsquedas por email (login)
    CREATE INDEX IX_Users_Email ON Users (Email);
END
GO