// Rutas de autenticacion usando PostgreSQL

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const router = express.Router();

// Middleware para verificar el token JWT
const verifyToken = async (req, res, next) => {
    // Obtiene el token del header Authorization
    const token = req.headers.authorization?.replace('Bearer ', '');

    // Si no hay token, responde con error
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token de acceso requerido'
        });
    }

    try {
        // Verifica el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cifrado_super_secreto_123');
        req.user = decoded;
        next();
    } catch (error) {
        // Si el token no es valido, responde con error
        return res.status(401).json({
            success: false,
            message: 'Token invalido'
        });
    }
};

// Ruta para login de usuario
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Verifica que se envien usuario y contrasena
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Usuario y contrasena son requeridos'
            });
        }

        // Busca el usuario por username o email
        const result = await query(`
            SELECT id, username, email, password_hash, full_name, avatar_url, created_at
            FROM users
            WHERE username = $1 OR email = $1
        `, [username.toLowerCase()]);

        // Si no existe el usuario, responde con error
        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const user = result.rows[0];

        // Compara la contrasena con el hash
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Contrasena incorrecta'
            });
        }

        // Asigna el rol segun el username
        const role = user.username === 'admin' ? 'admin' : 'student';

        // Genera el token JWT
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: role
            },
            process.env.JWT_SECRET || 'cifrado_super_secreto_123',
            { expiresIn: '24h' }
        );

        // Responde con los datos del usuario y el token
        res.json({
            success: true,
            message: 'Login exitoso',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: role,
                avatar_url: user.avatar_url,
                created_at: user.created_at
            },
            token: token
        });

    } catch (error) {
        // Error interno del servidor
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Ruta para registrar nuevos usuarios
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, full_name } = req.body;

        // Verifica que se envien los datos requeridos
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Usuario, email y contrasena son requeridos'
            });
        }

        // Verifica que la contrasena tenga al menos 6 caracteres
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contrasena debe tener al menos 6 caracteres'
            });
        }

        // Verifica si el usuario o email ya existe
        const existingUser = await query(`
      SELECT id FROM users 
      WHERE username = $1 OR email = $2
    `, [username.toLowerCase(), email.toLowerCase()]);

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Usuario o email ya existe'
            });
        }

        // Encripta la contrasena
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Inserta el nuevo usuario en la base de datos
        const result = await query(`
            INSERT INTO users (username, email, password_hash, full_name, created_at)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
                RETURNING id, username, email, full_name, created_at
        `, [username.toLowerCase(), email.toLowerCase(), hashedPassword, full_name || username]);

        const newUser = result.rows[0];
        const role = 'student'; // Todos los nuevos usuarios son estudiantes

        // Genera el token JWT
        const token = jwt.sign(
            {
                id: newUser.id,
                username: newUser.username,
                role: role
            },
            process.env.JWT_SECRET || 'cifrado_super_secreto_123',
            { expiresIn: '24h' }
        );

        // Responde con los datos del usuario y el token
        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                full_name: newUser.full_name,
                role: role,
                avatar_url: null,
                created_at: newUser.created_at
            },
            token: token
        });

    } catch (error) {
        // Error interno del servidor
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Ruta para verificar el token y mantener sesion
router.get('/verify', verifyToken, async (req, res) => {
    try {
        // Busca el usuario por id
        const result = await query(`
            SELECT id, username, email, full_name, avatar_url, created_at
            FROM users
            WHERE id = $1
        `, [req.user.id]);

        // Si no existe el usuario, responde con error
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const user = result.rows[0];

        // Responde con los datos del usuario
        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: req.user.role,
                avatar_url: user.avatar_url,
                created_at: user.created_at
            }
        });

    } catch (error) {
        // Error interno del servidor
        console.error('Error verificando token:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Ruta para solicitar recuperacion de contrasena
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        // Verifica que se envie el email
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email es requerido'
            });
        }

        // Busca el usuario por email
        const result = await query(`
            SELECT id, username, full_name FROM users
            WHERE email = $1
        `, [email.toLowerCase()]);

        // No revela si el email existe o no por seguridad
        if (result.rows.length === 0) {
            return res.json({
                success: true,
                message: 'Si el email existe, se ha enviado un enlace de recuperacion'
            });
        }

        const user = result.rows[0];

        // Genera un token de recuperacion valido por 1 hora
        const resetToken = jwt.sign(
            { userId: user.id, purpose: 'password_reset' },
            process.env.JWT_SECRET || 'cifrado_super_secreto_123',
            { expiresIn: '1h' }
        );

        // Simula el envio de email (solo para desarrollo)
        console.log(`
    ===================================
    EMAIL DE RECUPERACION (SIMULADO)
    ===================================
    Para: ${email}
    Asunto: Recuperacion de contrasena - Academia Musical
    
    Hola ${user.full_name || user.username},
    
    Has solicitado recuperar tu contrasena.
    
    Token de recuperacion: ${resetToken}
    
    Este token es valido por 1 hora.
    
    Usa el endpoint POST /api/auth/reset-password con:
    {
      "token": "${resetToken}",
      "newPassword": "tu_nueva_contrasena"
    }
    ===================================
    `);

        // Responde que el email fue enviado (o simulado)
        res.json({
            success: true,
            message: 'Si el email existe, se ha enviado un enlace de recuperacion',
            // Incluye el token solo en desarrollo
            ...(process.env.NODE_ENV === 'development' && {
                resetToken: resetToken,
                note: 'Token incluido solo en desarrollo'
            })
        });

    } catch (error) {
        // Error interno del servidor
        console.error('Error en forgot-password:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Ruta para resetear la contrasena usando el token
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // Verifica que se envie el token y la nueva contrasena
        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token y nueva contrasena son requeridos'
            });
        }

        // Verifica que la nueva contrasena tenga al menos 6 caracteres
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contrasena debe tener al menos 6 caracteres'
            });
        }

        // Verifica el token de recuperacion
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'cifrado_super_secreto_123');
            if (decoded.purpose !== 'password_reset') {
                throw new Error('Token invalido');
            }
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: 'Token invalido o expirado'
            });
        }

        // Encripta la nueva contrasena
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Actualiza la contrasena en la base de datos
        const result = await query(`
            UPDATE users
            SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
                RETURNING username, email
        `, [hashedPassword, decoded.userId]);

        // Si no se encuentra el usuario, responde con error
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Responde que la contrasena fue actualizada
        res.json({
            success: true,
            message: 'Contrasena actualizada exitosamente'
        });

    } catch (error) {
        // Error interno del servidor
        console.error('Error en reset-password:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Ruta para obtener el perfil del usuario autenticado
router.get('/profile', verifyToken, async (req, res) => {
    try {
        // Consulta los datos y estadisticas del usuario
        const result = await query(`
      SELECT 
        u.id, u.username, u.email, u.full_name, u.avatar_url, u.created_at,
        COUNT(DISTINCT up.id) as total_courses,
        COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN up.id END) as completed_courses,
        COUNT(DISTINCT ub.id) as total_badges
      FROM users u
      LEFT JOIN user_progress up ON u.id = up.user_id
      LEFT JOIN user_badges ub ON u.id = ub.user_id
      WHERE u.id = $1
      GROUP BY u.id, u.username, u.email, u.full_name, u.avatar_url, u.created_at
    `, [req.user.id]);

        // Si no existe el usuario, responde con error
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const profile = result.rows[0];

        // Responde con los datos y estadisticas del usuario
        res.json({
            success: true,
            data: {
                id: profile.id,
                username: profile.username,
                email: profile.email,
                full_name: profile.full_name,
                role: req.user.role,
                avatar_url: profile.avatar_url,
                created_at: profile.created_at,
                stats: {
                    total_courses: parseInt(profile.total_courses),
                    completed_courses: parseInt(profile.completed_courses),
                    total_badges: parseInt(profile.total_badges)
                }
            },
            message: 'Perfil obtenido exitosamente'
        });

    } catch (error) {
        // Error interno del servidor
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el perfil'
        });
    }
});

module.exports = router;