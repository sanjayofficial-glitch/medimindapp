import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Plus, LayoutGrid, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useTour } from "@/context/TourContext";
import { useOneSignal } from "@/hooks/use-one-signal";
import { useDoseLogsForDate, useSaveDoseLog, useMedicines, useUpdateMedicine, useRemoveMedicine } from "@/hooks/use-queries";
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
import { ScheduleItem } from "@/components/dashboard/types";

const Dashboard = () => {
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  
  const today = getLocalDateString();
  const { data: todayLogs = [], refetch } = useDoseLogsForDate(today);
  const { data: medicines = [], isLoading: isMedicinesLoading } = useMedicines();
  const saveDoseLog = useSaveDoseLog();
  const updateMedicine = useUpdateMedicine();
  const removeMedicine = useRemoveMedicine();

  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [medicineToDelete, setMedicineToDelete] = useState<Medicine | null>(null);
  const [isSyncingSchedule] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate("/login");
    }
  }, [user, isAuthLoading, navigate]);

  const { openTour, hasSeenOnboarding, markOnboardingSeen } = useTour();
  const { isEnabled: notificationsEnabled, isSupported, isConfigured, subscribe } = useOneSignal();

  useEffect(() => {
    if (user && !hasSeenOnboarding) {
      const tourSteps = [
        { id: "notifications", target: "", titleKey: "tour.notifications", descKey: "tour.notificationsDesc", position: "center" as const },
        { id: "header", target: "tour-header", titleKey: "tour.appHeader", descKey: "tour.appHeaderDesc", position: "bottom" as const },
        { id: "emergency", target: "tour-emergency", titleKey: "tour.emergency", descKey: "tour.emergencyDesc", position: "bottom" as const },
        { id: "ai-toggle", target: "tour-ai-toggle", titleKey: "tour.aiAssistant", descKey: "tour.aiAssistantDesc", position: "bottom" as const },
        { id: "greeting", target: "tour-greeting", titleKey: "tour.greeting", descKey: "tour.greetingDesc", position: "bottom" as const },
        { id: "schedule", target: "tour-schedule", titleKey: "tour.schedule", descKey: "tour.scheduleDesc", position: "bottom" as const },
        { id: "add-btn", target: "tour-add-btn", titleKey: "tour.addMedicine", descKey: "tour.addMedicineDesc", position: "bottom" as const },
      ];
      
      const timer = setTimeout(() => {
        openTour(tourSteps);
        markOnboardingSeen();
      }, 3500);
      
      return () => clearTimeout(timer);
    }
  }, [user, hasSeenOnboarding, openTour, markOnboardingSeen]);

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
    const existingLog = todayLogs.find(log => 
      log.medicineId === item.medicineId && 
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
          familyMemberId: item.familyMemberId || "",
          scheduledTime: item.scheduledTime,
          actualTime: status === "taken" ? new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : null,
          date: today,
          status,
        };
        await saveDoseLog.mutateAsync(newLog);
      }
      await refetch();
    } catch (error) {
      console.error("Failed to update dose status:", error);
      toast.error(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isInitialLoading = isAuthLoading || (user && isMedicinesLoading);

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm text-muted-foreground font-medium">Loading your health dashboard...</p>
      </div>
    );
  }

  if (!user) return null;

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    if (hour >= 17 && hour < 21) return "Good Evening";
    return "Good Night";
  };

  const userName = user?.user_metadata?.name || "Patient";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader user={user} onLogout={handleLogout} />

      <main className="flex-1 container max-w-6xl mx-auto px-4 py-6 space-y-8">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between"
        >
          <div id="tour-greeting">
            <p className="text-sm font-medium text-primary mb-1">{getTimeBasedGreeting()}, {userName} — stay healthy 😊💚</p>
            <h2 className="text-3xl font-bold text-foreground hidden">{userName}</h2>
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
                <div className="flex items-center gap-3" id="tour-schedule">
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
                  id="tour-add-btn"
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