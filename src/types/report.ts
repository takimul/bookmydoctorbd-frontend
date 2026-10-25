export interface PatientReport {
  id: string;
  medicalCaseId?: string | null;
  investigationOrderId?: string | null;
  patientPhone?: string | null;
  patientName?: string | null;
  testName: string;
  fileUrl: string;
  fileType: string;
  hospitalClinicName: string;
  reportDate: string;
  notes?: string | null;
  doctorId?: string | null;
  aiSummary?: string | null;
  uploadedAt: string;
}

export interface LabTestCatalogItem {
  id: string;
  name: string;
  category: string;
  specimen: string;
  fastingRequired: boolean;
  commonIndications: string[];
  department: string;
  turnaroundTime: string;
  sampleCollectionNote?: string;
}

