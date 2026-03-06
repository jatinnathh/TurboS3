// Import Firebase SDK functions
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCTRjbLC2Oe1dHLT0hIcSazr3lT5Rhaf7k",
  authDomain: "oncogenesis-c7bad.firebaseapp.com",
  projectId: "oncogenesis-c7bad",
  storageBucket: "oncogenesis-c7bad.firebasestorage.app",
  messagingSenderId: "371675542846",
  appId: "1:371675542846:web:738bb084509bc99b8be86f",
  measurementId: "G-PKGGTKKPS6",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// // Initialize core Firebase services
// export const auth = getAuth(app);
// export const db = getFirestore(app);
// export const storage = getStorage(app);

// Initialize Analytics only if supported (TypeScript-safe)
// let analytics: Analytics | null = null;
// isSupported().then((supported) => {
//   if (supported) {
//     analytics = getAnalytics(app);
//   }
// });

// export { app, analytics };
export { app };
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
