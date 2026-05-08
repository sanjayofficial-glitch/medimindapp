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
  const syncLock = useRef(false);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate("/login");
    }
  }, [user, isAuthLoading, navigate]);

  // Centralized Daily Sync Logic
  useEffect(() => {
    if (!user || isDataLoading || medicines.length === 0 || syncLock.current) return;

    const syncDailyLogs = async () => {
      // Check what's already in the database for today
      const existingKeys = new Set(
        todayLogs.map((log: DoseLog) => `${log.medicineId}-${normalizeTime(log.scheduledTime)}`)
      );

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

      syncLock.current = true;
      setIsSyncingSchedule(true);
      
      try {
        // Use upsert logic which respects the unique constraint we added
        await saveDoseLogsBatch.mutateAsync(missingLogs);
        await refetch();
      } catch (error) {
        console.error("Dashboard: Sync failed", error);
      } finally {
        setIsSyncingSchedule(false);
        // Keep lock for a short duration to prevent rapid re-triggers
        setTimeout(() => { syncLock.current = false; }, 2000);
      }
    };

    syncDailyLogs();
  }, [user, medicines, todayLogs, today, isDataLoading, saveDoseLogsBatch, refetch]);

  const handleSaveSchedule = async (editTimes: string[]) => {
    if (!editingMedicine) return;
    try {
      const sortedTimes = [...editTimes].sort();
      await updateMedicine.mutateAsync({ ...editingMedicine, times: sortedTimes });

      // Clean up old pending logs that are no longer in the schedule
      const nextTimeSet = new Set(editTimes.map(normalizeTime));
      const removableLogs = todayLogs.filter(
        (log: DoseLog) => 
          log.medicineId === editingMedicine.id && 
          log.status === "pending" && 
          !nextTimeSet.has(normalizeTime(log.scheduledTime))
      );

      if (removableLogs.length > 0) {
        await supabase.from("dose_logs").delete().in("id", removableLogs.map(l => l.id));
      }

      await refetch();
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
      await refetch();
      toast.success("Medicine removed");
      setMedicineToDelete(null);
    } catch (error) {
      toast.error("Failed to remove medicine");
    }
  };

  const handleSnooze = async (log: DoseLog) => {
    await supabase
      .from("dose_logs")
      .update({ notification_sent_at: null })
      .eq("id", log.id);
    refetch();
    toast.info("Reminding you again in 10 minutes");
  };

  const handleStatusUpdate = async (log: DoseLog, status: "taken" | "missed") => {
    try {
      const updatedLog: DoseLog = {
        ...log,
        status,
        actualTime: status === "taken" ? getCurrentTime24() : null
      };

      await saveDoseLog.mutateAsync(updatedLog);

      if (status === "taken") {
        const medicine = medicines.find(m => m.id === log.medicineId);
        if (medicine && medicine.stock !== undefined && medicine.stock > 0) {
          await updateMedicine.mutateAsync({ ...medicine, stock: medicine.stock - 1 });
        }
        toast.success(`${log.medicineName} taken!`);
      }
      refetch();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const takenCount = todayLogs.filter((l: DoseLog) => l.status === "taken").length;
  const totalToday = todayLogs.length;
  const progress = totalToday > 0 ? (takenCount / totalToday) * 100 : 0;
  const currentTime = getCurrentTime24();
  
  const pendingLogs = useMemo(() => 
    todayLogs.filter(l => l.status === "pending").sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime)),
    [todayLogs]
  );

  const visibleNextDoseLogs = useMemo(() => {
    const upcoming = pendingLogs.filter(l => normalizeTime(l.scheduledTime) >= currentTime);
    return upcoming.length > 0 ? upcoming : pendingLogs;
  }, [pendingLogs, currentTime]);

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background pb-32">
      <DashboardHeader user={user} onLogout={handleLogout} />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-primary mb-1">Welcome back,</p>
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
                <Button size="sm" className="rounded-full bg-primary text-primary-foreground" onClick={() => navigate("/add-medicine")}>
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
                isSaving={saveDoseLog.isPending || isSyncingSchedule}
              />
            </section>
            <InteractionChecker />
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
        isUpdating={updateMedicine.isPending}
        isDeleting={removeMedicine.isPending}
      />
    </motion.div>
  );
};

export default Dashboard;