// Componente para mostrar una tarjeta de modulo
// Autor: David Santigo Cubillos M.

import React from 'react';
import './ModuleCard.css';

// Recibe un objeto modulo y una funcion onClick como props
const ModuleCard = ({ module, onClick }) => {
    return (
        // Contenedor principal de la tarjeta
        <div
            className="module-card"
            onClick={onClick} // Maneja el click en la tarjeta
            style={{ "--module-color": module.color }} // Color personalizado
        >
            {/* Titulo del modulo */}
            <h3 className="module-title">{module.display_name}</h3>
            {/* Descripcion del modulo */}
            <p className="module-description">{module.description}</p>
            {/* Pie de la tarjeta con cantidad de cursos y boton */}
            <div className="module-footer">
                <span>{module.course_count}cursos  </span>
                <span className="btn btn-accent">  Ver cursos</span>
            </div>
        </div>
    );
};

export default ModuleCard;