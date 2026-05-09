"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Plus, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useDoseLogsForDate, useSaveDoseLog, useSaveDoseLogsBatch, useMedicines, useUpdateMedicine, useRemoveMedicine } from "@/hooks/use-queries";
import { DoseLog, Medicine } from "@/utils/storage";
import { toast } from "sonner";
import InteractionChecker from "@/components/InteractionChecker";
import DynamicAIInsight from "@/components/DynamicAIInsight";
import { getCurrentTime24, getLocalDateString, normalizeTime } from "@/utils/datetime";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardStats from "@/components/dashboard/DashboardStats";
import MedicationSchedule from "@/components/dashboard/MedicationSchedule";
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
    toast.info(`Snoozed ${log.medicineName} for 10 minutes`);
  };

  const handleStatusUpdate = async (log: DoseLog, status: "taken" | "missed") => {
    try {
      const updatedLog: DoseLog = {
        ...log,
        status,
        actualTime: status === "taken" ? new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : null
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

  if (isAuthLoading || (user && isDataLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm text-muted-foreground font-medium">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center">
      <div className="w-full max-w-md flex flex-col min-h-screen pb-32">
        <DashboardHeader user={user} onLogout={handleLogout} />

        <main className="flex-1 px-4 py-6 space-y-8">
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
              className="rounded-2xl h-12 w-12 border-emerald-100 text-emerald-600"
              onClick={() => navigate("/hub")}
            >
              <LayoutGrid className="w-6 h-6" />
            </Button>
          </motion.div>

          <DashboardStats 
            progress={progress}
            takenCount={takenCount}
            totalToday={totalToday}
            visibleNextDoseLogs={pendingLogs}
            currentTime={currentTime}
          />

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-foreground">Today's Schedule</h3>
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
              isSaving={saveDoseLog.isPending}
            />
          </section>

          <DynamicAIInsight />
          <InteractionChecker />
        </main>
      </div>

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