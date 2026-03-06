import React, { useEffect, useState } from 'react';
import { Search, Plus, FileDown, Trash2 } from 'lucide-react';
import { useDoctorProfile } from '../../contexts/AuthContext';
import { db } from '../../services/firebase';
import { addDoc, collection } from 'firebase/firestore';
import './prescription.css';

// Medicine database - in production, import this from a separate file
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
  { id: 38, name: 'Acetaminophen (Tylenol)', category: 'Supportive Care', diseaseType: 'All Skin Cancer Types' }
];


interface PatientData {
  id: string;
  name: string;
  age: string;
  gender: string;
}

interface PrescriptionSystemProps {
  patientData?: PatientData;
}

interface Medicine {
  id: number;
  name: string;
  category: string;
}

interface Prescription {
  id: number;
  medicine: Medicine;
  days: number;
  timesPerDay: number;
  totalDoses: number;
}

export default function PrescriptionSystem({ patientData }: PrescriptionSystemProps) {
  const doctorProfile = useDoctorProfile();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [days, setDays] = useState('');
  const [timesPerDay, setTimesPerDay] = useState('');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [patientInfo, setPatientInfo] = useState({
    patientId: '',
    patientName: '',
    age: '',
    gender: ''
  });

  useEffect(() => {
    if (patientData) {
      setPatientInfo({
        patientId: patientData.id || 'P' + Date.now(),
        patientName: patientData.name || 'Unknown',
        age: patientData.age || '0',
        gender: patientData.gender || 'Not specified'
      });
    } else {
      console.warn('No patient data provided');
    }
  }, [patientData]);

  const doctorInfo = {
    doctorId: doctorProfile?.doctorId,
    doctorName: doctorProfile?.name,
    specialty: doctorProfile?.specialization
  };

  const filteredMedicines = MEDICINES.filter(med =>
    med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    med.category.toLowerCase().includes(searchTerm.toLowerCase())
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
      
      prescriptionDate: new Date().toISOString(),
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const prescriptionRef = await addDoc(collection(db, 'prescriptions'), prescriptionData);
      console.log('Prescription saved with ID:', prescriptionRef.id);
      alert('Prescription saved successfully!');
    } catch (error) {
      console.error('Error saving prescription:', error);
      alert('Error saving prescription');
    }
  };

  const handleExportPDF = () => {
    const content = `
PRESCRIPTION
${'='.repeat(50)}

Patient Information:
Name: ${patientInfo.patientName}
ID: ${patientInfo.patientId}
Age: ${patientInfo.age}
Gender: ${patientInfo.gender}

Doctor Information:
Name: ${doctorInfo.doctorName}
Specialty: ${doctorInfo.specialty}
ID: ${doctorInfo.doctorId}

Date: ${new Date().toLocaleDateString()}

${'='.repeat(50)}

PRESCRIBED MEDICINES:

${prescriptions.map((p, i) => `
${i + 1}. ${p.medicine.name}
   Category: ${p.medicine.category}
   Duration: ${p.days} days
   Frequency: ${p.timesPerDay} times per day
   Total Doses: ${p.totalDoses}
`).join('\n')}

${'='.repeat(50)}

Doctor's Signature: _____________________
Date: ${new Date().toLocaleDateString()}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prescription_${patientInfo.patientId}_${Date.now()}.txt`;
    a.click();
  };

  return (
    <div className="prescription-container">
      <div className="prescription-wrapper">
        {/* Header */}
        <div className="prescription-header">
          <h1>Doctor Prescription System</h1>
          <p>Create and manage patient prescriptions</p>
        </div>

        <div className="prescription-content">
          {/* Patient Information Display */}
          <div className="patient-info-section">
            <h2>Patient Information</h2>
            <div className="patient-info-grid">
              <div className="patient-info-item">
                <p>Patient ID</p>
                <p>{patientInfo.patientId}</p>
              </div>
              <div className="patient-info-item">
                <p>Patient Name</p>
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

          {/* Add Prescription Form */}
          <div className="prescription-form">
            {/* Medicine Search */}
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
              
              {/* Dropdown */}
              {showDropdown && (
                <div className="medicine-dropdown">
                  {searchTerm === '' ? (
                    MEDICINES.map(med => (
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
                        <div className="dropdown-medicine-category">{med.category}</div>
                      </div>
                    ))
                  ) : (
                    filteredMedicines.length > 0 ? (
                      filteredMedicines.map(med => (
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
                          <div className="dropdown-medicine-category">{med.category}</div>
                        </div>
                      ))
                    ) : (
                      <div className="dropdown-no-results">No medicines found</div>
                    )
                  )}
                </div>
              )}
              
              {selectedMedicine && (
                <div className="selected-medicine-text">
                  Selected: {selectedMedicine.name}
                </div>
              )}
            </div>

            {/* Days Input */}
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

            {/* Times per Day Input */}
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

          {/* Add Button */}
          <button onClick={handleAddPrescription} className="add-prescription-btn">
            <Plus size={20} />
            Add to Prescription
          </button>

          {/* Prescriptions Table */}
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

              {/* Action Buttons */}
              <div className="action-buttons">
                <button onClick={handleSaveToFirebase} className="save-btn">
                  Save to Database
                </button>
                <button onClick={handleExportPDF} className="export-btn">
                  <FileDown size={20} />
                  Export Prescription
                </button>
              </div>
            </div>
          )}

          {prescriptions.length === 0 && (
            <div className="empty-state">
              <p>No prescriptions added yet</p>
              <p>Add medicines using the form above</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}