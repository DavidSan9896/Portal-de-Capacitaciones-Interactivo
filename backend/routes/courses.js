// Rutas de cursos - endpoints reales con postgresql
const express = require('express');
const {query} = require('../config/database');
const router = express.Router();

// Obtener todos los modulos musicales
router.get('/modules', async (req, res) => {
    try {
        const result = await query(`
            SELECT id,
                   name,
                   display_name,
                   description,
                   icon,
                   color,
                   (SELECT COUNT(*) FROM courses WHERE module_id = modules.id AND is_active = true) as course_count
            FROM modules
            ORDER BY id`);
        res.json({
            success: true,
            data: result.rows,
            message: `${result.rows.length} modulos musicales encontrados`
        });
    } catch (error) {
        console.error('Error al obtener modulos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los modulos musicales'
        });
    }
});

// Obtener todos los cursos o filtrar por modulo
router.get('/courses', async (req, res) => {
    try {
        const {module, level, search} = req.query;

        let whereConditions = ['c.is_active = true'];
        let queryParams = [];
        let paramCount = 0;

        // Filtrar por modulo
        if (module) {
            paramCount++;
            whereConditions.push(`m.name = $${paramCount}`);
            queryParams.push(module);
        }

        // Filtrar por nivel
        if (level) {
            paramCount++;
            whereConditions.push(`c.level = $${paramCount}`);
            queryParams.push(level);
        }

        // Busqueda por titulo o descripcion
        if (search) {
            paramCount++;
            whereConditions.push(`(c.title ILIKE $${paramCount} OR c.description ILIKE $${paramCount})`);
            queryParams.push(`%${search}%`);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const result = await query(`
            SELECT c.id,
                   c.title,
                   c.description,
                   c.level,
                   c.duration_minutes,
                   c.instructor_name,
                   c.video_url,
                   c.badge_image,
                   c.order_in_module,
                   c.is_active,
                   c.created_at,
                   m.name         as module_name,
                   m.display_name as module_display_name,
                   m.icon         as module_icon,
                   m.color        as module_color
            FROM courses c
                     JOIN modules m ON c.module_id = m.id
                ${whereClause}
            ORDER BY m.id, c.order_in_module, c.title
        `, queryParams);

        // Agrupar por modulos para respuesta mas organizada
        const coursesByModule = {};
        result.rows.forEach(course => {
            const moduleKey = course.module_name;
            if (!coursesByModule[moduleKey]) {
                coursesByModule[moduleKey] = {
                    module: {
                        name: course.module_name,
                        display_name: course.module_display_name,
                        icon: course.module_icon,
                        color: course.module_color
                    },
                    courses: []
                };
            }

            coursesByModule[moduleKey].courses.push({
                id: course.id,
                title: course.title,
                description: course.description,
                level: course.level,
                duration_minutes: course.duration_minutes,
                instructor_name: course.instructor_name,
                video_url: course.video_url,
                badge_image: course.badge_image,
                order_in_module: course.order_in_module,
                is_active: course.is_active,
                created_at: course.created_at
            });
        });

        res.json({
            success: true,
            data: module ? result.rows : coursesByModule,
            total_courses: result.rows.length,
            filters_applied: {
                module: module || null,
                level: level || null,
                search: search || null
            },
            message: `${result.rows.length} cursos encontrados`
        });
    } catch (error) {
        console.error('Error al obtener cursos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los cursos'
        });
    }
});

// Obtener un curso especifico por id
router.get('/courses/:id', async (req, res) => {
    try {
        const courseId = parseInt(req.params.id);

        if (isNaN(courseId)) {
            return res.status(400).json({
                success: false,
                message: 'Id de curso invalido'
            });
        }

        const result = await query(`
            SELECT c.*,
                   m.name         as module_name,
                   m.display_name as module_display_name,
                   m.icon         as module_icon,
                   m.color        as module_color,
                   m.description  as module_description
            FROM courses c
                     JOIN modules m ON c.module_id = m.id
            WHERE c.id = $1
              AND c.is_active = true`, [courseId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Curso no encontrado'
            });
        }

        const course = result.rows[0];

        res.json({
            success: true,
            data: {
                id: course.id,
                title: course.title,
                description: course.description,
                level: course.level,
                duration_minutes: course.duration_minutes,
                instructor_name: course.instructor_name,
                video_url: course.video_url,
                badge_image: course.badge_image,
                order_in_module: course.order_in_module,
                created_at: course.created_at,
                updated_at: course.updated_at,
                module: {
                    name: course.module_name,
                    display_name: course.module_display_name,
                    icon: course.module_icon,
                    color: course.module_color,
                    description: course.module_description
                }
            },
            message: 'Curso obtenido exitosamente'
        });
    } catch (error) {
        console.error('Error al obtener curso:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el curso'
        });
    }
});

// Obtener estadisticas generales
router.get('/stats', async (req, res) => {
    try {
        const result = await query(`
            SELECT (SELECT COUNT(*) FROM modules)                                  as total_modules,
                   (SELECT COUNT(*) FROM courses WHERE is_active = true)           as total_courses,
                   (SELECT COUNT(*) FROM users)                                    as total_users,
                   (SELECT COUNT(*) FROM user_progress WHERE status = 'completed') as total_completed,
                   (SELECT COUNT(*) FROM user_badges)                              as total_badges,
                   (SELECT json_agg(
                                   json_build_object(
                                           'module', display_name,
                                           'count', course_count,
                                           'color', color
                                   )
                           )
                    FROM (SELECT m.display_name,
                                 m.color,
                                 COUNT(c.id) as course_count
                          FROM modules m
                                   LEFT JOIN courses c ON m.id = c.module_id AND c.is_active = true
                          GROUP BY m.id, m.display_name, m.color
                          ORDER BY m.id) as module_stats)                          as courses_by_module
        `);

        const stats = result.rows[0];

        res.json({
            success: true,
            data: {
                overview: {
                    total_modules: parseInt(stats.total_modules),
                    total_courses: parseInt(stats.total_courses),
                    total_users: parseInt(stats.total_users),
                    total_completed: parseInt(stats.total_completed),
                    total_badges: parseInt(stats.total_badges)
                },
                courses_by_module: stats.courses_by_module
            },
            message: 'Estadisticas obtenidas exitosamente'
        });
    } catch (error) {
        console.error('Error al obtener estadisticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las estadisticas'
        });
    }
});

// Editar un curso por id (actualización parcial)
router.put('/courses/:id', async (req, res) => {
    try {
        const courseId = parseInt(req.params.id, 10);
        if (Number.isNaN(courseId)) {
            return res.status(400).json({success: false, message: 'Id de curso inválido'});
        }

        const body = req.body || {};
        const allowedFields = [
            'title',
            'description',
            'module_id',
            'level',
            'duration_minutes',
            'instructor_name',
            'video_url',
            'badge_image',
            'order_in_module',
            'is_active'
        ];

        const setClauses = [];
        const params = [];
        let idx = 1;

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                let value = body[field];

                if (['module_id', 'duration_minutes', 'order_in_module'].includes(field)) {
                    const parsed = parseInt(value, 10);
                    value = Number.isNaN(parsed) ? null : parsed;
                }
                if (field === 'is_active') {
                    value = Boolean(value);
                }

                setClauses.push(`${field} = $${idx++}`);
                params.push(value);
            }
        }

        if (setClauses.length === 0) {
            return res.status(400).json({success: false, message: 'No hay campos para actualizar'});
        }

        const sql = `
            UPDATE courses
            SET ${setClauses.join(', ')},
                updated_at = NOW()
            WHERE id = $${idx} RETURNING id, title, description, level, duration_minutes, instructor_name,
                      video_url, badge_image, order_in_module, module_id, is_active,
                      created_at, updated_at
        `;
        params.push(courseId);

        const result = await query(sql, params);
        if (result.rowCount === 0) {
            return res.status(404).json({success: false, message: 'Curso no encontrado'});
        }

        return res.json({
            success: true,
            data: result.rows[0],
            message: 'Curso actualizado exitosamente'
        });
    } catch (error) {
        console.error('Error al actualizar curso:', error);
        return res.status(500).json({success: false, message: 'Error al actualizar el curso'});
    }
});

// Crear curso
router.post('/courses', async (req, res) => {
    try {
        const body = req.body || {};
        const errors = {};

        // Coerciones básicas
        const title = (body.title ?? '').toString().trim();
        const description = body.description != null ? body.description.toString().trim() : null;
        const level = (body.level ?? 'beginner').toString().trim();
        const module_id = Number.parseInt(body.module_id, 10);
        const duration_minutes = Number.parseInt(body.duration_minutes ?? 60, 10);
        const instructor_name = (body.instructor_name ?? '').toString().trim();
        const is_active = typeof body.is_active === 'string'
            ? body.is_active.toLowerCase() !== 'false'
            : Boolean(body.is_active);

        // Validaciones del formulario
        if (!title) errors.title = 'El título es obligatorio';
        else if (title.length < 3) errors.title = 'Mínimo 3 caracteres';

        if (!Number.isInteger(module_id) || module_id <= 0) {
            errors.module_id = 'module_id inválido';
        }

        const allowedLevels = new Set(['beginner', 'intermediate', 'advanced']);
        if (!allowedLevels.has(level)) {
            errors.level = "Nivel inválido. Use 'beginner' | 'intermediate' | 'advanced'";
        }

        if (!Number.isInteger(duration_minutes) || duration_minutes < 1) {
            errors.duration_minutes = 'Duración debe ser un entero ≥ 1';
        }

        if (!instructor_name) errors.instructor_name = 'El instructor es obligatorio';

        if (Object.keys(errors).length > 0) {
            return res.status(422).json({success: false, message: 'Datos inválidos', errors});
        }

        // Verificar que el módulo exista
        const {rowCount: modExists} = await query('SELECT 1 FROM modules WHERE id = $1', [module_id]);
        if (modExists === 0) {
            return res.status(422).json({
                success: false,
                message: 'Datos inválidos',
                errors: {module_id: 'El módulo no existe'}
            });
        }

        // Siguiente orden dentro del módulo
        const {rows: orderRows} = await query(
            'SELECT COALESCE(MAX(order_in_module), 0) + 1 AS next_order FROM courses WHERE module_id = $1',
            [module_id]
        );
        const nextOrder = orderRows[0]?.next_order || 1;

        // Insert
        const insertSql = `
            INSERT INTO courses
            (title, description, module_id, level, duration_minutes, instructor_name, video_url, badge_image,
             order_in_module, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, title, description, module_id, level, duration_minutes, instructor_name,
                video_url, badge_image, order_in_module, is_active, created_at, updated_at
        `;
        const {rows} = await query(insertSql, [
            title,
            description,
            module_id,
            level,
            duration_minutes,
            instructor_name,
            null,           // video_url (no lo envía el formulario)
            null,           // badge_image (no lo envía el formulario)
            nextOrder,
            is_active
        ]);

        return res.status(201).json({
            success: true,
            data: rows[0],
            message: 'Curso creado exitosamente'
        });
    } catch (err) {
        console.error('Error creando curso:', err);
        return res.status(500).json({success: false, message: 'Error al crear curso'});
    }
});

module.exports = router;