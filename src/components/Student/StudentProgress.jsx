// Dashboard del estudiante con progreso real
import React, {useState, useEffect} from 'react';
import CourseEnrollment from "../Courses/CourseEnrollemnt";


const StudentProgress = ({user, refreshFlag}) => {
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [availableCourses, setAvailableCourses] = useState([]);
    const [showAvailableCourses, setShowAvailableCourses] = useState(false);

    useEffect(() => {
        if (user && user.id) {
            loadStudentProgress();
            loadAvailableCourses();
        }
    }, [user, refreshFlag]);

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

    const handleCourseClick = (courseId) => {
        // Navegar al curso o abrir modal de detalles
        console.log('Clicked course:', courseId);
    };


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
    // Sumar progreso
    const handleContinueCourse = async (course) => {
        if (!user || !user.id) return;
        const nuevoProgreso = Math.min((course.progress_percentage || 0) + 5, 100);

        try {
            await fetch(`http://localhost:3000/api/students/progress/${course.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': 'Bearer token_temp',
                    'user-id': user.id.toString(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    progress_percentage: nuevoProgreso,
                    notes: `Progreso actualizado a ${nuevoProgreso}%`
                })
            });
            if (typeof triggerRefreshProgress === 'function') triggerRefreshProgress();
        } catch (err) {
            alert('Error al actualizar el progreso');
        }
    };
    // Elimianr cursos del progreso
    const handleDeleteCourse = async (course) => {
        if (!user || !user.id) return;
        if (!window.confirm('¿Seguro que deseas eliminar este curso de tu progreso?')) return;

        try {
            await fetch(`http://localhost:3000/api/students/progress/${course.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer token_temp',
                    'user-id': user.id.toString()
                }
            });
            if (typeof triggerRefreshProgress === 'function') triggerRefreshProgress();
        } catch (err) {
            alert('Error al eliminar el curso');
        }
    };

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
                                            disabled={course.progress_percentage >= 100}
                                        >
                                            {course.status === 'completed' ? 'Revisar' : 'Continuar'}
                                        </button>
                                        <button
                                            className="delete-button"
                                            onClick={() => handleDeleteCourse(course)}
                                        >
                                            Eliminar
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