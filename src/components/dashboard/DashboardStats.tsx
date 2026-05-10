"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DashboardStatsProps } from "./types";

const DashboardStats = ({ progress, takenCount, totalToday, visibleNextDoseLogs }: DashboardStatsProps) => {
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
            <motion.div               initial={{ width: 0 }}               animate={{ width: `${progress}%` }} 
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
              <p className="text-[10px] text-muted-foreground truncate">{nextDose.medicineName}</p>
            </div>
          ) : (
            <p className="text-sm font-bold text-primary">All Done!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;
```

---

<dyad-write path="src/pages/Dashboard.tsx">
"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Loader2, Plus, LayoutGrid, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useDoseLogsForDate, useSaveDoseLog, useMedicines, useUpdateMedicine, useRemoveMedicine } from "@/hooks/use-queries";
import { DoseLog, Medicine } from "@/utils/storage";
import { toast } from "sonner";
import InteractionChecker from "@/components/InteractionChecker";
import DynamicAIInsight from "@/components/DynamicAIInsight";
import { getCurrentTime24, getLocalDateString, normalizeTime } from "@/utils/datetime";
import { addMinutes } from "date-fns";

const Dashboard = () => {
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  
  const today = getLocalDateString();
  const { data: todayLogs = [], refetch } = useDoseLogsForDate(today);
  const { data: medicines = [], isLoading: isMedicinesLoading } = useMedicines();

  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [medicineToDelete, setMedicineToDelete] = useState<Medicine | null>(null);
  // const [isSyncingSchedule, setIsSyncingSchedule] = useState(false); // <-- removed

  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate("/login");
    }
  }, [user, isAuthLoading, navigate]);

  // Build schedule items from medicines + dose log status - memoized for performance
  const scheduleItems = useMemo(() => {
    if (medicines.length === 0) return [];
    
    const logStatusMap = new Map<string, { status: string; actualTime: string | null }>();
    todayLogs.forEach(log => {
      const key = `${log.medicineId}-${normalizeTime(log.scheduledTime)}`;
      logStatusMap.set(key, { status: log.status, actualTime: log.actualTime });
    });

    const items: ScheduleItem[] = [];
    medicines.forEach(med => {
      (med.times || []).forEach(time => {
        const normalizedTime = normalizeTime(time);
        const key = `${med.id}-${normalizedTime}`;
        const logStatus = logStatusMap.get(key);
        
        items.push({
          id: key,
          medicineId: med.id,
          medicineName: med.name,
          dosage: med.dosage || "",
          familyMemberId: med.familyMemberId,
          scheduledTime: normalizedTime,
          status: (logStatus?.status as "pending" | "taken" | "missed") || "pending",
          actualTime: logStatus?.actualTime || null
        });
      });
    });

    return items.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  }, [medicines, todayLogs]);

  const pendingItems = useMemo(() => 
    scheduleItems.filter(item => item.status === "pending"),     [scheduleItems]
  );

  const takenCount = useMemo(() => 
    scheduleItems.filter(item => item.status === "taken").length, 
    [scheduleItems]
  );
  const totalToday = scheduleItems.length;
  const progress = totalToday > 0 ? (takenCount / totalToday) * 100 : 0;
  const currentTime = getCurrentTime24();

  const handleSaveSchedule = async (editTimes: string[]) => {
    if (!editingMedicine) return;
    try {
      await updateMedicine.mutateAsync({ ...editingMedicine, times: editTimes });
      setEditingMedicine(null);
      toast.success("Schedule updated");
    } catch (error) {
      toast.error("Failed to update schedule");
    }
  };

  const handleDeleteMedicine = async () => {
    if (!medicineToDelete) return;
    try {
      await removeMedicine.mutateAsync(medicineToDelete.id);
      setMedicineToDelete(null);
      toast.success("Medicine removed");
    } catch (error) {
      toast.error("Failed to remove medicine");
    }
  };

  const handleSnooze = async (item: ScheduleItem) => {
    // Create a dose log entry for snoozing
    const newLog: DoseLog = {
      id: crypto.randomUUID(),
      medicineId: item.medicineId,
      medicineName: item.medicineName,
      familyMemberId: item.familyMemberId,
      scheduledTime: item.scheduledTime,
      actualTime: null,
      date: today,
      status: "pending",
      snoozedUntil: addMinutes(new Date(), 10).toISOString()
    };
    try {
      await saveDoseLog.mutateAsync(newLog);
      toast.info(`Snoozed ${item.medicineName} for 10 minutes`);
      await refetch();
    } catch (error) {
      toast.error("Failed to snooze reminder");
    }
  };

  const handleStatusUpdate = async (item: ScheduleItem, status: "taken" | "missed") => {
    // Check if dose log exists, if not create one
    const existingLog = todayLogs.find(log =>       log.medicineId === item.medicineId && 
      normalizeTime(log.scheduledTime) === item.scheduledTime
    );

    try {
      if (existingLog) {
        const updatedLog: DoseLog = {
          ...existingLog,
          status,
          actualTime: status === "taken" ? new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : null,
          snoozedUntil: null
        };
        await saveDoseLog.mutateAsync(updatedLog);
      } else {
        // Create new dose log
        const newLog: DoseLog = {
          id: crypto.randomUUID(),
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          familyMemberId: item.familyMemberId,
          scheduledTime: item.scheduledTime,
          actualTime: status === "taken" ? new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : null,
          date: today,
          status,
        };
        await saveDoseLog.mutateAsync(newLog);
      }
      await refetch();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isInitialLoading = isAuthLoading || isMedicinesLoading;

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm text-muted-foreground font-medium">Loading your health dashboard...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader user={user} onLogout={handleLogout} />
      <main className="flex-1 container max-w-6xl mx-auto px-4 py-6 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-foreground mb-2">Today's Schedule</h3>
                  <AnimatePresence>
                    {isSyncingSchedule && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      >
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Syncing
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <Button                   size="sm" 
                  variant="ghost"
                  className="text-primary font-bold"
                  onClick={() => navigate("/add-medicine")} 
                >
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
            </section>

            <MedicationSchedule 
              scheduleItems={scheduleItems}
              medicines={medicines}
              onSnooze={handleSnooze}
              onStatusUpdate={handleStatusUpdate}
              onEdit={setEditingMedicine}
              onDelete={setMedicineToDelete}
              isSaving={saveDoseLog.isPending}
            />
          </div>

          <div className="lg:col-span-1">
            <DashboardStats 
              progress={progress}
              takenCount={takenCount}
              totalToday={totalToday}
              visibleNextDoseLogs={pendingItems}
              currentTime={currentTime}
            />
            <QuickActions />
            <DynamicAIInsight />
            <InteractionChecker />
          </div>
        </div>
      </main>

      <MedicationDialogs 
        editingMedicine={editingMedicine}
        setEditingMedicine={setEditingMedicine}
        medicineToDelete={medicineToDelete}
        setMedicineToDelete={setMedicineToDelete}
        onSaveSchedule={handleSaveSchedule}
        onDeleteMedicine={handleDeleteMedicine}
        isUpdating={updateMedicine.isPending}
        isDeleting={removeMedicine.isPending}
      />
    </div>
  );
};

export default Dashboard;