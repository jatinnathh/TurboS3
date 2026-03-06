import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getUserProfile } from '../../services/userService';
import type { Doctor, Patient, Management } from '../../types';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { user, userType, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Doctor | Patient | Management | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user && userType) {
        try {
          const profileData = await getUserProfile(user.uid, userType);
          setProfile(profileData as Doctor | Patient | Management | null);
        } catch (error) {
          console.error('Error fetching profile:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProfile();
  }, [user, userType]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const getUserTypeLabel = () => {
    switch (userType) {
      case 'doctor': return '👨‍⚕️ Doctor';
      case 'patient': return '🏥 Patient';
      case 'management': return '💼 Management';
      default: return 'User';
    }
  };

  const getUserTypeColor = () => {
    switch (userType) {
      case 'doctor': return '#4CAF50';
      case 'patient': return '#2196F3';
      case 'management': return '#FF9800';
      default: return '#667eea';
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Dashboard</h1>
          <span className="user-type-badge" style={{ backgroundColor: getUserTypeColor() }}>
            {getUserTypeLabel()}
          </span>
        </div>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
      
      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>Welcome, {profile?.name || 'User'}!</h2>
          <p>You're successfully logged in.</p>
        </div>

        <div className="profile-card">
          <h3>Profile Information</h3>
          <div className="profile-grid">
            <div className="profile-item">
              <strong>Email:</strong>
              <span>{user?.email}</span>
            </div>
            
            <div className="profile-item">
              <strong>Name:</strong>
              <span>{profile?.name || 'N/A'}</span>
            </div>

            {/* Doctor-specific fields */}
            {userType === 'doctor' && profile && 'doctorId' in profile && (
              <>
                <div className="profile-item">
                  <strong>Doctor ID:</strong>
                  <span>{profile.doctorId}</span>
                </div>
                <div className="profile-item">
                  <strong>Specialization:</strong>
                  <span>{profile.specialization || 'N/A'}</span>
                </div>
                <div className="profile-item">
                  <strong>Department:</strong>
                  <span>{profile.department || 'N/A'}</span>
                </div>
                <div className="profile-item">
                  <strong>Phone:</strong>
                  <span>{profile.phone || 'N/A'}</span>
                </div>
                <div className="profile-item">
                  <strong>Status:</strong>
                  <span className={`status-badge ${profile.status}`}>
                    {profile.status}
                  </span>
                </div>
              </>
            )}

            {/* Patient-specific fields */}
            {userType === 'patient' && profile && 'patientId' in profile && (
              <>
                <div className="profile-item">
                  <strong>Patient ID:</strong>
                  <span>{profile.patientId}</span>
                </div>
                <div className="profile-item">
                  <strong>Phone:</strong>
                  <span>{profile.phone || 'N/A'}</span>
                </div>
                <div className="profile-item">
                  <strong>Gender:</strong>
                  <span>{profile.gender || 'N/A'}</span>
                </div>
                <div className="profile-item">
                  <strong>Date of Birth:</strong>
                  <span>{profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="profile-item">
                  <strong>Address:</strong>
                  <span>{profile.address || 'N/A'}</span>
                </div>
                <div className="profile-item">
                  <strong>Emergency Contact:</strong>
                  <span>{profile.emergencyContact || 'N/A'}</span>
                </div>
              </>
            )}

            {/* Management-specific fields */}
            {userType === 'management' && profile && 'empId' in profile && (
              <>
                <div className="profile-item">
                  <strong>Employee ID:</strong>
                  <span>{profile.empId}</span>
                </div>
                <div className="profile-item">
                  <strong>Role:</strong>
                  <span>{profile.role || 'N/A'}</span>
                </div>
                <div className="profile-item">
                  <strong>Department:</strong>
                  <span>{profile.department || 'N/A'}</span>
                </div>
                <div className="profile-item">
                  <strong>Phone:</strong>
                  <span>{profile.phone || 'N/A'}</span>
                </div>
                <div className="profile-item">
                  <strong>Status:</strong>
                  <span className={`status-badge ${profile.status}`}>
                    {profile.status}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="info-card">
          <h3>Start Building</h3>
          <p>This is your {userType} dashboard. You can now add your application features here.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
