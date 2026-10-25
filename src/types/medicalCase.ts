import { Appointment } from './appointment';
import { DoctorProfile } from './doctor';
import { Prescription } from './prescription';
import { PatientReport } from './report';
import { User } from './user';

export type CaseStatus = 'ACTIVE' | 'RESOLVED' | 'CLOSED';

export interface MedicalCase {
  id: string;
  caseNumber: string;
  appointmentId?: string | null;
  patientUserId?: string | null;
  doctorId: string;
  chiefComplaints: string;
  diagnosis?: string | null;
  clinicalNotes?: string | null;
  status: CaseStatus;
  openedAt: string;
  closedAt?: string | null;
  appointment?: Appointment | null;
  doctor?: DoctorProfile;
  patientUser?: User | null;
  prescriptions: Prescription[];
  reports: PatientReport[];
}

export interface PatientHistoryResponse {
  success: boolean;
  patientUser?: User | null;
  appointmentsCount: number;
  appointments: Appointment[];
  medicalCases: MedicalCase[];
  reports: PatientReport[];
  vitalsHistory: Array<{
    date: string;
    caseNumber: string;
    doctorName?: string;
    vitals: any;
  }>;
  pastMedicines: Array<{
    brandName: string;
    genericName?: string;
    dosageForm: string;
    strength?: string;
    dosageInstruction: string;
    timing: string;
    durationDays: number;
    lastPrescribedDate: string;
    doctorName?: string;
    diagnosis?: string;
    timesPrescribed: number;
  }>;
  aiBrief: {
    patientIdentified: boolean;
    displayName: string;
    phone: string;
    totalVisits: number;
    knownAllergies: string[];
    chronicConditions: string[];
    bloodGroup: string;
    pastDiagnoses: string[];
    frequentlyPrescribedMedicines: any[];
    clinicalAlerts: string[];
  };
}
