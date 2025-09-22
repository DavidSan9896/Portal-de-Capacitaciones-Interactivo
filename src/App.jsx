// Componente principal - portal de capacitaciones musicales
import React, {useState, useEffect} from 'react';
import './App.css';

// Componentes
import Header from './components/Layout/Header';
import ModuleCard from './components/Courses/ModuleCard';
import LoadingSpinner from './components/Layout/LoadingSpinner';
import StudentProgress from './components/Student/StudentProgress';
import AdminPanel from './components/Admin/AdminPanel';
import CourseEnrollment from './components/Courses/CourseEnrollemnt';


// Servicios
import {getModules, getCourses, verifyToken} from './services/api';

function App() {
    const [modules, setModules] = useState([]);
    const [selectedModule, setSelectedModule] = useState(null);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [user, setUser] = useState(null);
    const [refreshProgressFlag, setRefreshProgressFlag] = useState(0);
    const [refreshFlag, setRefreshFlag] = useState(false);


    // Cargar modulos al iniciar
    useEffect(() => {
        loadModules();
        checkExistingAuth();
    }, []);

    const checkExistingAuth = async () => {
        const savedToken = localStorage.getItem('token');
        if (savedToken) {
            try {
                const response = await verifyToken(savedToken);
                if (response.success) {
                    setUser(response.user);
                } else {
                    localStorage.removeItem('token');
                    localStorage.removeItem('portal_user');
                }
            } catch (error) {
                localStorage.removeItem('token');
                localStorage.removeItem('portal_user');
            }
        }
    };

    const loadModules = async () => {
        try {
            setLoading(true);
            const response = await getModules();
            if (response.success) {
                setModules(response.data);
            } else {
                setError('Error al cargar los modulos musicales');
            }
        } catch (err) {
            setError('Error de conexion con el servidor');
            console.error('Error cargando modulos:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleModuleClick = async (module) => {
        try {
            setSelectedModule(module);
            setLoading(true);
            const response = await getCourses(module.name);
            if (response.success) {
                setCourses(response.data);
            } else {
                setError('Error al cargar los cursos del modulo');
            }
        } catch (err) {
            setError('Error al cargar cursos');
            console.error('Error cargando cursos:', err);
        } finally {
            setLoading(false);
        }
    };


    const handleBackToModules = () => {
        setSelectedModule(null);
        setCourses([]);
    };

    const handleLogin = (userData) => {
        setUser(userData);
        localStorage.setItem('portal_user', JSON.stringify(userData));
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('portal_user');
        setSelectedModule(null);
        setCourses([]);
    };

    const triggerRefreshProgress = () => setRefreshFlag(flag => !flag);
    <StudentProgress
        user={user}
        refreshFlag={refreshFlag}
        triggerRefreshProgress={triggerRefreshProgress}
    />
    const handleCourseClick = (course) => {
    };




    const handleEnrollInCourse = async (course) => {
        if (!user) {
            alert('Debes iniciar sesión para acceder');
            return;
        }
        // Llama a la API de inscripción
        try {
            const response = await fetch(`http://localhost:3000/api/students/enroll/${course.id}`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer token_temp',
                    'user-id': user.id.toString(),
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            if (data.success) {
                triggerRefreshProgress();
                // Recarga los cursos del módulo actual
                if (selectedModule) {
                    const coursesResponse = await getCourses(selectedModule.name);
                    if (coursesResponse.success) {
                        setCourses(coursesResponse.data);
                    }
                }
                alert('¡Curso agregado a tu progreso!');
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('Error al inscribirse en el curso');
        }
    };


    if (loading && modules.length === 0) {
        return (
            <div className="app">
                <Header
                    user={user}
                    onLogin={handleLogin}
                    onLogout={handleLogout}
                />
                <LoadingSpinner message="Cargando portal musical..."/>
            </div>
        );
    }

    if (error) {
        return (
            <div className="app">
                <Header
                    user={user}
                    onLogin={handleLogin}
                    onLogout={handleLogout}
                />
                <div className="error-container">
                    <div className="error-content">
                        <h2>Oops!</h2>
                        <p>{error}</p>
                        <button onClick={loadModules} className="retry-button">
                            Reintentar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="app">
            <Header
                user={user}
                onLogin={handleLogin}
                onLogout={handleLogout}
            />

            <main className="main-content">
                {user && user.role === 'admin' ? (
                    // Vista de administrador
                    <AdminPanel user={user}/>
                ) : user && user.role === 'student' ? (
                    // Vista de estudiante - puede elegir ver progreso o explorar cursos
                    <div>
                        <StudentProgress user={user} refreshFlag={refreshProgressFlag}/>
                        <div style={{marginTop: '3rem', borderTop: '2px solid #ecf0f1', paddingTop: '3rem'}}>
                            <h2 style={{textAlign: 'center', marginBottom: '2rem', color: '#2c3e50'}}>
                                Explorar Mas Cursos
                            </h2>
                            {!selectedModule ? (
                                <div className="modules-grid">
                                    {modules.map(module => (
                                        <ModuleCard
                                            key={module.id}
                                            module={module}
                                            onClick={() => handleModuleClick(module)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="courses-section">
                                    <div className="courses-header">
                                        <button
                                            onClick={handleBackToModules}
                                            className="back-to-modules-btn">Volver a modulos
                                        </button>
                                        <h1 className="courses-title">
                                            {selectedModule.display_name}
                                        </h1>
                                        <p className="courses-description">
                                            {selectedModule.description}
                                        </p>
                                    </div>

                                    {loading ? (
                                        <LoadingSpinner message="Cargando cursos..."/>
                                    ) : (
                                        <div className="courses-grid">
                                            {courses.map(course => (
                                                <div
                                                    key={course.id}
                                                    className="course-card"
                                                    onClick={() => handleCourseClick(course)}
                                                >
                                                    <div className="course-header">
                                                        <h3 className="course-title">{course.title}</h3>
                                                        <span className={`course-level level-${course.level}`}>
                                                            {course.level}
                                                            </span>
                                                    </div>
                                                    <p className="course-description">
                                                        {course.description}
                                                    </p>
                                                    <div className="course-info">
                                                    <span className="course-duration">
                                                        Duracion: {course.duration_minutes} min
                                                    </span>
                                                        <span
                                                            className="course-instructor"> Instructor: {course.instructor_name}
                                                    </span>
                                                    </div>
                                                    <CourseEnrollment
                                                        course={course}
                                                        user={user}
                                                        onEnrollSuccess={async () => {
                                                            triggerRefreshProgress();
                                                            // Recarga los cursos del módulo actual
                                                            if (selectedModule) {
                                                                const coursesResponse = await getCourses(selectedModule.name);
                                                                if (coursesResponse.success) {
                                                                    setCourses(coursesResponse.data);
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    // Vista publica - sin usuario logueado
                    !selectedModule ? (
                        <div className="modules-section">
                            <div className="hero-section">
                                <h1 className="hero-title">
                                    Portal de Capacitaciones Musicales
                                </h1>
                                <p className="hero-subtitle">
                                    Descubre tu pasion musical y desarrolla tus habilidades
                                </p>
                            </div>

                            <div className="modules-grid">
                                {modules.map(module => (
                                    <ModuleCard
                                        key={module.id}
                                        module={module}
                                        onClick={() => handleModuleClick(module)}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="courses-section">
                            <div className="courses-header">
                                <button
                                    onClick={handleBackToModules}
                                    className="back-to-modules-btn">Volver a modulos >
                                </button>
                                <h1 className="courses-title">
                                    {selectedModule.display_name}
                                </h1>
                                <p className="courses-description">
                                    {selectedModule.description}
                                </p>
                            </div>

                            {loading ? (
                                <LoadingSpinner message="Cargando cursos..."/>
                            ) : (
                                <div className="courses-grid">
                                    {courses.map(course => (
                                        <div
                                            key={course.id}
                                            className="course-card"
                                            onClick={() => handleCourseClick(course)}
                                        >
                                            <div className="course-header">
                                                <h3 className="course-title">{course.title}</h3>
                                                <span className={`course-level level-${course.level}`}>
                          {course.level}
                        </span>
                                            </div>
                                            <p className="course-description">
                                                {course.description}
                                            </p>
                                            <div className="course-info">
                        <span className="course-duration">
                          Duracion: {course.duration_minutes} min
                        </span>
                                                <span className="course-instructor">
                          Instructor: {course.instructor_name}
                        </span>
                                            </div>
                                            <button
                                                className="course-start-button"
                                                onClick={() => {
                                                    if (!user) {
                                                        alert('Debes iniciar sesión para acceder');
                                                        return;
                                                    }
                                                }}
                                            >
                                                {user ? 'Comenzar curso' : 'Inicia sesión para acceder'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                )}
            </main>

        </div>
    );
}

export default App;