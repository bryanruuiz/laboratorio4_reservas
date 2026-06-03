IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'lab4_reservas')
BEGIN
    CREATE DATABASE lab4_reservas;
END
GO

USE lab4_reservas;
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='usuarios' AND xtype='U')
BEGIN
    CREATE TABLE usuarios (
        id_usuario INT IDENTITY(1,1) PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        correo VARCHAR(150) NOT NULL UNIQUE,
        rol VARCHAR(20) NOT NULL,
        contrasena VARCHAR(255) NULL,
        estado VARCHAR(20) NOT NULL DEFAULT 'activo',
        CONSTRAINT CHK_usuarios_rol CHECK (rol IN ('admin', 'usuario')),
        CONSTRAINT CHK_usuarios_estado CHECK (estado IN ('activo', 'inactivo'))
    );
END
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='espacios' AND xtype='U')
BEGIN
    CREATE TABLE espacios (
        id_espacio INT IDENTITY(1,1) PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        ubicacion VARCHAR(150) NOT NULL,
        capacidad INT NOT NULL,
        estado VARCHAR(50) NOT NULL
    );
END
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='reservas' AND xtype='U')
BEGIN
    CREATE TABLE reservas (
        id_reserva INT IDENTITY(1,1) PRIMARY KEY,
        id_usuario INT NOT NULL,
        id_espacio INT NOT NULL,
        fecha DATE NOT NULL,
        hora_inicio TIME NOT NULL,
        hora_fin TIME NOT NULL,
        cantidad_asistentes INT NOT NULL,
        estado VARCHAR(50) NOT NULL DEFAULT 'esperando',
        CONSTRAINT FK_reservas_usuarios FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
        CONSTRAINT FK_reservas_espacios FOREIGN KEY (id_espacio) REFERENCES espacios(id_espacio)
    );
END
GO