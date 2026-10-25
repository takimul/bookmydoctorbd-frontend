export interface PrescribedMedicine {
  id?: string;
  brandName: string;
  genericName?: string;
  dosageForm: string; // e.g. "Tablet", "Capsule", "Syrup"
  strength?: string;  // e.g. "500mg"
  dosageInstruction: string; // e.g. "1 + 0 + 1"
  timing: string; // e.g. "After meal"
  durationDays: number;
  specialInstructions?: string;
}

export interface PrescriptionVitals {
  bp?: string;
  pulse?: string;
  weight?: string;
  temperature?: string;
  spo2?: string;
}

export interface Prescription {
  id: string;
  prescriptionNumber?: string;
  medicalCaseId: string;
  chiefComplaints?: string | null;
  clinicalFindings?: string | null;
  diagnosis?: string | null;
  vitals?: PrescriptionVitals | null;
  advice?: string | null;
  followUpDate?: string | null;
  items: PrescribedMedicine[];
  issuedAt: string;
}

export interface LabTestInvestigation {
  id: string;
  testName: string;
  instructions?: string;
  status?: string;
}

