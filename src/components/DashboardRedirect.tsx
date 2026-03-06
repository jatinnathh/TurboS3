import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DashboardRedirect: React.FC = () => {
  const { userType, loading } = useAuth();

  if (loading) {
    return <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      fontSize: '18px',
      color: '#667eea'
    }}>Loading...</div>;
  }

  // Redirect based on user type
  if (userType === 'doctor') {
    return <Navigate to="/doctor-dashboard" replace />;
  } else if (userType === 'patient') {
    return <Navigate to="/patient-dashboard" replace />;
  }

  // If no user type (shouldn't happen), go to login
  return <Navigate to="/login" replace />;
};

export default DashboardRedirect;

