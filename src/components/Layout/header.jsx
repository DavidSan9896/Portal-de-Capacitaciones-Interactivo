// Header con autenticacion real y recuperacion de contrasena
// Autor: David Cubillos M.

import React, { useState } from 'react';
import './Header.css';
import { login, register, forgotPassword } from '../../services/api';

// Componente principal Header
const Header = ({ user, onLogin, onLogout }) => {
    // Estado para mostrar u ocultar el menu de login
    const [showLoginMenu, setShowLoginMenu] = useState(false);
    // Estado para los datos del formulario de login
    const [loginForm, setLoginForm] = useState({
        username: '',
        password: ''
    });
    // Estado para los datos del formulario de registro
    const [registerForm, setRegisterForm] = useState({
        username: '',
        email: '',
        password: '',
        full_name: ''
    });
    // Estado para mostrar errores de login o registro
    const [loginError, setLoginError] = useState('');
    // Estado para mostrar si esta cargando
    const [loading, setLoading] = useState(false);
    // Estado para saber que tab esta activo: login, register o forgot
    const [activeTab, setActiveTab] = useState('login');
    // Estado para mostrar mensajes informativos
    const [message, setMessage] = useState('');

    // Maneja el login del usuario
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        setLoading(true);

        try {
            const response = await login(loginForm.username, loginForm.password);

            if (response.success) {
                onLogin(response.user);
                localStorage.setItem('token', response.token);
                setShowLoginMenu(false);
                setLoginForm({ username: '', password: '' });
                setMessage('');
            } else {
                setLoginError(response.message);
            }
        } catch (error) {
            setLoginError('Error de conexion. Intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    // Maneja el registro de un nuevo usuario
    const handleRegister = async (e) => {
        e.preventDefault();
        setLoginError('');
        setLoading(true);

        try {
            const response = await register(registerForm);

            if (response.success) {
                onLogin(response.user);
                localStorage.setItem('token', response.token);
                setShowLoginMenu(false);
                setRegisterForm({ username: '', email: '', password: '', full_name: '' });
                setMessage('');
            } else {
                setLoginError(response.message);
            }
        } catch (error) {
            setLoginError('Error de conexion. Intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    // Maneja la recuperacion de contrasena
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setLoginError('');
        setLoading(true);

        try {
            const response = await forgotPassword(loginForm.username);

            if (response.success) {
                setMessage('Se ha enviado un enlace de recuperacion al email asociado a tu cuenta.');
                setActiveTab('login');
            } else {
                setLoginError(response.message);
            }
        } catch (error) {
            setLoginError('Error de conexion. Intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    // Maneja el cierre de sesion
    const handleLogout = () => {
        if (window.confirm('Estas seguro que deseas cerrar sesion?')) {
            localStorage.removeItem('token');
            onLogout();
        }
    };

    // Maneja los cambios en los inputs de los formularios
    const handleInputChange = (e, form) => {
        const { name, value } = e.target;
        if (form === 'login') {
            setLoginForm(prev => ({ ...prev, [name]: value }));
        } else {
            setRegisterForm(prev => ({ ...prev, [name]: value }));
        }
    };

    // Resetea los formularios y mensajes
    const resetForms = () => {
        setLoginForm({ username: '', password: '' });
        setRegisterForm({ username: '', email: '', password: '', full_name: '' });
        setLoginError('');
        setMessage('');
    };

    // Cambia de tab (login, register, forgot)
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        resetForms();
    };

    // Render del componente
    return (
        <header className="header">
            <div className="header-container">
                <h1 className="header-title">Academia Musical</h1>
                <nav className="header-nav">
                    {user ? (
                        <div className="user-info">
                        {/* Muestra el rol y nombre del usuario */}
                        <span className={`user-role ${user.role}`}>{user.role === 'admin' ? 'Admin' : 'Estudiante'}: {user.full_name}
                            {user.role === 'admin' && (
                                <span className="admin-badge">Admin</span>
                            )}
                        </span>
                            <button className="logout-btn" onClick={handleLogout}>
                                Cerrar Sesion
                            </button>
                        </div>
                    ) : (
                        <div>
                            {/* Boton para mostrar el menu de login */}
                            <button className="login-btn" onClick={() => { setShowLoginMenu(!showLoginMenu); resetForms(); }}>
                                Iniciar Sesion
                            </button>
                            {showLoginMenu && (
                                <div className="login-menu">
                                    <div className="login-tabs">
                                        {/* Tabs para cambiar entre login y registro */}
                                        <button className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`} onClick={() => handleTabChange('login')}>Iniciar Sesion</button>
                                        <button className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`} onClick={() => handleTabChange('register')}>Registrarse</button>
                                    </div>
                                    {/* Muestra errores o mensajes */}
                                    {loginError && <div className="login-error">{loginError}</div>}
                                    {message && <div className="login-message">{message}</div>}
                                    {/* Formulario de login */}
                                    {activeTab === 'login' && (
                                        <form className="login-form" onSubmit={handleLogin}>
                                            <input className="input" type="text" name="username" placeholder="Usuario o Email" value={loginForm.username} onChange={(e) => handleInputChange(e, 'login')} required disabled={loading} />
                                            <input className="input" type="password" name="password" placeholder="Contrasena" value={loginForm.password} onChange={(e) => handleInputChange(e, 'login')} required disabled={loading} />
                                            <button className="submit-btn" type="submit" disabled={loading}>{loading ? 'Iniciando...' : 'Entrar'}</button>
                                            <button className="forgot-btn" type="button" onClick={() => handleTabChange('forgot')}>Olvidaste tu contrasena?</button>
                                        </form>
                                    )}
                                    {/* Formulario de registro */}
                                    {activeTab === 'register' && (
                                        <form className="register-form" onSubmit={handleRegister}>
                                            <input className="input" type="text" name="full_name" placeholder="Nombre Completo" value={registerForm.full_name} onChange={(e) => handleInputChange(e, 'register')} required disabled={loading} />
                                            <input className="input" type="text" name="username" placeholder="Usuario" value={registerForm.username} onChange={(e) => handleInputChange(e, 'register')} required disabled={loading} />
                                            <input className="input" type="email" name="email" placeholder="Email" value={registerForm.email} onChange={(e) => handleInputChange(e, 'register')} required disabled={loading} />
                                            <input className="input" type="password" name="password" placeholder="Contrasena (min. 6 caracteres)" value={registerForm.password} onChange={(e) => handleInputChange(e, 'register')} required disabled={loading} minLength="6" />
                                            <button className="submit-btn" type="submit" disabled={loading}>{loading ? 'Registrando...' : 'Crear Cuenta'}</button>
                                        </form>
                                    )}
                                    {/* Formulario para recuperar contrasena */}
                                    {activeTab === 'forgot' && (
                                        <form className="forgot-form" onSubmit={handleForgotPassword}>
                                            <h4 className="forgot-title">Recuperar Contrasena</h4>
                                            <p className="forgot-desc">Ingresa tu usuario o email para recibir instrucciones de recuperacion.</p>
                                            <input className="input" type="text" name="username" placeholder="Usuario o Email" value={loginForm.username} onChange={(e) => handleInputChange(e, 'login')} required disabled={loading} />
                                            <button className="submit-btn" type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Enviar Enlace'}</button>
                                            <button className="forgot-btn" type="button" onClick={() => handleTabChange('login')}>Volver al login</button>
                                        </form>
                                    )}
                                    {/* Usuarios de prueba para facilitar el acceso */}
                                    {activeTab === 'login' && (
                                        <div className="test-users">
                                            <strong>Usuarios de prueba:</strong><br />
                                            Admin: admin / Admi12345d <br />
                                            Usuario: ana.rodriguez / 1234userC
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Header;