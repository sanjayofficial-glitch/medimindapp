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
    scheduleItems.filter(item => item.status === "pending"),
    [scheduleItems]
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
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between"
        >
          <div>
            <p className="text-sm font-medium text-primary mb-1">Good morning,</p>
            <h2 className="text-3xl font-bold text-foreground">{user?.user_metadata?.name || "Patient"}</h2>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            className="md:hidden rounded-2xl h-12 w-12 border-emerald-100 text-emerald-600"
            onClick={() => navigate("/hub")}
          >
            <LayoutGrid className="w-6 h-6" />
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-foreground">Today's Schedule</h3>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="text-primary font-bold"
                  onClick={() => navigate("/add-medicine")}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
              
              <MedicationSchedule 
                scheduleItems={scheduleItems}
                medicines={medicines}
                onSnooze={handleSnooze}
                onStatusUpdate={handleStatusUpdate}
                onEdit={setEditingMedicine}
                onDelete={setMedicineToDelete}
                isSaving={saveDoseLog.isPending}
              />
            </section>
          </div>

          <div className="space-y-8">
            <DashboardStats 
              progress={progress}
              takenCount={takenCount}
              totalToday={totalToday}
              visibleNextDoseLogs={pendingItems}
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