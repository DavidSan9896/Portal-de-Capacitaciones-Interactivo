// Componente para mostrar un spinner de carga
// Autor: David Santigo Cubillos M.

import React from 'react';
import './LoadingSpinner.css';

// Recibe un mensaje opcional para mostrar mientras carga
const LoadingSpinner = ({ message = 'Cargando...' }) => {
    return (
        <div className="loading-spinner-container">
            {/* Spinner animado */}
            <div className="loading-spinner"></div>
            {/* Mensaje de carga */}
            <p className="loading-spinner-message">{message}</p>
        </div>
    );
};

export default LoadingSpinner;