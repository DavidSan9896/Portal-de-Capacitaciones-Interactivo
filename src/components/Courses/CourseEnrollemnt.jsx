// Componente para inscribirse a cursos
import React, { useState } from 'react';
import './CourseEnrollemnt.css';


const CourseEnrollment = ({ course, user, onEnrollSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleEnroll = async () => {
        if (!user || !user.id) {
            setMessage('Debes iniciar sesion para inscribirte');
            return;
        }

        setLoading(true);


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
                setMessage(data.message);
                if (onEnrollSuccess) {
                    onEnrollSuccess(course.id);
                }
            } else {
                setMessage(data.message);
            }
        } catch (error) {
            setMessage('Error al inscribirse en el curso');
            console.error('Error en inscripcion:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProgress = async (newProgress) => {
        if (!user || !user.id) return;

        try {
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

            if (data.success) {
                setMessage(data.message);
                if (onEnrollSuccess) {
                    onEnrollSuccess(course.id);
                }
            } else {
                setMessage(data.message);
            }
        } catch (error) {
            setMessage('Error al actualizar progreso');
            console.error('Error actualizando progreso:', error);
        }
    };

    return (
        <div className="course-enrollment">
            {message && (
                <div className={`enrollment-message ${message.includes('exitosamente') ? 'success' : 'error'}`}>
                    {message}
                </div>
            )}

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
                <button onClick={handleEnroll} disabled={loading} className="btn btn-accent">
                    {loading ? 'Inscribiendo...' : 'Inscribirse al Curso'}
                </button>
            )}
        </div>
    );
};

export default CourseEnrollment;