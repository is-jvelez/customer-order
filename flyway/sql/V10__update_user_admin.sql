USE CustomerOrdersDB;
GO

UPDATE U
SET U.PasswordHash = '$2a$12$rcj7H.dARWSz2j7ebXM0oOrl02mkJP1vXiWfHjlSfcC.RLi10.2lW'
FROM Users U WHERE U.Email = 'admin@demo.com';