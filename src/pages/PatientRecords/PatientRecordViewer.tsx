import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useDoctorProfile } from '../../contexts/AuthContext';
import './PatientRecordViewer.css';

interface PatientRecord {
  userId: string;
  name: string;
  email: string;
  age?: string;
  gender?: string;
  phone?: string;
  diagnosedDisease?: string;
  diseaseType?: string;
  diagnosisConfidence?: number;
  diagnosisDate?: string;
  diagnosedBy?: string;
  diagnosedByDoctorId?: string;
}

interface AppointmentData {
  patientId: string;
  patientName: string;
  patientEmail?: string;
  appointmentDate: string;
  status: string;
}

export default function PatientRecordViewer() {
  const navigate = useNavigate();
  const doctorProfile = useDoctorProfile();
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'diagnosed' | 'undiagnosed'>('all');
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, [doctorProfile]);

  useEffect(() => {
    filterPatients();
  }, [searchTerm, filterType, patients]);

  const fetchPatients = async () => {
    if (!doctorProfile?.doctorId) return;

    try {
      setLoading(true);
      
      // Get all appointments for this doctor to find their patients
      const appointmentsRef = collection(db, 'appointments');
      const appointmentsQuery = query(
        appointmentsRef,
        where('doctorId', '==', doctorProfile.doctorId)
      );
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      
      console.log('Total appointments found:', appointmentsSnapshot.size);
      
      // Get unique patient IDs and basic info from appointments
      const patientMap = new Map<string, { id: string; name: string; email: string }>();
      appointmentsSnapshot.forEach((doc) => {
        const data = doc.data() as AppointmentData;
        if (data.patientId && !patientMap.has(data.patientId)) {
          patientMap.set(data.patientId, {
            id: data.patientId,
            name: data.patientName || 'Unknown',
            email: data.patientEmail || ''
          });
        }
      });

      console.log('Unique patients found:', patientMap.size);

      // Fetch diagnosis information for all patients
      const diagnosisRef = collection(db, 'patientDiagnosis');
      const diagnosisSnapshot = await getDocs(diagnosisRef);
      
      // Create a map of patientId to diagnosis data
      const diagnosisMap = new Map();
      diagnosisSnapshot.forEach((doc) => {
        const data = doc.data();
        diagnosisMap.set(data.patientId, data);
      });

      console.log('Total diagnosis records:', diagnosisMap.size);

      // Combine appointment data with diagnosis data
      const patientRecords: PatientRecord[] = [];
      
      for (const [patientId, basicInfo] of patientMap) {
        const diagnosis = diagnosisMap.get(patientId);
        
        if (diagnosis) {
          console.log('Found diagnosis for patient:', patientId, diagnosis);
        }
        
        patientRecords.push({
          userId: patientId,
          name: basicInfo.name,
          email: basicInfo.email,
          diagnosedDisease: diagnosis?.diagnosedDisease,
          diseaseType: diagnosis?.diseaseType,
          diagnosisConfidence: diagnosis?.diagnosisConfidence,
          diagnosisDate: diagnosis?.diagnosisDate,
          diagnosedBy: diagnosis?.diagnosedBy,
          diagnosedByDoctorId: diagnosis?.diagnosedByDoctorId
        });
      }

      console.log('Final patient records:', patientRecords);
      setPatients(patientRecords);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    let filtered = [...patients];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(patient =>
        patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.diagnosedDisease?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply diagnosis filter
    if (filterType === 'diagnosed') {
      filtered = filtered.filter(patient => patient.diagnosedDisease);
    } else if (filterType === 'undiagnosed') {
      filtered = filtered.filter(patient => !patient.diagnosedDisease);
    }

    setFilteredPatients(filtered);
  };

  const handleViewDetails = (patient: PatientRecord) => {
    setSelectedPatient(patient);
    setShowDetailModal(true);
  };

  const handleNavigateToPrescription = (patient: PatientRecord) => {
    navigate('/doctor/prescription', {
      state: {
        patientData: {
          id: patient.userId,
          name: patient.name,
          age: patient.age || 'N/A',
          gender: patient.gender || 'N/A',
          email: patient.email
        }
      }
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return '#94a3b8';
    if (confidence >= 80) return '#10b981';
    if (confidence >= 60) return '#f59e0b';
    return '#ef4444';
  };

  if (loading) {
    return (
      <div className="patient-records-container">
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading patient records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-records-container">
      <div className="records-header">
        <div className="header-content">
          <h1><i className="fas fa-users"></i> My Patients</h1>
          <p>View and manage patient medical records</p>
        </div>
        <button className="back-btn" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i> Back
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-info">
            <h3>{patients.length}</h3>
            <p>Total Patients</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-info">
            <h3>{patients.filter(p => p.diagnosedDisease).length}</h3>
            <p>Diagnosed</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fee2e2', color: '#ef4444' }}>
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-info">
            <h3>{patients.filter(p => !p.diagnosedDisease).length}</h3>
            <p>Pending Diagnosis</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by name, email, or diagnosis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          <button
            className={filterType === 'all' ? 'active' : ''}
            onClick={() => setFilterType('all')}
          >
            All Patients
          </button>
          <button
            className={filterType === 'diagnosed' ? 'active' : ''}
            onClick={() => setFilterType('diagnosed')}
          >
            Diagnosed
          </button>
          <button
            className={filterType === 'undiagnosed' ? 'active' : ''}
            onClick={() => setFilterType('undiagnosed')}
          >
            Undiagnosed
          </button>
        </div>
      </div>

      {/* Patients List */}
      {filteredPatients.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-user-slash"></i>
          <h3>No patients found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="patients-table">
          <table>
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Contact</th>
                <th>Age/Gender</th>
                <th>Diagnosis</th>
                <th>Disease Type</th>
                <th>Confidence</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.userId}>
                  <td>
                    <div className="patient-name-cell">
                      <div className="avatar">
                        {patient.name?.charAt(0).toUpperCase() || 'P'}
                      </div>
                      <span>{patient.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="contact-cell">
                      <span>{patient.email || 'N/A'}</span>
                      {patient.phone && <small>{patient.phone}</small>}
                    </div>
                  </td>
                  <td>{patient.age || 'N/A'} / {patient.gender || 'N/A'}</td>
                  <td>
                    {patient.diagnosedDisease ? (
                      <span className="diagnosis-badge">
                        {patient.diagnosedDisease}
                      </span>
                    ) : (
                      <span className="no-diagnosis">Not diagnosed</span>
                    )}
                  </td>
                  <td>
                    {patient.diseaseType ? (
                      <span className={`disease-type-badge ${patient.diseaseType}`}>
                        <i className={
                          patient.diseaseType === 'brain' ? 'fas fa-brain' :
                          patient.diseaseType === 'lung' ? 'fas fa-lungs' :
                          patient.diseaseType === 'skin' ? 'fas fa-hand-sparkles' : 'fas fa-question'
                        }></i>
                        {patient.diseaseType.toUpperCase()}
                      </span>
                    ) : (
                      <span className="no-data">-</span>
                    )}
                  </td>
                  <td>
                    {patient.diagnosisConfidence ? (
                      <span
                        className="confidence-badge"
                        style={{ color: getConfidenceColor(patient.diagnosisConfidence) }}
                      >
                        {patient.diagnosisConfidence.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="no-data">-</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="view-btn"
                        onClick={() => handleViewDetails(patient)}
                        title="View Details"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        className="prescribe-btn"
                        onClick={() => handleNavigateToPrescription(patient)}
                        title="Create Prescription"
                      >
                        <i className="fas fa-prescription"></i>
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
      {showDetailModal && selectedPatient && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><i className="fas fa-user-md"></i> Patient Medical Record</h2>
              <button className="close-btn" onClick={() => setShowDetailModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="patient-detail-content">
              {/* Basic Info */}
              <div className="detail-section">
                <h3><i className="fas fa-id-card"></i> Basic Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Full Name:</label>
                    <span>{selectedPatient.name || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Patient ID:</label>
                    <span>{selectedPatient.userId}</span>
                  </div>
                  <div className="detail-item">
                    <label>Email:</label>
                    <span>{selectedPatient.email || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Phone:</label>
                    <span>{selectedPatient.phone || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Age:</label>
                    <span>{selectedPatient.age || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Gender:</label>
                    <span>{selectedPatient.gender || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Diagnosis Info */}
              <div className="detail-section">
                <h3><i className="fas fa-stethoscope"></i> Diagnosis Information</h3>
                {selectedPatient.diagnosedDisease ? (
                  <div className="diagnosis-detail">
                    <div className="detail-item-large">
                      <label>Diagnosed Disease:</label>
                      <span className="highlight">{selectedPatient.diagnosedDisease}</span>
                    </div>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>Disease Type:</label>
                        <span className={`disease-badge ${selectedPatient.diseaseType}`}>
                          {selectedPatient.diseaseType?.toUpperCase() || 'N/A'}
                        </span>
                      </div>
                      <div className="detail-item">
                        <label>Confidence Level:</label>
                        <span style={{ 
                          color: getConfidenceColor(selectedPatient.diagnosisConfidence),
                          fontWeight: 'bold'
                        }}>
                          {selectedPatient.diagnosisConfidence?.toFixed(2)}%
                        </span>
                      </div>
                      <div className="detail-item">
                        <label>Diagnosis Date:</label>
                        <span>{formatDate(selectedPatient.diagnosisDate)}</span>
                      </div>
                      <div className="detail-item">
                        <label>Diagnosed By:</label>
                        <span>{selectedPatient.diagnosedBy || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="no-diagnosis-info">
                    <i className="fas fa-info-circle"></i>
                    <p>No diagnosis recorded for this patient yet.</p>
                    <button 
                      className="diagnose-btn"
                      onClick={() => {
                        setShowDetailModal(false);
                        handleNavigateToPrescription(selectedPatient);
                      }}
                    >
                      <i className="fas fa-plus"></i> Create Diagnosis
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="secondary-btn"
                onClick={() => setShowDetailModal(false)}
              >
                Close
              </button>
              <button
                className="primary-btn"
                onClick={() => {
                  setShowDetailModal(false);
                  handleNavigateToPrescription(selectedPatient);
                }}
              >
                <i className="fas fa-prescription"></i> Create Prescription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
