import React from 'react';
import { useNavigate } from 'react-router-dom';
import './QuickActions.css';

interface QuickAction {
  iconClass: string;
  title: string;
  description: string;
  path: string;
  color: string;
}

const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const actions: QuickAction[] = [
    {
      iconClass: 'fas fa-microscope',
      title: 'Cancer Classification',
      description: 'Upload and classify medical images',
      path: '/classification',
      color: '#667eea'
    },
    {
      iconClass: 'fas fa-history',
      title: 'Classification History',
      description: 'View your past classification results',
      path: '/classification-history',
      color: '#764ba2'
    },
    {
      iconClass: 'fas fa-calendar-check',
      title: 'Appointments',
      description: 'View and manage appointments',
      path: '/booked-appointments',
      color: '#f093fb'
    }
  ];

  return (
    <div className="quick-actions">
      <h2>Quick Actions</h2>
      <div className="actions-grid">
        {actions.map((action) => (
          <div
            key={action.path}
            className="action-card"
            onClick={() => navigate(action.path)}
            style={{ borderColor: action.color }}
          >
            <div className="action-icon" style={{ color: action.color }}>
              <i className={action.iconClass}></i>
            </div>
            <h3>{action.title}</h3>
            <p>{action.description}</p>
            <button 
              className="action-btn" 
              style={{ backgroundColor: action.color }}
            >
              <span>Go</span> <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
