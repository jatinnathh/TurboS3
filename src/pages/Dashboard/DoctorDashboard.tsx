import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getUserProfile } from '../../services/userService';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import type { Doctor } from '../../types';
import './Dashboard.css';
import { getDoctorAppointments } from '../../services/appointmentService';

interface Appointment {
  id: string;
  amount: number;
  appointmentDate: Timestamp;
  createdAt: Timestamp;
  doctorEmail: string;
  doctorId: string;
  doctorName: string;
  patientEmail: string;
  patientId: string;
  patientName: string;
  paymentStatus: string;
  status: string;
  timeSlot: string;
  updatedAt: Timestamp;
}

interface PatientProfile {
  userId: string;
  name: string;
  email: string;
  age?: string;
  gender?: string;
  phone?: string;
  bloodGroup?: string;
  [key: string]: any;
}

// Helper function to parse time slot and get start time for sorting
const parseTimeSlot = (timeSlot: string): number => {
  const [start] = timeSlot.split('-');
  return parseInt(start);
};

// Helper function to format time slot
const formatTimeSlot = (timeSlot: string): string => {
  const [start, end] = timeSlot.split('-');
  const startHour = parseInt(start);
  const endHour = parseInt(end);
  
  const formatHour = (hour: number) => {
    if (hour === 0) return '12:00 AM';
    if (hour === 12) return '12:00 PM';
    if (hour > 12) return `${hour - 12}:00 PM`;
    return `${hour}:00 AM`;
  };
  
  return `${formatHour(startHour)} - ${formatHour(endHour)}`;
};

const DoctorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          const profileData = await getUserProfile(user.uid, 'doctor');
          setProfile(profileData as Doctor);

          if (profileData) {
            const doctorAppts = await getDoctorAppointments((profileData as Doctor).doctorId);
            setAppointments(doctorAppts);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!profile?.doctorId) return;
      setLoadingAppointments(true);
      try {
        const allAppointments = await getDoctorAppointments(profile.doctorId);

        const scheduledAppointments = allAppointments.filter(
          (appt) => appt.status === 'scheduled'
        );

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayAppts = scheduledAppointments.filter((appt) => {
          const apptDate = appt.appointmentDate.toDate();
          return apptDate.toDateString() === today.toDateString();
        });

        const upcomingAppts = scheduledAppointments.filter((appt) => {
          const apptDate = appt.appointmentDate.toDate();
          return apptDate > today;
        });

        todayAppts.sort((a, b) => parseTimeSlot(a.timeSlot) - parseTimeSlot(b.timeSlot));
        upcomingAppts.sort((a, b) => {
          const dateCompare = a.appointmentDate.toMillis() - b.appointmentDate.toMillis();
          if (dateCompare !== 0) return dateCompare;
          return parseTimeSlot(a.timeSlot) - parseTimeSlot(b.timeSlot);
        });

        setTodayAppointments(todayAppts);
        setUpcomingAppointments(upcomingAppts.slice(0, 5));
      } catch (err) {
        console.error('Error fetching doctor appointments:', err);
      } finally {
        setLoadingAppointments(false);
      }
    };

    fetchAppointments();
  }, [profile]);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const handleJoinCall = (appointmentId: string) => {
    navigate(`/video-call/${appointmentId}`);
  };

  // Function to fetch patient profile from Firestore
  const fetchPatientProfile = async (patientId: string): Promise<PatientProfile | null> => {
    try {
      const patientsQuery = query(
        collection(db, 'users'),
        where('userId', '==', patientId),
        where('role', '==', 'patient')
      );
      
      const querySnapshot = await getDocs(patientsQuery);
      
      if (!querySnapshot.empty) {
        const patientDoc = querySnapshot.docs[0];
        return patientDoc.data() as PatientProfile;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching patient profile:', error);
      return null;
    }
  };

  // Handler for appointment card click - navigates to prescription page
  const handleAppointmentClick = async (appointment: Appointment) => {
    try {
      // Show loading state (optional)
      console.log('Fetching patient data for:', appointment.patientId);
      
      // Fetch complete patient profile
      const patientProfile = await fetchPatientProfile(appointment.patientId);
      
      if (patientProfile) {
        // Navigate with complete patient data
        navigate('/doctor/prescription', {
          state: {
            id: patientProfile.userId || appointment.patientId,
            name: patientProfile.name || appointment.patientName,
            age: patientProfile.age || 'N/A',
            gender: patientProfile.gender || 'N/A',
            email: patientProfile.email || appointment.patientEmail,
            phone: patientProfile.phone || 'N/A',
            bloodGroup: patientProfile.bloodGroup || 'N/A',
            // Include appointment details for reference
            appointmentId: appointment.id,
            appointmentDate: appointment.appointmentDate.toDate().toLocaleDateString(),
            timeSlot: appointment.timeSlot
          }
        });
      } else {
        // Fallback: Navigate with appointment data only
        console.warn('Patient profile not found, using appointment data');
        navigate('/doctor/prescription', {
          state: {
            id: appointment.patientId,
            name: appointment.patientName,
            age: 'N/A',
            gender: 'N/A',
            email: appointment.patientEmail,
            appointmentId: appointment.id,
            appointmentDate: appointment.appointmentDate.toDate().toLocaleDateString(),
            timeSlot: appointment.timeSlot
          }
        });
      }
    } catch (error) {
      console.error('Error handling appointment click:', error);
      // Fallback navigation in case of error
      navigate('/doctor/prescription', {
        state: {
          id: appointment.patientId,
          name: appointment.patientName,
          age: 'N/A',
          gender: 'N/A',
          email: appointment.patientEmail
        }
      });
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  const mainLayoutClass = `dashboard-main-layout ${isSidebarOpen ? '' : 'sidebar-collapsed'}`;
  const firstName = profile?.name ? profile.name.split(' ')[0] : 'Doctor';

  // Doctor info object for use in other contexts/components
  const doctorInfo = {
    doctorId: profile?.doctorId,
    doctorName: profile?.name,
    specialty: profile?.specialization,
    email: user?.email,
    department: profile?.department,
    phone: profile?.phone
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Doctor Dashboard</h1>
          <span className="user-type-badge" style={{ backgroundColor: '#4CAF50' }}>
            <i className="fas fa-user-md"></i> Doctor
          </span>
        </div>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
      
      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>Welcome, {profile?.name || 'Doctor'}!</h2>
          <p>Manage your appointments and patient consultations.</p>
        </div>

        {/* Stats Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          <div className="stat-card" style={{ padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '12px', border: '1px solid #90caf9' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, color: '#1565c0', fontSize: '14px', fontWeight: '500' }}>Today's Appointments</p>
                <h2 style={{ margin: '8px 0 0 0', color: '#0d47a1', fontSize: '32px' }}>{todayAppointments.length}</h2>
              </div>
              <i className="fas fa-calendar-day" style={{ fontSize: '32px', color: '#42a5f5' }}></i>
            </div>
          </div>

          <div className="stat-card" style={{ padding: '20px', backgroundColor: '#f3e5f5', borderRadius: '12px', border: '1px solid #ce93d8' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, color: '#6a1b9a', fontSize: '14px', fontWeight: '500' }}>Upcoming Appointments</p>
                <h2 style={{ margin: '8px 0 0 0', color: '#4a148c', fontSize: '32px' }}>{upcomingAppointments.length}</h2>
              </div>
              <i className="fas fa-clock" style={{ fontSize: '32px', color: '#ab47bc' }}></i>
            </div>
          </div>

          <div className="stat-card" style={{ padding: '20px', backgroundColor: '#e8f5e9', borderRadius: '12px', border: '1px solid #81c784' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, color: '#2e7d32', fontSize: '14px', fontWeight: '500' }}>Specialization</p>
                <h3 style={{ margin: '8px 0 0 0', color: '#1b5e20', fontSize: '18px' }}>{profile?.specialization || 'N/A'}</h3>
              </div>
              <i className="fas fa-user-md" style={{ fontSize: '32px', color: '#66bb6a' }}></i>
            </div>
          </div>
        </div>

        {/* Today's Appointments Section */}
        <div className="info-card" style={{ marginBottom: '20px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fas fa-calendar-day" style={{ color: '#1976d2' }}></i>
            Today's Schedule
          </h3>
          {loadingAppointments ? (
            <p style={{ color: '#666', padding: '10px 0' }}>Loading appointments...</p>
          ) : todayAppointments.length > 0 ? (
            <div className="appointments-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', marginTop: '15px' }}>
              {todayAppointments.map((appointment) => (
                <div 
                  key={appointment.id} 
                  className="appointment-card"
                  onClick={() => handleAppointmentClick(appointment)}
                  style={{
                    padding: '20px',
                    border: '2px solid #2196f3',
                    borderRadius: '12px',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 2px 8px rgba(33, 150, 243, 0.15)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(33, 150, 243, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(33, 150, 243, 0.15)';
                  }}
                >
                  <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #e0e0e0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '50%', 
                        backgroundColor: '#e3f2fd', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '18px',
                        color: '#1976d2'
                      }}>
                        <i className="fas fa-user"></i>
                      </div>
                      <div>
                        <h4 style={{ margin: 0, color: '#1976d2', fontSize: '16px', fontWeight: '600' }}>
                          {appointment.patientName}
                        </h4>
                        <p style={{ margin: '2px 0 0 0', color: '#757575', fontSize: '12px' }}>
                          ID: {appointment.patientId}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ 
                      display: 'inline-block',
                      padding: '8px 16px', 
                      backgroundColor: '#1976d2', 
                      color: 'white', 
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      <i className="fas fa-clock" style={{ marginRight: '8px' }}></i>
                      {formatTimeSlot(appointment.timeSlot)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#555' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fas fa-envelope" style={{ color: '#757575', width: '16px' }}></i>
                      <span style={{ fontSize: '13px' }}>{appointment.patientEmail}</span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '12px', borderTop: '1px solid #e0e0e0' }}>
                      <span 
                        style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: appointment.paymentStatus === 'pending' ? '#fff3cd' : '#d4edda',
                          color: appointment.paymentStatus === 'pending' ? '#856404' : '#155724',
                          border: `1px solid ${appointment.paymentStatus === 'pending' ? '#ffeaa7' : '#c3e6cb'}`
                        }}
                      >
                        {appointment.paymentStatus === 'pending' ? (
                          <><i className="fas fa-clock"></i> Payment Pending</>
                        ) : (
                          <><i className="fas fa-check-circle"></i> Paid</>
                        )}
                      </span>
                      <span style={{ color: '#1976d2', fontWeight: 'bold', fontSize: '16px' }}>
                        ₹{appointment.amount}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ 
                    marginTop: '12px', 
                    paddingTop: '12px', 
                    borderTop: '1px solid #e0e0e0',
                    display: 'flex',
                    gap: '8px'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinCall(appointment.id);
                      }}
                      style={{
                        flex: 1,
                        padding: '10px',
                        backgroundColor: '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4caf50'}
                    >
                      <i className="fas fa-video"></i>
                      Join Video Call
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAppointmentClick(appointment);
                      }}
                      style={{
                        flex: 1,
                        padding: '10px',
                        backgroundColor: '#1976d2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
                    >
                      <i className="fas fa-prescription"></i>
                      Prescription
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
              <i className="fas fa-calendar-times" style={{ fontSize: '48px', marginBottom: '16px', color: '#ddd' }}></i>
              <p style={{ margin: 0, fontSize: '16px' }}>No appointments scheduled for today.</p>
            </div>
          )}
        </div>

        {/* Upcoming Appointments Section */}
        <div className="info-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fas fa-calendar-alt" style={{ color: '#7b1fa2' }}></i>
            Upcoming Appointments
          </h3>
          {loadingAppointments ? (
            <p style={{ color: '#666', padding: '10px 0' }}>Loading appointments...</p>
          ) : upcomingAppointments.length > 0 ? (
            <div style={{ marginTop: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {upcomingAppointments.map((appointment) => (
                  <div 
                    key={appointment.id} 
                    className="appointment-item"
                    onClick={() => handleAppointmentClick(appointment)}
                    style={{
                      padding: '16px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '10px',
                      backgroundColor: '#fafafa',
                      transition: 'all 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                      e.currentTarget.style.borderColor = '#9c27b0';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#fafafa';
                      e.currentTarget.style.borderColor = '#e0e0e0';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '15px', fontWeight: '600' }}>
                          {appointment.patientName}
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '13px', color: '#666' }}>
                          <span>
                            <i className="fas fa-calendar" style={{ marginRight: '6px', color: '#7b1fa2' }}></i>
                            {appointment.appointmentDate.toDate().toLocaleDateString('en-IN', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </span>
                          <span>
                            <i className="fas fa-clock" style={{ marginRight: '6px', color: '#7b1fa2' }}></i>
                            {formatTimeSlot(appointment.timeSlot)}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJoinCall(appointment.id);
                          }}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#4caf50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4caf50'}
                        >
                          <i className="fas fa-video"></i>
                          Join
                        </button>
                        <span 
                          style={{
                            padding: '4px 10px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: appointment.paymentStatus === 'pending' ? '#fff3cd' : '#d4edda',
                            color: appointment.paymentStatus === 'pending' ? '#856404' : '#155724'
                          }}
                        >
                          {appointment.paymentStatus === 'pending' ? 'Pending' : 'Paid'}
                        </span>
                        <span style={{ color: '#7b1fa2', fontWeight: 'bold', fontSize: '15px', minWidth: '70px', textAlign: 'right' }}>
                          ₹{appointment.amount}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                className="nav-button"
                onClick={() => handleNavigate('/doctor/appointments')}
                style={{ 
                  marginTop: '16px', 
                  width: '100%', 
                  backgroundColor: '#7b1fa2',
                  color: 'white',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6a1b9a'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7b1fa2'}
              >
                <i className="fas fa-arrow-right" style={{ marginRight: '8px' }}></i>
                View All Appointments
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
              <i className="fas fa-calendar-check" style={{ fontSize: '48px', marginBottom: '16px', color: '#ddd' }}></i>
              <p style={{ margin: 0, fontSize: '16px' }}>No upcoming appointments scheduled.</p>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className="profile-card" style={{ marginTop: '20px' }}>
          <h3>Doctor Profile</h3>
          <div className="profile-grid">
            <div className="profile-item">
              <strong>Doctor ID:</strong>
              <span>{profile?.doctorId || 'N/A'}</span>
            </div>
            
            <div className="profile-item">
              <strong>Name:</strong>
              <span>{profile?.name || 'N/A'}</span>
            </div>

            <div className="profile-item">
              <strong>Email:</strong>
              <span>{user?.email}</span>
            </div>
            
            <div className="profile-item">
              <strong>Specialization:</strong>
              <span>{profile?.specialization || 'N/A'}</span>
            </div>
            
            <div className="profile-item">
              <strong>Department:</strong>
              <span>{profile?.department || 'N/A'}</span>
            </div>
            
            <div className="profile-item">
              <strong>Phone:</strong>
              <span>{profile?.phone || 'N/A'}</span>
            </div>
            
            <div className="profile-item">
              <strong>Status:</strong>
              <span className={`status-badge ${profile?.status || 'active'}`}>
                {profile?.status || 'active'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="info-card" style={{ marginTop: '20px' }}>
          <h3>Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginTop: '15px' }}>
            
            {/* My Patients Card */}
            <div 
              onClick={() => handleNavigate('/doctor/patients')}
              style={{
                padding: '20px',
                borderRadius: '12px',
                backgroundColor: '#e8f5e9',
                border: '2px solid #4caf50',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 2px 8px rgba(76, 175, 80, 0.15)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(76, 175, 80, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(76, 175, 80, 0.15)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '50%', 
                  backgroundColor: '#4caf50', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '24px',
                  color: 'white'
                }}>
                  <i className="fas fa-users"></i>
                </div>
                <h4 style={{ margin: 0, color: '#2e7d32', fontSize: '18px', fontWeight: '600' }}>
                  My Patients
                </h4>
              </div>
              <p style={{ margin: 0, color: '#666', fontSize: '14px', lineHeight: '1.6' }}>
                View patient medical records, diagnosis history, and health information
              </p>
            </div>

            {/* Cancer Classification Card */}
            <div 
              onClick={() => handleNavigate('/classification')}
              style={{
                padding: '20px',
                borderRadius: '12px',
                backgroundColor: '#fff3e0',
                border: '2px solid #ff9800',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 2px 8px rgba(255, 152, 0, 0.15)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(255, 152, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(255, 152, 0, 0.15)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '50%', 
                  backgroundColor: '#ff9800', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '24px',
                  color: 'white'
                }}>
                  <i className="fas fa-microscope"></i>
                </div>
                <h4 style={{ margin: 0, color: '#e65100', fontSize: '18px', fontWeight: '600' }}>
                  Cancer Classification
                </h4>
              </div>
              <p style={{ margin: 0, color: '#666', fontSize: '14px', lineHeight: '1.6' }}>
                Upload medical images for AI-powered cancer detection (Brain, Lung, Skin)
              </p>
              <div style={{ 
                marginTop: '12px', 
                color: '#ff9800', 
                fontSize: '13px', 
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>Start Analysis</span>
                <i className="fas fa-arrow-right"></i>
              </div>
            </div>

            {/* Classification History Card */}
            <div 
              onClick={() => handleNavigate('/classification-history')}
              style={{
                padding: '20px',
                borderRadius: '12px',
                backgroundColor: '#e8eaf6',
                border: '2px solid #3f51b5',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 2px 8px rgba(63, 81, 181, 0.15)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(63, 81, 181, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(63, 81, 181, 0.15)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '50%', 
                  backgroundColor: '#3f51b5', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '24px',
                  color: 'white'
                }}>
                  <i className="fas fa-history"></i>
                </div>
                <h4 style={{ margin: 0, color: '#1a237e', fontSize: '18px', fontWeight: '600' }}>
                  Classification History
                </h4>
              </div>
              <p style={{ margin: 0, color: '#666', fontSize: '14px', lineHeight: '1.6' }}>
                View past classification results and patient analysis history
              </p>
              <div style={{ 
                marginTop: '12px', 
                color: '#3f51b5', 
                fontSize: '13px', 
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>View History</span>
                <i className="fas fa-arrow-right"></i>
              </div>
            </div>

            {/* Prescription History Card */}
            <div 
              onClick={() => handleNavigate('/doctor/prescription-history')}
              style={{
                padding: '20px',
                borderRadius: '12px',
                backgroundColor: '#e1f5fe',
                border: '2px solid #0288d1',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 2px 8px rgba(2, 136, 209, 0.15)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(2, 136, 209, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(2, 136, 209, 0.15)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '50%', 
                  backgroundColor: '#0288d1', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '24px',
                  color: 'white'
                }}>
                  <i className="fas fa-file-medical"></i>
                </div>
                <h4 style={{ margin: 0, color: '#01579b', fontSize: '18px', fontWeight: '600' }}>
                  Prescription History
                </h4>
              </div>
              <p style={{ margin: 0, color: '#666', fontSize: '14px', lineHeight: '1.6' }}>
                View all prescriptions you've written for your patients
              </p>
              <div style={{ 
                marginTop: '12px', 
                color: '#0288d1', 
                fontSize: '13px', 
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>View Prescriptions</span>
                <i className="fas fa-arrow-right"></i>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>Other Features:</p>
            <ul style={{ paddingLeft: '20px', color: '#666', fontSize: '14px' }}>
              <li><strong>My Patients</strong>: View and manage your patient list with complete medical histories.</li>
              <li><strong>Appointments</strong>: Review today's appointments and upcoming consultations.</li>
              <li><strong>Prescriptions</strong>: Create and manage patient prescriptions digitally.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;