-- Migración de tablas operativas para Tutor y Estudiante (V2 - Postgres)

-- 1. Tabla de Avances de Proyecto (Hitos de entrega)
CREATE TABLE IF NOT EXISTS avances_proyecto (
    id bigserial PRIMARY KEY,
    proyecto_id bigint NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    numero_avance integer NOT NULL, -- 1, 2, 3, 4
    archivo_entregado character varying(255),
    comentario_estudiante text,
    comentario_tutor text,
    estado character varying(20) DEFAULT 'pendiente', -- 'pendiente', 'revisado', 'corregir', 'aprobado'
    nota numeric(3,1),
    fecha_entrega timestamp DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Entregas de Pasantía (Informes mensuales/quincenales)
CREATE TABLE IF NOT EXISTS entregas_pasantia (
    id bigserial PRIMARY KEY,
    pasantia_id bigint NOT NULL REFERENCES pasantias(id) ON DELETE CASCADE,
    numero_entrega integer NOT NULL,
    archivo_entregado character varying(255),
    comentario_estudiante text,
    comentario_tutor text,
    estado character varying(20) DEFAULT 'pendiente', -- 'pendiente', 'revisado', 'corregir', 'aprobado'
    nota numeric(3,1),
    fecha_entrega timestamp DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Chat (Mensajería interna)
CREATE TABLE IF NOT EXISTS mensajes_chat (
    id bigserial PRIMARY KEY,
    pasantia_id bigint REFERENCES pasantias(id) ON DELETE CASCADE,
    proyecto_id bigint REFERENCES proyectos(id) ON DELETE CASCADE,
    emisor_id bigint NOT NULL REFERENCES users(id),
    receptor_id bigint NOT NULL REFERENCES users(id),
    mensaje text,
    archivo character varying(255),
    leido boolean DEFAULT false,
    fecha_envio timestamp DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tablas para Gestión de Documentos de Pasantía (Lo que pidió el usuario)
-- Podemos usar una tabla para guardar los datos que alimentan los formatos
CREATE TABLE IF NOT EXISTS documentos_pasantia (
    id bigserial PRIMARY KEY,
    pasantia_id bigint NOT NULL REFERENCES pasantias(id) ON DELETE CASCADE,
    tipo_documento character varying(50) NOT NULL, -- 'acta_inicio', 'plan_trabajo', 'evaluacion', 'asistencia'
    datos_json jsonb NOT NULL, -- Guardamos nombres, fechas, NIT, etc. en formato flexible
    ruta_pdf_generado character varying(255),
    estado character varying(20) DEFAULT 'borrador', -- 'borrador', 'firmado', 'finalizado'
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- 5. Actividades (Para Seminarios o Tareas extras de Tutores)
CREATE TABLE IF NOT EXISTS actividades (
    id bigserial PRIMARY KEY,
    titulo character varying(255) NOT NULL,
    descripcion text,
    fecha_limite date,
    hora_limite time,
    tutor_id bigint NOT NULL REFERENCES users(id),
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- 6. Notificaciones del Sistema
CREATE TABLE IF NOT EXISTS notificaciones (
    id bigserial PRIMARY KEY,
    user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    titulo character varying(100),
    mensaje text,
    leida boolean DEFAULT false,
    tipo character varying(50), -- 'entrega', 'chat', 'aprobacion'
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar velocidad en el panel del tutor
CREATE INDEX idx_avances_estado ON avances_proyecto(estado);
CREATE INDEX idx_entregas_estado ON entregas_pasantia(estado);
CREATE INDEX idx_mensajes_receptor ON mensajes_chat(receptor_id, leido);
