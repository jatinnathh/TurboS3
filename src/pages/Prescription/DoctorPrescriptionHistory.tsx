import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useDoctorProfile } from '../../contexts/AuthContext';
import './DoctorPrescriptionHistory.css';

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

export default function DoctorPrescriptionHistory() {
  const navigate = useNavigate();
  const doctorProfile = useDoctorProfile();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchPrescriptions();
  }, [doctorProfile]);

  useEffect(() => {
    filterPrescriptions();
  }, [searchTerm, prescriptions]);

  const fetchPrescriptions = async () => {
    if (!doctorProfile?.doctorId) {
      console.log('No doctorId available yet');
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching prescriptions for doctor:', doctorProfile.doctorId);
      
      // Fetch prescriptions written by this doctor
      const prescriptionsRef = collection(db, 'prescriptions');
      const q = query(
        prescriptionsRef,
        where('doctorId', '==', doctorProfile.doctorId)
      );
      const snapshot = await getDocs(q);
      
      console.log('Raw documents found:', snapshot.size);
      
      const prescriptionData: Prescription[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Prescription document:', doc.id, data);
        prescriptionData.push({
          id: doc.id,
          ...data
        } as Prescription);
      });

      // Sort prescriptions by date in memory (client-side)
      prescriptionData.sort((a, b) => {
        const dateA = new Date(a.prescriptionDate).getTime();
        const dateB = new Date(b.prescriptionDate).getTime();
        return dateB - dateA; // Descending order (newest first)
      });

      console.log('Final prescriptions found:', prescriptionData.length);
      setPrescriptions(prescriptionData);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      alert('Error loading prescription history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterPrescriptions = () => {
    if (!searchTerm) {
      setFilteredPrescriptions(prescriptions);
      return;
    }

    const filtered = prescriptions.filter(prescription =>
      prescription.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.medicines.some(m => m.medicineName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    setFilteredPrescriptions(filtered);
  };

  const handleViewDetails = (prescription: Prescription) => {
    console.log('Opening prescription details:', prescription);
    console.log('Medicines in prescription:', prescription.medicines);
    setSelectedPrescription(prescription);
    setShowDetailModal(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="prescription-history-container">
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading prescription history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="prescription-history-container">
      <div className="history-header">
        <div className="header-content">
          <h1><i className="fas fa-file-medical"></i> Prescription History</h1>
          <p>View and manage prescriptions you've written for patients</p>
        </div>
        <button className="back-btn" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i> Back
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
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-info">
            <h3>{new Set(prescriptions.map(p => p.patientId)).size}</h3>
            <p>Patients Treated</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
            <i className="fas fa-pills"></i>
          </div>
          <div className="stat-info">
            <h3>{prescriptions.reduce((sum, p) => sum + p.medicines.length, 0)}</h3>
            <p>Medicines Prescribed</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by patient name or medicine..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Prescriptions Table */}
      {filteredPrescriptions.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-prescription"></i>
          <h3>No prescriptions found</h3>
          <p>{searchTerm ? 'Try adjusting your search' : 'You haven\'t written any prescriptions yet'}</p>
        </div>
      ) : (
        <div className="prescriptions-table">
          <table>
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Age/Gender</th>
                <th>Prescription Date</th>
                <th>Medicines</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrescriptions.map((prescription) => (
                <tr key={prescription.id}>
                  <td>
                    <div className="patient-name-cell">
                      <div className="avatar">
                        {prescription.patientName.charAt(0).toUpperCase()}
                      </div>
                      <span>{prescription.patientName}</span>
                    </div>
                  </td>
                  <td>{prescription.patientAge || 'N/A'} / {prescription.patientGender || 'N/A'}</td>
                  <td>{formatDate(prescription.prescriptionDate)}</td>
                  <td>
                    <span className="medicines-count">
                      {prescription.medicines?.length || 0} medicine{(prescription.medicines?.length || 0) !== 1 ? 's' : ''}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${prescription.status}`}>
                      {prescription.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="view-btn"
                        onClick={() => handleViewDetails(prescription)}
                        title="View Details"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          fontWeight: '600'
                        }}
                      >
                        <i className="fas fa-eye"></i> View Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                  <h4>Patient Information</h4>
                  <p><strong>Name:</strong> {selectedPrescription.patientName}</p>
                  <p><strong>Age:</strong> {selectedPrescription.patientAge || 'N/A'}</p>
                  <p><strong>Gender:</strong> {selectedPrescription.patientGender || 'N/A'}</p>
                </div>
                <div className="detail-section">
                  <h4>Doctor Information</h4>
                  <p><strong>Name:</strong> {selectedPrescription.doctorName}</p>
                  <p><strong>Specialty:</strong> {selectedPrescription.doctorSpecialty || 'General Physician'}</p>
                </div>
                <div className="detail-section">
                  <h4>Prescription Details</h4>
                  <p><strong>Date:</strong> {formatDate(selectedPrescription.prescriptionDate)}</p>
                  <p><strong>Status:</strong> <span className={`status-badge ${selectedPrescription.status}`}>{selectedPrescription.status}</span></p>
                </div>
              </div>

              {/* Medicines Table */}
              <div className="medicines-section">
                <h3><i className="fas fa-pills"></i> Prescribed Medicines</h3>
                {selectedPrescription.medicines && selectedPrescription.medicines.length > 0 ? (
                  <table className="medicines-table">
                    <thead>
                      <tr>
                        <th>#</th>
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
                          <td>{index + 1}</td>
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
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    <i className="fas fa-exclamation-circle" style={{ fontSize: '24px', marginBottom: '10px' }}></i>
                    <p>No medicines found in this prescription</p>
                  </div>
                )}
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
            </div>

            <div className="modal-actions">
              <button className="secondary-btn" onClick={() => setShowDetailModal(false)}>
                Close
              </button>
              <button className="primary-btn" onClick={() => window.print()}>
                <i className="fas fa-print"></i> Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
