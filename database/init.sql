-- Portal de capacitaciones musicales - esquema completo
-- Tabla de usuarios
CREATE TABLE users
(
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50) UNIQUE  NOT NULL,
    email         VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255)        NOT NULL,
    full_name     VARCHAR(100),
    avatar_url    VARCHAR(255),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de modulos musicales
CREATE TABLE modules
(
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100)       NOT NULL,
    description  TEXT,
    icon         VARCHAR(50),
    color        VARCHAR(7) DEFAULT '#3B82F6',
    created_at   TIMESTAMP  DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de cursos musicales
CREATE TABLE courses
(
    id               SERIAL PRIMARY KEY,
    title            VARCHAR(200) NOT NULL,
    description      TEXT,
    module_id        INTEGER      NOT NULL REFERENCES modules (id) ON DELETE CASCADE,
    level            VARCHAR(20) DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced'
    duration_minutes INTEGER     DEFAULT 60,
    instructor_name  VARCHAR(100),
    video_url        VARCHAR(255),
    badge_image      VARCHAR(255),
    order_in_module  INTEGER     DEFAULT 0,
    is_active        BOOLEAN     DEFAULT true,
    created_at       TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de progreso del usuario
CREATE TABLE user_progress
(
    id                  SERIAL PRIMARY KEY,
    user_id             INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    course_id           INTEGER NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
    status              VARCHAR(20) DEFAULT 'not_started', -- 'not_started', 'started', 'completed'
    progress_percentage INTEGER     DEFAULT 0,             -- 0-100
    started_at          TIMESTAMP,
    completed_at        TIMESTAMP,
    last_accessed       TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    notes               TEXT,
    UNIQUE (user_id, course_id)
);

-- Tabla de insignias obtenidas
CREATE TABLE user_badges
(
    id        SERIAL PRIMARY KEY,
    user_id   INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, course_id)
);

-- Crear indices para mejor performance
CREATE INDEX IF NOT EXISTS idx_courses_module ON courses(module_id);
CREATE INDEX IF NOT EXISTS idx_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_course ON user_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_badges_user ON user_badges(user_id);

-- Insertar módulos musicales
INSERT INTO modules (name, display_name, description, icon, color)
VALUES ('piano', 'Piano', 'Aprende a tocar piano desde lo basico hasta nivel avanzado', 'piano', '#8B5CF6'),
       ('guitar', 'Guitarra', 'Domina la guitarra acustica y electrica', 'guitar', '#10B981'),
       ('vocals', 'Canto', 'Tecnicas vocales y entrenamiento de voz', 'microphone', '#F59E0B'),
       ('drums', 'Bateria', 'Ritmos y tecnicas de percusion', 'drums', '#EF4444'),
       ('theory', 'Teoria Musical', 'Fundamentos teoricos de la musica', 'music-note', '#3B82F6'),
       ('production', 'Produccion', 'Produccion musical digital y audio', 'headphones', '#6366F1');

-- Insertar cursos musicales usando subconsultas para garantizar IDs correctos
INSERT INTO courses (title, description, module_id, level, duration_minutes, instructor_name, order_in_module)
VALUES
-- Piano
('Piano para Principiantes', 'Primeros pasos en el piano: postura, digitacion y escalas basicas',
 (SELECT id FROM modules WHERE name = 'piano'), 'beginner', 45, 'Maria Rodriguez', 1),
('Acordes y Progresiones', 'Aprende los acordes fundamentales y como combinarlos',
 (SELECT id FROM modules WHERE name = 'piano'), 'intermediate', 60, 'Carlos Mendoza', 2),
('Piano Clasico Avanzado', 'Tecnicas avanzadas e interpretacion de piezas clasicas',
 (SELECT id FROM modules WHERE name = 'piano'), 'advanced', 90, 'Ana Gutierrez', 3),
('Jazz Piano Basico', 'Introduccion al piano jazz y improvisacion',
 (SELECT id FROM modules WHERE name = 'piano'), 'intermediate', 75, 'Roberto Silva', 4),

-- Guitarra
('Guitarra Basica', 'Primeros acordes y rasgueos fundamentales',
 (SELECT id FROM modules WHERE name = 'guitar'), 'beginner', 50, 'Diego Lopez', 1),
('Tecnicas de Fingerpicking', 'Dominando el fingerpicking y arpegios',
 (SELECT id FROM modules WHERE name = 'guitar'), 'intermediate', 65, 'Lucia Torres', 2),
('Guitarra Electrica Rock', 'Riffs, solos y tecnicas del rock',
 (SELECT id FROM modules WHERE name = 'guitar'), 'advanced', 75, 'Roberto Silva', 3),
('Blues Guitar', 'Tecnicas y escalas del blues en guitarra',
 (SELECT id FROM modules WHERE name = 'guitar'), 'intermediate', 70, 'Miguel Santos', 4),

-- Canto
('Respiracion y Postura Vocal', 'Fundamentos de la tecnica vocal',
 (SELECT id FROM modules WHERE name = 'vocals'), 'beginner', 40, 'Isabella Garcia', 1),
('Interpretacion y Estilo', 'Desarrolla tu propio estilo vocal',
 (SELECT id FROM modules WHERE name = 'vocals'), 'intermediate', 55, 'Fernando Ruiz', 2),
('Canto Lirico', 'Tecnicas de canto clasico y lirico',
 (SELECT id FROM modules WHERE name = 'vocals'), 'advanced', 80, 'Carmen Morales', 3),

-- Bateria
('Ritmos Basicos', 'Patrones ritmicos fundamentales',
 (SELECT id FROM modules WHERE name = 'drums'), 'beginner', 50, 'Andres Morales', 1),
('Fills y Transiciones', 'Tecnicas avanzadas de bateria',
 (SELECT id FROM modules WHERE name = 'drums'), 'intermediate', 70, 'Camila Vega', 2),

-- Teoria Musical
('Solfeo y Lectura', 'Aprende a leer partituras',
 (SELECT id FROM modules WHERE name = 'theory'), 'beginner', 35, 'Prof. Gonzalez', 1),
('Armonia Moderna', 'Conceptos avanzados de armonia',
 (SELECT id FROM modules WHERE name = 'theory'), 'advanced', 80, 'Dr. Martinez', 2),

-- Produccion
('Introduccion a DAWs', 'Primeros pasos en software de produccion',
 (SELECT id FROM modules WHERE name = 'production'), 'beginner', 60, 'Alex Producer', 1),
('Mixing y Mastering', 'Tecnicas profesionales de mezcla',
 (SELECT id FROM modules WHERE name = 'production'), 'advanced', 120, 'Sound Engineer Pro', 2);

-- Usuario administrador
INSERT INTO users (username, email, password_hash, full_name)
VALUES ('admin', 'admin@academia-musical.com', '$2b$10$unGPfgMPQPhfqg9MVQfBgOmWAJjAIbiJtd18hjIEX0sSR83IaoyE.', 'Administrador Academia');


-- Usuarios estudiantes
INSERT INTO users (username, email, password_hash, full_name)
VALUES('ana.rodriguez', 'ana.rodriguez@email.com', '$2b$10$JlnV4D0DyyztelTJ7IzTnu6Cgzj0mSIgaYfaPX5mDvG7DBuIhiz5e', 'Ana Rodriguez'),
       ('carlos.mendez', 'carlos.mendez@email.com', '$2b$10$b7Pv4OQw6E2VY0Dr2E5n1.MqQbjWOc3B.VJBYQ9aN.d5RZVS7mtXW', 'Carlos Mendez'),
       ('maria.lopez', 'maria.lopez@email.com', '$2b$10$rMSXFBnaNcRtUelK.oMVBO/INORrBuwKX2K/.LCNtSt5irnialUQy', 'Maria Lopez'),
       ('pedro.garcia', 'pedro.garcia@email.com', '$2b$10$as4dDQhf.744UOp4g7hGc.MPiX/GEs.3wbqKmqtiYf.QQzRFMtQ5i', 'Pedro Garcia'),
       ('sofia.martinez', 'sofia.martinez@email.com', '$2b$10$LKwMad3hv4xr1pXYZvYopuT0JBOFV5.cXNL81Q3DwIoGWhFW50HPu', 'Sofia Martinez'),
       ('luis.hernandez', 'luis.hernandez@email.com', '$2b$10$IEJqPdVMEr79UKm2mUuC/OVHkPF8s.nT6px1T0Z2ysxspERlrWDbu', 'Luis Hernandez');

-- Insertar progreso de ejemplo para algunos usuarios
INSERT INTO user_progress (user_id, course_id, status, progress_percentage, started_at, completed_at, last_accessed)
VALUES
-- Progreso del usuario "ana.rodriguez" (id: 2)
(2, 1, 'completed', 100, NOW() - INTERVAL '10 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),
(2, 5, 'started', 65, NOW() - INTERVAL '5 days', NULL, NOW() - INTERVAL '1 hour'),
(2, 9, 'started', 30, NOW() - INTERVAL '2 days', NULL, NOW() - INTERVAL '6 hours'),

-- Progreso del usuario "carlos.mendez" (id: 3)
(3, 1, 'completed', 100, NOW() - INTERVAL '15 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '2 days'),
(3, 2, 'started', 45, NOW() - INTERVAL '7 days', NULL, NOW() - INTERVAL '3 hours'),
(3, 5, 'completed', 100, NOW() - INTERVAL '12 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day'),

-- Progreso del usuario "maria.lopez" (id: 4)
(4, 5, 'started', 80, NOW() - INTERVAL '4 days', NULL, NOW() - INTERVAL '2 hours'),
(4, 6, 'started', 25, NOW() - INTERVAL '1 day', NULL, NOW() - INTERVAL '4 hours'),

-- Progreso del usuario "pedro.garcia" (id: 5)
(5, 9, 'completed', 100, NOW() - INTERVAL '8 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
(5, 10, 'started', 55, NOW() - INTERVAL '3 days', NULL, NOW() - INTERVAL '5 hours');

-- Insertar insignias para cursos completados
INSERT INTO user_badges (user_id, course_id, earned_at)
VALUES
-- Insignias del usuario "ana.rodriguez"
(2, 1, NOW() - INTERVAL '3 days'),

-- Insignias del usuario "carlos.mendez"
(3, 1, NOW() - INTERVAL '8 days'),
(3, 5, NOW() - INTERVAL '5 days'),

-- Insignias del usuario "pedro.garcia"
(5, 9, NOW() - INTERVAL '2 days');

-- Mensaje de confirmacion
DO
$$
BEGIN
    RAISE NOTICE 'Base de datos inicializada correctamente:';
    RAISE NOTICE '- % modulos musicales creados', (SELECT COUNT(*) FROM modules);
    RAISE NOTICE '- % cursos disponibles', (SELECT COUNT(*) FROM courses);
    RAISE NOTICE '- % usuarios registrados', (SELECT COUNT(*) FROM users);
    RAISE NOTICE '- % progresos de ejemplo', (SELECT COUNT(*) FROM user_progress);
    RAISE NOTICE '- % insignias otorgadas', (SELECT COUNT(*) FROM user_badges);
    RAISE NOTICE '';
    RAISE NOTICE 'Usuarios disponibles (todos con contraseña: password):';
    RAISE NOTICE '- admin (Administrador)';
    RAISE NOTICE '- ana.rodriguez, carlos.mendez, maria.lopez, pedro.garcia, sofia.martinez, luis.hernandez (Estudiantes)';
END $$;
