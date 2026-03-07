# Mediflow-3
Unable to deploy this project because the models were to large as they are built from scratch

A full-stack oncology platform that combines appointment management, AI-powered cancer image classification, and digital prescription management into a single system for doctors and patients.

---

## Overview

Mediflow-3 is built for oncology workflows. Doctors can view their scheduled appointments, start video consultations, issue digital prescriptions, and run AI cancer classification on medical images. Patients can browse available doctors, book time slots, pay online, and access their prescriptions. Both roles share a classification history so past AI results are always on hand.

---
<p align="center">
  <img src="https://github.com/jatinnathh/TurboS3/blob/main/public/Screenshot%202026-03-07%20002001.png" width="900"/>
  <img src="https://github.com/jatinnathh/TurboS3/blob/main/public/Screenshot%202026-03-07%20002207.png" width="900"/>
</p>

<p align="center">
  <img src="https://github.com/jatinnathh/TurboS3/blob/main/public/Screenshot%202026-03-07%20005510.png" width="900"/>
  <img src="https://github.com/jatinnathh/TurboS3/blob/main/public/Screenshot%202026-03-07%20011648.png" width="900"/>
</p>

<p align="center">
  <img src="https://github.com/jatinnathh/TurboS3/blob/main/public/Screenshot%202026-03-07%20011714.png" width="900"/>
  <img src="https://github.com/jatinnathh/TurboS3/blob/main/public/Screenshot%202026-03-07%20012016.png" width="900"/>
</p>

## Tech Stack

**Frontend**
- React 18 with TypeScript
- Vite
- React Router v6

**Backend / AI**
- Python (Flask) REST API
- PyTorch (custom CNN models)
- OpenCV, scikit-image (image preprocessing)
- GPU-accelerated inference (CUDA, falls back to CPU)

**Database / Auth**
- Firebase Authentication (email/password, role-based)
- Firebase Firestore (users, appointments, prescriptions, classification results)

**Payments**
- Razorpay (payment orders and signature verification)

**Video Calls**
- Google Meet (meeting links generated per appointment)

---

## Features
### AI Cancer Image Classification

**Classify an image** (`/classification`)

- Supports three cancer types:
  - **Brain Tumor** — classifies MRI scans into Glioma, Meningioma, No Tumor, or Pituitary
  - **Lung Cancer** — classifies histopathology images into Adenocarcinoma, Benign Tissue, or Squamous Cell Carcinoma
  - **Skin Cancer** — classifies lesion images into Actinic Keratoses, Basal Cell Carcinoma, Benign Keratosis, Dermatofibroma, Melanocytic Nevi, Melanoma, or Vascular Lesions
- Upload via file picker or drag-and-drop (PNG, JPG, JPEG, BMP, TIFF, max 16 MB)
- Returns predicted class and optionally shows full probability distribution for all classes with a confidence bar chart
- Results are saved to Firestore after every successful classification
### Gemini API integration for clinical support decisions
- Possible diagnosis
- Recommended tests
- Risk assessment
  
### Authentication and Role Management

- Email/password login via Firebase Authentication
- Two roles: **Doctor** and **Patient**
- Role-based routing: doctors go to `/doctor-dashboard`, patients go to `/patient-dashboard`
- Protected routes — unauthenticated users are redirected to `/login`

---

### Doctor Dashboard

- Displays today's scheduled appointments as clickable cards, sorted by time slot
- Displays the next 5 upcoming appointments sorted by date and time
- Each appointment card shows patient name, patient ID, email, time slot, payment status, and consultation fee
- Two quick actions per card: **Join Video Call** and **Write Prescription**
- Quick action cards to navigate to My Patients, Cancer Classification, Classification History, and Prescription History
- Doctor profile panel showing specialization, department, phone, and status

---

### Patient Dashboard

- Browse all available doctors with their specialization, department, and photo
- View each doctor's time slots (available vs booked)
- Book an appointment slot (₹500 consultation fee)
- Razorpay payment flow: order creation, payment gateway, signature verification, slot update
- After successful payment the appointment is recorded and the slot is marked booked
- Navigate to My Appointments and My Prescriptions from the header

---

### Appointment Management (Patient)

- `/booked-appointments` — lists all appointments the patient has booked with their status and details

---

### Video Calls

- `/video-call/:appointmentId` — opens a Google Meet video call associated with the appointment
- Accessible from the appointment card on the Doctor Dashboard

---

### Prescription System

**Doctor side — Create Prescription** (`/doctor/prescription`)

- Opened with patient context passed from an appointment card (patient ID, name, age, gender)
- Search and select medicines from a curated oncology database covering brain, lung, and skin cancer treatments
- Categories include Chemotherapy, Targeted Therapy, Immunotherapy, Hormone Therapy, Topical treatments, and Supportive Care
- Set duration (days) and frequency (times per day) per medicine; total doses calculated automatically
- Add multiple medicines to build a prescription
- Save prescription to Firestore
- Export prescription as a plain-text file

**Doctor side — Prescription History** (`/doctor/prescription-history`)

- View all prescriptions previously issued by the logged-in doctor

**Patient side — View Prescriptions** (`/patient/prescriptions`)

- View all prescriptions written for the logged-in patient

---

### Patient Records

- `/doctor/patients` — view medical records and profile information for all patients associated with the logged-in doctor

---



**Brain tumor preprocessing pipeline (server-side)**

- Bias field correction via Gaussian blur normalization
- CLAHE (Contrast Limited Adaptive Histogram Equalization)
- Gamma correction
- NL-means denoising
- Brain region masking via Otsu thresholding and morphological operations

**Classification History** (`/classification-history`)

- View all past classification results for the logged-in user (both doctors and patients)

---

### AI Backend (Flask API)

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Returns server status and list of loaded models |
| `/api/predict` | POST | Accepts image + `cancer_type` (brain/lung/skin), returns prediction |
| `/api/models` | GET | Returns metadata for all loaded models |
| `/api/models/brain/info` | GET | Detailed info for the brain model (version, accuracy, preprocessing) |

- GPU-accelerated via CUDA when available; falls back to CPU automatically
- Custom CNN architectures: `BrainTumorCNN`, `LungCNN`, `SkinCNN`

---

## Diagrams

### Activity Diagram — User Authentication and Role Routing

```mermaid
flowchart TD
    A([User opens app]) --> B[Navigate to /login]
    B --> C[Enter email and password]
    C --> D{Firebase Auth}
    D -- Invalid credentials --> E[Show error message]
    E --> C
    D -- Valid --> F{Fetch user role from Firestore}
    F -- role: doctor --> G[Redirect to /doctor-dashboard]
    F -- role: patient --> H[Redirect to /patient-dashboard]
    G --> I[Doctor views today's appointments and upcoming schedule]
    H --> J[Patient views available doctors and slots]
```

---

### Activity Diagram — Patient Appointment Booking and Payment

```mermaid
flowchart TD
    A([Patient on dashboard]) --> B[Browse available doctors]
    B --> C[Select an available time slot]
    C --> D[Create appointment record in Firestore\nstatus: scheduled, payment: pending]
    D --> E[Create Razorpay payment order\nvia backend API]
    E --> F[Open Razorpay payment gateway]
    F --> G{Payment outcome}
    G -- Cancelled or failed --> H[Show failure alert]
    H --> B
    G -- Success --> I[Verify Razorpay signature]
    I --> J[Update appointment with payment IDs\nstatus: paid]
    J --> K[Mark doctor's slot as booked]
    K --> L[Copy appointment to patient's\nbooked appointments subcollection]
    L --> M[Refresh doctor list to reflect slot change]
    M --> N([Booking confirmed])
```

---

### Activity Diagram — Doctor Consultation Workflow

```mermaid
flowchart TD
    A([Doctor on dashboard]) --> B{Select action from appointment card}
    B -- Join Video Call --> C[Navigate to /video-call/:appointmentId]
    C --> D[Open Google Meet link]
    D --> E([Consultation in progress])
    B -- Prescription --> F[Navigate to /doctor/prescription\nwith patient context]
    F --> G[Search and select medicine from oncology database]
    G --> H[Set duration in days and frequency per day]
    H --> I[Add medicine to prescription list]
    I --> J{Add more medicines?}
    J -- Yes --> G
    J -- No --> K{Choose action}
    K -- Save --> L[Save prescription to Firestore]
    K -- Export --> M[Download prescription as text file]
    L --> N([Prescription saved])
    M --> N
```

---

### Statechart — Appointment Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Initiated : Patient selects a slot
    Initiated --> PaymentPending : Appointment created in Firestore
    PaymentPending --> PaymentInProgress : Razorpay gateway opened
    PaymentInProgress --> PaymentFailed : Payment cancelled or failed
    PaymentInProgress --> Confirmed : Signature verified and slot booked
    PaymentFailed --> [*] : Booking aborted
    Confirmed --> ConsultationScheduled : Appears on Doctor Dashboard
    ConsultationScheduled --> VideoCallJoined : Doctor or patient joins Google Meet
    ConsultationScheduled --> PrescriptionIssued : Doctor writes prescription
    VideoCallJoined --> PrescriptionIssued : After consultation
    PrescriptionIssued --> [*] : Workflow complete
```

---

### Statechart — AI Classification Session

```mermaid
stateDiagram-v2
    [*] --> Idle : User opens /classification
    Idle --> CancerTypeSelected : User picks Brain / Lung / Skin
    CancerTypeSelected --> Idle : User changes cancer type (resets)
    CancerTypeSelected --> ImageUploaded : User uploads or drops an image
    ImageUploaded --> CancerTypeSelected : User removes image
    ImageUploaded --> Classifying : User clicks Classify Image
    Classifying --> ResultReady : Flask API returns prediction
    Classifying --> Error : API error or server unavailable
    Error --> ImageUploaded : User retries
    ResultReady --> ProbabilitiesVisible : User clicks View Probability Distribution
    ProbabilitiesVisible --> ResultReady : User hides probabilities
    ResultReady --> Idle : User clicks Classify Another Image
```

---

### Sequence Diagram — End-to-End Classification Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as React Frontend
    participant FB as Firebase Firestore
    participant PY as Flask AI Backend

    User->>UI: Select cancer type (brain/lung/skin)
    User->>UI: Upload medical image
    User->>UI: Click Classify Image
    UI->>PY: POST /api/predict (image + cancer_type)
    PY->>PY: Preprocess image\n(CLAHE, masking, denoising for brain)
    PY->>PY: Run CNN model inference
    PY-->>UI: Return predicted_class, confidence, all_probabilities
    UI->>UI: Display result and confidence bar
    UI->>FB: saveClassificationResult(userId, role, result)
    FB-->>UI: Document reference confirmed
    UI-->>User: Show result, optionally show probability chart
```

---

## Project Structure

```
oncogenesis/
├── backend/
│   ├── app.py                    # Flask API — model loading, preprocessing, prediction routes
│   ├── requirements.txt
│   └── src/
│       ├── brain/                # Brain tumor model checkpoints
│       ├── lungs/                # Lung cancer model checkpoints
│       └── skin/                 # Skin cancer model checkpoints
│
└── src/
    ├── contexts/
    │   └── AuthContext.tsx        # Firebase auth, user role, doctor profile context
    ├── services/
    │   ├── firebase.ts            # Firebase app initialization
    │   ├── userService.ts         # Fetch/update user profiles
    │   ├── appointmentService.ts  # CRUD for appointments, slot management
    │   ├── classificationService.ts # API calls to Flask backend, Firestore save
    │   ├── paymentService.ts      # Razorpay order creation and payment init
    │   └── addData.ts             # Utility to seed Firestore with doctor data
    ├── pages/
    │   ├── Login.tsx
    │   ├── BookedAppointments.tsx
    │   ├── VideoCall.tsx
    │   ├── Dashboard/
    │   │   ├── DoctorDashboard.tsx
    │   │   └── PatientDashboard.tsx
    │   ├── Prescription/
    │   │   ├── DoctorCreatePrescription.tsx
    │   │   ├── DoctorPrescriptionHistory.tsx
    │   │   └── PatientPrescriptionViewer.tsx
    │   ├── CancerClassification/
    │   │   └── CancerClassification.tsx
    │   ├── ClassificationHistory/
    │   │   └── ClassificationHistory.tsx
    │   └── PatientRecords/
    │       └── PatientRecordViewer.tsx
    └── components/
        ├── PrivateRoute.tsx
        └── DashboardRedirect.tsx
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- A Firebase project with Authentication and Firestore enabled
- A Razorpay account (test or live keys)

### Frontend

```bash
npm install
npm run dev
```

### AI Backend

```bash
cd backend
pip install -r requirements.txt
python app.py          # CPU
# or for GPU:
python run_gpu.py
```

Place trained model files in `backend/src/brain/`, `backend/src/lungs/`, and `backend/src/skin/` before starting the server.

### Environment Variables

Create a `.env` file in the project root:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_RAZORPAY_KEY_ID=
VITE_FLASK_API_URL=http://localhost:5000
```

---

## Important Disclaimer

The AI classification models are for educational and research purposes only. They must not be used as a substitute for professional medical diagnosis or treatment. Always consult qualified healthcare professionals for medical decisions.
