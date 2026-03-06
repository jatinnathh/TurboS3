import { collection, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase.ts';
import type {
  Doctor,
  Patient,
  Management,
  BaseUser,
  UserType,
  DoctorRegistrationData,
  PatientRegistrationData,
  ManagementRegistrationData
} from '../types';

// Generate unique IDs
const generateDoctorId = () => `DOC${Date.now()}${Math.floor(Math.random() * 1000)}`;
const generatePatientId = () => `PAT${Date.now()}${Math.floor(Math.random() * 1000)}`;
const generateEmpId = () => `EMP${Date.now()}${Math.floor(Math.random() * 1000)}`;

// Create base user document
export const createBaseUser = async (
  userId: string,
  email: string,
  userType: UserType
): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  const userData: Omit<BaseUser, 'id' | 'createdAt' | 'updatedAt'> = {
    email,
    userType,
    isVerified: false,
  };

  await setDoc(userRef, {
    ...userData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

// Generate default profile image for doctor
const generateDoctorImageUrl = () => {
  return './placeholder.jpg';
};

// Generate default time slots for doctor
const generateDefaultSlots = () => {
  return {
    '09-10': false,
    '10-11': false,
    '11-12': false,
    '12-13': false,
    '14-15': false,
    '15-16': false,
    '16-17': false,
    '17-18': false,
  };
};

// Create doctor profile
export const createDoctorProfile = async (
  userId: string,
  email: string,
  data: DoctorRegistrationData
): Promise<string> => {
  const doctorId = generateDoctorId();
  const doctorRef = doc(db, 'doctors', userId);

  const doctorData: Omit<Doctor, 'id' | 'createdAt' | 'updatedAt'> = {
    userId,
    doctorId,
    email,
    name: data.name,
    specialization: data.specialization || '',
    department: data.department || '',
    phone: data.phone || '',
    imageUrl: generateDoctorImageUrl(),
    slots: generateDefaultSlots(),
    status: 'active',
  };

  await setDoc(doctorRef, {
    ...doctorData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return doctorId;
};

// Create patient profile
export const createPatientProfile = async (
  userId: string,
  email: string,
  data: PatientRegistrationData
): Promise<string> => {
  const patientId = generatePatientId();
  const patientRef = doc(db, 'patients', userId);

  const patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'dateOfBirth'> & { dateOfBirth?: string } = {
    userId,
    patientId,
    email,
    name: data.name,
    phone: data.phone || '',
    address: data.address || '',
    dateOfBirth: data.dateOfBirth || '',
    gender: data.gender,
    emergencyContact: data.emergencyContact || '',
  };

  await setDoc(patientRef, {
    ...patientData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return patientId;
};

// Create management profile
export const createManagementProfile = async (
  userId: string,
  email: string,
  data: ManagementRegistrationData
): Promise<string> => {
  const empId = generateEmpId();
  const managementRef = doc(db, 'management', userId);

  const managementData: Omit<Management, 'id' | 'createdAt' | 'updatedAt'> = {
    userId,
    empId,
    email,
    name: data.name,
    role: data.role || '',
    department: data.department || '',
    phone: data.phone || '',
    status: 'active',
  };

  await setDoc(managementRef, {
    ...managementData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return empId;
};

// Get user profile by type
export const getUserProfile = async (
  userId: string,
  userType: UserType
): Promise<Doctor | Patient | Management | null> => {
  const collectionName = userType === 'doctor' ? 'doctors' :
    userType === 'patient' ? 'patients' :
      'management';

  const profileRef = doc(db, collectionName, userId);
  const profileSnap = await getDoc(profileRef);

  if (profileSnap.exists()) {
    return { id: profileSnap.id, ...profileSnap.data() } as Doctor | Patient | Management;
  }

  return null;
};

// Get base user data
export const getBaseUser = async (userId: string): Promise<BaseUser | null> => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return { id: userSnap.id, ...userSnap.data() } as BaseUser;
  }

  return null;
};

