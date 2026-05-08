"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toDisplayTime } from "@/utils/datetime";
import { DoseLog } from "@/utils/storage";

interface DashboardStatsProps {
  progress: number;
  takenCount: number;
  totalToday: number;
  visibleNextDoseLogs: DoseLog[];
  currentTime: string;
}

const DashboardStats = ({ progress, takenCount, totalToday, visibleNextDoseLogs, currentTime }: DashboardStatsProps) => {
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <motion.div variants={itemVariants}>
        <Card className="border-none shadow-sm bg-card overflow-hidden h-full">
          <div className="h-1 bg-primary w-full" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Daily Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{Math.round(progress)}%</div>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{takenCount}/{totalToday} Doses</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${progress}%` }} 
                  className="h-full bg-primary" 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border-none shadow-sm bg-card h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Adherence Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold text-foreground">12 Days</div>
              <div className="px-2 py-1 text-[10px] font-bold rounded uppercase bg-primary/10 text-primary flex items-center gap-1">
                <Trophy className="w-3 h-3" /> Milestone
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Keep it up for a reward!</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border-none shadow-sm bg-card h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Next Dose</CardTitle>
          </CardHeader>
          <CardContent>
            {visibleNextDoseLogs.length > 0 ? (
              <div className="space-y-3">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {visibleNextDoseLogs.slice(0, 5).map((log) => {
                    const overdue = log.scheduledTime < currentTime;
                    return (
                      <div key={log.id} className={cn("min-w-[9rem] rounded-lg border bg-background px-3 py-2", overdue ? "border-rose-200" : "border-border")}>
                        <div className={cn("text-2xl font-bold", overdue ? "text-rose-600" : "text-foreground")}>
                          {toDisplayTime(log.scheduledTime)}
                        </div>
                        <p className="mt-1 truncate text-xs font-medium text-muted-foreground">{log.medicineName}</p>
                        {overdue && <div className="text-[10px] font-bold text-rose-500 mt-1">OVERDUE</div>}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {visibleNextDoseLogs.length > 0 ? `${visibleNextDoseLogs.length} pending dose${visibleNextDoseLogs.length !== 1 ? "s" : ""}` : "All clear"}
                </p>
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold text-primary">All Clear</div>
                <p className="text-xs text-muted-foreground mt-2">No pending doses today</p>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default DashboardStats;