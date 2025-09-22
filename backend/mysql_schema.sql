-- =========================================================
-- MANEA Professional - Esquema MySQL 8.0+
-- Sistema Integral de Gestión Ganadera
-- =========================================================

CREATE DATABASE IF NOT EXISTS manea_professional
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE manea_professional;

-- Configuración inicial
SET sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';
SET time_zone = '+00:00';

-- =========================
-- TABLAS DE CATÁLOGOS
-- =========================

-- Roles de usuario
CREATE TABLE roles (
  id TINYINT UNSIGNED PRIMARY KEY,
  codigo VARCHAR(32) NOT NULL UNIQUE,
  nombre VARCHAR(64) NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Roles de usuarios del sistema';

INSERT INTO roles (id, codigo, nombre, descripcion) VALUES
  (1, 'ganadero', 'Ganadero', 'Propietario de ganado y fincas'),
  (2, 'veterinario', 'Veterinario', 'Profesional veterinario'),
  (3, 'administrador', 'Administrador', 'Administrador del sistema');

-- Tipos de ganado
CREATE TABLE tipos_ganado (
  id TINYINT UNSIGNED PRIMARY KEY,
  codigo VARCHAR(32) NOT NULL UNIQUE,
  nombre VARCHAR(64) NOT NULL,
  descripcion TEXT,
  icono VARCHAR(32),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Tipos de explotación ganadera';

INSERT INTO tipos_ganado (id, codigo, nombre, descripcion, icono) VALUES
  (1, 'leche', 'Producción Láctea', 'Ganado especializado en producción de leche', '🥛'),
  (2, 'carne', 'Producción de Carne', 'Ganado para engorde y producción cárnica', '🍖'),
  (3, 'dual', 'Doble Propósito', 'Ganado para leche y carne simultáneamente', '🥛+🍖');

-- Estados del ganado
CREATE TABLE estados_ganado (
  id TINYINT UNSIGNED PRIMARY KEY,
  codigo VARCHAR(32) NOT NULL UNIQUE,
  nombre VARCHAR(64) NOT NULL,
  descripcion TEXT,
  color VARCHAR(7) DEFAULT '#6B7280',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Estados del ganado en el sistema';

INSERT INTO estados_ganado (id, codigo, nombre, descripcion, color) VALUES
  (1, 'activo', 'Activo', 'Animal activo en la finca', '#10B981'),
  (2, 'vendido', 'Vendido', 'Animal vendido', '#6B7280'),
  (3, 'reservado', 'Reservado', 'Animal reservado para venta', '#F59E0B'),
  (4, 'muerto', 'Muerto', 'Animal fallecido', '#EF4444'),
  (5, 'retirado', 'Retirado', 'Animal retirado del sistema', '#8B5CF6');

-- Estados de venta
CREATE TABLE estados_venta (
  id TINYINT UNSIGNED PRIMARY KEY,
  codigo VARCHAR(32) NOT NULL UNIQUE,
  nombre VARCHAR(64) NOT NULL,
  descripcion TEXT,
  color VARCHAR(7) DEFAULT '#6B7280',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Estados de venta del ganado';

INSERT INTO estados_venta (id, codigo, nombre, descripcion, color) VALUES
  (1, 'disponible', 'Disponible', 'Animal disponible para venta', '#10B981'),
  (2, 'reservado', 'Reservado', 'Animal reservado por comprador', '#F59E0B'),
  (3, 'vendido', 'Vendido', 'Animal vendido', '#6B7280');

-- Tipos de registro médico
CREATE TABLE tipos_registro_medico (
  id SMALLINT UNSIGNED PRIMARY KEY,
  codigo VARCHAR(32) NOT NULL UNIQUE,
  nombre VARCHAR(64) NOT NULL,
  descripcion TEXT,
  requiere_medicamento BOOLEAN DEFAULT FALSE,
  requiere_veterinario BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Tipos de registros médicos';

INSERT INTO tipos_registro_medico (id, codigo, nombre, descripcion, requiere_medicamento, requiere_veterinario) VALUES
  (1, 'vacuna', 'Vacunación', 'Aplicación de vacunas', TRUE, TRUE),
  (2, 'desparasitacion', 'Desparasitación', 'Tratamiento antiparasitario', TRUE, FALSE),
  (3, 'tratamiento', 'Tratamiento Médico', 'Tratamiento médico general', TRUE, TRUE),
  (4, 'examen', 'Examen Médico', 'Examen o chequeo médico', FALSE, TRUE),
  (5, 'cirugia', 'Cirugía', 'Procedimiento quirúrgico', FALSE, TRUE);

-- Tipos de alerta
CREATE TABLE tipos_alerta (
  id TINYINT UNSIGNED PRIMARY KEY,
  codigo VARCHAR(32) NOT NULL UNIQUE,
  nombre VARCHAR(64) NOT NULL,
  descripcion TEXT,
  severidad_default TINYINT DEFAULT 2,
  color VARCHAR(7) DEFAULT '#F59E0B',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Tipos de alertas del sistema';

INSERT INTO tipos_alerta (id, codigo, nombre, descripcion, severidad_default, color) VALUES
  (1, 'vencimiento_medico', 'Vencimiento Médico', 'Vencimiento de tratamiento o vacuna', 3, '#EF4444'),
  (2, 'chequeo_gestacion', 'Chequeo de Gestación', 'Control de gestación pendiente', 2, '#F59E0B'),
  (3, 'control_peso', 'Control de Peso', 'Control de peso programado', 2, '#3B82F6'),
  (4, 'falta_leche', 'Registro de Leche Faltante', 'Falta registro de producción láctea', 1, '#8B5CF6'),
  (5, 'produccion_baja', 'Producción Baja', 'Producción por debajo del promedio', 2, '#F59E0B');

-- Razas de ganado
CREATE TABLE razas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE,
  tipo_ganado_principal TINYINT UNSIGNED,
  origen VARCHAR(100),
  caracteristicas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tipo_ganado_principal) REFERENCES tipos_ganado(id)
) ENGINE=InnoDB COMMENT='Catálogo de razas bovinas';

INSERT INTO razas (nombre, tipo_ganado_principal, origen, caracteristicas) VALUES
  ('Holstein', 1, 'Holanda', 'Excelente producción láctea, adaptable a diversos climas'),
  ('Jersey', 1, 'Reino Unido', 'Leche rica en grasa y proteína, raza pequeña'),
  ('Brahman', 2, 'India', 'Resistente a climas cálidos, buena para carne'),
  ('Angus', 2, 'Escocia', 'Excelente calidad de carne, resistente'),
  ('Simmental', 3, 'Suiza', 'Doble propósito, buena para leche y carne'),
  ('Pardo Suizo', 3, 'Suiza', 'Versatil, buena producción láctea y cárnica');

-- =========================
-- USUARIOS Y AUTENTICACIÓN
-- =========================

CREATE TABLE usuarios (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nombre_completo VARCHAR(120) NOT NULL,
  correo VARCHAR(190) NOT NULL UNIQUE,
  clave_hash VARCHAR(255) NOT NULL,
  rol_id TINYINT UNSIGNED NOT NULL DEFAULT 1,
  telefono VARCHAR(32),
  especialidad VARCHAR(100), -- Para veterinarios
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_acceso TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (rol_id) REFERENCES roles(id),
  INDEX idx_usuarios_correo (correo),
  INDEX idx_usuarios_activo (activo)
) ENGINE=InnoDB COMMENT='Usuarios del sistema';

-- =========================
-- FINCAS Y UBICACIONES
-- =========================

CREATE TABLE paises (
  codigo CHAR(2) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  nombre_oficial VARCHAR(150),
  moneda_codigo CHAR(3) DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Catálogo de países';

INSERT INTO paises (codigo, nombre, nombre_oficial, moneda_codigo) VALUES
  ('CR', 'Costa Rica', 'República de Costa Rica', 'CRC'),
  ('GT', 'Guatemala', 'República de Guatemala', 'GTQ'),
  ('NI', 'Nicaragua', 'República de Nicaragua', 'NIO'),
  ('HN', 'Honduras', 'República de Honduras', 'HNL'),
  ('PA', 'Panamá', 'República de Panamá', 'PAB');

CREATE TABLE fincas (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nombre VARCHAR(120) NOT NULL,
  codigo_pais CHAR(2) DEFAULT 'CR',
  direccion TEXT,
  telefono VARCHAR(32),
  email VARCHAR(190),
  area_hectareas DECIMAL(10,2) UNSIGNED,
  
  -- Ubicación geográfica (punto central)
  latitud DECIMAL(10, 8),
  longitud DECIMAL(11, 8),
  
  -- Perímetro de la finca (polígono)
  perimetro_geojson JSON, -- Almacenar como GeoJSON
  
  -- Información adicional
  descripcion TEXT,
  imagen_url VARCHAR(512),
  activa BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (codigo_pais) REFERENCES paises(codigo),
  INDEX idx_fincas_activa (activa),
  INDEX idx_fincas_pais (codigo_pais)
) ENGINE=InnoDB COMMENT='Fincas ganaderas';

-- Relación usuarios-fincas (muchos a muchos)
CREATE TABLE fincas_usuarios (
  finca_id CHAR(36) NOT NULL,
  usuario_id CHAR(36) NOT NULL,
  rol_finca ENUM('propietario', 'administrador', 'empleado', 'veterinario') DEFAULT 'empleado',
  fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  activo BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (finca_id, usuario_id),
  FOREIGN KEY (finca_id) REFERENCES fincas(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_fincas_usuarios_activo (activo)
) ENGINE=InnoDB COMMENT='Relación usuarios-fincas';

-- Potreros dentro de las fincas
CREATE TABLE potreros (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  finca_id CHAR(36) NOT NULL,
  nombre VARCHAR(80) NOT NULL,
  area_hectareas DECIMAL(7,2) UNSIGNED,
  capacidad_bovinos SMALLINT UNSIGNED,
  tipo_pasto VARCHAR(100),
  
  -- Ubicación del potrero (polígono)
  poligono_geojson JSON NOT NULL, -- GeoJSON del polígono
  
  descripcion TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (finca_id) REFERENCES fincas(id) ON DELETE CASCADE,
  UNIQUE KEY uq_potreros_finca_nombre (finca_id, nombre),
  INDEX idx_potreros_activo (activo)
) ENGINE=InnoDB COMMENT='Potreros de las fincas';

-- =========================
-- BOVINOS (NÚCLEO PRINCIPAL)
-- =========================

CREATE TABLE bovinos (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  finca_id CHAR(36) NOT NULL,
  
  -- Identificación
  caravana VARCHAR(50) NOT NULL,
  arete_oficial VARCHAR(50) UNIQUE,
  nombre VARCHAR(100),
  
  -- Características básicas
  sexo ENUM('H','M') NOT NULL DEFAULT 'H', -- Hembra/Macho
  raza_id INT UNSIGNED,
  fecha_nacimiento DATE,
  peso_kg DECIMAL(6,2) UNSIGNED,
  
  -- Tipo y estado
  tipo_ganado_id TINYINT UNSIGNED NOT NULL,
  estado_ganado_id TINYINT UNSIGNED NOT NULL DEFAULT 1,
  estado_venta_id TINYINT UNSIGNED NOT NULL DEFAULT 1,
  
  -- Geolocalización
  latitud DECIMAL(10, 8),
  longitud DECIMAL(11, 8),
  ultima_ubicacion_fecha TIMESTAMP NULL,
  
  -- Información comercial
  precio DECIMAL(12,2) UNSIGNED,
  contacto_nombre VARCHAR(120),
  contacto_telefono VARCHAR(32),
  contacto_email VARCHAR(190),
  
  -- Parentesco
  padre_id CHAR(36),
  madre_id CHAR(36),
  
  -- Código QR y multimedia
  qr_codigo TEXT, -- Base64 del QR generado
  qr_url VARCHAR(512), -- URL pública del QR
  foto_url VARCHAR(512),
  
  -- Información adicional
  observaciones TEXT,
  activo BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Claves foráneas
  FOREIGN KEY (finca_id) REFERENCES fincas(id) ON DELETE CASCADE,
  FOREIGN KEY (raza_id) REFERENCES razas(id) ON DELETE SET NULL,
  FOREIGN KEY (tipo_ganado_id) REFERENCES tipos_ganado(id),
  FOREIGN KEY (estado_ganado_id) REFERENCES estados_ganado(id),
  FOREIGN KEY (estado_venta_id) REFERENCES estados_venta(id),
  FOREIGN KEY (padre_id) REFERENCES bovinos(id) ON DELETE SET NULL,
  FOREIGN KEY (madre_id) REFERENCES bovinos(id) ON DELETE SET NULL,
  
  -- Índices
  UNIQUE KEY uq_bovinos_finca_caravana (finca_id, caravana),
  INDEX idx_bovinos_tipo_ganado (tipo_ganado_id),
  INDEX idx_bovinos_estado_ganado (estado_ganado_id),
  INDEX idx_bovinos_estado_venta (estado_venta_id),
  INDEX idx_bovinos_activo (activo),
  INDEX idx_bovinos_fecha_nacimiento (fecha_nacimiento)
) ENGINE=InnoDB COMMENT='Registro de bovinos';

-- =========================
-- REGISTROS MÉDICOS
-- =========================

CREATE TABLE registros_medicos (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  bovino_id CHAR(36) NOT NULL,
  tipo_registro_id SMALLINT UNSIGNED NOT NULL,
  veterinario_id CHAR(36),
  
  -- Detalles del registro
  descripcion TEXT NOT NULL,
  medicamento VARCHAR(120),
  dosis VARCHAR(80),
  lote_medicamento VARCHAR(50),
  
  -- Fechas
  fecha_evento DATE NOT NULL,
  fecha_proxima DATE, -- Próxima aplicación/control
  
  -- Costos
  costo DECIMAL(10,2) UNSIGNED,
  moneda CHAR(3) DEFAULT 'CRC',
  
  -- Información adicional
  observaciones TEXT,
  archivo_adjunto VARCHAR(512), -- URL del archivo adjunto
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by CHAR(36),
  
  FOREIGN KEY (bovino_id) REFERENCES bovinos(id) ON DELETE CASCADE,
  FOREIGN KEY (tipo_registro_id) REFERENCES tipos_registro_medico(id),
  FOREIGN KEY (veterinario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL,
  
  INDEX idx_registros_medicos_fecha (fecha_evento),
  INDEX idx_registros_medicos_proxima (fecha_proxima),
  INDEX idx_registros_medicos_tipo (tipo_registro_id)
) ENGINE=InnoDB COMMENT='Registros médicos del ganado';

-- =========================
-- PRODUCCIÓN
-- =========================

-- Producción láctea
CREATE TABLE produccion_leche (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  bovino_id CHAR(36) NOT NULL,
  fecha_registro DATE NOT NULL,
  
  -- Producción
  litros DECIMAL(6,2) NOT NULL CHECK (litros >= 0),
  ordeno_manana DECIMAL(6,2) DEFAULT 0,
  ordeno_tarde DECIMAL(6,2) DEFAULT 0,
  
  -- Calidad
  grasa_porcentaje DECIMAL(4,2) CHECK (grasa_porcentaje >= 0 AND grasa_porcentaje <= 100),
  proteina_porcentaje DECIMAL(4,2) CHECK (proteina_porcentaje >= 0 AND proteina_porcentaje <= 100),
  solidos_totales DECIMAL(4,2),
  
  -- Información adicional
  temperatura_leche DECIMAL(4,2),
  ph_leche DECIMAL(3,2),
  observaciones TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by CHAR(36),
  
  FOREIGN KEY (bovino_id) REFERENCES bovinos(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL,
  
  UNIQUE KEY uq_produccion_leche_bovino_fecha (bovino_id, fecha_registro),
  INDEX idx_produccion_leche_fecha (fecha_registro)
) ENGINE=InnoDB COMMENT='Registro de producción láctea';

-- Producción de engorde/peso
CREATE TABLE produccion_engorde (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  bovino_id CHAR(36) NOT NULL,
  fecha_registro DATE NOT NULL,
  
  -- Peso y ganancia
  peso_kg DECIMAL(6,2) NOT NULL CHECK (peso_kg > 0),
  ganancia_diaria DECIMAL(5,3), -- kg por día
  condicion_corporal TINYINT CHECK (condicion_corporal BETWEEN 1 AND 5),
  
  -- Alimentación
  tipo_alimentacion VARCHAR(100),
  consumo_concentrado_kg DECIMAL(5,2),
  consumo_forraje_kg DECIMAL(5,2),
  
  -- Medidas corporales
  perimetro_toracico DECIMAL(5,2),
  altura_cruz DECIMAL(5,2),
  largo_corporal DECIMAL(5,2),
  
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by CHAR(36),
  
  FOREIGN KEY (bovino_id) REFERENCES bovinos(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL,
  
  INDEX idx_produccion_engorde_fecha (fecha_registro),
  INDEX idx_produccion_engorde_peso (peso_kg)
) ENGINE=InnoDB COMMENT='Registro de producción de engorde';

-- =========================
-- ALERTAS Y NOTIFICACIONES
-- =========================

CREATE TABLE alertas (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  bovino_id CHAR(36) NOT NULL,
  tipo_alerta_id TINYINT UNSIGNED NOT NULL,
  
  -- Contenido de la alerta
  titulo VARCHAR(200) NOT NULL,
  mensaje TEXT,
  severidad TINYINT UNSIGNED DEFAULT 2, -- 1=baja, 2=media, 3=alta
  
  -- Fechas
  fecha_vencimiento DATE,
  fecha_programada TIMESTAMP,
  
  -- Estado
  activa BOOLEAN DEFAULT TRUE,
  leida BOOLEAN DEFAULT FALSE,
  
  -- Seguimiento
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by CHAR(36),
  resolved_at TIMESTAMP NULL,
  resolved_by CHAR(36),
  
  FOREIGN KEY (bovino_id) REFERENCES bovinos(id) ON DELETE CASCADE,
  FOREIGN KEY (tipo_alerta_id) REFERENCES tipos_alerta(id),
  FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (resolved_by) REFERENCES usuarios(id) ON DELETE SET NULL,
  
  INDEX idx_alertas_activa (activa),
  INDEX idx_alertas_severidad (severidad),
  INDEX idx_alertas_fecha_vencimiento (fecha_vencimiento),
  INDEX idx_alertas_tipo (tipo_alerta_id)
) ENGINE=InnoDB COMMENT='Sistema de alertas y notificaciones';

-- =========================
-- MOVIMIENTOS Y TRAZABILIDAD
-- =========================

CREATE TABLE tipos_movimiento (
  id TINYINT UNSIGNED PRIMARY KEY,
  codigo VARCHAR(32) NOT NULL UNIQUE,
  nombre VARCHAR(64) NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO tipos_movimiento (id, codigo, nombre, descripcion) VALUES
  (1, 'ingreso', 'Ingreso', 'Ingreso de bovino a la finca'),
  (2, 'egreso', 'Egreso', 'Salida de bovino de la finca'),
  (3, 'traslado', 'Traslado', 'Movimiento entre potreros'),
  (4, 'venta', 'Venta', 'Venta del bovino'),
  (5, 'compra', 'Compra', 'Compra de bovino'),
  (6, 'muerte', 'Muerte', 'Muerte del bovino'),
  (7, 'nacimiento', 'Nacimiento', 'Nacimiento de bovino');

CREATE TABLE movimientos_bovino (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  bovino_id CHAR(36) NOT NULL,
  tipo_movimiento_id TINYINT UNSIGNED NOT NULL,
  
  -- Origen y destino
  potrero_origen_id CHAR(36),
  potrero_destino_id CHAR(36),
  finca_origen_id CHAR(36),
  finca_destino_id CHAR(36),
  
  -- Detalles del movimiento
  fecha_movimiento TIMESTAMP NOT NULL,
  motivo TEXT,
  documento_referencia VARCHAR(120),
  
  -- Información comercial (para ventas/compras)
  precio DECIMAL(12,2),
  comprador_vendedor VARCHAR(150),
  
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by CHAR(36),
  
  FOREIGN KEY (bovino_id) REFERENCES bovinos(id) ON DELETE CASCADE,
  FOREIGN KEY (tipo_movimiento_id) REFERENCES tipos_movimiento(id),
  FOREIGN KEY (potrero_origen_id) REFERENCES potreros(id) ON DELETE SET NULL,
  FOREIGN KEY (potrero_destino_id) REFERENCES potreros(id) ON DELETE SET NULL,
  FOREIGN KEY (finca_origen_id) REFERENCES fincas(id) ON DELETE SET NULL,
  FOREIGN KEY (finca_destino_id) REFERENCES fincas(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL,
  
  INDEX idx_movimientos_fecha (fecha_movimiento),
  INDEX idx_movimientos_tipo (tipo_movimiento_id)
) ENGINE=InnoDB COMMENT='Historial de movimientos de bovinos';

-- =========================
-- GESTIÓN ECONÓMICA
-- =========================

-- Proveedores
CREATE TABLE proveedores (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nombre VARCHAR(160) NOT NULL,
  tipo_documento ENUM('cedula', 'ruc', 'pasaporte', 'otro') DEFAULT 'cedula',
  numero_documento VARCHAR(32),
  telefono VARCHAR(32),
  email VARCHAR(190),
  direccion TEXT,
  pais_codigo CHAR(2) DEFAULT 'CR',
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pais_codigo) REFERENCES paises(codigo),
  UNIQUE KEY uq_proveedores_documento (numero_documento, tipo_documento),
  INDEX idx_proveedores_activo (activo)
) ENGINE=InnoDB COMMENT='Catálogo de proveedores';

-- Categorías de insumos
CREATE TABLE categorias_insumos (
  id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO categorias_insumos (nombre, descripcion) VALUES
  ('Alimentos', 'Concentrados, forrajes, suplementos'),
  ('Medicamentos', 'Vacunas, antibióticos, desparasitantes'),
  ('Equipos', 'Herramientas y equipos ganaderos'),
  ('Servicios', 'Servicios veterinarios, transporte'),
  ('Otros', 'Otros insumos no clasificados');

-- Insumos
CREATE TABLE insumos (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  categoria_id SMALLINT UNSIGNED NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  descripcion TEXT,
  unidad_medida VARCHAR(16) NOT NULL, -- kg, lt, dosis, unidad, etc.
  precio_unitario DECIMAL(12,4),
  moneda CHAR(3) DEFAULT 'CRC',
  proveedor_id CHAR(36),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (categoria_id) REFERENCES categorias_insumos(id),
  FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL,
  INDEX idx_insumos_categoria (categoria_id),
  INDEX idx_insumos_activo (activo)
) ENGINE=InnoDB COMMENT='Catálogo de insumos ganaderos';

-- =========================
-- VISTAS PARA ANÁLISIS
-- =========================

-- Vista: Resumen de bovinos por finca
CREATE VIEW v_bovinos_resumen AS
SELECT 
  f.id as finca_id,
  f.nombre as finca_nombre,
  tg.nombre as tipo_ganado,
  COUNT(b.id) as total_bovinos,
  AVG(CASE WHEN b.peso_kg > 0 THEN b.peso_kg END) as peso_promedio,
  COUNT(CASE WHEN b.estado_venta_id = 1 THEN 1 END) as disponibles_venta,
  COUNT(CASE WHEN b.estado_ganado_id = 1 THEN 1 END) as activos
FROM fincas f
LEFT JOIN bovinos b ON f.id = b.finca_id AND b.activo = TRUE
LEFT JOIN tipos_ganado tg ON b.tipo_ganado_id = tg.id
GROUP BY f.id, f.nombre, tg.id, tg.nombre;

-- Vista: Producción láctea mensual
CREATE VIEW v_produccion_lactea_mensual AS
SELECT 
  b.finca_id,
  f.nombre as finca_nombre,
  YEAR(pl.fecha_registro) as anio,
  MONTH(pl.fecha_registro) as mes,
  COUNT(DISTINCT b.id) as vacas_productoras,
  SUM(pl.litros) as litros_totales,
  AVG(pl.litros) as litros_promedio_diario,
  AVG(pl.grasa_porcentaje) as grasa_promedio,
  AVG(pl.proteina_porcentaje) as proteina_promedio
FROM produccion_leche pl
JOIN bovinos b ON pl.bovino_id = b.id
JOIN fincas f ON b.finca_id = f.id
WHERE b.activo = TRUE
GROUP BY b.finca_id, f.nombre, YEAR(pl.fecha_registro), MONTH(pl.fecha_registro);

-- Vista: Alertas pendientes con información del bovino
CREATE VIEW v_alertas_pendientes AS
SELECT 
  a.id as alerta_id,
  a.titulo,
  a.mensaje,
  a.severidad,
  a.fecha_vencimiento,
  a.created_at as fecha_creacion,
  b.id as bovino_id,
  b.caravana,
  b.nombre as bovino_nombre,
  f.nombre as finca_nombre,
  ta.nombre as tipo_alerta,
  ta.color as color_alerta,
  DATEDIFF(COALESCE(a.fecha_vencimiento, CURDATE()), CURDATE()) as dias_vencimiento
FROM alertas a
JOIN bovinos b ON a.bovino_id = b.id
JOIN fincas f ON b.finca_id = f.id
JOIN tipos_alerta ta ON a.tipo_alerta_id = ta.id
WHERE a.activa = TRUE AND b.activo = TRUE
ORDER BY a.severidad DESC, a.fecha_vencimiento ASC;

-- Vista: Historial médico completo
CREATE VIEW v_historial_medico_completo AS
SELECT 
  rm.id as registro_id,
  b.id as bovino_id,
  b.caravana,
  b.nombre as bovino_nombre,
  f.nombre as finca_nombre,
  trm.nombre as tipo_registro,
  rm.descripcion,
  rm.medicamento,
  rm.dosis,
  rm.fecha_evento,
  rm.fecha_proxima,
  rm.costo,
  u.nombre_completo as veterinario,
  rm.created_at as fecha_registro
FROM registros_medicos rm
JOIN bovinos b ON rm.bovino_id = b.id
JOIN fincas f ON b.finca_id = f.id
JOIN tipos_registro_medico trm ON rm.tipo_registro_id = trm.id
LEFT JOIN usuarios u ON rm.veterinario_id = u.id
WHERE b.activo = TRUE
ORDER BY rm.fecha_evento DESC;

-- =========================
-- DATOS DE PRUEBA
-- =========================

-- Usuario administrador de prueba
INSERT INTO usuarios (id, nombre_completo, correo, clave_hash, rol_id) VALUES
('admin-test-uuid', 'Administrador Test', 'admin@manea.com', '$2b$12$example_hash_here', 3);

-- Finca de prueba
INSERT INTO fincas (id, nombre, codigo_pais, direccion, area_hectareas, latitud, longitud) VALUES
('finca-test-uuid', 'Finca La Esperanza', 'CR', 'San José, Costa Rica', 150.50, 9.7489, -83.7534);

-- Relación usuario-finca
INSERT INTO fincas_usuarios (finca_id, usuario_id, rol_finca) VALUES
('finca-test-uuid', 'admin-test-uuid', 'propietario');

-- =========================
-- ÍNDICES ADICIONALES PARA RENDIMIENTO
-- =========================

-- Índices compuestos para consultas frecuentes
CREATE INDEX idx_bovinos_finca_tipo_estado ON bovinos(finca_id, tipo_ganado_id, estado_ganado_id);
CREATE INDEX idx_produccion_leche_bovino_fecha ON produccion_leche(bovino_id, fecha_registro);
CREATE INDEX idx_produccion_engorde_bovino_fecha ON produccion_engorde(bovino_id, fecha_registro);
CREATE INDEX idx_registros_medicos_bovino_fecha ON registros_medicos(bovino_id, fecha_evento);
CREATE INDEX idx_alertas_bovino_activa ON alertas(bovino_id, activa);

-- =========================
-- TRIGGERS PARA AUTOMATIZACIÓN
-- =========================

DELIMITER //

-- Trigger: Actualizar peso del bovino al registrar producción de engorde
CREATE TRIGGER tr_actualizar_peso_bovino
AFTER INSERT ON produccion_engorde
FOR EACH ROW
BEGIN
  UPDATE bovinos 
  SET peso_kg = NEW.peso_kg, updated_at = NOW()
  WHERE id = NEW.bovino_id;
END //

-- Trigger: Crear alerta automática de próximo control médico
CREATE TRIGGER tr_crear_alerta_medica
AFTER INSERT ON registros_medicos
FOR EACH ROW
BEGIN
  IF NEW.fecha_proxima IS NOT NULL THEN
    INSERT INTO alertas (bovino_id, tipo_alerta_id, titulo, mensaje, fecha_vencimiento, created_by)
    VALUES (
      NEW.bovino_id, 
      1, -- vencimiento_medico
      CONCAT('Próximo ', (SELECT nombre FROM tipos_registro_medico WHERE id = NEW.tipo_registro_id)),
      CONCAT('Programado para el ', DATE_FORMAT(NEW.fecha_proxima, '%d/%m/%Y')),
      NEW.fecha_proxima,
      NEW.created_by
    );
  END IF;
END //

DELIMITER ;

-- =========================
-- PROCEDIMIENTOS ALMACENADOS
-- =========================

DELIMITER //

-- Procedimiento: Obtener estadísticas del dashboard
CREATE PROCEDURE sp_dashboard_stats(IN p_finca_id CHAR(36))
BEGIN
  SELECT 
    (SELECT COUNT(*) FROM bovinos WHERE finca_id = COALESCE(p_finca_id, finca_id) AND activo = TRUE) as total_bovinos,
    (SELECT COUNT(*) FROM fincas WHERE id = COALESCE(p_finca_id, id) AND activa = TRUE) as total_fincas,
    (SELECT COUNT(*) FROM alertas a JOIN bovinos b ON a.bovino_id = b.id WHERE b.finca_id = COALESCE(p_finca_id, b.finca_id) AND a.activa = TRUE) as alertas_activas,
    (SELECT COALESCE(SUM(pl.litros), 0) FROM produccion_leche pl JOIN bovinos b ON pl.bovino_id = b.id WHERE b.finca_id = COALESCE(p_finca_id, b.finca_id) AND pl.fecha_registro >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) as litros_mes_actual;
END //

-- Procedimiento: Generar reporte de producción
CREATE PROCEDURE sp_reporte_produccion(IN p_bovino_id CHAR(36), IN p_fecha_inicio DATE, IN p_fecha_fin DATE)
BEGIN
  -- Producción láctea
  SELECT 'PRODUCCION_LECHE' as tipo, fecha_registro, litros as valor, grasa_porcentaje, proteina_porcentaje
  FROM produccion_leche 
  WHERE bovino_id = p_bovino_id 
    AND fecha_registro BETWEEN p_fecha_inicio AND p_fecha_fin
  ORDER BY fecha_registro;
  
  -- Producción de engorde
  SELECT 'PRODUCCION_ENGORDE' as tipo, fecha_registro, peso_kg as valor, ganancia_diaria, condicion_corporal
  FROM produccion_engorde 
  WHERE bovino_id = p_bovino_id 
    AND fecha_registro BETWEEN p_fecha_inicio AND p_fecha_fin
  ORDER BY fecha_registro;
END //

DELIMITER ;

-- =========================
-- CONFIGURACIÓN FINAL
-- =========================

-- Configurar el motor de almacenamiento por defecto
SET default_storage_engine = InnoDB;

-- Configurar el conjunto de caracteres
ALTER DATABASE manea_professional CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- Mensaje de finalización
SELECT 'Base de datos MANEA Professional creada exitosamente' as mensaje,
       COUNT(*) as total_tablas
FROM information_schema.tables 
WHERE table_schema = 'manea_professional';