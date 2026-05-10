export interface ScheduleItem {
  id: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  familyMemberId: string;
  scheduledTime: string;
  status: "pending" | "taken" | "missed";
  actualTime: string | null;
}

export interface DashboardStatsProps {
  progress: number;
  takenCount: number;
  totalToday: number;
  visibleNextDoseLogs: ScheduleItem[];
  currentTime?: string;
}