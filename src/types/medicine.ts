export interface Medicine {
  id: string;
  familyMemberId: string;
  name: string;
  dosage: string;
  times: string[];
  frequency: string;
  additionalText?: string;
  stock?: number;
  refillAt?: number;
}

export interface DoseLog {
  id: string;
  medicineId: string;
  medicineName: string;
  familyMemberId: string;
  scheduledTime: string;
  actualTime: string | null;
  date: string;
  status: "pending" | "taken" | "missed" | "partial";
  notificationSentAt?: string | null;
  notificationError?: string | null;
  snoozedUntil?: string | null;
}

export interface Prescription {
  id: string;
  familyMemberId: string;
  title: string;
  imageUrl: string;
  pharmacyName: string;
  pharmacyPhone: string;
  expiryDate: string;
}