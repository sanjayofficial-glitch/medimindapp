"use client";

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Pill, Plus, CheckCircle2, Clock, Pencil, Trash2, Loader2 } from "lucide-react";
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
      <div className="bg-card rounded-3xl p-12 text-center border-2 border-dashed border-border">
        <Pill className="w-8 h-8 text-muted-foreground/30 mx-auto mb-4" />
        <h4 className="text-lg font-bold text-foreground mb-2">No medications scheduled</h4>
        <Link to="/add-medicine">
          <Button variant="outline" className="rounded-full">Get Started</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedLogs.map((log, i) => {
        const medicine = medicines.find((med) => med.id === log.medicineId);
        const overdue = log.status === "pending" && to24hMinutes(log.scheduledTime) < nowMinutes();
        const statusLabel = log.status === "taken" ? "taken" : log.status === "missed" ? "missed" : overdue ? "overdue" : "pending";

        return (
          <motion.div
            key={log.id}
            layout
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            custom={i}
            whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
            whileTap={{ scale: 0.99 }}
            className={cn(
              "flex items-center justify-between p-4 bg-card rounded-2xl border shadow-sm hover:shadow-md transition-shadow",
              log.status === "taken" ? "opacity-60 border-border" : "",
              log.status === "missed" ? "border-rose-200 bg-rose-50/30" : "",
              (log.status === "pending" && overdue) ? "border-rose-300 bg-rose-50/20" : "",
              log.status === "pending" && !overdue ? "border-amber-100" : ""
            )}
          >
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={cn("w-12 h-12 rounded-xl flex items-center justify-center",
                  log.status === "taken" ? "bg-primary/20 text-primary" :
                  log.status === "missed" ? "bg-rose-100 text-rose-600" :
                  overdue ? "bg-rose-100 text-rose-600" :
                  "bg-amber-100 text-amber-600"
                )}
              >
                {log.status === "taken" ? <CheckCircle2 className="w-6 h-6" /> : <Pill className="w-6 h-6" />}
              </motion.div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-foreground">{log.medicineName}</p>
                  {log.status === "taken" && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 25 }}>
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </motion.div>
                  )}
                </div>
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {toDisplayTime(log.scheduledTime)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {medicine && (
                <>
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => onEdit(medicine)} title="Edit reminder times">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-full text-destructive hover:text-destructive" onClick={() => onDelete(medicine)} title="Delete medicine reminders">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
              {log.status === "pending" ? (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="h-9 rounded-full text-xs border-amber-200 text-amber-700 hover:bg-amber-50" onClick={() => onSnooze(log)} title="Snooze for 10 minutes">
                    <Clock className="w-3 h-3 mr-1" /> Snooze
                  </Button>
                  <Button className="h-10 px-6 rounded-full bg-primary text-primary-foreground" onClick={() => onStatusUpdate(log, "taken")} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Take Now"}
                  </Button>
                </div>
              ) : (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={cn("px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest",
                    log.status === "taken" ? "bg-primary/20 text-primary" :
                    "bg-rose-100 text-rose-600"
                  )}
                >
                  {statusLabel}
                </motion.div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default MedicationSchedule;