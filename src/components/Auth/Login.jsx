// Componente de login para acceder a la aplicacion
// Autor: David Santigo Cubillos M.

import React, { useState } from 'react';
import './Login.css';
import { login } from '../../services/api';

const Login = ({ onLoginSuccess }) => {
    // Estado para los datos del formulario
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    // Estado para mostrar si esta cargando
    const [loading, setLoading] = useState(false);
    // Estado para mostrar errores
    const [error, setError] = useState('');

    // Funcion que se ejecuta al enviar el formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Llama a la funcion login con los datos del usuario
            const response = await login(formData.username, formData.password);
            if (response.success) {
                // Guarda datos en localStorage si el login es exitoso
                localStorage.setItem('user', JSON.stringify(response.user));
                localStorage.setItem('userId', response.user.id);
                localStorage.setItem('token', response.token);
                onLoginSuccess(response.user);
            } else {
                // Muestra mensaje de error si el login falla
                setError(response.message);
            }
        } catch (err) {
            // Muestra mensaje si hay error de conexion
            setError('Error de conexion. Intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    // Funcion para actualizar los datos del formulario
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h2>Iniciar Sesion</h2>
                    <p>Accede a tus cursos musicales</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="username">Usuario</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            placeholder="Ingresa tu usuario"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Contrasena</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="Ingresa tu contrasena"
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading ? 'Iniciando sesion...' : 'Iniciar Sesion'}
                    </button>
                </form>

                <div className="login-footer">
                    <p>¿No tienes cuenta? <span className="signup-link">Registrate aqui</span></p>
                </div>
            </div>
        </div>
    );
};

export default Login;