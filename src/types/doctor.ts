import { User } from './user';

export type DoctorVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface DoctorGalleryItem {
  url: string;
  title: string;
  category?: 'achievement' | 'certificate' | 'chamber' | 'award';
}

export interface ChamberSchedule {
  id: string;
  chamberId: string;
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  startTime: string; // e.g. "18:00"
  endTime: string;   // e.g. "21:00"
  slotTitle?: string | null;
  slotDurationMinutes: number;
  maxPatientsPerShift: number;
  isActive?: boolean;
}

export interface Chamber {
  id: string;
  doctorId: string;
  name: string;
  division: string;
  district: string;
  upazilaThana: string;
  address: string;
  contactPhone?: string | null;
  consultationFee: number;
  followUpFee: number;
  isActive: boolean;
  schedules?: ChamberSchedule[];
}

export interface DoctorLeave {
  id: string;
  doctorId: string;
  startDate: string;
  endDate: string;
  reason?: string | null;
}

export interface DoctorProfile {
  id: string;
  userId: string;
  user: User;
  bmdcRegNumber: string;
  gender?: string | null;
  specialties: string[];
  isVeterinary: boolean;
  degrees: string[];
  experienceYears: number;
  aboutBio?: string | null;
  profilePhotoUrl?: string | null;
  gallery?: DoctorGalleryItem[] | null;
  languages: string[];
  verificationStatus: DoctorVerificationStatus;
  profileScore: number;
  rating: number;
  totalReviews: number;
  baseConsultationFee: number;
  followUpFee: number;
  digitalFollowUpFee: number;
  isSponsored: boolean;
  chambers?: Chamber[];
  leaves?: DoctorLeave[];
}
