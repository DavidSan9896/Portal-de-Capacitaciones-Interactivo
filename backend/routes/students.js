// Rutas para funcionalidades del estudiante
const express = require('express');
const { query, transaction } = require('../config/database');
const router = express.Router();

// Middleware para verificar autenticacion (simplificado)
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: 'Token de autenticacion requerido'
        });
    }

    // Por ahora usamos el user_id del header (en produccion seria del JWT)
    const userId = req.headers['user-id'];
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: 'Usuario no identificado'
        });
    }

    req.userId = parseInt(userId);
    next();
};

// Listar estudiantes para el panel de administración
router.get('/', async (req, res) => {
    try {
        const result = await query(`
      SELECT
        u.id,
        u.full_name AS name,
        u.email,
        COUNT(up.course_id)::int AS courses,
        COUNT(up.course_id)::int AS enrollments_count,
        COALESCE(ROUND(AVG(up.progress_percentage))::int, 0) AS avg_progress,
        TRUE AS is_active
      FROM users u
      LEFT JOIN user_progress up ON up.user_id = u.id
      WHERE u.username <> $1
      GROUP BY u.id, u.full_name, u.email
      ORDER BY u.id ASC
    `, ['admin']);

        return res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error listando estudiantes:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener estudiantes'
        });
    }
});
// Obtener progreso del estudiante
router.get('/progress', requireAuth, async (req, res) => {
    try {
        const userId = req.userId;

        // Obtener estadisticas generales (corregido para evitar conteos cruzados)
        const statsResult = await query(`
      SELECT 
        (SELECT COUNT(*) FROM user_progress WHERE user_id = $1 AND status = 'started') as courses_started,
        (SELECT COUNT(*) FROM user_progress WHERE user_id = $1 AND status = 'completed') as courses_completed,
        (SELECT COUNT(*) FROM user_badges WHERE user_id = $1) as total_badges,
        (SELECT COUNT(*) FROM user_progress WHERE user_id = $1) as total_enrolled
    `, [userId]);

        const stats = statsResult.rows[0] || {
            courses_started: 0,
            courses_completed: 0,
            total_badges: 0,
            total_enrolled: 0
        };

        // Obtener cursos actuales con progreso
        const coursesResult = await query(`
      SELECT 
        c.id,
        c.title,
        c.description,
        c.duration_minutes,
        m.display_name as module_name,
        m.color as module_color,
        up.status,
        up.progress_percentage,
        up.started_at,
        up.completed_at,
        up.last_accessed
      FROM user_progress up
      JOIN courses c ON up.course_id = c.id
      JOIN modules m ON c.module_id = m.id
      WHERE up.user_id = $1
      ORDER BY up.last_accessed DESC
    `, [userId]);

        // Obtener insignias obtenidas
        const badgesResult = await query(`
      SELECT 
        c.id as course_id,
        c.title as course_title,
        ub.earned_at,
        m.display_name as module_name,
        m.color as module_color
      FROM user_badges ub
      JOIN courses c ON ub.course_id = c.id
      JOIN modules m ON c.module_id = m.id
      WHERE ub.user_id = $1
      ORDER BY ub.earned_at DESC
    `, [userId]);

        res.json({
            success: true,
            data: {
                stats: {
                    courses_started: parseInt(stats.courses_started),
                    courses_completed: parseInt(stats.courses_completed),
                    total_badges: parseInt(stats.total_badges),
                    total_enrolled: parseInt(stats.total_enrolled),
                    completion_rate: stats.total_enrolled > 0
                        ? Math.round((stats.courses_completed / stats.total_enrolled) * 100)
                        : 0
                },
                current_courses: coursesResult.rows,
                badges: badgesResult.rows
            },
            message: 'Progreso obtenido exitosamente'
        });

    } catch (error) {
        console.error('Error obteniendo progreso:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el progreso del estudiante'
        });
    }
});

// Inscribirse a un curso
router.post('/enroll/:courseId', requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const courseId = parseInt(req.params.courseId);

        if (isNaN(courseId)) {
            return res.status(400).json({
                success: false,
                message: 'ID de curso invalido'
            });
        }

        // Verificar que el curso existe
        const courseResult = await query(`
      SELECT id, title FROM courses WHERE id = $1 AND is_active = true
    `, [courseId]);

        if (courseResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Curso no encontrado'
            });
        }

        const course = courseResult.rows[0];

        // Verificar si ya esta inscrito
        const existingResult = await query(`
      SELECT id FROM user_progress WHERE user_id = $1 AND course_id = $2
    `, [userId, courseId]);

        if (existingResult.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Ya estas inscrito en este curso'
            });
        }

        // Inscribir al estudiante
        const enrollResult = await query(`
      INSERT INTO user_progress (user_id, course_id, status, progress_percentage, started_at, last_accessed)
      VALUES ($1, $2, 'started', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id
    `, [userId, courseId]);

        res.status(201).json({
            success: true,
            data: {
                enrollment_id: enrollResult.rows[0].id,
                course_title: course.title
            },
            message: `Te has inscrito exitosamente en "${course.title}"`
        });

    } catch (error) {
        console.error('Error en inscripcion:', error);
        res.status(500).json({
            success: false,
            message: 'Error al inscribirse en el curso'
        });
    }
});

// Actualizar progreso de un curso
router.put('/progress/:courseId', requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const courseId = parseInt(req.params.courseId);
        const { progress_percentage, notes } = req.body;

        if (isNaN(courseId) || isNaN(progress_percentage)) {
            return res.status(400).json({
                success: false,
                message: 'Datos invalidos'
            });
        }

        if (progress_percentage < 0 || progress_percentage > 100) {
            return res.status(400).json({
                success: false,
                message: 'El progreso debe estar entre 0 y 100'
            });
        }

        // Verificar que esta inscrito en el curso
        const enrollmentResult = await query(`
      SELECT id, status FROM user_progress 
      WHERE user_id = $1 AND course_id = $2
    `, [userId, courseId]);

        if (enrollmentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No estas inscrito en este curso'
            });
        }

        const enrollment = enrollmentResult.rows[0];

        // Determinar nuevo status
        let newStatus = enrollment.status;
        let completedAt = null;

        if (progress_percentage === 100 && enrollment.status !== 'completed') {
            newStatus = 'completed';
            completedAt = 'CURRENT_TIMESTAMP';
        } else if (progress_percentage > 0 && enrollment.status === 'not_started') {
            newStatus = 'started';
        }

        // Usar transaccion para actualizar progreso y generar insignia si es necesario
        const result = await transaction(async (client) => {
            // Actualizar progreso
            const updateQuery = `
        UPDATE user_progress 
        SET 
          progress_percentage = $1,
          status = $2,
          notes = $3,
          last_accessed = CURRENT_TIMESTAMP
          ${completedAt ? ', completed_at = CURRENT_TIMESTAMP' : ''}
        WHERE user_id = $4 AND course_id = $5
        RETURNING id
      `;

            await client.query(updateQuery, [
                progress_percentage,
                newStatus,
                notes || null,
                userId,
                courseId
            ]);

            // Si completo el curso, generar insignia
            if (newStatus === 'completed') {
                // Verificar si ya tiene la insignia
                const badgeCheck = await client.query(`
          SELECT id FROM user_badges WHERE user_id = $1 AND course_id = $2
        `, [userId, courseId]);

                if (badgeCheck.rows.length === 0) {
                    await client.query(`
            INSERT INTO user_badges (user_id, course_id, earned_at)
            VALUES ($1, $2, CURRENT_TIMESTAMP)
          `, [userId, courseId]);
                }
            }

            return { newStatus, badgeEarned: newStatus === 'completed' };
        });

        res.json({
            success: true,
            data: {
                progress_percentage,
                status: result.newStatus,
                badge_earned: result.badgeEarned
            },
            message: result.badgeEarned
                ? 'Progreso actualizado. Felicidades, has ganado una insignia!'
                : 'Progreso actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error actualizando progreso:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el progreso'
        });
    }
});

// Obtener cursos disponibles para inscribirse
router.get('/available-courses', requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const { module } = req.query;

        let whereClause = 'WHERE c.is_active = true';
        let queryParams = [userId];

        if (module) {
            whereClause += ' AND m.name = $2';
            queryParams.push(module);
        }

        const result = await query(`
      SELECT 
        c.id,
        c.title,
        c.description,
        c.level,
        c.duration_minutes,
        c.instructor_name,
        m.name as module_name,
        m.display_name as module_display_name,
        m.color as module_color,
        CASE 
          WHEN up.id IS NOT NULL THEN true 
          ELSE false 
        END as is_enrolled,
        up.status as enrollment_status,
        up.progress_percentage
      FROM courses c
      JOIN modules m ON c.module_id = m.id
      LEFT JOIN user_progress up ON c.id = up.course_id AND up.user_id = $1
      ${whereClause}
      ORDER BY m.id, c.order_in_module, c.title
    `, queryParams);

        res.json({
            success: true,
            data: result.rows,
            message: `${result.rows.length} cursos encontrados`
        });

    } catch (error) {
        console.error('Error obteniendo cursos disponibles:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener cursos disponibles'
        });
    }
});

// Desinscribirse de un curso (solo si no esta completado)
router.delete('/enroll/:courseId', requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const courseId = parseInt(req.params.courseId);

        if (isNaN(courseId)) {
            return res.status(400).json({
                success: false,
                message: 'ID de curso invalido'
            });
        }

        // Verificar inscripcion y estado
        const enrollmentResult = await query(`
      SELECT up.id, up.status, c.title
      FROM user_progress up
      JOIN courses c ON up.course_id = c.id
      WHERE up.user_id = $1 AND up.course_id = $2
    `, [userId, courseId]);

        if (enrollmentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No estas inscrito en este curso'
            });
        }

        const enrollment = enrollmentResult.rows[0];

        if (enrollment.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'No puedes desinscribirte de un curso completado'
            });
        }

        // Eliminar inscripcion
        await query(`
      DELETE FROM user_progress WHERE user_id = $1 AND course_id = $2
    `, [userId, courseId]);

        res.json({
            success: true,
            message: `Te has desinscrito de "${enrollment.title}"`
        });

    } catch (error) {
        console.error('Error en desinscripcion:', error);
        res.status(500).json({
            success: false,
            message: 'Error al desinscribirse del curso'
        });
    }
});

module.exports = router;