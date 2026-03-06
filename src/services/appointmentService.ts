import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  getDocs,
  query,
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import type { Appointment } from '../types';
import { generateMeetLink } from '../utils/meetLinkGenerator';

// Create appointment
export const createAppointment = async (appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'meetLink'>): Promise<string> => {
  const appointmentId = `APT${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const appointmentRef = doc(db, 'appointments', appointmentId);
  
  // Generate Google Meet link
  const meetLink = generateMeetLink(appointmentId);
  
  await setDoc(appointmentRef, {
    ...appointmentData,
    meetLink,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return appointmentId;
};

// Update appointment after payment
export const updateAppointmentPayment = async (
  appointmentId: string,
  paymentDetails: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }
): Promise<void> => {
  const appointmentRef = doc(db, 'appointments', appointmentId);
  
  await updateDoc(appointmentRef, {
    paymentStatus: 'completed',
    razorpayOrderId: paymentDetails.razorpayOrderId,
    razorpayPaymentId: paymentDetails.razorpayPaymentId,
    razorpaySignature: paymentDetails.razorpaySignature,
    updatedAt: serverTimestamp(),
  });
};

// Update doctor slot after booking
export const updateDoctorSlot = async (
  doctorUserId: string,
  timeSlot: string
): Promise<void> => {
  const doctorRef = doc(db, 'doctors', doctorUserId);
  const slotPath = `slots.${timeSlot}`;
  
  await updateDoc(doctorRef, {
    [slotPath]: true, // true = booked
    updatedAt: serverTimestamp(),
  });
};

// Get all doctors
export const getAllDoctors = async () => {
  const doctorsRef = collection(db, 'doctors');
  const querySnapshot = await getDocs(doctorsRef);
  
  const doctors: any[] = [];
  querySnapshot.forEach((doc) => {
    doctors.push({
      id: doc.id,
      ...doc.data()
    });
  });
  
  return doctors;
};

// Get available doctors (with at least one available slot)
export const getAvailableDoctors = async () => {
  const doctors = await getAllDoctors();
  
  // Filter doctors with available slots
  return doctors.filter(doctor => {
    if (!doctor.slots) return false;
    return Object.values(doctor.slots).some(isBooked => !isBooked);
  });
};

// Get patient appointments
export const getPatientAppointments = async (patientId: string) => {
  const appointmentsRef = collection(db, 'appointments');
  const q = query(appointmentsRef, where('patientId', '==', patientId));
  const querySnapshot = await getDocs(q);
  
  const appointments: any[] = [];
  querySnapshot.forEach((doc) => {
    appointments.push({
      id: doc.id,
      ...doc.data()
    });
  });
  
  return appointments;
};

// Add appointment to patient's booked appointments subcollection
export const addToPatientBookedAppointments = async (
  patientUserId: string,
  appointmentData: any
): Promise<void> => {
  const bookedAppointmentRef = doc(
    db, 
    'patients', 
    patientUserId, 
    'bookedAppointments', 
    appointmentData.id
  );
  
  await setDoc(bookedAppointmentRef, {
    ...appointmentData,
    bookedAt: serverTimestamp(),
  });
};

// Get patient's booked appointments
export const getPatientBookedAppointments = async (patientUserId: string) => {
  const bookedAppointmentsRef = collection(db, 'patients', patientUserId, 'bookedAppointments');
  const querySnapshot = await getDocs(bookedAppointmentsRef);
  
  const appointments: any[] = [];
  querySnapshot.forEach((doc) => {
    appointments.push({
      id: doc.id,
      ...doc.data()
    });
  });
  
  // Sort by creation date, newest first
  return appointments.sort((a, b) => {
    const aTime = a.createdAt?.seconds || 0;
    const bTime = b.createdAt?.seconds || 0;
    return bTime - aTime;
  });
};

// Get doctor appointments
export const getDoctorAppointments = async (doctorId: string) => {
  const appointmentsRef = collection(db, 'appointments');
  const q = query(appointmentsRef, where('doctorId', '==', doctorId));
  const querySnapshot = await getDocs(q);
  
  const appointments: any[] = [];
  querySnapshot.forEach((doc) => {
    appointments.push({
      id: doc.id,
      ...doc.data()
    });
  });
  
  return appointments;
};

// Get appointment by ID
export const getAppointmentById = async (appointmentId: string): Promise<Appointment | null> => {
  const appointmentRef = doc(db, 'appointments', appointmentId);
  const appointmentSnap = await getDoc(appointmentRef);
  
  if (appointmentSnap.exists()) {
    return { id: appointmentSnap.id, ...appointmentSnap.data() } as Appointment;
  }
  
  return null;
};

