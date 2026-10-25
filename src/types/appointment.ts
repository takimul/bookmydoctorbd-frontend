import { DoctorProfile, Chamber } from './doctor';
import { User } from './user';

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export interface AppointmentSlotAvailability {
  id: string;
  chamberId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotTitle: string;
  slotDurationMinutes: number;
  maxCapacity: number;
  bookedCount: number;
  availableCount: number;
  isFull: boolean;
}

export interface ChamberSlotsResponse {
  success: boolean;
  chamber: {
    id: string;
    name: string;
    address: string;
    consultationFee: number;
    doctorName: string;
  };
  date: string;
  dayOfWeek: number;
  isDoctorOnLeave: boolean;
  leaveReason?: string | null;
  totalSlots: number;
  availableSlotsCount: number;
  slots: AppointmentSlotAvailability[];
}

export interface Appointment {
  id: string;
  appointmentNumber: string;
  doctorId: string;
  chamberId: string;
  patientUserId?: string | null;
  patientName: string;
  patientPhone: string;
  patientEmail?: string | null;
  appointmentDate: string;
  timeSlot: string;
  serialNumber: number;
  status: AppointmentStatus;
  problemDescription?: string | null;
  isGuestBooking: boolean;
  doctor?: DoctorProfile;
  chamber?: Chamber;
  patientUser?: User;
  createdAt: string;
  updatedAt: string;
}

