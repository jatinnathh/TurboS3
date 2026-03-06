import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PrescriptionSystemEnhanced from './DoctorCreatePrescriptionEnhanced';

export default function PrescriptionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Patient data passed from doctor dashboard
  const patient = location.state;

  // Handle redirect in useEffect to avoid rendering issues
  useEffect(() => {
    if (!patient) {
      console.warn('No patient data received. Redirecting to dashboard...');
      navigate('/doctor-dashboard', { replace: true });
    }
  }, [patient, navigate]);

  // If no patient data, show loading or return null
  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PrescriptionSystemEnhanced key={patient.id} patientData={patient} />
    </div>
  );
}