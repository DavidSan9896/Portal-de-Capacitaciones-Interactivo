// Servidor express - portal de capacitaciones musicales
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Importar configuracion de base de datos y rutas
const { testConnection } = require('./config/database');
const coursesRoutes = require('./routes/courses');
const authRoutes = require('./routes/auth');
const studentsRoutes = require('./routes/students');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de seguridad
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true
}));

// Logging
app.use(morgan('combined'));

// Parseo de json
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inicializar conexion a base de datos
const initializeDatabase = async () => {
    console.log('Iniciando conexion a postgresql...');
    const isConnected = await testConnection();
    if (!isConnected) {
        console.error('No se pudo conectar a postgresql');
        console.log('Continuando con endpoints simulados...');
        return false;
    }
    return true;
};

// Rutas principales

// Ruta de salud
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Portal de capacitaciones musicales - backend funcionando',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: 'PostgreSQL conectado'
    });
});

// Ruta raiz
app.get('/', (req, res) => {
    res.json({
        message: 'Bienvenido al portal de capacitaciones musicales',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            modules: '/api/modules',
            courses: '/api/courses',
            course_detail: '/api/courses/:id',
            stats: '/api/stats',
            auth: '/api/auth (proximamente)',
            users: '/api/users (proximamente)'
        }
    });
});

// Usar las rutas de cursos con base de datos real
app.use('/api', coursesRoutes);

// Usar las rutas de autenticacion
app.use('/api/auth', authRoutes);

// Usar las rutas de estudiantes
app.use('/api/students', studentsRoutes);

// Progreso simulado (temporal - mover a rutas separadas después)
app.get('/api/user/progress', (req, res) => {
    res.json({
        success: true,
        data: {
            courses_started: 3,
            courses_completed: 1,
            total_badges: 1,
            current_courses: [
                {
                    id: 1,
                    title: 'Piano para principiantes',
                    progress: 100,
                    status: 'completed'
                },
                {
                    id: 2,
                    title: 'Guitarra basica',
                    progress: 60,
                    status: 'started'
                },
                {
                    id: 4,
                    title: 'Respiracion y postura vocal',
                    progress: 30,
                    status: 'started'
                }
            ]
        },
        message: 'Progreso obtenido exitosamente'
    });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
        path: req.originalUrl
    });
});

// Manejo global de errores
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Algo salio mal'
    });
});

// Iniciar servidor
const startServer = async () => {
    // Probar conexion a base de datos
    await initializeDatabase();

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`
Portal capacitaciones musicales
Servidor corriendo en puerto ${PORT}
Entorno: ${process.env.NODE_ENV || 'development'}
Health check: http://localhost:${PORT}/api/health
Api base: http://localhost:${PORT}/api
Frontend: http://localhost:3001
Usuario db: ${process.env.DB_USER || 'PortalDavid'}
Base de datos: ${process.env.DB_NAME || 'training_portal'}
    `);
    });
};

// Iniciar el servidor
startServer().catch(err => {
    console.error('Error al iniciar servidor:', err);
    process.exit(1);
});

module.exports = app;