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

-- Insertar modulos musicales
INSERT INTO modules (name, display_name, description, icon, color)
VALUES ('piano', 'Piano', 'Aprende a tocar piano desde lo basico hasta nivel avanzado', 'piano', '#8B5CF6'),
       ('guitar', 'Guitarra', 'Domina la guitarra acustica y electrica', 'guitar', '#10B981'),
       ('vocals', 'Canto', 'Tecnicas vocales y entrenamiento de voz', 'microphone', '#F59E0B'),
       ('drums', 'Bateria', 'Ritmos y tecnicas de percusion', 'drums', '#EF4444'),
       ('theory', 'Teoria Musical', 'Fundamentos teoricos de la musica', 'music-note', '#3B82F6'),
       ('production', 'Produccion', 'Produccion musical digital y audio', 'headphones', '#6366F1');

-- Insertar cursos musicales
INSERT INTO courses (title, description, module_id, level, duration_minutes, instructor_name, order_in_module)
VALUES
-- Piano
('Piano para Principiantes', 'Primeros pasos en el piano: postura, digitacion y escalas basicas', 1, 'beginner', 45,
 'Maria Rodriguez', 1),
('Acordes y Progresiones', 'Aprende los acordes fundamentales y como combinarlos', 1, 'intermediate', 60,
 'Carlos Mendoza', 2),
('Piano Clasico Avanzado', 'Tecnicas avanzadas e interpretacion de piezas clasicas', 1, 'advanced', 90, 'Ana Gutierrez',
 3),
('Jazz Piano Basico', 'Introduccion al piano jazz y improvisacion', 1, 'intermediate', 75, 'Roberto Silva', 4),

-- Guitarra
('Guitarra Basica', 'Primeros acordes y rasgueos fundamentales', 2, 'beginner', 50, 'Diego Lopez', 1),
('Tecnicas de Fingerpicking', 'Dominando el fingerpicking y arpegios', 2, 'intermediate', 65, 'Lucia Torres', 2),
('Guitarra Electrica Rock', 'Riffs, solos y tecnicas del rock', 2, 'advanced', 75, 'Roberto Silva', 3),
('Blues Guitar', 'Tecnicas y escalas del blues en guitarra', 2, 'intermediate', 70, 'Miguel Santos', 4),

-- Canto
('Respiracion y Postura Vocal', 'Fundamentos de la tecnica vocal', 3, 'beginner', 40, 'Isabella Garcia', 1),
('Interpretacion y Estilo', 'Desarrolla tu propio estilo vocal', 3, 'intermediate', 55, 'Fernando Ruiz', 2),
('Canto Lirico', 'Tecnicas de canto clasico y lirico', 3, 'advanced', 80, 'Carmen Morales', 3),

-- Bateria
('Ritmos Basicos', 'Patrones ritmicos fundamentales', 4, 'beginner', 50, 'Andres Morales', 1),
('Fills y Transiciones', 'Tecnicas avanzadas de bateria', 4, 'intermediate', 70, 'Camila Vega', 2),
('Bateria en Generos Latinos', 'Ritmos latinos y percusion afroamericana', 4, 'intermediate', 65, 'Jose Martinez', 3),

-- Teoria Musical
('Solfeo y Lectura', 'Aprende a leer partituras', 5, 'beginner', 35, 'Prof. Gonzalez', 1),
('Armonia Moderna', 'Conceptos avanzados de armonia', 5, 'advanced', 80, 'Dr. Martinez', 2),
('Composicion Musical', 'Tecnicas de composicion y arreglo', 5, 'advanced', 90, 'Maestro Ramirez', 3),

-- Produccion
('Introduccion a DAWs', 'Primeros pasos en software de produccion', 6, 'beginner', 60, 'Alex Producer', 1),
('Mixing y Mastering', 'Tecnicas profesionales de mezcla', 6, 'advanced', 120, 'Sound Engineer Pro', 2),
('Produccion de Beats', 'Creacion de ritmos modernos y urbanos', 6, 'intermediate', 85, 'Beat Maker One', 3);

-- Insertar usuarios con contraseñas encriptadas
-- Contraseña para todos: "password"
-- Hash generado con bcrypt(10): $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi

-- Usuario administrador
INSERT INTO users (username, email, password_hash, full_name)
VALUES ('admin', 'admin@academia-musical.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Administrador Academia');

-- Usuarios estudiantes
INSERT INTO users (username, email, password_hash, full_name)
VALUES ('estudiante', 'estudiante@academia-musical.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Estudiante Musical'),
       ('ana.rodriguez', 'ana.rodriguez@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Ana Rodriguez'),
       ('carlos.mendez', 'carlos.mendez@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Carlos Mendez'),
       ('maria.lopez', 'maria.lopez@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Maria Lopez'),
       ('pedro.garcia', 'pedro.garcia@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Pedro Garcia'),
       ('sofia.martinez', 'sofia.martinez@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Sofia Martinez'),
       ('luis.hernandez', 'luis.hernandez@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Luis Hernandez');

-- Insertar progreso de ejemplo para algunos usuarios
INSERT INTO user_progress (user_id, course_id, status, progress_percentage, started_at, completed_at, last_accessed)
VALUES
-- Progreso del usuario "estudiante" (id: 2)
(2, 1, 'completed', 100, NOW() - INTERVAL '10 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),
(2, 5, 'started', 65, NOW() - INTERVAL '5 days', NULL, NOW() - INTERVAL '1 hour'),
(2, 9, 'started', 30, NOW() - INTERVAL '2 days', NULL, NOW() - INTERVAL '6 hours'),

-- Progreso del usuario "ana.rodriguez" (id: 3)
(3, 1, 'completed', 100, NOW() - INTERVAL '15 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '2 days'),
(3, 2, 'started', 45, NOW() - INTERVAL '7 days', NULL, NOW() - INTERVAL '3 hours'),
(3, 5, 'completed', 100, NOW() - INTERVAL '12 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day'),

-- Progreso del usuario "carlos.mendez" (id: 4)
(4, 5, 'started', 80, NOW() - INTERVAL '4 days', NULL, NOW() - INTERVAL '2 hours'),
(4, 6, 'started', 25, NOW() - INTERVAL '1 day', NULL, NOW() - INTERVAL '4 hours'),

-- Progreso del usuario "maria.lopez" (id: 5)
(5, 9, 'completed', 100, NOW() - INTERVAL '8 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
(5, 10, 'started', 55, NOW() - INTERVAL '3 days', NULL, NOW() - INTERVAL '5 hours');

-- Insertar insignias para cursos completados
INSERT INTO user_badges (user_id, course_id, earned_at)
VALUES
-- Insignias del usuario "estudiante"
(2, 1, NOW() - INTERVAL '3 days'),

-- Insignias del usuario "ana.rodriguez"
(3, 1, NOW() - INTERVAL '8 days'),
(3, 5, NOW() - INTERVAL '5 days'),

-- Insignias del usuario "maria.lopez"
(5, 9, NOW() - INTERVAL '2 days');

-- Mensaje de confirmacion
DO
$$
BEGIN
    RAISE
NOTICE 'Base de datos inicializada correctamente:';
    RAISE
NOTICE '- % modulos musicales creados', (SELECT COUNT(*) FROM modules);
    RAISE
NOTICE '- % cursos disponibles', (SELECT COUNT(*) FROM courses);
    RAISE
NOTICE '- % usuarios registrados', (SELECT COUNT(*) FROM users);
    RAISE
NOTICE '- % progresos de ejemplo', (SELECT COUNT(*) FROM user_progress);
    RAISE
NOTICE '- % insignias otorgadas', (SELECT COUNT(*) FROM user_badges);
    RAISE
NOTICE '';
    RAISE
NOTICE 'Usuarios disponibles (todos con contraseña: password):';
    RAISE
NOTICE '- admin (Administrador)';
    RAISE
NOTICE '- estudiante, ana.rodriguez, carlos.mendez, maria.lopez, pedro.garcia, sofia.martinez, luis.hernandez (Estudiantes)';
END $$;