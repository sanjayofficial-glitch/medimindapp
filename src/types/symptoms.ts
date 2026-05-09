export type SeverityLevel = "mild" | "moderate" | "severe";

export interface SymptomLog {
  id: string;
  familyMemberId: string;
  symptom: string;
  severity: SeverityLevel;
  date: string;
  time: string;
  notes?: string;
}