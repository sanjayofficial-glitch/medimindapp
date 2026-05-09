export type VitalType = "blood_pressure" | "heart_rate" | "temperature" | "weight" | "blood_sugar" | "oxygen";

export interface VitalLog {
  id: string;
  familyMemberId: string;
  type: VitalType;
  value: string;
  unit: string;
  date: string;
  time: string;
  notes?: string;
}