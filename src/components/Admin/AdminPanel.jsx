// src/components/Admin/AdminPanel.jsx
// Autor: David Santiago Cubillos M.
// Panel de Administracion para gestionar modulos, cursos y estudiantes

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './AdminPanel.css';
import { getModules, getCourses } from '../../services/api';

// Modal para ver estudiantes de un curso
const CourseStudentsModal = ({isOpen, onClose, course, students, loading, error}) => {
    // Si el modal no esta abierto, no muestra nada
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Estudiantes del curso {course ? `"${course.title}"` : ''}</h2>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>

                <div className="modal-body">
                    {loading && <p>Cargando estudiantes...</p>}
                    {error && <p className="error-text">Error: {error}</p>}
                    {/* Si hay estudiantes los muestra en tabla, si no muestra mensaje */}
                    {!loading && !error && (
                        students.length > 0 ? (
                            <div className="courses-table">
                                <table>
                                    <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre</th>
                                        <th>Email</th>
                                        <th>Progreso</th>
                                        <th>Inscripcion</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {students.map(s => (
                                        <tr key={s.id}>
                                            <td>{s.id}</td>
                                            <td>{s.name || `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim()}</td>
                                            <td>{s.email}</td>
                                            <td>{s.progress != null ? `${s.progress}%` : '—'}</td>
                                            <td>{s.enrolled_at ? new Date(s.enrolled_at).toLocaleDateString() : '—'}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p>No hay estudiantes inscritos en este curso.</p>
                        )
                    )}
                </div>

                <div className="modal-footer">
                    <button type="button" onClick={onClose} className="btn-secondary">Cerrar</button>
                </div>
            </div>
        </div>
    );
};

// Modal para agregar o editar un curso
const AddCourseModal = ({isOpen, onClose, onSave, modules, initialCourse = null, titleText, submitLabel}) => {
    // Datos por defecto para el formulario
    const defaultData = {
        title: '',
        description: '',
        module_id: modules.length > 0 ? modules[0].id : '',
        level: 'beginner',
        duration_minutes: 60,
        instructor_name: '',
        is_active: true
    };

    // Estado para los datos del curso
    const [courseData, setCourseData] = useState(initialCourse ? {...defaultData, ...initialCourse} : defaultData);

    // Cuando se abre el modal, actualiza los datos si es edicion
    useEffect(() => {
        if (isOpen) {
            setCourseData(initialCourse ? {...defaultData, ...initialCourse} : defaultData);
        }
    }, [isOpen, modules, initialCourse]);

    // Si el modal no esta abierto, no muestra nada
    if (!isOpen) return null;

    // Maneja cambios en los inputs del formulario
    const handleChange = (e) => {
        const {name, value, type, checked} = e.target;
        setCourseData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Cuando se envia el formulario, valida y llama a onSave
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!courseData.title || !courseData.module_id || !courseData.instructor_name) {
            alert('Por favor, completa los campos obligatorios: Titulo, Modulo e Instructor.');
            return;
        }
        const payload = {
            ...courseData,
            module_id: parseInt(courseData.module_id, 10),
            duration_minutes: parseInt(courseData.duration_minutes, 10)
        };
        onSave(payload);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{titleText || 'Agregar Nuevo Curso'}</h2>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label htmlFor="title">Titulo del Curso</label>
                        <input type="text" id="title" name="title" value={courseData.title} onChange={handleChange}
                               required/>
                    </div>
                    <div className="form-group">
                        <label htmlFor="description">Descripcion</label>
                        <textarea id="description" name="description" value={courseData.description}
                                  onChange={handleChange}></textarea>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="module_id">Modulo</label>
                            <select id="module_id" name="module_id" value={courseData.module_id} onChange={handleChange}
                                    required>
                                {modules.map(m => <option key={m.id} value={m.id}>{m.display_name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="level">Nivel</label>
                            <select id="level" name="level" value={courseData.level} onChange={handleChange}>
                                <option value="beginner">Principiante</option>
                                <option value="intermediate">Intermedio</option>
                                <option value="advanced">Avanzado</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="duration_minutes">Duracion (minutos)</label>
                            <input type="number" id="duration_minutes" name="duration_minutes" min="1"
                                   value={courseData.duration_minutes} onChange={handleChange}/>
                        </div>
                        <div className="form-group">
                            <label htmlFor="instructor_name">Instructor</label>
                            <input type="text" id="instructor_name" name="instructor_name"
                                   value={courseData.instructor_name} onChange={handleChange} required/>
                        </div>
                    </div>
                    <div className="form-group form-group-checkbox">
                        <label htmlFor="is_active">
                            <input type="checkbox" id="is_active" name="is_active" checked={courseData.is_active}
                                   onChange={handleChange}/>
                            Curso Activo
                        </label>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
                        <button type="submit" className="btn-primary">{submitLabel || 'Guardar Curso'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Componente principal del panel de administracion
const AdminPanel = ({user}) => {
    // Estados para pestañas y datos principales
    const [activeTab, setActiveTab] = useState('overview');
    const [modules, setModules] = useState([]);
    const [allCourses, setAllCourses] = useState([]);
    const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);

    // Estados para edicion de curso
    const [isEditCourseModalOpen, setIsEditCourseModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);

    // Estados para ver estudiantes de un curso
    const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
    const [studentsCourse, setStudentsCourse] = useState(null);
    const [courseStudents, setCourseStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [studentsError, setStudentsError] = useState(null);

    // Estadisticas generales
    const [stats, setStats] = useState({
        totalModules: 0,
        totalCourses: 0,
        totalStudents: 5,
        recentActivity: []
    });

    // Carga los datos al iniciar
    useEffect(() => {
        loadData();
    }, []);

    // Funcion para cargar modulos y cursos
    const loadData = async () => {
        try {
            const [modulesResponse, coursesResponse] = await Promise.all([
                getModules(),
                getCourses()
            ]);

            if (modulesResponse.success) {
                setModules(modulesResponse.data);
                setStats(prev => ({...prev, totalModules: modulesResponse.data.length}));
            }

            if (coursesResponse.success) {
                const coursesArray = [];
                Object.values(coursesResponse.data).forEach(moduleData => {
                    coursesArray.push(...moduleData.courses);
                });
                setAllCourses(coursesArray);
                setStats(prev => ({...prev, totalCourses: coursesArray.length}));
            }
        } catch (error) {
            console.error('Error cargando datos:', error);
        }
    };

    // Guardar un nuevo curso
    const handleSaveNewCourse = async (courseData) => {
        try {
            const response = await fetch('http://localhost:3000/api/courses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer token_temp'
                },
                body: JSON.stringify(courseData)
            });

            if (!response.ok) {
                throw new Error('Error al guardar el curso');
            }

            alert('Curso agregado exitosamente');
            setIsAddCourseModalOpen(false);
            await loadData();
        } catch (error) {
            console.error('Error al guardar el curso:', error);
            alert(`Error al guardar el curso: ${error.message}`);
        }
    };

    // Abre el modal para editar un curso
    const handleOpenEditCourse = (course) => {
        setEditingCourse(course);
        setIsEditCourseModalOpen(true);
    };

    // Actualiza un curso existente
    const handleUpdateCourse = async (courseData) => {
        if (!editingCourse) return;
        try {
            const response = await fetch(`http://localhost:3000/api/courses/${editingCourse.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer token_temp'
                },
                body: JSON.stringify(courseData)
            });

            if (!response.ok) {
                throw new Error('Error al actualizar el curso');
            }

            alert('Curso actualizado exitosamente');
            setIsEditCourseModalOpen(false);
            setEditingCourse(null);
            await loadData();
        } catch (error) {
            console.error('Error al actualizar el curso:', error);
            alert(`Error al actualizar el curso: ${error.message}`);
        }
    };

    // Abre el modal de estudiantes y carga la lista
    const handleOpenCourseStudents = async (course) => {
        setStudentsCourse(course);
        setIsStudentsModalOpen(true);
        setLoadingStudents(true);
        setStudentsError(null);
        try {
            const res = await fetch(`http://localhost:3000/api/courses/${course.id}/students`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer token_temp'
                }
            });
            if (!res.ok) throw new Error('Error al cargar estudiantes');

            const data = await res.json();
            const list = Array.isArray(data) ? data : (data.data ?? []);
            setCourseStudents(list);
        } catch (e) {
            setStudentsError(e.message);
            setCourseStudents([]);
        } finally {
            setLoadingStudents(false);
        }
    };

    // Cierra el modal de estudiantes
    const handleCloseCourseStudents = () => {
        setIsStudentsModalOpen(false);
        setStudentsCourse(null);
        setCourseStudents([]);
        setStudentsError(null);
    };

    // Pestaña de resumen general
    const OverviewTab = () => (
        <div className="admin-overview">
            <div className="admin-stats">
                <div className="admin-stat-card">
                    <h3>{stats.totalModules}</h3>
                    <p>Modulos Musicales</p>
                </div>
                <div className="admin-stat-card">
                    <h3>{stats.totalCourses}</h3>
                    <p>Cursos Totales</p>
                </div>
                <div className="admin-stat-card">
                    <h3>{stats.totalStudents}</h3>
                    <p>Estudiantes Activos</p>
                </div>
                <div className="admin-stat-card">
                    <h3>87%</h3>
                    <p>Tasa de Finalizacion</p>
                </div>
            </div>

            <div className="modules-overview">
                <h3>Resumen por Modulos</h3>
                <div className="modules-summary">
                    {/* Muestra resumen de cada modulo */}
                    {modules.map(module => (
                        <div key={module.id} className="module-summary-card">
                            <h4>{module.display_name}</h4>
                            <p>{module.course_count} cursos</p>
                            <div className="module-actions">
                                <button className="btn-small">Ver Cursos</button>
                                <button className="btn-small btn-secondary">Editar</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    // Pestaña de gestion de cursos
    const CoursesTab = ({allCourses}) => {
        const [currentPage, setCurrentPage] = useState(1);
        const [coursesPerPage] = useState(10);
        const [filteredCourses, setFilteredCourses] = useState([]);
        const [filters, setFilters] = useState({
            module_id: '',
            level: '',
            search: ''
        });

        // Aplica filtros cuando cambian
        useEffect(() => {
            applyFilters();
        }, [allCourses, filters]);

        // Filtra los cursos segun los filtros
        const applyFilters = () => {
            let filtered = [...allCourses];

            if (filters.search) {
                filtered = filtered.filter(course =>
                    course.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                    course.instructor_name.toLowerCase().includes(filters.search.toLowerCase())
                );
            }

            if (filters.module_id) {
                filtered = filtered.filter(course => course.module_id === parseInt(filters.module_id));
            }

            if (filters.level) {
                filtered = filtered.filter(course => course.level === filters.level);
            }

            setFilteredCourses(filtered);
            setCurrentPage(1);
        };

        // Cambia los filtros
        const handleFilterChange = (filterType, value) => {
            setFilters(prev => ({...prev, [filterType]: value}));
        };

        // Limpia los filtros
        const clearFilters = () => {
            setFilters({module_id: '', level: '', search: ''});
        };

        // Paginacion
        const indexOfLastCourse = currentPage * coursesPerPage;
        const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
        const currentCourses = filteredCourses.slice(indexOfFirstCourse, indexOfLastCourse);
        const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);

        const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

        // Numeros para la paginacion
        const getPaginationNumbers = () => {
            const delta = 2;
            const range = [];
            const rangeWithDots = [];

            for (let i = Math.max(2, currentPage - delta);
                 i <= Math.min(totalPages - 1, currentPage + delta);
                 i++) range.push(i);

            if (currentPage - delta > 2) rangeWithDots.push(1, '...');
            else rangeWithDots.push(1);

            rangeWithDots.push(...range);

            if (currentPage + delta < totalPages - 1) rangeWithDots.push('...', totalPages);
            else if (totalPages > 1) rangeWithDots.push(totalPages);

            return rangeWithDots.filter((page, index, arr) => arr.indexOf(page) === index);
        };

        // Niveles unicos
        const uniqueLevels = ['beginner', 'intermediate', 'advanced'];
        // Formatea el texto del nivel
        const formatLevel = (level) => ({
            beginner: 'Principiante',
            intermediate: 'Intermedio',
            advanced: 'Avanzado'
        }[level] || level);

        return (
            <div className="admin-courses">
                <div className="courses-header">
                    <h3>Gestion de Cursos</h3>
                    <button className="btn-primary" onClick={() => setIsAddCourseModalOpen(true)}>
                        Agregar Nuevo Curso
                    </button>
                </div>

                <div className="courses-filters">
                    <div className="filter-group">
                        <input
                            type="text"
                            placeholder="Buscar por titulo o instructor..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="filter-input"
                        />
                    </div>

                    <div className="filter-group">
                        <select
                            value={filters.level}
                            onChange={(e) => handleFilterChange('level', e.target.value)}
                            className="filter-select"
                        >
                            <option value="">Todos los niveles</option>
                            {uniqueLevels.map(level => (
                                <option key={level} value={level}>{formatLevel(level)}</option>
                            ))}
                        </select>
                    </div>

                    <button onClick={clearFilters} className="btn-secondary btn-small">
                        Limpiar filtros
                    </button>
                </div>

                <div className="courses-info">
                                    <span>
                                        Mostrando {indexOfFirstCourse + 1}-{Math.min(indexOfLastCourse, filteredCourses.length)} de {filteredCourses.length} cursos
                                    </span>
                </div>

                <div className="courses-table">
                    <table>
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Titulo</th>
                            <th>Nivel</th>
                            <th>Duracion</th>
                            <th>Instructor</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {currentCourses.length > 0 ? (
                            currentCourses.map(course => (
                                <tr key={course.id}>
                                    <td>{course.id}</td>
                                    <td>
                                        <div className="course-title">
                                            <strong>{course.title}</strong>
                                            <span className="course-description">
                                                                    {course.description ? course.description.substring(0, 50) + '...' : 'Sin descripcion'}
                                                                </span>
                                        </div>
                                    </td>
                                    <td>
                                                            <span className={`level-badge level-${course.level}`}>
                                                                {formatLevel(course.level)}
                                                            </span>
                                    </td>
                                    <td>{course.duration_minutes} min</td>
                                    <td>{course.instructor_name}</td>
                                    <td>
                                                            <span
                                                                className={`status-badge ${course.is_active ? 'status-active' : 'status-inactive'}`}>
                                                                {course.is_active ? 'Activo' : 'Inactivo'}
                                                            </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button
                                                className="btn-small btn-primary"
                                                onClick={() => handleOpenCourseStudents(course)}
                                            >
                                                Ver Estudiantes
                                            </button>
                                            <button
                                                className="btn-small btn-secondary"
                                                onClick={() => handleOpenEditCourse(course)}
                                            >
                                                Editar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" className="no-results">No se encontraron cursos</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Paginacion */}
                {totalPages > 1 && (
                    <div className="pagination">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="pagination-btn flex items-center gap-1"
                        >
                            <ChevronLeft className="w-5 h-5"/>
                            <span className="hidden sm:inline"></span>
                        </button>

                        <div className="pagination-numbers">
                            {getPaginationNumbers().map((page, index) => (
                                <React.Fragment key={index}>
                                    {page === "..." ? (
                                        <span className="pagination-dots">...</span>
                                    ) : (
                                        <button
                                            onClick={() => handlePageChange(page)}
                                            className={`pagination-number ${
                                                currentPage === page ? "active" : ""
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="pagination-btn flex items-center gap-1"
                        >
                            <span className="hidden sm:inline"></span>
                            <ChevronRight className="w-5 h-5"/>
                        </button>
                    </div>
                )}
            </div>
        );
    };

    // Pestaña de estudiantes
    const StudentsTab = () => {
        const [students, setStudents] = useState([]);
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState(null);
        const [statusFilter, setStatusFilter] = useState('all');

        // Carga los estudiantes al iniciar
        useEffect(() => {
            const loadStudents = async () => {
                setLoading(true);
                setError(null);
                try {
                    const res = await fetch('http://localhost:3000/api/students', {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer token_temp'
                        }
                    });
                    if (!res.ok) throw new Error('Error al cargar estudiantes');
                    const data = await res.json();
                    const list = Array.isArray(data) ? data : (data.data ?? []);
                    setStudents(list);
                } catch (e) {
                    setError(e.message);
                    setStudents([]);
                } finally {
                    setLoading(false);
                }
            };
            loadStudents();
        }, []);

        // Filtra los estudiantes por estado
        const filteredStudents = students.filter(s => {
            if (statusFilter === 'active') return s.is_active !== false;
            if (statusFilter === 'inactive') return s.is_active === false;
            return true;
        });

        return (
            <div className="admin-students">
                <div className="students-header">
                    <h3>Estudiantes Registrados</h3>
                    <div className="students-filters">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">Todos los estudiantes</option>
                            <option value="active">Activos</option>
                            <option value="inactive">Inactivos</option>
                        </select>
                    </div>
                </div>

                {loading && <p>Cargando estudiantes...</p>}
                {error && <p className="error-text">Error: {error}</p>}

                {/* Muestra los estudiantes en tarjetas */}
                {!loading && !error && (
                    <div className="students-grid">
                        {filteredStudents.length > 0 ? (
                            filteredStudents.map(student => (
                                <div key={student.id} className="student-card">
                                    <div className="student-info">
                                        <h4>{student.name || `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim() || 'Sin nombre'}</h4>
                                        <p>{student.email || '—'}</p>
                                    </div>
                                    <div className="student-stats">
                                        <div className="student-stat">
                                            <span
                                                className="stat-number">{student.courses ?? student.courses_count ?? student.enrollments_count ?? 0}</span>
                                            <span className="stat-label">Cursos</span>
                                        </div>
                                        <div className="student-stat">
                                            <span
                                                className="stat-number">{(student.progress ?? student.avg_progress ?? 0)}%</span>
                                            <span className="stat-label">Progreso</span>
                                        </div>
                                    </div>
                                    <button className="btn-small">Ver Detalles</button>
                                </div>
                            ))
                        ) : (
                            <p className="no-results">No hay estudiantes.</p>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // Render principal del panel
    return (
        <div className="admin-panel">
            <div className="admin-header">
                <h2>Panel de Administracion</h2>
                <p>Bienvenido, {user.full_name}</p>
            </div>

            {/* Pestañas */}
            <div className="admin-tabs">
                <button className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}>
                    Resumen
                </button>
                <button className={`tab-button ${activeTab === 'courses' ? 'active' : ''}`}
                        onClick={() => setActiveTab('courses')}>
                    Cursos
                </button>
                <button className={`tab-button ${activeTab === 'students' ? 'active' : ''}`}
                        onClick={() => setActiveTab('students')}>
                    Estudiantes
                </button>
            </div>

            {/* Contenido segun la pestaña */}
            <div className="admin-content">
                {activeTab === 'overview' && <OverviewTab/>}
                {activeTab === 'courses' && (<CoursesTab allCourses={allCourses}/>)}
                {activeTab === 'students' && <StudentsTab/>}
            </div>

            {/* Modal agregar curso */}
            <AddCourseModal
                isOpen={isAddCourseModalOpen}
                onClose={() => setIsAddCourseModalOpen(false)}
                onSave={handleSaveNewCourse}
                modules={modules}
                titleText="Agregar Nuevo Curso"
                submitLabel="Guardar Curso"
            />

            {/* Modal editar curso */}
            <AddCourseModal
                isOpen={isEditCourseModalOpen}
                onClose={() => {
                    setIsEditCourseModalOpen(false);
                    setEditingCourse(null);
                }}
                onSave={handleUpdateCourse}
                modules={modules}
                initialCourse={editingCourse}
                titleText="Editar Curso"
                submitLabel="Guardar Cambios"
            />

            {/* Modal ver estudiantes */}
            <CourseStudentsModal
                isOpen={isStudentsModalOpen}
                onClose={handleCloseCourseStudents}
                course={studentsCourse}
                students={courseStudents}
                loading={loadingStudents}
                error={studentsError}
            />
        </div>
    );
};

export default AdminPanel;
