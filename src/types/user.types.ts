// User types
export type UserType = 'doctor' | 'patient' | 'management';

// Base User interface
export interface BaseUser {
  id: string;
  email: string;
  userType: UserType;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Doctor interface
export interface Doctor {
  id: string; // Firestore document ID
  userId: string; // Firebase Auth user ID
  doctorId: string; // Custom doctor ID
  name: string;
  email: string;
  phone: string;
  department: string;
  specialization: string;
  status: 'active' | 'inactive';
  slots: Record<string, boolean>; // e.g. { "09-10": true, "10-11": false }
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

// Management interface
export interface Management {
  id: string;
  userId: string;
  empId: string;
  name: string;
  role?: string;
  department?: string;
  phone?: string;
  status: 'active' | 'inactive';
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// Patient interface
export interface Patient {
  id: string;
  userId: string;
  patientId: string;
  name: string;
  phone?: string;
  address?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  emergencyContact?: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// Registration data interfaces
export interface DoctorRegistrationData {
  name: string;
  specialization?: string;
  department?: string;
  phone?: string;
}

export interface ManagementRegistrationData {
  name: string;
  role?: string;
  department?: string;
  phone?: string;
}

export interface PatientRegistrationData {
  name: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  emergencyContact?: string;
}

