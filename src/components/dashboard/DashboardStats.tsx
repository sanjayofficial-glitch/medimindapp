"use client";

import { motion } from "framer-motion";
import { Trophy, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toDisplayTime } from "@/utils/datetime";

interface ScheduleItem {
  id: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  familyMemberId: string;
  scheduledTime: string;
  status: "pending" | "taken" | "missed";
  actualTime: string | null;
}

interface DashboardStatsProps {
  progress: number;
  takenCount: number;
  totalToday: number;
  visibleNextDoseLogs: ScheduleItem[];
  currentTime: string;
}

const DashboardStats = ({ progress, takenCount, totalToday, visibleNextDoseLogs, currentTime }: DashboardStatsProps) => {
  const nextDose = visibleNextDoseLogs[0];

  return (
    <div className="grid grid-cols-2 gap-3">
      <Card className="border-none shadow-sm bg-primary text-primary-foreground overflow-hidden col-span-2">
        <CardContent className="p-5">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider opacity-80">Daily Progress</p>
              <h4 className="text-4xl font-black">{Math.round(progress)}%</h4>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold opacity-80">{takenCount}/{totalToday} Doses</p>
            </div>
          </div>
          <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: `${progress}%` }} 
              className="h-full bg-white" 
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-card">
        <CardContent className="p-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Next Dose</p>
          {nextDose ? (
            <div>
              <div className="flex items-center gap-1 text-primary font-black text-lg">
                <Clock className="w-4 h-4" />
                {toDisplayTime(nextDose.scheduledTime)}
              </div>
              <p className="text-[10px] text-muted-foreground truncate font-medium">{nextDose.medicineName}</p>
            </div>
          ) : (
            <p className="text-sm font-bold text-primary">All Done!</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-card">
        <CardContent className="p-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Streak</p>
          <div className="flex items-center gap-1 text-amber-500 font-black text-lg">
            <Trophy className="w-4 h-4" />
            12 Days
          </div>
          <p className="text-[10px] text-muted-foreground font-medium">Keep it up!</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;