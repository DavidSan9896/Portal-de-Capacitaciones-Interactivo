// StudentProgress.jsx
// Autor: David C.<3 M.
// Importa React y hooks para manejar estado y efectos
import React, {useState, useEffect} from 'react';
// Importa estilos CSS
import './StudentProgress.css';
// Importa el componente para inscribirse a cursos
import CourseEnrollment from "../Courses/CourseEnrollemnt";

// Componente principal que muestra el progreso del estudiante
const StudentProgress = ({user, refreshFlag}) => {
    // Estado para el progreso del estudiante
    const [progress, setProgress] = useState({
        stats: {
            courses_started: 0,
            courses_completed: 0,
            total_badges: 0,
            total_enrolled: 0,
            completion_rate: 0
        },
        current_courses: [],
        badges: []
    });
    // Estado para mostrar si esta cargando
    const [loading, setLoading] = useState(true);
    // Estado para errores
    const [error, setError] = useState(null);
    // Estado para cursos disponibles
    const [availableCourses, setAvailableCourses] = useState([]);
    // Estado para mostrar cursos disponibles
    const [showAvailableCourses, setShowAvailableCourses] = useState(false);
    // Estado para saber si se esta eliminando un curso
    const [deleting, setDeleting] = useState({});

    // Efecto para cargar datos cuando cambia el usuario o refreshFlag
    useEffect(() => {
        if (user && user.id) {
            loadStudentProgress();
            loadAvailableCourses();
        }
    }, [user, refreshFlag]);

    // Funcion para cargar el progreso del estudiante
    const loadStudentProgress = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:3000/api/students/progress', {
                headers: {
                    'Authorization': 'Bearer token_temp',
                    'user-id': user.id.toString()
                }
            });
            const data = await response.json();
            if (data.success) {
                setProgress(data.data);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Error al cargar el progreso');
            console.error('Error cargando progreso:', err);
        } finally {
            setLoading(false);
        }
    };

    // Funcion para cargar cursos disponibles
    const loadAvailableCourses = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/students/available-courses', {
                headers: {
                    'Authorization': 'Bearer token_temp',
                    'user-id': user.id.toString()
                }
            });

            const data = await response.json();
            if (data.success) {
                setAvailableCourses(data.data.filter(c => !c.is_enrolled));
            }
        } catch (err) {
            console.error('Error cargando cursos:', err);
        }
    };

    // Funcion para manejar click en un curso (solo log)
    const handleCourseClick = (courseId) => {
        console.log('Clicked course:', courseId);
    };

    // Funcion para mostrar texto segun el estado del curso
    const getStatusText = (status) => {
        switch (status) {
            case 'completed':
                return 'Completado';
            case 'started':
                return 'En progreso';
            default:
                return 'No iniciado';
        }
    };

    // Funcion para mostrar color segun el estado del curso
    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return '#27ae60';
            case 'started':
                return '#3498db';
            default:
                return '#95a5a6';
        }
    };

    // Funcion para continuar un curso (aumenta el progreso)
    const handleContinueCourse = async (course) => {
        if (!user || !user.id) return;
        const nuevoProgreso = Math.min((course.progress_percentage || 0) + 5, 100);
        const nuevoStatus = nuevoProgreso >= 100 ? 'completed' : 'started';

        // Actualizacion optimista de la UI
        setProgress(prev => ({
            ...prev,
            current_courses: prev.current_courses.map(c =>
                c.id === course.id
                    ? {
                        ...c,
                        progress_percentage: nuevoProgreso,
                        status: nuevoStatus
                    }
                    : c
            )
        }));

        try {
            const res = await fetch(`http://localhost:3000/api/students/progress/${course.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': 'Bearer token_temp',
                    'user-id': user.id.toString(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    progress_percentage: nuevoProgreso,
                    status: nuevoStatus,  // Agregar el status
                    notes: `Progreso actualizado a ${nuevoProgreso}%`
                })
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok || data.success === false) {
                throw new Error(data.message || 'Fallo al actualizar el progreso');
            }

            // Recargar el progreso completo para actualizar estadisticas y badges
            await loadStudentProgress();

            // Si se completo el curso, actualizar cursos disponibles
            if (nuevoProgreso >= 100) {
                await loadAvailableCourses();
            }

        } catch (err) {
            // Revertir cambios en caso de error
            setProgress(prev => ({
                ...prev,
                current_courses: prev.current_courses.map(c =>
                    c.id === course.id
                        ? {
                            ...c,
                            progress_percentage: course.progress_percentage,
                            status: course.status
                        }
                        : c
                )
            }));
            alert('Error al actualizar el progreso');
            console.error('Error:', err);
        }
    };

    // Funcion para eliminar un curso del progreso
    const handleDeleteCourse = async (course) => {
        if (!user || !user.id) return;

        const confirmDelete = window.confirm(`¿Estas seguro que deseas eliminar el curso "${course.title}" de tu progreso? Esta accion no se puede deshacer.`);
        if (!confirmDelete) return;

        setDeleting(prev => ({...prev, [course.id]: true}));
        const prevCourses = [...progress.current_courses];

        setProgress(prev => ({
            ...prev,
            current_courses: prev.current_courses.filter(c => c.id !== course.id)
        }));

        try {
            // Usar la ruta correcta del backend
            const response = await fetch(`http://localhost:3000/api/students/enroll/${course.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer token_temp',
                    'user-id': user.id.toString(),
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Error del servidor: ${response.status}`);
            }

            await loadStudentProgress();
            await loadAvailableCourses();

        } catch (err) {
            setProgress(prev => ({
                ...prev,
                current_courses: prevCourses
            }));
            alert(`Error al eliminar el curso: ${err.message}`);
            console.error('Error eliminando curso:', err);
        } finally {
            setDeleting(prev => {
                const copy = {...prev};
                delete copy[course.id];
                return copy;
            });
        }
    };

    // Si esta cargando, muestra spinner
    if (loading) {
        return (
            <div className="student-dashboard">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p className="loading-message">Cargando tu progreso...</p>
                </div>
            </div>
        );
    }

    // Si hay error, muestra mensaje de error
    if (error) {
        return (
            <div className="student-dashboard">
                <div className="error-container">
                    <h3>Error al cargar progreso</h3>
                    <p>{error}</p>
                    <button onClick={loadStudentProgress} className="retry-button">
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    // Render principal del dashboard del estudiante
    return (
        <div className="student-dashboard">
            <div className="dashboard-header">
                <h2>Mi Progreso Musical</h2>
                <p>Bienvenido de nuevo, {user.full_name}</p>
            </div>

            {/* Cursos actuales */}
            {progress.current_courses.length > 0 && (
                <div className="current-courses">
                    <h3>Mis Cursos Actuales</h3>
                    <div className="course-list">
                        {progress.current_courses.map(course => (
                            <div key={course.id} className="progress-course-card">
                                <div className="course-info">
                                    <h4>{course.title}</h4>
                                    <div className="course-meta">
                                        <span className="course-module">{course.module_name}</span>
                                        <span
                                            className="course-status"
                                            style={{color: getStatusColor(course.status)}}
                                        >
                                                {getStatusText(course.status)}
                                            </span>
                                    </div>
                                    <p className="course-description">{course.description}</p>
                                </div>
                                <div className="progress-section">
                                    <div className="progress-bar-container">
                                        <div className="progress-bar-outer">
                                            <div
                                                className="progress-bar-inner"
                                                style={{
                                                    width: `${course.progress_percentage}%`,
                                                    backgroundColor: getStatusColor(course.status)
                                                }}
                                            ></div>
                                        </div>
                                        <span className="progress-text">{course.progress_percentage}%</span>
                                    </div>
                                    <div className="course-actions">
                                        <button
                                            className="continue-button"
                                            onClick={() => handleContinueCourse(course)}
                                            disabled={course.progress_percentage >= 100 || !!deleting[course.id]}
                                        >
                                            {course.status === 'completed' ? 'Revisar' : 'Continuar'}
                                        </button>
                                        <button
                                            className="delete-button"
                                            onClick={() => handleDeleteCourse(course)}
                                            disabled={!!deleting[course.id]}
                                        >
                                            {deleting[course.id] ? 'Eliminando...' : 'Eliminar'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Insignias */}
            {progress.badges.length > 0 && (
                <div className="badges-section">
                    <h3>Mis Insignias</h3>
                    <div className="badges-grid">
                        {progress.badges.map(badge => (
                            <div key={`${badge.course_id}-${badge.earned_at}`} className="badge-item">
                                <div
                                    className="badge-icon"
                                    style={{backgroundColor: badge.module_color}}
                                >
                                    Insignia
                                </div>
                                <div className="badge-name">{badge.course_title}</div>
                                <div className="badge-description">
                                    Completado el {new Date(badge.earned_at).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Estado vacio */}
            {progress.current_courses.length === 0 && !loading && (
                <div className="empty-state">
                    <h3>Aun no tienes cursos</h3>
                    <p>Explora los modulos musicales abajo para comenzar tu aprendizaje</p>
                </div>
            )}

            {/* Cursos disponibles para inscribirse */}
            {showAvailableCourses && (
                <div style={{marginTop: '2rem'}}>
                    {availableCourses.map(course => (
                        <CourseEnrollment
                            key={course.id}
                            course={course}
                            user={user}
                            onEnrollSuccess={() => {
                                loadStudentProgress();
                                loadAvailableCourses();
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentProgress;