export interface MedicineCatalogItem {
  id: string;
  brandName: string;
  genericName: string;
  dosageForm: string;
  strength: string;
  manufacturer?: string | null;
  defaultDose?: string | null;
  defaultTiming?: string | null;
  defaultDuration?: number | null;
  indications?: string[];
  unitPrice?: number | null;
}

