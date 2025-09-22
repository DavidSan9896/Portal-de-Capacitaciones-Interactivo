// Componente para inscribirse a cursos - Autor: David Santiago C M
import React, { useState } from 'react';
import './CourseEnrollemnt.css';


// Componente funcional que permite inscribirse y actualizar progreso en un curso
const CourseEnrollment = ({ course, user, onEnrollSuccess }) => {
    // Estado para mostrar si esta cargando
    const [loading, setLoading] = useState(false);
    // Estado para mostrar mensajes al usuario
    const [message, setMessage] = useState('');

    // Funcion para inscribirse al curso
    const handleEnroll = async () => {
        // Si el usuario no esta logueado, muestra mensaje
        if (!user || !user.id) {
            setMessage('Debes iniciar sesion para inscribirte');
            return;
        }

        setLoading(true);

        try {
            // Llama a la API para inscribir al usuario en el curso
            const response = await fetch(`http://localhost:3000/api/students/enroll/${course.id}`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer token_temp',
                    'user-id': user.id.toString(),
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            // Si la inscripcion fue exitosa, muestra mensaje y ejecuta callback
            if (data.success) {
                setMessage(data.message);
                if (onEnrollSuccess) {
                    onEnrollSuccess(course.id);
                }
            } else {
                setMessage(data.message);
            }
        } catch (error) {
            // Si hay error, muestra mensaje de error
            setMessage('Error al inscribirse en el curso');
            console.error('Error en inscripcion:', error);
        } finally {
            setLoading(false);
        }
    };

    // Funcion para actualizar el progreso del curso
    const handleUpdateProgress = async (newProgress) => {
        // Si el usuario no esta logueado, no hace nada
        if (!user || !user.id) return;

        try {
            // Llama a la API para actualizar el progreso
            const response = await fetch(`http://localhost:3000/api/students/progress/${course.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': 'Bearer token_temp',
                    'user-id': user.id.toString(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    progress_percentage: newProgress,
                    notes: `Progreso actualizado a ${newProgress}%`
                })
            });

            const data = await response.json();

            // Si la actualizacion fue exitosa, muestra mensaje y ejecuta callback
            if (data.success) {
                setMessage(data.message);
                if (onEnrollSuccess) {
                    onEnrollSuccess(course.id);
                }
            } else {
                setMessage(data.message);
            }
        } catch (error) {
            // Si hay error, muestra mensaje de error
            setMessage('Error al actualizar progreso');
            console.error('Error actualizando progreso:', error);
        }
    };

    // Renderiza el componente
    return (
        <div className="course-enrollment">
            {/* Muestra mensaje si existe */}
            {message && (
                <div className={`enrollment-message ${message.includes('exitosamente') ? 'success' : 'error'}`}>
                    {message}
                </div>
            )}

            {/* Si el usuario ya esta inscrito, muestra botones de progreso */}
            {course.is_enrolled ? (
                <div className="enrolled-actions">
                    <div className="progress-controls">
                        <span>Progreso actual: {course.progress_percentage || 0}%</span>
                        <div className="progress-buttons">
                            {[25, 50, 75, 100].map(p => (
                                <button
                                    key={p}
                                    onClick={() => handleUpdateProgress(p)}
                                    disabled={loading}
                                    className={`progress-btn ${p === 100 ? 'complete' : ''}`}
                                >
                                    {p === 100 ? 'Completar' : `${p}%`}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                // Si no esta inscrito, muestra boton para inscribirse
                <button onClick={handleEnroll} disabled={loading} className="btn btn-accent">
                    {loading ? 'Inscribiendo...' : 'Inscribirse al Curso'}
                </button>
            )}
        </div>
    );
};

export default CourseEnrollment;