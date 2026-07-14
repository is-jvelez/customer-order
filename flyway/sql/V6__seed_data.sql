USE CustomerOrdersDB;
GO

-- Usuario de prueba (password: Admin123! hasheado con BCrypt)
INSERT INTO Users (Email, PasswordHash) VALUES
('admin@demo.com', '$2a$11$rBnNmTkIp/placeholder.hash.for.dev.only');

-- Clientes
INSERT INTO Customers (Name, Email, Phone, Address, IsActive) VALUES
('Juan Pérez',     'juan@mail.com',   '0991234567', 'Av. Principal 123, Guayaquil', 1),
('María García',   'maria@mail.com',  '0987654321', 'Calle Flores 456, Quito',      1),
('Carlos López',   'carlos@mail.com', '0976543210', 'Av. 9 de Octubre, Guayaquil',  1),
('Ana Rodríguez',  'ana@mail.com',    '0965432109', 'Av. Amazonas 789, Quito',      0);

-- Pedidos
INSERT INTO Orders (CustomerId, Status, Notes) VALUES
(1, 'Pending',    'Entregar en horario de oficina'),
(1, 'Completed',  'Entregado sin novedad'),
(2, 'InProgress', 'Cliente solicitó embalaje especial'),
(3, 'Cancelled',  'Cancelado por falta de stock'),
(2, 'Pending',    NULL);

-- Ítems (el trigger recalculará el Total automáticamente)
INSERT INTO OrderItems (OrderId, Description, Quantity, UnitPrice) VALUES
(1, 'Laptop HP 15"',        1, 899.99),
(1, 'Mouse inalámbrico',    2,  25.00),
(2, 'Monitor LG 24"',       1, 350.00),
(2, 'Cable HDMI 2m',        3,   8.50),
(3, 'Teclado mecánico',     1, 120.00),
(4, 'Audífonos Sony',       2,  75.00),
(5, 'Webcam Logitech',      1,  89.99),
(5, 'Hub USB 7 puertos',    1,  35.00);
GO