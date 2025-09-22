// Panel de administracion para gestionar cursos
import React, {useState, useEffect} from 'react';
import './AdminPanel.css';
import {getModules, getCourses} from '../../services/api';

const AdminPanel = ({user}) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [modules, setModules] = useState([]);
    const [allCourses, setAllCourses] = useState([]);
    const [stats, setStats] = useState({
        totalModules: 0,
        totalCourses: 0,
        totalStudents: 5, // Simulado
        recentActivity: []
    });

    useEffect(() => {
        loadData();
    }, []);

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
                // Convertir el objeto coursesByModule a array plano
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

    const CoursesTab = ({allCourses, modules}) => {
        const [currentPage, setCurrentPage] = useState(1);
        const [coursesPerPage] = useState(10);
        const [filteredCourses, setFilteredCourses] = useState([]);
        const [filters, setFilters] = useState({
            module_id: '',
            level: '',
            search: ''
        });

        useEffect(() => {
            applyFilters();
        }, [allCourses, filters]);

        const applyFilters = () => {
            let filtered = [...allCourses];

            // Filtro por búsqueda (título o instructor)
            if (filters.search) {
                filtered = filtered.filter(course =>
                    course.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                    course.instructor_name.toLowerCase().includes(filters.search.toLowerCase())
                );
            }

            // Filtro por módulo
            if (filters.module_id) {
                filtered = filtered.filter(course => course.module_id === parseInt(filters.module_id));
            }

            // Filtro por nivel
            if (filters.level) {
                filtered = filtered.filter(course => course.level === filters.level);
            }

            setFilteredCourses(filtered);
            setCurrentPage(1); // Reset a primera página
        };


        const handleFilterChange = (filterType, value) => {
            setFilters(prev => ({
                ...prev,
                [filterType]: value
            }));
        };

        const clearFilters = () => {
            setFilters({
                module_id: '',
                level: '',
                search: ''
            });
        };

        // Calcular cursos para la página actual
        const indexOfLastCourse = currentPage * coursesPerPage;
        const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
        const currentCourses = filteredCourses.slice(indexOfFirstCourse, indexOfLastCourse);

        // Calcular número total de páginas
        const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);

        const handlePageChange = (pageNumber) => {
            setCurrentPage(pageNumber);
        };

        const getPaginationNumbers = () => {
            const delta = 2;
            const range = [];
            const rangeWithDots = [];

            for (let i = Math.max(2, currentPage - delta);
                 i <= Math.min(totalPages - 1, currentPage + delta);
                 i++) {
                range.push(i);
            }

            if (currentPage - delta > 2) {
                rangeWithDots.push(1, '...');
            } else {
                rangeWithDots.push(1);
            }

            rangeWithDots.push(...range);

            if (currentPage + delta < totalPages - 1) {
                rangeWithDots.push('...', totalPages);
            } else {
                rangeWithDots.push(totalPages);
            }

            return rangeWithDots.filter((page, index, arr) => arr.indexOf(page) === index);
        };

        // Obtener módulos únicos para el filtro
        const uniqueLevels = ['beginner', 'intermediate', 'advanced'];



        // Función para formatear el nivel
        const formatLevel = (level) => {
            const levelMap = {
                beginner: 'Principiante',
                intermediate: 'Intermedio',
                advanced: 'Avanzado'
            };
            return levelMap[level] || level;
        };

        return (
            <div className="admin-courses">
                <div className="courses-header">
                    <h3>Gestión de Cursos</h3>
                    <button className="btn-primary">Agregar Nuevo Curso</button>
                </div>

                {/* Filtros */}
                <div className="courses-filters">
                    <div className="filter-group">
                        <input
                            type="text"
                            placeholder="Buscar por título o instructor..."
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
                                <option key={level} value={level}>
                                    {formatLevel(level)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={clearFilters}
                        className="btn-secondary btn-small"
                    >
                        Limpiar filtros
                    </button>
                </div>

                {/* Información de resultados */}
                <div className="courses-info">
                <span>
                    Mostrando {indexOfFirstCourse + 1}-{Math.min(indexOfLastCourse, filteredCourses.length)} de {filteredCourses.length} cursos
                </span>
                </div>

                {/* Tabla de cursos */}

                <div className="courses-table">
                    <table>
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Título</th>
                            <th>Nivel</th>
                            <th>Duración</th>
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
                                                {course.description ?
                                                    course.description.substring(0, 50) + '...' :
                                                    'Sin descripción'
                                                }
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
                                            <button className="btn-small btn-primary">Ver Estudiantes</button>
                                            <button className="btn-small btn-secondary">Editar</button>
                                            <button className="btn-small btn-danger">Pausar</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" className="no-results">
                                    No se encontraron cursos
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                    <div className="pagination">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="pagination-btn"
                        >
                            ← Anterior
                        </button>

                        <div className="pagination-numbers">
                            {getPaginationNumbers().map((page, index) => (
                                <React.Fragment key={index}>
                                    {page === '...' ? (
                                        <span className="pagination-dots">...</span>
                                    ) : (
                                        <button
                                            onClick={() => handlePageChange(page)}
                                            className={`pagination-number ${currentPage === page ? 'active' : ''}`}
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
                            className="pagination-btn"
                        >
                            Siguiente →
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const StudentsTab = () => (
        <div className="admin-students">
            <div className="students-header">
                <h3>Estudiantes Registrados</h3>
                <div className="students-filters">
                    <select>
                        <option>Todos los estudiantes</option>
                        <option>Activos</option>
                        <option>Inactivos</option>
                    </select>
                </div>
            </div>

            <div className="students-grid">
                {/* Datos simulados de estudiantes */}
                {[
                    {id: 1, name: 'Ana Rodriguez', email: 'ana@email.com', courses: 3, progress: 75},
                    {id: 2, name: 'Carlos Mendez', email: 'carlos@email.com', courses: 5, progress: 92},
                    {id: 3, name: 'Maria Lopez', email: 'maria@email.com', courses: 2, progress: 45},
                    {id: 4, name: 'Pedro Garcia', email: 'pedro@email.com', courses: 4, progress: 68}
                ].map(student => (
                    <div key={student.id} className="student-card">
                        <div className="student-info">
                            <h4>{student.name}</h4>
                            <p>{student.email}</p>
                        </div>
                        <div className="student-stats">
                            <div className="student-stat">
                                <span className="stat-number">{student.courses}</span>
                                <span className="stat-label">Cursos</span>
                            </div>
                            <div className="student-stat">
                                <span className="stat-number">{student.progress}%</span>
                                <span className="stat-label">Progreso</span>
                            </div>
                        </div>
                        <button className="btn-small">Ver Detalles</button>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="admin-panel">
            <div className="admin-header">
                <h2>Panel de Administracion</h2>
                <p>Bienvenido, {user.full_name}</p>
            </div>

            <div className="admin-tabs">
                <button
                    className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Resumen
                </button>
                <button
                    className={`tab-button ${activeTab === 'courses' ? 'active' : ''}`}
                    onClick={() => setActiveTab('courses')}
                >
                    Cursos
                </button>
                <button
                    className={`tab-button ${activeTab === 'students' ? 'active' : ''}`}
                    onClick={() => setActiveTab('students')}
                >
                    Estudiantes
                </button>
            </div>

            <div className="admin-content">
                {activeTab === 'overview' && <OverviewTab/>}
                {activeTab === 'courses' && (<CoursesTab
                        allCourses={allCourses}
                        modules={modules}/>)}
                {activeTab === 'students' && <StudentsTab/>}
            </div>
        </div>
    );
};

export default AdminPanel;