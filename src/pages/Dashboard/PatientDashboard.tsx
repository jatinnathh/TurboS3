import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getUserProfile } from '../../services/userService';
import { getAvailableDoctors, createAppointment, updateDoctorSlot, updateAppointmentPayment, addToPatientBookedAppointments, getAppointmentById } from '../../services/appointmentService';
import { createPaymentOrder, initializePayment } from '../../services/paymentService';
import type { Patient, Doctor } from '../../types';
import './PatientDashboard.css';

const PatientDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Patient | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          // Fetch patient profile
          const profileData = await getUserProfile(user.uid, 'patient');
          setProfile(profileData as Patient);

          // Fetch available doctors
          const availableDoctors = await getAvailableDoctors();
          setDoctors(availableDoctors);
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const handleSlotBooking = async (doctor: Doctor, timeSlot: string) => {
    if (!profile || !user) return;

    setBookingLoading(true);

    try {
      // Create appointment in pending state
      const appointmentId = await createAppointment({
        patientId: profile.patientId,
        patientName: profile.name,
        patientEmail: user.email || '',
        doctorId: doctor.doctorId,
        doctorName: doctor.name,
        doctorEmail: doctor.email,
        timeSlot: timeSlot,
        appointmentDate: new Date(),
        status: 'scheduled',
        paymentStatus: 'pending',
        amount: 500, // ₹500 per appointment
      });

      // Create payment order
      const order = await createPaymentOrder(500);

      // Initialize Razorpay payment
      await initializePayment(
        order,
        {
          name: profile.name,
          email: user.email || '',
          contact: profile.phone || ''
        },
        async (response) => {
          // Payment successful
          try {
            // Update appointment with payment details
            await updateAppointmentPayment(appointmentId, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });

            // Update doctor slot to booked
            await updateDoctorSlot(doctor.id, timeSlot);

            // Fetch the complete appointment (including meetLink)
            const completedAppointment = await getAppointmentById(appointmentId);

            // Add to patient's booked appointments subcollection
            if (user && completedAppointment) {
              await addToPatientBookedAppointments(user.uid, completedAppointment);
            }

            // Refresh doctors list to show updated slots
            const updatedDoctors = await getAvailableDoctors();
            setDoctors(updatedDoctors);

            // Show success message
            alert('✓ Appointment booked successfully! You can view it in "My Appointments" section.');
          } catch (error) {
            console.error('Error updating appointment:', error);
            alert('Payment successful but failed to update appointment. Please contact support.');
          } finally {
            setBookingLoading(false);
          }
        },
        (error) => {
          // Payment failed or cancelled
          console.error('Payment failed:', error);
          alert('Payment failed. Please try again.');
          setBookingLoading(false);
        }
      );
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Failed to initiate booking. Please try again.');
      setBookingLoading(false);
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
          <h1>Patient Dashboard</h1>
          <span className="user-type-badge">
            <i className="fas fa-user-injured"></i> Patient
          </span>
        </div>
        <div className="header-actions">


          <button className="appointments-button" onClick={() => navigate('/booked-appointments')}>
            <i className="fas fa-calendar-check"></i> My Appointments
          </button>
          <button className="appointments-button" onClick={() => navigate('/patient/prescriptions')}>
            <i className="fas fa-file-medical"></i> My Prescriptions
          </button>
          <button className="logout-button" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>Welcome, {profile?.name || 'Patient'}!</h2>
          <p>Book an appointment with our available doctors.</p>
        </div>

        {/* Available Doctors */}
        <div className="doctors-section">
          <h3>Available Doctors</h3>
          {doctors.length === 0 ? (
            <p className="no-doctors">No doctors available at the moment.</p>
          ) : (
            <div className="doctors-grid">
              {doctors.map((doctor) => (
                <div key={doctor.id} className="doctor-card">
                  <div className="doctor-header">
                    <img
                      src={doctor.imageUrl || "/placeholder.jpg"}
                      alt={doctor.name}
                      className="doctor-image"
                    />
                    <div className="doctor-info">
                      <h4>{doctor.name}</h4>
                      <p className="specialization">{doctor.specialization}</p>
                      <p className="department">{doctor.department}</p>
                    </div>
                  </div>

                  <div className="slots-section">
                    <p className="slots-label">Available Slots:</p>
                    <div className="slots-grid">
                      {doctor.slots && Object.entries(doctor.slots).map(([slot, isBooked]) => (
                        <button
                          key={slot}
                          className={`slot-button ${isBooked ? 'booked' : 'available'}`}
                          disabled={isBooked || bookingLoading}
                          onClick={() => handleSlotBooking(doctor, slot)}
                        >
                          {slot}
                          {isBooked && <span className="booked-badge">Booked</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="appointment-price">
                    <span>Consultation Fee:</span>
                    <strong>₹500</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {bookingLoading && (
        <div className="payment-overlay">
          <div className="payment-loader">
            <div className="spinner"></div>
            <p>Processing your payment...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
