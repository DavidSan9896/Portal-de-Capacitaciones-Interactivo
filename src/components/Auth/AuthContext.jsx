// AuthContext.jsx
// Autor: David Santiago Cubillos M.

// Importa React y hooks necesarios
import React, { createContext, useContext, useState, useEffect } from 'react';
// Importa estilos para el contexto de autenticacion
import './AuthContext.css';

// Crea el contexto de autenticacion
const AuthContext = createContext();

// Hook personalizado para usar el contexto de autenticacion
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        // Lanza error si el hook se usa fuera del proveedor
        throw new Error('useAuth debe usarse dentro de AuthProvider');
    }
    return context;
};

// Proveedor de autenticacion que envuelve la app
export const AuthProvider = ({ children }) => {
    // Estado para el usuario autenticado
    const [user, setUser] = useState(null);
    // Estado para saber si esta cargando la info
    const [loading, setLoading] = useState(true);

    // Efecto para verificar usuario guardado al iniciar :)
    useEffect(() => {
        // Obtiene usuario y token de localStorage
        const savedUser = localStorage.getItem('user');
        const savedToken = localStorage.getItem('token');

        if (savedUser && savedToken) {
            try {
                // Si hay datos, los parsea y setea el usuario
                setUser(JSON.parse(savedUser));
            } catch (err) {
                // Si hay error, limpia el localStorage
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
        }
        // Termina la carga
        setLoading(false);
    }, []);

    // Funcion para iniciar sesion
    const login = (userData) => {
        setUser(userData);
    };

    // Funcion para cerrar sesion
    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    // Valores que se comparten en el contexto
    const value = {
        user,
        login,
        logout,
        isAuthenticated: !!user
    };

    // Muestra pantalla de carga si esta cargando y si carga
    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p className="loading-message">Cargando...</p>
            </div>
        );
    }

    // Retorna el proveedor con los valores y los hijos,  correcta
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};