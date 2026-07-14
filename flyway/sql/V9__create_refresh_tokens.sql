USE CustomerOrdersDB;
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'RefreshTokens' AND xtype = 'U')
BEGIN
    CREATE TABLE RefreshTokens (
        Id          INT             NOT NULL IDENTITY(1,1),
        UserId      INT             NOT NULL,
        Token       NVARCHAR(500)   NOT NULL,
        ExpiresAt   DATETIME2       NOT NULL,
        CreatedAt   DATETIME2       NOT NULL,
        RevokedAt   DATETIME2       NULL,
        IsRevoked   BIT             NOT NULL DEFAULT 0,
        CONSTRAINT PK_RefreshTokens PRIMARY KEY (Id),
        CONSTRAINT FK_RefreshTokens_Users FOREIGN KEY (UserId)
            REFERENCES Users(Id) ON DELETE CASCADE
    );

    CREATE INDEX IX_RefreshTokens_UserId ON RefreshTokens (UserId);
END
GO
