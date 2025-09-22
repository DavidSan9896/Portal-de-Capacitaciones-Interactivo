// Servicio de api para conectar con backend
const API_BASE_URL = 'http://localhost:3000/api';

// Funcion helper para hacer requests
const apiRequest = async (endpoint, options = {}) => {
    try {
        const url = `${API_BASE_URL}${endpoint}`;
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
};

// Obtener todos los modulos musicales
export const getModules = async () => {
    return await apiRequest('/modules');
};

// Obtener cursos (todos o filtrados por modulo)
export const getCourses = async (module = null, level = null, search = null) => {
    const params = new URLSearchParams();
    if (module) params.append('module', module);
    if (level) params.append('level', level);
    if (search) params.append('search', search);

    const query = params.toString() ? `?${params.toString()}` : '';
    return await apiRequest(`/courses${query}`);
};

// Obtener un curso especifico por id
export const getCourse = async (id) => {
    return await apiRequest(`/courses/${id}`);
};

// Obtener estadisticas generales
export const getStats = async () => {
    return await apiRequest('/stats');
};

// Auth - login real con base de datos
export const login = async (username, password) => {
    return await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    });
};

// Auth - registro de nuevos usuarios
export const register = async (userData) => {
    return await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
    });
};

// Auth - verificar token existente
export const verifyToken = async (token) => {
    return await apiRequest('/auth/verify', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
};

// Auth - recuperacion de contraseña
export const forgotPassword = async (email) => {
    return await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
};

// Auth - resetear contraseña con token
export const resetPassword = async (token, newPassword) => {
    return await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
    });
};

// Obtener progreso del usuario
export const getUserProgress = async () => {
    return await apiRequest('/user/progress');
};