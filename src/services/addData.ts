// ----------------------------
// FIREBASE SETUP
// ----------------------------
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

// 🧩 Paste your Firebase configuration here
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);

import { db, app } from "./firebase"

// ----------------------------
// DOCTOR DATA
// ----------------------------
const doctors = [
  {
    doctorId: "DOC1760984599907908",
    userId: "3jYziS8XTSYcoq7gdT4bFDTegAj2",
    name: "Gaurav Jhalani",
    email: "gauravjhalani@gmail.com",
    phone: "9338065181",
    department: "Chemotherapy",
    specialization: "Lung Cancer Specialist",
    status: "active",
    slots: { "09-10": true, "10-11": true, "14-15": true },
    imageUrl: "./placeholder.jpg"
  },
  {
    doctorId: "DOC1760984600012345",
    userId: "8bTyZp1YdEJ8Hk43jTfghNw2",
    name: "Dr. Priya Mehta",
    email: "priyamehta@hospital.com",
    phone: "9876543210",
    department: "Cardiology",
    specialization: "Heart Surgeon",
    status: "active",
    slots: { "09-10": true, "10-11": false, "14-15": true },
    imageUrl: "./placeholder.jpg"
  },
  {
    doctorId: "DOC1760984601122334",
    userId: "9pOqwe12AfRt56LopVbN34t",
    name: "Dr. Arjun Singh",
    email: "arjun.singh@hospital.com",
    phone: "9001234567",
    department: "Orthopedics",
    specialization: "Bone & Joint Specialist",
    status: "active",
    slots: { "09-10": false, "10-11": true, "14-15": true },
    imageUrl: "./placeholder.jpg"
  },
  {
    doctorId: "DOC1760984602233445",
    userId: "5LoPeRxVbFg8yUiW9vTe6jJ",
    name: "Dr. Neha Kapoor",
    email: "neha.kapoor@hospital.com",
    phone: "9823012345",
    department: "Dermatology",
    specialization: "Skin Specialist",
    status: "active",
    slots: { "09-10": true, "10-11": true, "14-15": false },
    imageUrl: "./placeholder.jpg"
  },
  {
    doctorId: "DOC1760984603344556",
    userId: "4ErTg78HiJoLp09MnQwZx8V",
    name: "Dr. Ramesh Iyer",
    email: "ramesh.iyer@hospital.com",
    phone: "9789097890",
    department: "Neurology",
    specialization: "Brain & Nerve Specialist",
    status: "active",
    slots: { "09-10": true, "10-11": true, "14-15": true },
    imageUrl: "./placeholder.jpg"
  },
  {
    doctorId: "DOC1760984604455667",
    userId: "2KjHwQp9LsVrZe0Fg7N8UxC",
    name: "Dr. Sneha Patil",
    email: "sneha.patil@hospital.com",
    phone: "9923344556",
    department: "Pediatrics",
    specialization: "Child Specialist",
    status: "active",
    slots: { "09-10": false, "10-11": true, "14-15": true },
    imageUrl: "./placeholder.jpg"
  },
  {
    doctorId: "DOC1760984605566778",
    userId: "7GhHjKl2BnM9Qw8VrD3Tx9S",
    name: "Dr. Karan Sharma",
    email: "karan.sharma@hospital.com",
    phone: "9811122233",
    department: "Ophthalmology",
    specialization: "Eye Surgeon",
    status: "active",
    slots: { "09-10": true, "10-11": true, "14-15": false },
    imageUrl: "./placeholder.jpg"
  },
  {
    doctorId: "DOC1760984606677889",
    userId: "6LoPmNxQrStVwYz8AhJkC7U",
    name: "Dr. Ananya Verma",
    email: "ananya.verma@hospital.com",
    phone: "9800023456",
    department: "Gynecology",
    specialization: "Women's Health Expert",
    status: "active",
    slots: { "09-10": true, "10-11": false, "14-15": true },
    imageUrl: "./placeholder.jpg"
  },
  {
    doctorId: "DOC1760984607788990",
    userId: "3HgDfPo2JkL8Nm9QwXtR6Vb",
    name: "Dr. Rohit Desai",
    email: "rohit.desai@hospital.com",
    phone: "9876000001",
    department: "ENT",
    specialization: "Ear, Nose & Throat Specialist",
    status: "active",
    slots: { "09-10": true, "10-11": true, "14-15": false },
    imageUrl: "./placeholder.jpg"
  },
  {
    doctorId: "DOC1760984608899001",
    userId: "1QwErTy3UiOp8AsDf9GhJkL",
    name: "Dr. Meera Sahu",
    email: "meera.sahu@hospital.com",
    phone: "9867543210",
    department: "Oncology",
    specialization: "Cancer Specialist",
    status: "active",
    slots: { "09-10": false, "10-11": true, "14-15": true },
    imageUrl: "./placeholder.jpg"
  }
];

// ----------------------------
// UPLOAD FUNCTION
// ----------------------------
async function uploadDoctors() {
  try {
    const doctorsRef = collection(db, "doctors");

    for (const docData of doctors) {
      await addDoc(doctorsRef, {
        ...docData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log(`✅ Added doctor: ${docData.name}`);
    }

    console.log("🎉 All doctors uploaded successfully!");
  } catch (error) {
    console.error("❌ Error uploading doctors:", error);
  }
}

// Run the script
export default uploadDoctors;
