"use client";

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Pill, CheckCircle2, Clock, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toDisplayTime } from "@/utils/datetime";
import { DoseLog, Medicine } from "@/utils/storage";
import { scaleIn } from "@/lib/animations";

interface MedicationScheduleProps {
  todayLogs: DoseLog[];
  medicines: Medicine[];
  onSnooze: (log: DoseLog) => void;
  onStatusUpdate: (log: DoseLog, status: "taken" | "missed") => void;
  onEdit: (medicine: Medicine) => void;
  onDelete: (medicine: Medicine) => void;
  isSaving: boolean;
}

const MedicationSchedule = ({ 
  todayLogs, 
  medicines, 
  onSnooze, 
  onStatusUpdate, 
  onEdit, 
  onDelete,
  isSaving 
}: MedicationScheduleProps) => {
  const nowMinutes = () => new Date().getHours() * 60 + new Date().getMinutes();
  const to24hMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const sortedLogs = [...todayLogs].sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  if (sortedLogs.length === 0) {
    return (
      <div className="bg-card rounded-3xl p-10 text-center border-2 border-dashed border-border">
        <Pill className="w-8 h-8 text-muted-foreground/30 mx-auto mb-4" />
        <h4 className="text-sm font-bold text-foreground mb-4">No medications scheduled</h4>
        <Link to="/add-medicine">
          <Button variant="outline" className="rounded-full h-10 px-6 text-xs font-bold">Add First Medicine</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedLogs.map((log, i) => {
        const medicine = medicines.find((med) => med.id === log.medicineId);
        const overdue = log.status === "pending" && to24hMinutes(log.scheduledTime) < nowMinutes();

        return (
          <motion.div
            key={log.id}
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            custom={i}
            className={cn(
              "p-4 bg-card rounded-2xl border shadow-sm transition-all active:scale-[0.98]",
              log.status === "taken" ? "opacity-60" : "",
              overdue ? "border-rose-200 bg-rose-50/30" : "border-border"
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  log.status === "taken" ? "bg-primary/10 text-primary" : 
                  overdue ? "bg-rose-100 text-rose-600" : "bg-emerald-50 text-emerald-600"
                )}>
                  {log.status === "taken" ? <CheckCircle2 className="w-5 h-5" /> : <Pill className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground leading-tight">{log.medicineName}</h4>
                  <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> {toDisplayTime(log.scheduledTime)}
                    {overdue && <span className="text-rose-600 ml-1">• OVERDUE</span>}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-1">
                {medicine && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => onEdit(medicine)}>
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                )}
              </div>
            </div>

            {log.status === "pending" ? (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 h-10 rounded-xl text-xs font-bold border-emerald-100 text-emerald-700"
                  onClick={() => onSnooze(log)}
                >
                  Snooze
                </Button>
                <Button 
                  className="flex-[2] h-10 rounded-xl text-xs font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  onClick={() => onStatusUpdate(log, "taken")}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Take Now"}
                </Button>
              </div>
            ) : (
              <div className={cn(
                "w-full py-2 rounded-xl text-center text-[10px] font-black uppercase tracking-widest",
                log.status === "taken" ? "bg-primary/10 text-primary" : "bg-rose-100 text-rose-600"
              )}>
                {log.status}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default MedicationSchedule;