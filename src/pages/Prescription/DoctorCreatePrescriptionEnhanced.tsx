import { useEffect, useState, useRef } from 'react';
import { Search, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useDoctorProfile } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/firebase';
import { addDoc, collection } from 'firebase/firestore';
import { 
  classifyImage, 
  type CancerType,
  type ClassificationResult 
} from '../../services/classificationService';
import './prescription.css';

// Medicine database
const MEDICINES = [
  // -------------------------
  // 🧠 Brain Tumor
  // -------------------------
  { id: 1, name: 'Temozolomide (Temodar)', category: 'Chemotherapy', diseaseType: 'Glioma' },
  { id: 2, name: 'Carmustine (BCNU)', category: 'Chemotherapy', diseaseType: 'Glioma' },
  { id: 3, name: 'Lomustine (CCNU)', category: 'Chemotherapy', diseaseType: 'Glioma' },
  { id: 4, name: 'Bevacizumab (Avastin)', category: 'Targeted Therapy', diseaseType: 'Glioma' },
  { id: 5, name: 'Everolimus (Afinitor)', category: 'Targeted Therapy', diseaseType: 'Pituitary Tumor' },
  { id: 6, name: 'Octreotide (Sandostatin)', category: 'Hormone Therapy', diseaseType: 'Pituitary Tumor' },
  { id: 7, name: 'Pembrolizumab (Keytruda)', category: 'Immunotherapy', diseaseType: 'Glioma' },
  { id: 8, name: 'Nivolumab (Opdivo)', category: 'Immunotherapy', diseaseType: 'Glioma' },
  { id: 9, name: 'Dexamethasone', category: 'Supportive Care', diseaseType: 'Meningioma' },
  { id: 10, name: 'Levetiracetam (Keppra)', category: 'Supportive Care', diseaseType: 'Any Brain Tumor' },

  // -------------------------
  // 🫁 Lung Cancer
  // -------------------------
  { id: 11, name: 'Cisplatin', category: 'Chemotherapy', diseaseType: 'Adenocarcinoma' },
  { id: 12, name: 'Carboplatin', category: 'Chemotherapy', diseaseType: 'Adenocarcinoma' },
  { id: 13, name: 'Paclitaxel (Taxol)', category: 'Chemotherapy', diseaseType: 'Squamous Cell Carcinoma' },
  { id: 14, name: 'Docetaxel (Taxotere)', category: 'Chemotherapy', diseaseType: 'Adenocarcinoma' },
  { id: 15, name: 'Gemcitabine (Gemzar)', category: 'Chemotherapy', diseaseType: 'Squamous Cell Carcinoma' },
  { id: 16, name: 'Pemetrexed (Alimta)', category: 'Chemotherapy', diseaseType: 'Adenocarcinoma' },
  { id: 17, name: 'Erlotinib (Tarceva)', category: 'Targeted Therapy', diseaseType: 'Adenocarcinoma (EGFR+)' },
  { id: 18, name: 'Gefitinib (Iressa)', category: 'Targeted Therapy', diseaseType: 'Adenocarcinoma (EGFR+)' },
  { id: 19, name: 'Osimertinib (Tagrisso)', category: 'Targeted Therapy', diseaseType: 'Adenocarcinoma (EGFR+)' },
  { id: 20, name: 'Crizotinib (Xalkori)', category: 'Targeted Therapy', diseaseType: 'Adenocarcinoma (ALK+)' },
  { id: 21, name: 'Pembrolizumab (Keytruda)', category: 'Immunotherapy', diseaseType: 'Adenocarcinoma / Squamous Cell Carcinoma' },
  { id: 22, name: 'Atezolizumab (Tecentriq)', category: 'Immunotherapy', diseaseType: 'Adenocarcinoma / Squamous Cell Carcinoma' },
  { id: 23, name: 'Durvalumab (Imfinzi)', category: 'Immunotherapy', diseaseType: 'Adenocarcinoma / Squamous Cell Carcinoma' },
  { id: 24, name: 'Bevacizumab (Avastin)', category: 'Targeted Therapy', diseaseType: 'Adenocarcinoma' },
  { id: 25, name: 'Ondansetron (Zofran)', category: 'Supportive Care', diseaseType: 'All Lung Cancer Types' },
  { id: 26, name: 'Filgrastim (Neupogen)', category: 'Supportive Care', diseaseType: 'All Lung Cancer Types' },

  // -------------------------
  // 🧴 Skin Cancer
  // -------------------------
  { id: 27, name: 'Vemurafenib (Zelboraf)', category: 'Targeted Therapy', diseaseType: 'Melanoma (BRAF+)' },
  { id: 28, name: 'Dabrafenib (Tafinlar)', category: 'Targeted Therapy', diseaseType: 'Melanoma (BRAF+)' },
  { id: 29, name: 'Trametinib (Mekinist)', category: 'Targeted Therapy', diseaseType: 'Melanoma (BRAF+)' },
  { id: 30, name: 'Imiquimod (Aldara)', category: 'Topical Immunotherapy', diseaseType: 'Basal Cell Carcinoma (BCC)' },
  { id: 31, name: 'Fluorouracil (5-FU)', category: 'Topical Chemotherapy', diseaseType: 'Actinic Keratoses / SCC in situ' },
  { id: 32, name: 'Pembrolizumab (Keytruda)', category: 'Immunotherapy', diseaseType: 'Melanoma / Advanced Skin Cancer' },
  { id: 33, name: 'Nivolumab (Opdivo)', category: 'Immunotherapy', diseaseType: 'Melanoma / Advanced Skin Cancer' },
  { id: 34, name: 'Ipilimumab (Yervoy)', category: 'Immunotherapy', diseaseType: 'Melanoma' },
  { id: 35, name: 'Cemiplimab (Libtayo)', category: 'Immunotherapy', diseaseType: 'Cutaneous Squamous Cell Carcinoma' },
  { id: 36, name: 'Interferon-alpha', category: 'Immunotherapy', diseaseType: 'Melanoma' },
  { id: 37, name: 'Hydrocortisone Cream', category: 'Supportive Care', diseaseType: 'Benign Keratosis / Dermatofibroma' },
  { id: 38, name: 'Acetaminophen (Tylenol)', category: 'Supportive Care', diseaseType: 'All Skin Cancer Types' },
  
  // Additional common cancer medicines
  { id: 39, name: 'Doxorubicin', category: 'Chemotherapy', diseaseType: 'Various Cancers' },
  { id: 40, name: 'Cyclophosphamide', category: 'Chemotherapy', diseaseType: 'Various Cancers' },
  { id: 41, name: 'Methotrexate', category: 'Chemotherapy', diseaseType: 'Various Cancers' },
  { id: 42, name: 'Vincristine', category: 'Chemotherapy', diseaseType: 'Various Cancers' },
  { id: 43, name: 'Irinotecan', category: 'Chemotherapy', diseaseType: 'Various Cancers' },
  { id: 44, name: 'Oxaliplatin', category: 'Chemotherapy', diseaseType: 'Various Cancers' },
  { id: 45, name: 'Trastuzumab (Herceptin)', category: 'Targeted Therapy', diseaseType: 'Breast Cancer' },
  { id: 46, name: 'Rituximab (Rituxan)', category: 'Targeted Therapy', diseaseType: 'Lymphoma' },
  { id: 47, name: 'Imatinib (Gleevec)', category: 'Targeted Therapy', diseaseType: 'Leukemia' },
  { id: 48, name: 'Tamoxifen', category: 'Hormone Therapy', diseaseType: 'Breast Cancer' },
  { id: 49, name: 'Anastrozole (Arimidex)', category: 'Hormone Therapy', diseaseType: 'Breast Cancer' }
];

interface PatientData {
  id: string;
  name: string;
  age: string;
  gender: string;
  email?: string;
}

interface PrescriptionSystemProps {
  patientData?: PatientData;
}

interface Medicine {
  id: number;
  name: string;
  category: string;
  diseaseType?: string;
}

interface Prescription {
  id: number;
  medicine: Medicine;
  days: number;
  timesPerDay: number;
  totalDoses: number;
}

type TabType = 'prescription' | 'classification';

export default function PrescriptionSystemEnhanced({ patientData }: PrescriptionSystemProps) {
  const doctorProfile = useDoctorProfile();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('prescription');
  
  // Prescription states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [days, setDays] = useState('');
  const [timesPerDay, setTimesPerDay] = useState('');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [reportNotes, setReportNotes] = useState('');
  const [patientInfo, setPatientInfo] = useState({
    patientId: '',
    patientName: '',
    age: '',
    gender: '',
    email: ''
  });

  // Classification states
  const [selectedCancerType, setSelectedCancerType] = useState<CancerType>('brain');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [classificationResult, setClassificationResult] = useState<ClassificationResult | null>(null);
  const [classificationError, setClassificationError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cancer type information
  const cancerTypes = {
    brain: {
      name: 'Brain Tumor',
      description: 'MRI scan classification',
      iconClass: 'fas fa-brain'
    },
    lung: {
      name: 'Lung Cancer',
      description: 'Histopathology classification',
      iconClass: 'fas fa-lungs'
    },
    skin: {
      name: 'Skin Cancer',
      description: 'Lesion classification',
      iconClass: 'fas fa-hand-holding-medical'
    }
  };

  useEffect(() => {
    if (patientData) {
      setPatientInfo({
        patientId: patientData.id || 'P' + Date.now(),
        patientName: patientData.name || 'Unknown',
        age: patientData.age || '0',
        gender: patientData.gender || 'Not specified',
        email: patientData.email || ''
      });
    }
  }, [patientData]);

  const doctorInfo = {
    doctorId: doctorProfile?.doctorId,
    doctorName: doctorProfile?.name,
    specialty: doctorProfile?.specialization
  };

  // Prescription functions
  const filteredMedicines = MEDICINES.filter(med =>
    med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    med.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (med.diseaseType && med.diseaseType.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddPrescription = () => {
    if (!selectedMedicine || !days || !timesPerDay) {
      alert('Please fill all fields');
      return;
    }

    const newPrescription: Prescription = {
      id: Date.now(),
      medicine: selectedMedicine,
      days: parseInt(days),
      timesPerDay: parseInt(timesPerDay),
      totalDoses: parseInt(days) * parseInt(timesPerDay)
    };

    setPrescriptions([...prescriptions, newPrescription]);
    setSelectedMedicine(null);
    setSearchTerm('');
    setDays('');
    setTimesPerDay('');
    setShowDropdown(false);
  };

  const handleRemovePrescription = (id: number) => {
    setPrescriptions(prescriptions.filter(p => p.id !== id));
  };

  const handleSaveToFirebase = async () => {
    if (prescriptions.length === 0) {
      alert('Please add at least one prescription');
      return;
    }

    const prescriptionData = {
      patientId: patientInfo.patientId,
      patientName: patientInfo.patientName,
      patientAge: patientInfo.age,
      patientGender: patientInfo.gender,
      
      doctorId: doctorInfo.doctorId,
      doctorName: doctorInfo.doctorName,
      doctorSpecialty: doctorInfo.specialty,
      
      medicines: prescriptions.map(p => ({
        medicineId: p.medicine.id,
        medicineName: p.medicine.name,
        medicineCategory: p.medicine.category,
        durationDays: p.days,
        timesPerDay: p.timesPerDay,
        totalDoses: p.totalDoses
      })),
      
      reportNotes: reportNotes.trim() || '',
      
      prescriptionDate: new Date().toISOString(),
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      console.log('Saving prescription data:', prescriptionData);
      const prescriptionRef = await addDoc(collection(db, 'prescriptions'), prescriptionData);
      console.log('Prescription saved successfully with ID:', prescriptionRef.id);
      alert('Prescription saved successfully!');
      
      // Clear the form after successful save
      setPrescriptions([]);
      setReportNotes('');
    } catch (error) {
      console.error('Error saving prescription:', error);
      alert('Error saving prescription. Please try again.');
    }
  };

  // Classification functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setClassificationError('Please select a valid image file');
      return;
    }

    if (file.size > 16 * 1024 * 1024) {
      setClassificationError('File size should be less than 16MB');
      return;
    }

    setSelectedFile(file);
    setClassificationError(null);
    setClassificationResult(null);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleClassify = async () => {
    if (!selectedFile) {
      setClassificationError('Please select an image first');
      return;
    }

    setIsClassifying(true);
    setClassificationError(null);
    setClassificationResult(null);

    try {
      const response = await classifyImage(selectedFile, selectedCancerType);

      if (response.success && response.result) {
        setClassificationResult(response.result);
      } else {
        setClassificationError(response.error || 'Classification failed');
      }
    } catch (err) {
      setClassificationError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsClassifying(false);
    }
  };

  const handleConfirmDiagnosis = () => {
    setShowConfirmDialog(true);
  };

  const handleSaveDiagnosis = async () => {
    if (!classificationResult) return;

    try {
      // Save diagnosis to dedicated collection
      await addDoc(collection(db, 'patientDiagnosis'), {
        patientId: patientInfo.patientId,
        patientName: patientInfo.patientName,
        patientEmail: patientInfo.email,
        diagnosedDisease: classificationResult.predicted_class,
        diseaseType: classificationResult.cancer_type,
        diagnosisConfidence: classificationResult.confidence,
        diagnosisDate: new Date().toISOString(),
        diagnosedBy: doctorInfo.doctorName,
        diagnosedByDoctorId: doctorInfo.doctorId,
        createdAt: new Date().toISOString()
      });

      // Also save to classification history
      await addDoc(collection(db, 'classificationHistory'), {
        patientId: patientInfo.patientId,
        patientName: patientInfo.patientName,
        cancerType: classificationResult.cancer_type,
        predictedClass: classificationResult.predicted_class,
        confidence: classificationResult.confidence,
        allProbabilities: classificationResult.all_probabilities,
        confirmedByDoctor: true,
        doctorId: doctorInfo.doctorId,
        doctorName: doctorInfo.doctorName,
        timestamp: new Date().toISOString(),
        imageUrl: previewUrl || ''
      });

      setShowConfirmDialog(false);
      
      // Show success message
      setSuccessMessage(`Diagnosis "${classificationResult.predicted_class}" has been saved to ${patientInfo.patientName}'s medical record!`);
      
      // Reset classification after 5 seconds
      setTimeout(() => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setClassificationResult(null);
        setSuccessMessage(null);
      }, 5000);
    } catch (error) {
      console.error('Error saving diagnosis:', error);
      alert('Error saving diagnosis to patient record');
    }
  };

  const handleResetClassification = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setClassificationResult(null);
    setClassificationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="prescription-container">
      <div className="prescription-wrapper">
        {/* Header */}
        <div className="prescription-header">
          <h1>Patient Management System</h1>
          <p>Prescriptions & Cancer Classification</p>
        </div>

        {/* Patient Information */}
        <div className="patient-info-section">
          <h2>Patient Information</h2>
          <div className="patient-info-grid">
            <div className="patient-info-item">
              <p>Patient ID</p>
              <p>{patientInfo.patientId}</p>
            </div>
            <div className="patient-info-item">
              <p>Name</p>
              <p>{patientInfo.patientName}</p>
            </div>
            <div className="patient-info-item">
              <p>Age</p>
              <p>{patientInfo.age} years</p>
            </div>
            <div className="patient-info-item">
              <p>Gender</p>
              <p>{patientInfo.gender}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <button
            className={`tab-button ${activeTab === 'prescription' ? 'active' : ''}`}
            onClick={() => setActiveTab('prescription')}
          >
            <i className="fas fa-prescription"></i>
            Prescription
          </button>
          <button
            className={`tab-button ${activeTab === 'classification' ? 'active' : ''}`}
            onClick={() => setActiveTab('classification')}
          >
            <i className="fas fa-microscope"></i>
            Cancer Classification
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Prescription Tab */}
          {activeTab === 'prescription' && (
            <div className="prescription-content">
              {/* Add Prescription Form */}
              <div className="prescription-form">
                <div className="form-field form-field-wide">
                  <label className="form-label">Search Medicine</label>
                  <div className="form-input-wrapper">
                    <Search className="input-icon" size={20} />
                    <input
                      type="text"
                      placeholder="Search medicine..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      className="form-input"
                    />
                  </div>
                  
                  {showDropdown && (
                    <div className="medicine-dropdown">
                      {(searchTerm === '' ? MEDICINES : filteredMedicines).map(med => (
                        <div
                          key={med.id}
                          onClick={() => {
                            setSelectedMedicine(med);
                            setSearchTerm(med.name);
                            setShowDropdown(false);
                          }}
                          className="dropdown-item"
                        >
                          <div className="dropdown-medicine-name">{med.name}</div>
                          <div className="dropdown-medicine-category">
                            {med.category}
                            {med.diseaseType && <span style={{ marginLeft: '8px', color: '#9ca3af' }}>• {med.diseaseType}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {selectedMedicine && (
                    <div className="selected-medicine-text">
                      Selected: {selectedMedicine.name}
                    </div>
                  )}
                </div>

                <div className="form-field">
                  <label className="form-label">Duration (Days)</label>
                  <input
                    type="number"
                    placeholder="e.g., 7"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    min="1"
                    className="form-input form-input-simple"
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Times/Day</label>
                  <input
                    type="number"
                    placeholder="e.g., 3"
                    value={timesPerDay}
                    onChange={(e) => setTimesPerDay(e.target.value)}
                    min="1"
                    className="form-input form-input-simple"
                  />
                </div>
              </div>

              <button onClick={handleAddPrescription} className="add-prescription-btn">
                <Plus size={20} />
                Add to Prescription
              </button>

              {prescriptions.length > 0 && (
                <div className="prescription-summary">
                  <h2>Prescription Summary</h2>
                  <div className="prescription-table-wrapper">
                    <table className="prescription-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Medicine Name</th>
                          <th>Category</th>
                          <th className="text-center">Days</th>
                          <th className="text-center">Times/Day</th>
                          <th className="text-center">Total Doses</th>
                          <th className="text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prescriptions.map((prescription, index) => (
                          <tr key={prescription.id}>
                            <td>{index + 1}</td>
                            <td className="medicine-name">{prescription.medicine.name}</td>
                            <td className="medicine-category">{prescription.medicine.category}</td>
                            <td className="text-center">{prescription.days}</td>
                            <td className="text-center">{prescription.timesPerDay}</td>
                            <td className="text-center total-doses">{prescription.totalDoses}</td>
                            <td className="text-center">
                              <button
                                onClick={() => handleRemovePrescription(prescription.id)}
                                className="delete-btn"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Doctor's Report/Notes Section */}
                  <div className="report-section">
                    <h3 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.125rem', fontWeight: '600', color: '#1e293b' }}>
                      <i className="fas fa-notes-medical"></i>
                      Doctor's Report & Notes
                    </h3>
                    <textarea
                      value={reportNotes}
                      onChange={(e) => setReportNotes(e.target.value)}
                      placeholder="Enter diagnosis, observations, special instructions, follow-up recommendations, or any additional notes for the patient..."
                      rows={6}
                      className="report-textarea"
                    />
                    <p style={{ 
                      marginTop: '8px', 
                      fontSize: '13px', 
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <i className="fas fa-info-circle"></i>
                      This report will be visible to the patient and can include diagnosis details, treatment plan, and any important medical observations.
                    </p>
                  </div>

                  <div className="action-buttons">
                    <button onClick={handleSaveToFirebase} className="save-btn">
                      Save Prescription
                    </button>
                  </div>
                </div>
              )}

              {prescriptions.length === 0 && (
                <div className="empty-state">
                  <p>No prescriptions added yet</p>
                </div>
              )}
            </div>
          )}

          {/* Classification Tab */}
          {activeTab === 'classification' && (
            <div className="classification-content">
              {/* Cancer Type Selection */}
              <div className="cancer-type-selector">
                <h2>Select Cancer Type</h2>
                <div className="cancer-type-cards">
                  {(Object.keys(cancerTypes) as CancerType[]).map((type) => (
                    <div
                      key={type}
                      className={`cancer-type-card ${selectedCancerType === type ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedCancerType(type);
                        handleResetClassification();
                      }}
                    >
                      <div className="cancer-type-icon">
                        <i className={cancerTypes[type].iconClass}></i>
                      </div>
                      <h3>{cancerTypes[type].name}</h3>
                      <p>{cancerTypes[type].description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upload Area */}
              <div className="upload-section">
                <h2>Upload Medical Image</h2>
                <div
                  className={`upload-area ${isDragging ? 'drag-over' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {previewUrl ? (
                    <div className="image-preview">
                      <img src={previewUrl} alt="Preview" />
                      <button className="remove-btn" onClick={(e) => {
                        e.stopPropagation();
                        handleResetClassification();
                      }}>
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <i className="fas fa-cloud-upload-alt" style={{ fontSize: '3rem', marginBottom: '1rem' }}></i>
                      <p>Click or drag and drop to upload image</p>
                      <span>PNG, JPG, JPEG (max 16MB)</span>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                </div>

                <button
                  className="classify-btn"
                  onClick={handleClassify}
                  disabled={!selectedFile || isClassifying}
                >
                  {isClassifying ? 'Classifying...' : 'Classify Image'}
                </button>
              </div>

              {/* Error */}
              {classificationError && (
                <div className="error-message">
                  <i className="fas fa-exclamation-circle"></i>
                  {classificationError}
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="success-message">
                  <i className="fas fa-check-circle"></i>
                  {successMessage}
                </div>
              )}

              {/* Results */}
              {classificationResult && (
                <div className="results-section">
                  <h2>Classification Results</h2>
                  
                  <div className="result-main">
                    <div className="result-header">
                      <h3>Predicted: {classificationResult.predicted_class}</h3>
                      <div className="confidence-badge" style={{
                        backgroundColor: classificationResult.confidence >= 80 ? '#4caf50' : 
                                       classificationResult.confidence >= 60 ? '#ff9800' : '#f44336'
                      }}>
                        {classificationResult.confidence.toFixed(2)}% Confidence
                      </div>
                    </div>
                    
                    <div className="cancer-type-badge">
                      <i className={cancerTypes[selectedCancerType].iconClass}></i>
                      {classificationResult.cancer_type}
                    </div>

                    {/* Confirm Button */}
                    <div className="confirm-diagnosis-section">
                      <button 
                        className="confirm-diagnosis-btn"
                        onClick={handleConfirmDiagnosis}
                      >
                        <i className="fas fa-check-circle"></i>
                        Confirm & Save Diagnosis to Patient Record
                      </button>
                      <p className="confirm-hint">
                        This will save "{classificationResult.predicted_class}" as the patient's diagnosed disease
                      </p>
                    </div>
                  </div>

                  <button className="secondary-btn" onClick={handleResetClassification}>
                    <i className="fas fa-redo"></i> Classify Another Image
                  </button>
                </div>
              )}

              {/* Information Panel */}
              <div className="info-panel" style={{ marginTop: '2rem' }}>
                <h3><i className="fas fa-info-circle"></i> About {cancerTypes[selectedCancerType].name} Classification</h3>
                <p>
                  This model can detect the following classes:
                </p>
                <ul>
                  {selectedCancerType === 'brain' && (
                    <>
                      <li>Glioma</li>
                      <li>Meningioma</li>
                      <li>No Tumor</li>
                      <li>Pituitary</li>
                    </>
                  )}
                  {selectedCancerType === 'lung' && (
                    <>
                      <li>Adenocarcinoma</li>
                      <li>Benign Tissue</li>
                      <li>Squamous Cell Carcinoma</li>
                    </>
                  )}
                  {selectedCancerType === 'skin' && (
                    <>
                      <li>Actinic Keratoses</li>
                      <li>Basal Cell Carcinoma</li>
                      <li>Benign Keratosis</li>
                      <li>Dermatofibroma</li>
                      <li>Melanocytic Nevi</li>
                      <li>Melanoma</li>
                      <li>Vascular Lesions</li>
                    </>
                  )}
                </ul>
                <div className="disclaimer">
                  <i className="fas fa-exclamation-triangle"></i>
                  <strong>Disclaimer:</strong> This tool is for educational and research purposes only. 
                  It should not be used as a substitute for professional medical advice, diagnosis, or treatment. 
                  Always consult with qualified healthcare professionals for medical decisions.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && classificationResult && (
        <div className="modal-overlay" onClick={() => setShowConfirmDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm Diagnosis</h2>
            <p>Are you sure you want to save this diagnosis to the patient's medical record?</p>
            
            <div className="diagnosis-summary">
              <div className="summary-item">
                <strong>Patient:</strong> 
                <span>{patientInfo.patientName || 'Unknown'}</span>
              </div>
              <div className="summary-item">
                <strong>Diagnosis:</strong> 
                <span>{classificationResult.predicted_class || 'N/A'}</span>
              </div>
              <div className="summary-item">
                <strong>Cancer Type:</strong> 
                <span>{classificationResult.cancer_type ? classificationResult.cancer_type.toUpperCase() : 'N/A'}</span>
              </div>
              <div className="summary-item">
                <strong>Confidence:</strong> 
                <span>{classificationResult.confidence ? `${classificationResult.confidence.toFixed(2)}%` : 'N/A'}</span>
              </div>
              <div className="summary-item">
                <strong>Doctor:</strong> 
                <span>{doctorInfo.doctorName || 'Unknown'}</span>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="modal-cancel-btn"
                onClick={() => setShowConfirmDialog(false)}
              >
                Cancel
              </button>
              <button 
                className="modal-confirm-btn"
                onClick={handleSaveDiagnosis}
              >
                <i className="fas fa-check"></i> Confirm & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
