-- ============================================================================
-- PROTOVISITAS - Estructura + Datos Iniciales
-- ============================================================================

-- La imagen oficial de MariaDB crea y selecciona MARIADB_DATABASE antes de
-- ejecutar los scripts ubicados en /docker-entrypoint-initdb.d.

-- ===================================
-- ROLES Y PERMISOS
-- ===================================

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE permisos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE rol_permisos (
    rol_id INT NOT NULL,
    permiso_id INT NOT NULL,
    PRIMARY KEY (rol_id, permiso_id),
    FOREIGN KEY (rol_id) REFERENCES roles(id),
    FOREIGN KEY (permiso_id) REFERENCES permisos(id)
);

-- ===================================
-- USUARIOS
-- ===================================

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol_id INT NOT NULL,
    supervisor_id INT NULL,
    activo BOOLEAN DEFAULT TRUE,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id),
    FOREIGN KEY (supervisor_id) REFERENCES usuarios(id)
);

-- ===================================
-- CLIENTES
-- ===================================

CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(200),
    departamento VARCHAR(80),
    municipio VARCHAR(80),
    latitud DOUBLE,
    longitud DOUBLE,
    telefono VARCHAR(20),
    email VARCHAR(120),
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ===================================
-- ESTADOS DE VISITA
-- ===================================

CREATE TABLE estados_visita (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- ===================================
-- VISITAS
-- ===================================

CREATE TABLE visitas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    supervisor_id INT NOT NULL,
    tecnico_id INT NOT NULL,
    estado_id INT NOT NULL,
    fecha_programada DATE NOT NULL,
    hora_inicio TIME,
    hora_fin TIME,
    notas TEXT,
    latitud_inicio DOUBLE,
    longitud_inicio DOUBLE,
    latitud_fin DOUBLE,
    longitud_fin DOUBLE,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (supervisor_id) REFERENCES usuarios(id),
    FOREIGN KEY (tecnico_id) REFERENCES usuarios(id),
    FOREIGN KEY (estado_id) REFERENCES estados_visita(id)
);

-- ===================================
-- REPORTES
-- ===================================

CREATE TABLE reportes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visita_id INT NOT NULL,
    resumen TEXT,
    observaciones TEXT,
    firma_cliente VARCHAR(255),
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (visita_id) REFERENCES visitas(id)
);

-- ============================================================================
-- DATOS DE PRUEBA
-- ============================================================================

-- ---------------------
-- ROLES
-- ---------------------
INSERT INTO roles (nombre) VALUES
('Administrador'),
('Supervisor'),
('Tecnico');

-- ---------------------
-- PERMISOS
-- ---------------------
INSERT INTO permisos (nombre) VALUES
('crear_visita'),
('editar_visita'),
('ver_dashboard'),
('gestionar_usuarios');

-- ---------------------
-- ROLES - PERMISOS
-- ---------------------
-- Administrador: todos
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 1, id FROM permisos;

-- Supervisor: crear/editar/ver
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 2, id FROM permisos WHERE nombre IN ('crear_visita', 'editar_visita', 'ver_dashboard');

-- Técnico: solo ver_dashboard
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 3, id FROM permisos WHERE nombre = 'ver_dashboard';

-- Los usuarios y clientes se crean vacíos deliberadamente.
-- Para generar el primer administrador, consulta el README y usa
-- Backend/scripts/create_admin.py. Así no se publican credenciales de ejemplo.

-- ---------------------
-- ESTADOS DE VISITA
-- ---------------------
INSERT INTO estados_visita (nombre) VALUES
('PLANIFICADA'),
('EN_PROGRESO'),
('COMPLETADA'),
('CANCELADA');

-- No se incluyen visitas ni reportes de terceros en la versión pública.
