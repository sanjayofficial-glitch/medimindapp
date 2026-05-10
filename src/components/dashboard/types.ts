import { DoseLog } from "@/utils/storage";

export interface DashboardStatsProps {
  progress: number;
  takenCount: number;
  totalToday: number;
  visibleNextDoseLogs: DoseLog[];
  currentTime?: string;
}