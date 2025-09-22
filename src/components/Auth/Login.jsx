import React, { useState } from 'react';
import './Login.css';
import { login } from '../../services/api';

const Login = ({ onLoginSuccess }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await login(formData.username, formData.password);
            if (response.success) {
                localStorage.setItem('user', JSON.stringify(response.user));
                localStorage.setItem('userId', response.user.id);
                localStorage.setItem('token', response.token);
                onLoginSuccess(response.user);
            } else {
                setError(response.message);
            }
        } catch (err) {
            setError('Error de conexion. Intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

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
                        <label htmlFor="password">Contraseña</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="Ingresa tu contraseña"
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