// Panel de administracion para gestionar cursos
import React, { useState, useEffect } from 'react';
import { getModules, getCourses } from '../../services/api';

const AdminPanel = ({ user }) => {
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
                setStats(prev => ({ ...prev, totalModules: modulesResponse.data.length }));
            }

            if (coursesResponse.success) {
                // Convertir el objeto coursesByModule a array plano
                const coursesArray = [];
                Object.values(coursesResponse.data).forEach(moduleData => {
                    coursesArray.push(...moduleData.courses);
                });
                setAllCourses(coursesArray);
                setStats(prev => ({ ...prev, totalCourses: coursesArray.length }));
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

    const CoursesTab = () => (
        <div className="admin-courses">
            <div className="courses-header">
                <h3>Gestion de Cursos</h3>
                <button className="btn-primary">Agregar Nuevo Curso</button>
            </div>

            <div className="courses-table">
                <table>
                    <thead>
                    <tr>
                        <th>Titulo</th>
                        <th>Modulo</th>
                        <th>Nivel</th>
                        <th>Duracion</th>
                        <th>Instructor</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {allCourses.slice(0, 10).map(course => (
                        <tr key={course.id}>
                            <td>{course.title}</td>
                            <td>{course.module}</td>
                            <td>
                  <span className={`level-badge level-${course.level}`}>
                    {course.level}
                  </span>
                            </td>
                            <td>{course.duration_minutes} min</td>
                            <td>{course.instructor_name}</td>
                            <td>
                                <span className="status-active">Activo</span>
                            </td>
                            <td>
                                <div className="table-actions">
                                    <button className="btn-small">Editar</button>
                                    <button className="btn-small btn-danger">Eliminar</button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

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
                    { id: 1, name: 'Ana Rodriguez', email: 'ana@email.com', courses: 3, progress: 75 },
                    { id: 2, name: 'Carlos Mendez', email: 'carlos@email.com', courses: 5, progress: 92 },
                    { id: 3, name: 'Maria Lopez', email: 'maria@email.com', courses: 2, progress: 45 },
                    { id: 4, name: 'Pedro Garcia', email: 'pedro@email.com', courses: 4, progress: 68 }
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
                {activeTab === 'overview' && <OverviewTab />}
                {activeTab === 'courses' && <CoursesTab />}
                {activeTab === 'students' && <StudentsTab />}
            </div>
        </div>
    );
};

export default AdminPanel;