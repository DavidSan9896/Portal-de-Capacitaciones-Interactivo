import React from 'react';

const ModuleCard = ({ module, onClick }) => {
    return (
        <div
            className="module-card"
            onClick={onClick}
            style={{ "--module-color": module.color }}
        >
            <h3 className="module-title">{module.display_name}</h3>
            <p className="module-description">{module.description}</p>
            <div className="module-footer">
                <span>{module.course_count}cursos  </span>
                <span className="btn btn-accent">  Ver cursos</span>
            </div>
        </div>

    );
};

export default ModuleCard;