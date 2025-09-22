// Servicio para conectar con el backend de la app
// Autor: David Santiago Cubillos M.

const API_BASE_URL = 'http://localhost:3000/api';

// Funcion para hacer peticiones a la API
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

        // Si la respuesta no es exitosa, lanza error
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Devuelve la data en formato JSON
        const data = await response.json();
        return data;
    } catch (error) {
        // Muestra el error en consola
        console.error('API Request Error:', error);
        throw error;
    }
};

// Trae todos los modulos musicales
export const getModules = async () => {
    return await apiRequest('/modules');
};

// Trae cursos, se puede filtrar por modulo, nivel o buscar
export const getCourses = async (module = null, level = null, search = null) => {
    const params = new URLSearchParams();
    if (module) params.append('module', module);
    if (level) params.append('level', level);
    if (search) params.append('search', search);

    const query = params.toString() ? `?${params.toString()}` : '';
    return await apiRequest(`/courses${query}`);
};

// Trae un curso especifico por id
export const getCourse = async (id) => {
    return await apiRequest(`/courses/${id}`);
};

// Trae estadisticas generales
export const getStats = async () => {
    return await apiRequest('/stats');
};

// Login de usuario, consulta a la base de datos
export const login = async (username, password) => {
    return await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    });
};

// Registro de nuevos usuarios
export const register = async (userData) => {
    return await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
    });
};

// Verifica si el token es valido
export const verifyToken = async (token) => {
    return await apiRequest('/auth/verify', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
};

// Recupera la contrasena si la olvidaste
export const forgotPassword = async (email) => {
    return await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
};

// Cambia la contrasena usando un token (Pendiente por verificar )
export const resetPassword = async (token, newPassword) => {
    return await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
    });
};

// Trae el progreso del usuario
export const getUserProgress = async () => {
    return await apiRequest('/user/progress');
};