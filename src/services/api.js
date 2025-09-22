// Servicio para conectar con el backend de la app
// Autor: David Santiago Cubillos M.

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const apiRequest = async (endpoint, options = {}) => {
    try {
        const url = `${API_BASE_URL}${endpoint}`;
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {}),
            },
            ...options,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
};

export const getModules = async () => apiRequest('/modules');

export const getCourses = async (module = null, level = null, search = null) => {
    const params = new URLSearchParams();
    if (module) params.append('module', module);
    if (level) params.append('level', level);
    if (search) params.append('search', search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/courses${query}`);
};

export const getCourse = async (id) => apiRequest(`/courses/${id}`);

export const getStats = async () => apiRequest('/stats');

export const login = async (username, password) =>
    apiRequest('/auth/login', {method: 'POST', body: JSON.stringify({username, password})});

export const register = async (userData) =>
    apiRequest('/auth/register', {method: 'POST', body: JSON.stringify(userData)});

export const verifyToken = async (token) =>
    apiRequest('/auth/verify', {headers: {Authorization: `Bearer ${token}`}});

export const forgotPassword = async (email) =>
    apiRequest('/auth/forgot-password', {method: 'POST', body: JSON.stringify({email})});

export const resetPassword = async (token, newPassword) =>
    apiRequest('/auth/reset-password', {method: 'POST', body: JSON.stringify({token, newPassword})});

export const getUserProgress = async () => apiRequest('/user/progress');
