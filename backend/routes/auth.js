// Rutas de autenticacion real con postgresql
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const router = express.Router();

// Middleware para verificar token jwt
const verifyToken = async (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token de acceso requerido'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cifrado_super_secreto_123');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token invalido'
        });
    }
};

// Login con base de datos postgresql
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Usuario y contraseña son requeridos'
            });
        }

        // Buscar usuario en base de datos por username o email
        const result = await query(`
            SELECT id, username, email, password_hash, full_name, avatar_url, created_at
            FROM users
            WHERE username = $1 OR email = $1
        `, [username.toLowerCase()]);

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const user = result.rows[0];

        // Verificar contraseña con bcrypt
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Contraseña incorrecta'
            });
        }

        // Determinar rol (admin si username es 'admin', sino student)
        const role = user.username === 'admin' ? 'admin' : 'student';

        // Generar token jwt
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: role
            },
            process.env.JWT_SECRET || 'cifrado_super_secreto_123',
            { expiresIn: '24h' }
        );

        // Respuesta exitosa sin incluir password_hash
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
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Registro de nuevos usuarios
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, full_name } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Usuario, email y contraseña son requeridos'
            });
        }

        // Verificar longitud minima de contraseña
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Verificar si usuario o email ya existe
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

        // Encriptar contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insertar nuevo usuario
        const result = await query(`
            INSERT INTO users (username, email, password_hash, full_name, created_at)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
                RETURNING id, username, email, full_name, created_at
        `, [username.toLowerCase(), email.toLowerCase(), hashedPassword, full_name || username]);

        const newUser = result.rows[0];
        const role = 'student'; // Nuevos usuarios siempre son estudiantes

        // Generar token
        const token = jwt.sign(
            {
                id: newUser.id,
                username: newUser.username,
                role: role
            },
            process.env.JWT_SECRET || 'cifrado_super_secreto_123',
            { expiresIn: '24h' }
        );

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
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Verificar token (para mantener sesion)
router.get('/verify', verifyToken, async (req, res) => {
    try {
        const result = await query(`
            SELECT id, username, email, full_name, avatar_url, created_at
            FROM users
            WHERE id = $1
        `, [req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const user = result.rows[0];

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
        console.error('Error verificando token:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Solicitar recuperacion de contraseña
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email es requerido'
            });
        }

        // Verificar si el email existe en la base de datos
        const result = await query(`
            SELECT id, username, full_name FROM users
            WHERE email = $1
        `, [email.toLowerCase()]);

        // Por seguridad, no revelar si el email existe o no
        if (result.rows.length === 0) {
            return res.json({
                success: true,
                message: 'Si el email existe, se ha enviado un enlace de recuperacion'
            });
        }

        const user = result.rows[0];

        // Generar token de recuperacion (valido por 1 hora)
        const resetToken = jwt.sign(
            { userId: user.id, purpose: 'password_reset' },
            process.env.JWT_SECRET || 'cifrado_super_secreto_123',
            { expiresIn: '1h' }
        );

        // Simular envio de email (en produccion se enviaria real)
        console.log(`
    ===================================
    EMAIL DE RECUPERACION (SIMULADO)
    ===================================
    Para: ${email}
    Asunto: Recuperacion de contraseña - Academia Musical
    
    Hola ${user.full_name || user.username},
    
    Has solicitado recuperar tu contraseña.
    
    Token de recuperacion: ${resetToken}
    
    Este token es valido por 1 hora.
    
    Usa el endpoint POST /api/auth/reset-password con:
    {
      "token": "${resetToken}",
      "newPassword": "tu_nueva_contraseña"
    }
    ===================================
    `);

        res.json({
            success: true,
            message: 'Si el email existe, se ha enviado un enlace de recuperacion',
            // En desarrollo, incluir el token para pruebas
            ...(process.env.NODE_ENV === 'development' && {
                resetToken: resetToken,
                note: 'Token incluido solo en desarrollo'
            })
        });

    } catch (error) {
        console.error('Error en forgot-password:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Resetear contraseña con token
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token y nueva contraseña son requeridos'
            });
        }

        // Validar contraseña nueva
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Verificar token de recuperacion
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

        // Encriptar nueva contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Actualizar contraseña en base de datos
        const result = await query(`
            UPDATE users
            SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
                RETURNING username, email
        `, [hashedPassword, decoded.userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });

    } catch (error) {
        console.error('Error en reset-password:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener perfil del usuario autenticado
router.get('/profile', verifyToken, async (req, res) => {
    try {
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

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const profile = result.rows[0];

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
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el perfil'
        });
    }
});

module.exports = router;