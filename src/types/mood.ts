export type MoodType = "great" | "good" | "okay" | "bad" | "awful";

export interface MoodLog {
  id: string;
  familyMemberId: string;
  mood: MoodType;
  date: string;
  notes?: string;
  createdAt?: string;
}