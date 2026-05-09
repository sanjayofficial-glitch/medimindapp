import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Plus, LayoutGrid, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useDoseLogsForDate, useSaveDoseLog, useSaveDoseLogsBatch, useMedicines, useUpdateMedicine, useRemoveMedicine } from "@/hooks/use-queries";
import { DoseLog, Medicine } from "@/utils/storage";
import { toast } from "sonner";
import InteractionChecker from "@/components/InteractionChecker";
import DynamicAIInsight from "@/components/DynamicAIInsight";
import { getCurrentTime24, getLocalDateString, normalizeTime } from "@/utils/datetime";
import { addMinutes } from "date-fns";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardStats from "@/components/dashboard/DashboardStats";
import MedicationSchedule from "@/components/dashboard/MedicationSchedule";
import MedicationDialogs from "@/components/dashboard/MedicationDialogs";
import QuickActions from "@/components/dashboard/QuickActions";

const Dashboard = () => {
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  
  const today = getLocalDateString();
  const { data: todayLogs = [], isLoading: isLogsLoading, refetch } = useDoseLogsForDate(today);
  const { data: medicines = [], isLoading: isMedicinesLoading } = useMedicines();
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

  // Logic to create missing dose logs for today based on active medicines
  useEffect(() => {
    if (!user || isLogsLoading || isMedicinesLoading || medicines.length === 0 || dailySyncInFlight.current) return;

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

      // Track locally to prevent duplicate creation attempts during the same session
      const newKeys: string[] = [];
      missingLogs.forEach((log) => {
        const key = `${log.medicineId}-${log.scheduledTime}`;
        locallyCreatedDoseKeys.current.add(key);
        newKeys.push(key);
      });

      dailySyncInFlight.current = true;
      setIsSyncingSchedule(true);
      
      try {
        await saveDoseLogsBatch.mutateAsync(missingLogs);
        await refetch();
      } catch (error) {
        console.error("Failed to create daily dose logs:", error);
        // Clear keys on failure so we can try again
        newKeys.forEach(key => locallyCreatedDoseKeys.current.delete(key));
      } finally {
        dailySyncInFlight.current = false;
        setIsSyncingSchedule(false);
      }
    };

    createMissingDailyDoseLogs();
  }, [user, medicines, todayLogs, today, isLogsLoading, isMedicinesLoading, saveDoseLogsBatch, refetch]);

  const handleSaveSchedule = async (editTimes: string[]) => {
    if (!editingMedicine) return;
    try {
      await updateMedicine.mutateAsync({ ...editingMedicine, times: editTimes });
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
      setMedicineToDelete(null);
      toast.success("Medicine removed");
    } catch (error) {
      toast.error("Failed to remove medicine");
    }
  };

  const handleSnooze = async (log: DoseLog) => {
    try {
      const snoozeUntil = addMinutes(new Date(), 10).toISOString();
      const updatedLog: DoseLog = {
        ...log,
        snoozedUntil: snoozeUntil,
        notificationSentAt: null
      };
      await saveDoseLog.mutateAsync(updatedLog);
      toast.info(`Snoozed ${log.medicineName} for 10 minutes`);
      refetch();
    } catch (error) {
      toast.error("Failed to snooze reminder");
    }
  };

  const handleStatusUpdate = async (log: DoseLog, status: "taken" | "missed") => {
    try {
      const updatedLog: DoseLog = {
        ...log,
        status,
        actualTime: status === "taken" ? new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : null,
        snoozedUntil: null
      };
      await saveDoseLog.mutateAsync(updatedLog);
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
  
  const pendingLogs = useMemo(
    () => todayLogs
      .filter((l: DoseLog) => l.status === "pending")
      .sort((a: DoseLog, b: DoseLog) => a.scheduledTime.localeCompare(b.scheduledTime)),
    [todayLogs]
  );

  const isInitialLoading = isAuthLoading || (user && isLogsLoading && medicines.length === 0);

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
                todayLogs={todayLogs}
                medicines={medicines}
                onSnooze={handleSnooze}
                onStatusUpdate={handleStatusUpdate}
                onEdit={setEditingMedicine}
                onDelete={setMedicineToDelete}
                isSaving={saveDoseLog.isPending || isSyncingSchedule}
              />
            </section>
          </div>

          <div className="space-y-8">
            <DashboardStats 
              progress={progress}
              takenCount={takenCount}
              totalToday={totalToday}
              visibleNextDoseLogs={pendingLogs}
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