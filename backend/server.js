// javascript
// backend/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const {testConnection} = require('./config/database');
const coursesRoutes = require('./routes/courses');
const authRoutes = require('./routes/auth');
const studentsRoutes = require('./routes/students');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares base
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Health
app.get('/health', (req, res) => res.json({ok: true}));
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Portal de capacitaciones musicales - backend funcionando',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: 'PostgreSQL conectado'
    });
});

// Raíz informativa
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
            auth: '/api/auth',
            students: '/api/students'
        }
    });
});

// Rutas (routers específicos primero)
app.use('/api/auth', authRoutes);
app.use('/api/students', studentsRoutes);

// Importante: monta el router genérico de /api al final
app.use('/api', coursesRoutes);

// 404 global
app.use('*', (req, res) => {
    res.status(404).json({success: false, message: 'Ruta no encontrada', path: req.originalUrl});
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Algo salio mal'
    });
});

// Inicio
(async () => {
    await testConnection();
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`API escuchando en http://localhost:${PORT}`);
        console.log(`Health: http://localhost:${PORT}/api/health`);
    });
})();

module.exports = app;