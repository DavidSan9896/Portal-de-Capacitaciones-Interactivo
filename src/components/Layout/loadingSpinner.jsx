import React from 'react';

const LoadingSpinner = ({ message = 'Cargando...' }) => {
    return (
        <div className="loading-spinner-container">
            <div className="loading-spinner"></div>
            <p className="loading-spinner-message">{message}</p>
        </div>
    );
};

export default LoadingSpinner;