import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import DoctorDashboard from './pages/Dashboard/DoctorDashboard';
import PatientDashboard from './pages/Dashboard/PatientDashboard';
import VideoCall from './pages/VideoCall';
import BookedAppointments from './pages/BookedAppointments';
import PrivateRoute from './components/PrivateRoute';
import DashboardRedirect from './components/DashboardRedirect';
import PrescriptionPage from './pages/Prescription/DoctorPrescriptionPage';
import CancerClassification from './pages/CancerClassification/CancerClassification';
import ClassificationHistory from './pages/ClassificationHistory/ClassificationHistory';
import PatientRecordViewer from './pages/PatientRecords/PatientRecordViewer';
import PatientPrescriptionViewer from './pages/Prescription/PatientPrescriptionViewer';
import DoctorPrescriptionHistory from './pages/Prescription/DoctorPrescriptionHistory';
import './App.css';
function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Dashboard redirect based on user type */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardRedirect />
              </PrivateRoute>
            }
          />
          
          {/* Doctor Dashboard */}
          <Route
            path="/doctor-dashboard"
            element={
              <PrivateRoute>
                <DoctorDashboard />
              </PrivateRoute>
            }
          />
          
          {/* Patient Dashboard */}
          <Route
            path="/patient-dashboard"
            element={
              <PrivateRoute>
                <PatientDashboard />
              </PrivateRoute>
            }
          />

          {/* Booked Appointments */}
          <Route
            path="/booked-appointments"
            element={
              <PrivateRoute>
                <BookedAppointments />
              </PrivateRoute>
            }
          />

          {/* Video Call Page */}
          <Route
            path="/video-call/:appointmentId"
            element={
              <PrivateRoute>
                <VideoCall />
              </PrivateRoute>
            }
          />
          <Route 
          path="/doctor/prescription"
          element={
            <PrivateRoute>
              <PrescriptionPage/>
            </PrivateRoute>
          }
          ></Route>

          {/* Cancer Classification */}
          <Route
            path="/classification"
            element={
              <PrivateRoute>
                <CancerClassification />
              </PrivateRoute>
            }
          />

          {/* Classification History */}
          <Route
            path="/classification-history"
            element={
              <PrivateRoute>
                <ClassificationHistory />
              </PrivateRoute>
            }
          />

          {/* Patient Records Viewer */}
          <Route
            path="/doctor/patients"
            element={
              <PrivateRoute>
                <PatientRecordViewer />
              </PrivateRoute>
            }
          />

          {/* Patient Prescription Viewer */}
          <Route
            path="/patient/prescriptions"
            element={
              <PrivateRoute>
                <PatientPrescriptionViewer />
              </PrivateRoute>
            }
          />

          {/* Doctor Prescription History */}
          <Route
            path="/doctor/prescription-history"
            element={
              <PrivateRoute>
                <DoctorPrescriptionHistory />
              </PrivateRoute>
            }
          />
          
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
