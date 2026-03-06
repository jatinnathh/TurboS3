import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { getUserProfile } from '../../services/userService';
import './PatientPrescriptionViewer.css';

interface Medicine {
  medicineId: number;
  medicineName: string;
  medicineCategory: string;
  durationDays: number;
  timesPerDay: number;
  totalDoses: number;
}

interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: string;
  patientGender: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  medicines: Medicine[];
  prescriptionDate: string;
  status: string;
  createdAt: string;
  reportNotes?: string;
}

export default function PatientPrescriptionViewer() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchPrescriptions();
  }, [user]);

  const fetchPrescriptions = async () => {
    if (!user?.uid) {
      console.log('No user UID available');
      return;
    }

    try {
      setLoading(true);
      
      // First, get the current user's profile to get their name
      const userProfile = await getUserProfile(user.uid, 'patient');
      const userName = userProfile?.name;
      
      console.log('Fetching prescriptions for:');
      console.log('  User UID:', user.uid);
      console.log('  User email:', user.email);
      console.log('  User name:', userName);
      
      // Fetch ALL prescriptions first
      const prescriptionsRef = collection(db, 'prescriptions');
      const snapshot = await getDocs(prescriptionsRef);
      
      console.log('Total prescriptions in database:', snapshot.size);
      
      const prescriptionData: Prescription[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Log each prescription's identifying info
        console.log('Prescription:', {
          docId: doc.id,
          patientId: data.patientId,
          patientEmail: data.patientEmail,
          patientName: data.patientName,
          doctorName: data.doctorName
        });
        
        // Match by multiple criteria for better matching
        const matchesId = data.patientId === user.uid;
        const matchesEmail = data.patientEmail?.toLowerCase() === user.email?.toLowerCase();
        const matchesName = userName && data.patientName?.toLowerCase() === userName?.toLowerCase();
        
        console.log(`  Match check - UID: ${matchesId}, Email: ${matchesEmail}, Name: ${matchesName}`);
        
        if (matchesId || matchesEmail || matchesName) {
          console.log('  ✓ MATCH FOUND - Adding to list');
          prescriptionData.push({
            id: doc.id,
            ...data
          } as Prescription);
        }
      });

      // Sort by date in memory (client-side)
      prescriptionData.sort((a, b) => {
        const dateA = new Date(a.prescriptionDate).getTime();
        const dateB = new Date(b.prescriptionDate).getTime();
        return dateB - dateA; // Descending order (newest first)
      });

      console.log('✅ Final prescriptions matched:', prescriptionData.length);
      console.log('Prescription details:', prescriptionData);
      setPrescriptions(prescriptionData);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      alert('Error loading prescriptions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setShowDetailModal(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="prescription-viewer-container">
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading your prescriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="prescription-viewer-container">
      <div className="viewer-header">
        <div className="header-content">
          <h1><i className="fas fa-prescription"></i> My Prescriptions</h1>
          <p>View your medical prescriptions and medication history</p>
        </div>
        <button className="back-btn" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i> Back to Dashboard
        </button>
      </div>

      {/* Statistics */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <i className="fas fa-file-prescription"></i>
          </div>
          <div className="stat-info">
            <h3>{prescriptions.length}</h3>
            <p>Total Prescriptions</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
            <i className="fas fa-pills"></i>
          </div>
          <div className="stat-info">
            <h3>{prescriptions.reduce((sum, p) => sum + p.medicines.length, 0)}</h3>
            <p>Total Medicines</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
            <i className="fas fa-user-md"></i>
          </div>
          <div className="stat-info">
            <h3>{new Set(prescriptions.map(p => p.doctorId)).size}</h3>
            <p>Doctors Consulted</p>
          </div>
        </div>
      </div>

      {/* Prescriptions List */}
      {prescriptions.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-prescription"></i>
          <h3>No prescriptions found</h3>
          <p>You don't have any prescriptions yet. Book an appointment with a doctor to get started.</p>
          <button className="primary-btn" onClick={() => navigate('/patient-dashboard')}>
            <i className="fas fa-calendar-plus"></i> Book Appointment
          </button>
        </div>
      ) : (
        <div className="prescriptions-grid">
          {prescriptions.map((prescription) => (
            <div key={prescription.id} className="prescription-card">
              <div className="card-header">
                <div className="doctor-info">
                  <div className="doctor-avatar">
                    <i className="fas fa-user-md"></i>
                  </div>
                  <div>
                    <h3>{prescription.doctorName}</h3>
                    <p>{prescription.doctorSpecialty || 'General Physician'}</p>
                  </div>
                </div>
                <span className={`status-badge ${prescription.status}`}>
                  {prescription.status}
                </span>
              </div>

              <div className="card-body">
                <div className="info-row">
                  <i className="fas fa-calendar"></i>
                  <span>{formatDate(prescription.prescriptionDate)}</span>
                </div>
                <div className="info-row">
                  <i className="fas fa-pills"></i>
                  <span>{prescription.medicines.length} Medicine{prescription.medicines.length > 1 ? 's' : ''}</span>
                </div>
              </div>

              <div className="card-footer">
                <button 
                  className="view-btn"
                  onClick={() => handleViewDetails(prescription)}
                >
                  <i className="fas fa-eye"></i> View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedPrescription && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content prescription-detail" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><i className="fas fa-file-prescription"></i> Prescription Details</h2>
              <button className="close-btn" onClick={() => setShowDetailModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="prescription-detail-content">
              {/* Header Info */}
              <div className="detail-header">
                <div className="detail-section">
                  <h4>Doctor Information</h4>
                  <p><strong>Name:</strong> {selectedPrescription.doctorName}</p>
                  <p><strong>Specialty:</strong> {selectedPrescription.doctorSpecialty || 'General Physician'}</p>
                </div>
                <div className="detail-section">
                  <h4>Patient Information</h4>
                  <p><strong>Name:</strong> {selectedPrescription.patientName}</p>
                  <p><strong>Age:</strong> {selectedPrescription.patientAge || 'N/A'}</p>
                  <p><strong>Gender:</strong> {selectedPrescription.patientGender || 'N/A'}</p>
                </div>
                <div className="detail-section">
                  <h4>Prescription Date</h4>
                  <p>{formatDate(selectedPrescription.prescriptionDate)}</p>
                </div>
              </div>

              {/* Medicines Table */}
              <div className="medicines-section">
                <h3><i className="fas fa-pills"></i> Prescribed Medicines</h3>
                <table className="medicines-table">
                  <thead>
                    <tr>
                      <th>Medicine Name</th>
                      <th>Category</th>
                      <th>Duration</th>
                      <th>Frequency</th>
                      <th>Total Doses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPrescription.medicines.map((medicine, index) => (
                      <tr key={index}>
                        <td><strong>{medicine.medicineName}</strong></td>
                        <td>
                          <span className="category-badge">{medicine.medicineCategory}</span>
                        </td>
                        <td>{medicine.durationDays} days</td>
                        <td>{medicine.timesPerDay}x per day</td>
                        <td>{medicine.totalDoses} doses</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Doctor's Report Section */}
              {selectedPrescription.reportNotes && (
                <div className="report-notes-section">
                  <h3><i className="fas fa-notes-medical"></i> Doctor's Report & Notes</h3>
                  <div className="report-content">
                    <p>{selectedPrescription.reportNotes}</p>
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="instructions-section">
                <div className="instruction-card">
                  <i className="fas fa-info-circle"></i>
                  <p><strong>Important:</strong> Take medicines as prescribed by your doctor</p>
                </div>
                <div className="instruction-card">
                  <i className="fas fa-clock"></i>
                  <p><strong>Timing:</strong> Follow the recommended frequency and duration</p>
                </div>
                <div className="instruction-card">
                  <i className="fas fa-exclamation-triangle"></i>
                  <p><strong>Warning:</strong> Do not stop medication without consulting your doctor</p>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="secondary-btn" onClick={() => setShowDetailModal(false)}>
                Close
              </button>
              <button className="primary-btn" onClick={handlePrint}>
                <i className="fas fa-print"></i> Print Prescription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
