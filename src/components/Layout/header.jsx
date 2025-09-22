// Header con autenticacion real y recuperacion de contraseña
import React, { useState } from 'react';
import { login, register, forgotPassword } from '../../services/api';

const Header = ({ user, onLogin, onLogout }) => {
    const [showLoginMenu, setShowLoginMenu] = useState(false);
    const [loginForm, setLoginForm] = useState({
        username: '',
        password: ''
    });
    const [registerForm, setRegisterForm] = useState({
        username: '',
        email: '',
        password: '',
        full_name: ''
    });
    const [loginError, setLoginError] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('login'); // 'login', 'register', 'forgot'
    const [message, setMessage] = useState('');

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

    const handleLogout = () => {
        if (window.confirm('¿Estas seguro que deseas cerrar sesion?')) {
            localStorage.removeItem('token');
            onLogout();
        }
    };

    const handleInputChange = (e, form) => {
        const { name, value } = e.target;
        if (form === 'login') {
            setLoginForm(prev => ({ ...prev, [name]: value }));
        } else {
            setRegisterForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const resetForms = () => {
        setLoginForm({ username: '', password: '' });
        setRegisterForm({ username: '', email: '', password: '', full_name: '' });
        setLoginError('');
        setMessage('');
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        resetForms();
    };

    return (
        <header className="header">
            <div className="header-container">
                <h1 className="header-title">Academia Musical</h1>
                <nav className="header-nav">
                    {user ? (
                        <div className="user-info">
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
                            <button className="login-btn" onClick={() => { setShowLoginMenu(!showLoginMenu); resetForms(); }}>
                                Iniciar Sesion
                            </button>
                            {showLoginMenu && (
                                <div className="login-menu">
                                    <div className="login-tabs">
                                        <button className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`} onClick={() => handleTabChange('login')}>Iniciar Sesion</button>
                                        <button className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`} onClick={() => handleTabChange('register')}>Registrarse</button>
                                    </div>
                                    {loginError && <div className="login-error">{loginError}</div>}
                                    {message && <div className="login-message">{message}</div>}
                                    {activeTab === 'login' && (
                                        <form className="login-form" onSubmit={handleLogin}>
                                            <input className="input" type="text" name="username" placeholder="Usuario o Email" value={loginForm.username} onChange={(e) => handleInputChange(e, 'login')} required disabled={loading} />
                                            <input className="input" type="password" name="password" placeholder="Contraseña" value={loginForm.password} onChange={(e) => handleInputChange(e, 'login')} required disabled={loading} />
                                            <button className="submit-btn" type="submit" disabled={loading}>{loading ? 'Iniciando...' : 'Entrar'}</button>
                                            <button className="forgot-btn" type="button" onClick={() => handleTabChange('forgot')}>¿Olvidaste tu contraseña?</button>
                                        </form>
                                    )}
                                    {activeTab === 'register' && (
                                        <form className="register-form" onSubmit={handleRegister}>
                                            <input className="input" type="text" name="full_name" placeholder="Nombre Completo" value={registerForm.full_name} onChange={(e) => handleInputChange(e, 'register')} required disabled={loading} />
                                            <input className="input" type="text" name="username" placeholder="Usuario" value={registerForm.username} onChange={(e) => handleInputChange(e, 'register')} required disabled={loading} />
                                            <input className="input" type="email" name="email" placeholder="Email" value={registerForm.email} onChange={(e) => handleInputChange(e, 'register')} required disabled={loading} />
                                            <input className="input" type="password" name="password" placeholder="Contraseña (min. 6 caracteres)" value={registerForm.password} onChange={(e) => handleInputChange(e, 'register')} required disabled={loading} minLength="6" />
                                            <button className="submit-btn" type="submit" disabled={loading}>{loading ? 'Registrando...' : 'Crear Cuenta'}</button>
                                        </form>
                                    )}
                                    {activeTab === 'forgot' && (
                                        <form className="forgot-form" onSubmit={handleForgotPassword}>
                                            <h4 className="forgot-title">Recuperar Contraseña</h4>
                                            <p className="forgot-desc">Ingresa tu usuario o email para recibir instrucciones de recuperacion.</p>
                                            <input className="input" type="text" name="username" placeholder="Usuario o Email" value={loginForm.username} onChange={(e) => handleInputChange(e, 'login')} required disabled={loading} />
                                            <button className="submit-btn" type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Enviar Enlace'}</button>
                                            <button className="forgot-btn" type="button" onClick={() => handleTabChange('login')}>Volver al login</button>
                                        </form>
                                    )}
                                    {activeTab === 'login' && (
                                        <div className="test-users">
                                            <strong>Usuarios de prueba:</strong><br />
                                            Admin: admin / password<br />
                                            Estudiante: estudiante / password
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