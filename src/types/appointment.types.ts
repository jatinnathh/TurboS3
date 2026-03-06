// Appointment status types
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';

// Payment status types
export type PaymentStatus = 'pending' | 'completed' | 'failed';

// Appointment interface
export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  doctorId: string;
  doctorName: string;
  doctorEmail: string;
  timeSlot: string; // e.g., "09-10"
  appointmentDate: Date;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number;
  meetLink?: string; // Google Meet link
  createdAt: Date;
  updatedAt: Date;
}

// Chat message interface
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'patient' | 'doctor';
  message: string;
  timestamp: Date;
}

// Payment order interface
export interface PaymentOrder {
  orderId: string;
  amount: number;
  currency: string;
}

