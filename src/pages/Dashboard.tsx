"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useDoseLogsForDate, useSaveDoseLog, useSaveDoseLogsBatch, useMedicines, useUpdateMedicine, useRemoveMedicine } from "@/hooks/use-queries";
import { DoseLog, Medicine } from "@/utils/storage";
import { toast } from "sonner";
import InteractionChecker from "@/components/InteractionChecker";
import DynamicAIInsight from "@/components/DynamicAIInsight";
import { supabase } from "@/integrations/supabase/client";
import { queryClient, QUERY_KEYS } from "@/lib/query-client";
import { getCurrentTime24, getLocalDateString, normalizeTime } from "@/utils/datetime";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardStats from "@/components/dashboard/DashboardStats";
import MedicationSchedule from "@/components/dashboard/MedicationSchedule";
import QuickActions from "@/components/dashboard/QuickActions";
import MedicationDialogs from "@/components/dashboard/MedicationDialogs";

const Dashboard = () => {
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  
  const today = getLocalDateString();
  const { data: todayLogs = [], isLoading: isDataLoading, refetch } = useDoseLogsForDate(today);
  const { data: medicines = [] } = useMedicines();
  const saveDoseLog = useSaveDoseLog();
  const saveDoseLogsBatch = useSaveDoseLogsBatch();
  const updateMedicine = useUpdateMedicine();
  const removeMedicine = useRemoveMedicine();

  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [medicineToDelete, setMedicineToDelete] = useState<Medicine | null>(null);
  const [isSyncingSchedule, setIsSyncingSchedule] = useState(false);
  const dailySyncInFlight = useRef(false);
  const locallyCreatedDoseKeys = useRef(new Set<string>());

  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate("/login");
    }
  }, [user, isAuthLoading, navigate]);

  useEffect(() => {
    if (!user || isDataLoading || medicines.length === 0 || isSyncingSchedule || dailySyncInFlight.current) return;

    const createMissingDailyDoseLogs = async () => {
      const existingKeys = new Set([
        ...todayLogs.map((log: DoseLog) => `${log.medicineId}-${normalizeTime(log.scheduledTime)}`),
        ...Array.from(locallyCreatedDoseKeys.current),
      ]);

      const missingLogs = medicines.flatMap((medicine: Medicine) =>
        (medicine.times || [])
          .map(normalizeTime)
          .filter((scheduledTime) => !existingKeys.has(`${medicine.id}-${scheduledTime}`))
          .map((scheduledTime) => ({
            id: crypto.randomUUID(),
            medicineId: medicine.id,
            medicineName: medicine.name,
            familyMemberId: medicine.familyMemberId,
            scheduledTime,
            actualTime: null,
            date: today,
            status: "pending",
          } as DoseLog))
      );

      if (missingLogs.length === 0) return;

      missingLogs.forEach((log) => locallyCreatedDoseKeys.current.add(`${log.medicineId}-${log.scheduledTime}`));
      dailySyncInFlight.current = true;
      setIsSyncingSchedule(true);
      try {
        await saveDoseLogsBatch.mutateAsync(missingLogs);
        await refetch();
      } catch (error) {
        console.error("Failed to create daily dose logs:", error);
      } finally {
        dailySyncInFlight.current = false;
        setIsSyncingSchedule(false);
      }
    };

    createMissingDailyDoseLogs();
  }, [user, medicines, todayLogs, today, isDataLoading, isSyncingSchedule, saveDoseLogsBatch, refetch]);

  const handleSaveSchedule = async (editTimes: string[]) => {
    if (!editingMedicine) return;
    if (editTimes.length === 0) {
      toast.error("Add at least one reminder time");
      return;
    }

    try {
      const sortedTimes = [...editTimes].sort();
      await updateMedicine.mutateAsync({ ...editingMedicine, times: sortedTimes });

      const nextTimeSet = new Set(editTimes.map(normalizeTime));
      const currentMedicineLogs = todayLogs.filter((log: DoseLog) => log.medicineId === editingMedicine.id);
      const removableLogs = currentMedicineLogs.filter(
        (log: DoseLog) => (log.status === "pending" || log.status === "partial") && !nextTimeSet.has(normalizeTime(log.scheduledTime))
      );

      if (removableLogs.length > 0) {
        const { error } = await supabase
          .from("dose_logs")
          .delete()
          .in("id", removableLogs.map((log: DoseLog) => log.id));
        if (error) throw new Error(error.message);
      }

      const existingTimesNormalized = new Set(
        currentMedicineLogs.map((log: DoseLog) => normalizeTime(log.scheduledTime))
      );
      
      const newLogs: DoseLog[] = [];
      for (const scheduledTime of editTimes) {
        if (existingTimesNormalized.has(normalizeTime(scheduledTime))) continue;
        newLogs.push({
          id: crypto.randomUUID(),
          medicineId: editingMedicine.id,
          medicineName: editingMedicine.name,
          familyMemberId: editingMedicine.familyMemberId,
          scheduledTime: normalizeTime(scheduledTime),
          actualTime: null,
          date: today,
          status: "pending",
        });
      }

      if (newLogs.length > 0) {
        await saveDoseLogsBatch.mutateAsync(newLogs);
      }

      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.doseLogsForDate(today) });
      await refetch();
      setEditingMedicine(null);
      toast.success("Reminder schedule updated");
    } catch (error) {
      console.error("Failed to update reminder schedule:", error);
      toast.error("Failed to update reminder schedule");
    }
  };

  const handleDeleteMedicine = async () => {
    if (!medicineToDelete) return;

    try {
      await removeMedicine.mutateAsync(medicineToDelete.id);
      await refetch();
      toast.success(`${medicineToDelete.name} reminders deleted`);
      setMedicineToDelete(null);
    } catch (error) {
      console.error("Failed to delete medicine:", error);
      toast.error("Failed to delete reminder");
    }
  };

  const handleSnooze = async (log: DoseLog) => {
    await supabase
      .from("dose_logs")
      .update({ notification_sent_at: null, notification_error: null })
      .eq("id", log.id)
      .eq("status", "pending");
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.doseLogsForDate(today) });
    toast.info(`Reminder snoozed for 10 minutes — we'll remind you again soon`, { duration: 4000 });
  };

  const handleStatusUpdate = async (log: DoseLog, status: "taken" | "missed") => {
    try {
      const updatedLog: DoseLog = {
        ...log,
        status,
        actualTime: status === "taken" ? new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : null
      };

      await saveDoseLog.mutateAsync(updatedLog);

      if (status === "taken") {
        const medicine = medicines.find(m => m.id === log.medicineId);
        if (medicine && medicine.stock !== undefined && medicine.stock > 0) {
          await updateMedicine.mutateAsync({ ...medicine, stock: medicine.stock - 1 });
          if (medicine.stock - 1 <= (medicine.refillAt || 5)) {
            toast.warning(`Low stock: ${medicine.name} (${medicine.stock - 1} left)`);
          }
        }
        toast.success(`${log.medicineName} marked as taken`);
      }

      refetch();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
    toast.success("Logged out successfully");
  };

  const takenCount = todayLogs.filter((l: DoseLog) => l.status === "taken").length;
  const pendingLogs = useMemo(
    () => todayLogs
      .filter((l: DoseLog) => l.status === "pending")
      .sort((a: DoseLog, b: DoseLog) => a.scheduledTime.localeCompare(b.scheduledTime)),
    [todayLogs]
  );
  
  const currentTime = getCurrentTime24();
  const upcomingDoseLogs = useMemo(
    () => pendingLogs.filter((l: DoseLog) => normalizeTime(l.scheduledTime) >= currentTime),
    [pendingLogs, currentTime]
  );
  
  const visibleNextDoseLogs = upcomingDoseLogs.length > 0 ? upcomingDoseLogs : pendingLogs;
  const totalToday = todayLogs.length;
  const progress = totalToday > 0 ? (takenCount / totalToday) * 100 : 0;

  if (isAuthLoading || (user && isDataLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm text-muted-foreground font-medium">Loading your health dashboard...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pb-32"
    >
      <DashboardHeader user={user} onLogout={handleLogout} />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-primary mb-1">Good morning,</p>
              <h2 className="text-3xl font-bold text-foreground">{user?.user_metadata?.name || "Patient"}</h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card px-4 py-2 rounded-full border border-border shadow-sm">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </motion.div>

        <DashboardStats 
          progress={progress}
          takenCount={takenCount}
          totalToday={totalToday}
          visibleNextDoseLogs={visibleNextDoseLogs}
          currentTime={currentTime}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-foreground">Today's Schedule</h3>
                <Button 
                  size="sm" 
                  className="rounded-full bg-primary text-primary-foreground"
                  onClick={() => navigate("/add-medicine")}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add New
                </Button>
              </div>
              
              <MedicationSchedule 
                todayLogs={todayLogs}
                medicines={medicines}
                onSnooze={handleSnooze}
                onStatusUpdate={handleStatusUpdate}
                onEdit={setEditingMedicine}
                onDelete={setMedicineToDelete}
                isSaving={saveDoseLog.isPending}
              />
            </section>

            <section>
              <InteractionChecker />
            </section>
          </div>

          <div className="space-y-8">
            <QuickActions />
            <DynamicAIInsight />
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
        isUpdating={updateMedicine.isPending || saveDoseLogsBatch.isPending}
        isDeleting={removeMedicine.isPending}
      />
    </motion.div>
  );
};

export default Dashboard;