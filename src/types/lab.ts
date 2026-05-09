export interface LabResult {
  id: string;
  familyMemberId: string;
  testName: string;
  value: string;
  unit: string;
  date: string;
  notes?: string;
  normalRange?: string;
  file_url?: string;
}