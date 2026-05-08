import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, Variants } from "framer-motion";
import { 
  Pill, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ChevronRight, 
  LogOut,
  Activity,
  Package,
  Sparkles,
  ShieldAlert,
  Trophy,
  Settings as SettingsIcon,
  Loader2,
  Pencil,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { useDoseLogsForDate, useSaveDoseLog, useMedicines, useUpdateMedicine, useRemoveMedicine } from "@/hooks/use-queries";
import { DoseLog, Medicine } from "@/utils/storage";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import InteractionChecker from "@/components/InteractionChecker";
import DynamicAIInsight from "@/components/DynamicAIInsight";
import { supabase } from "@/integrations/supabase/client";
import { queryClient, QUERY_KEYS } from "@/lib/query-client";
import { getCurrentTime24, getLocalDateString } from "@/utils/datetime";

import { iconPop, cardInteractive, chevronSlide, buttonTap, scaleIn } from "@/lib/animations";

const to24HourTime = (time: string) => {
  if (/^\d{2}:\d{2}$/.test(time)) return time;

  const [timePart, period = "AM"] = time.trim().split(" ");
  const [hourPart, minute = "00"] = timePart.split(":");
  let hour = Number(hourPart);
  if (Number.isNaN(hour)) return time;

  if (period.toUpperCase() === "PM" && hour < 12) hour += 12;
  if (period.toUpperCase() === "AM" && hour === 12) hour = 0;

  return `${hour.toString().padStart(2, "0")}:${minute.padStart(2, "0")}`;
};

const toDisplayTime = (time: string) => {
  const normalized = to24HourTime(time);
  const [hourStr, minute = "00"] = normalized.split(":");
  const hour = Number(hourStr);
  if (Number.isNaN(hour)) return time;

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${period}`;
};

const Dashboard = () => {
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  
  const today = getLocalDateString();
  const { data: todayLogs = [], isLoading: isDataLoading, refetch } = useDoseLogsForDate(today);
  const { data: medicines = [] } = useMedicines();
  const saveDoseLog = useSaveDoseLog();
  const updateMedicine = useUpdateMedicine();
  const removeMedicine = useRemoveMedicine();
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [editTimes, setEditTimes] = useState<string[]>([]);
  const [newEditTime, setNewEditTime] = useState("");
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
        ...todayLogs.map((log: DoseLog) => `${log.medicineId}-${log.scheduledTime}`),
        ...locallyCreatedDoseKeys.current,
      ]);

      const missingLogs = medicines.flatMap((medicine: Medicine) =>
        (medicine.times || [])
          .map(to24HourTime)
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
        for (const log of missingLogs) {
          await saveDoseLog.mutateAsync(log);
        }
        await refetch();
      } catch (error) {
        console.error("Failed to create daily dose logs:", error);
        toast.error("Could not refresh today's reminder schedule");
      } finally {
        dailySyncInFlight.current = false;
        setIsSyncingSchedule(false);
      }
    };

    createMissingDailyDoseLogs();
  }, [user, medicines, todayLogs, today, isDataLoading, isSyncingSchedule, saveDoseLog, refetch]);

  const openEditSchedule = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    setEditTimes((medicine.times || []).map((t: string) => to24HourTime(t)).sort());
    setNewEditTime("");
  };

  const addEditTime = () => {
    if (!newEditTime) return;
    const normalized = to24HourTime(newEditTime);
    setEditTimes((prev) => Array.from(new Set([...prev, normalized])).sort());
    setNewEditTime("");
  };

  const removeEditTime = (time: string) => {
    setEditTimes((prev) => prev.filter((item) => item !== time));
  };

  const handleSaveSchedule = async () => {
    if (!editingMedicine) return;
    if (editTimes.length === 0) {
      toast.error("Add at least one reminder time");
      return;
    }

    try {
      const sortedTimes = [...editTimes].sort();
      await updateMedicine.mutateAsync({ ...editingMedicine, times: sortedTimes });

      const nextTimeSet = new Set(editTimes.map((t: string) => to24HourTime(t)));
      const currentMedicineLogs = todayLogs.filter((log: DoseLog) => log.medicineId === editingMedicine.id);
      const removableLogs = currentMedicineLogs.filter(
        (log: DoseLog) => (log.status === "pending" || log.status === "partial") && !nextTimeSet.has(to24HourTime(log.scheduledTime))
      );

      if (removableLogs.length > 0) {
        const { error } = await supabase
          .from("dose_logs")
          .delete()
          .in("id", removableLogs.map((log: DoseLog) => log.id));
        if (error) throw new Error(error.message);
      }

      const existingTimesNormalized = new Set(
        currentMedicineLogs.map((log: DoseLog) => to24HourTime(log.scheduledTime))
      );
      for (const scheduledTime of editTimes) {
        if (existingTimesNormalized.has(to24HourTime(scheduledTime))) continue;
        await saveDoseLog.mutateAsync({
          id: crypto.randomUUID(),
          medicineId: editingMedicine.id,
          medicineName: editingMedicine.name,
          familyMemberId: editingMedicine.familyMemberId,
          scheduledTime: to24HourTime(scheduledTime),
          actualTime: null,
          date: today,
          status: "pending",
        });
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

  const to24h = (time: string): number => {
    const normalized = /^\d{2}:\d{2}$/.test(time) ? time : (() => {
      const [tp, p = "AM"] = time.trim().split(" ");
      const [h = "0", m = "0"] = tp.split(":");
      let hour = Number(h);
      if (Number.isNaN(hour)) return time;
      if (p.toUpperCase() === "PM" && hour < 12) hour += 12;
      if (p.toUpperCase() === "AM" && hour === 12) hour = 0;
      return `${hour.toString().padStart(2, "0")}:${m.padStart(2, "0")}`;
    })();
    const [h = "0", m = "0"] = normalized.split(":");
    return Number(h) * 60 + Number(m);
  };

  const nowMinutes = (): number => new Date().getHours() * 60 + new Date().getMinutes();
  const isOverdue = (log: DoseLog): boolean => log.status === "pending" && to24h(log.scheduledTime) < nowMinutes();

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
  const missedLogs = useMemo(
    () => {
      const nowMins = nowMinutes();
      return todayLogs
        .filter((l: DoseLog) => l.status === "missed" || (l.status === "pending" && to24h(l.scheduledTime) < nowMins))
        .sort((a: DoseLog, b: DoseLog) => a.scheduledTime.localeCompare(b.scheduledTime));
    },
    [todayLogs]
  );
  const currentTime = getCurrentTime24();
  const upcomingDoseLogs = useMemo(
    () => pendingLogs.filter((l: DoseLog) => l.scheduledTime >= currentTime),
    [pendingLogs, currentTime]
  );
  const overdueDoseLogs = useMemo(
    () => pendingLogs.filter((l: DoseLog) => l.scheduledTime < currentTime),
    [pendingLogs, currentTime]
  );
  const visibleNextDoseLogs = upcomingDoseLogs.length > 0 ? upcomingDoseLogs : pendingLogs;
  const takenLogs = todayLogs.filter((l: DoseLog) => l.status === "taken");
  const pendingCount = pendingLogs.length;
  const totalToday = todayLogs.length;
  const progress = totalToday > 0 ? (takenCount / totalToday) * 100 : 0;

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

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
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/dashboard">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Pill className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-foreground leading-tight">MediMind</h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Clinical Dashboard</p>
              </div>
            </div>
          </Link>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="destructive" 
              size="sm" 
              className="rounded-full shadow-lg shadow-destructive/20 animate-pulse"
              onClick={() => navigate("/emergency-id")}
            >
              <ShieldAlert className="w-4 h-4 mr-1" /> Emergency
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative h-8 w-8 rounded-full p-0 overflow-hidden border border-border">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'default'}`} alt="avatar" className="h-full w-full object-cover" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.user_metadata?.name || "Patient"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email || "patient@medimind.com"}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <motion.div variants={itemVariants} className="mb-8">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div variants={itemVariants}>
            <Card className="border-none shadow-sm bg-card overflow-hidden h-full">
              <div className="h-1 bg-primary w-full" />
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Daily Progress</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{Math.round(progress)}%</div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>{takenCount}/{totalToday} Doses</span></div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card className="border-none shadow-sm bg-card h-full">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Adherence Streak</CardTitle></CardHeader>
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
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Next Dose</CardTitle></CardHeader>
              <CardContent>
                {visibleNextDoseLogs.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {visibleNextDoseLogs.slice(0, 5).map((log: DoseLog) => {
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
                      {upcomingDoseLogs.length > 0 ? `${upcomingDoseLogs.length} upcoming dose${upcomingDoseLogs.length !== 1 ? "s" : ""}` : "Overdue — needs attention"}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-foreground">Today's Schedule</h3>
                <Link to="/add-medicine"><Button size="sm" className="rounded-full bg-primary text-primary-foreground"><Plus className="w-4 h-4 mr-1" /> Add New</Button></Link>
              </div>
              <div className="space-y-4">
                {(() => {
                  const allSorted = [...todayLogs].sort((a: DoseLog, b: DoseLog) => a.scheduledTime.localeCompare(b.scheduledTime));

                  if (allSorted.length === 0) return (
                    <div className="bg-card rounded-3xl p-12 text-center border-2 border-dashed border-border">
                      <Pill className="w-8 h-8 text-muted-foreground/30 mx-auto mb-4" />
                      <h4 className="text-lg font-bold text-foreground mb-2">No medications scheduled</h4>
                      <Link to="/add-medicine"><Button variant="outline" className="rounded-full">Get Started</Button></Link>
                    </div>
                  );

                  return allSorted.map((log: DoseLog, i: number) => {
                    const medicine = medicines.find((med: Medicine) => med.id === log.medicineId);
                    const overdue = log.status === "pending" && to24h(log.scheduledTime) < nowMinutes();
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
                          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {toDisplayTime(log.scheduledTime)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {medicine ? (
                          <>
                            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => openEditSchedule(medicine)} title="Edit reminder times">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-full text-destructive hover:text-destructive" onClick={() => setMedicineToDelete(medicine)} title="Delete medicine reminders">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : null}
                        {log.status === "pending" ? (
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" className="h-9 rounded-full text-xs border-amber-200 text-amber-700 hover:bg-amber-50" onClick={() => handleSnooze(log)} title="Snooze for 10 minutes">
                              <Clock className="w-3 h-3 mr-1" /> Snooze
                            </Button>
                            <Button className="h-10 px-6 rounded-full bg-primary text-primary-foreground" onClick={() => handleStatusUpdate(log, "taken")} disabled={saveDoseLog.isPending}>
                              {saveDoseLog.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Take Now"}
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
                  });
                })()}
              </div>
            </section>

            <section>
              <InteractionChecker />
            </section>
          </div>

          <div className="space-y-8">
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-foreground">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { to: "/appointments", icon: Calendar, title: "Appointments", sub: "Next: Dr. Smith", color: "bg-blue-500/10 text-blue-500" },
                  { to: "/lab-results", icon: Activity, title: "Lab Results", sub: "Track biomarkers", color: "bg-primary/10 text-primary" },
                  { to: "/mood", icon: Sparkles, title: "Mood Journal", sub: "Mental health", color: "bg-indigo-500/10 text-indigo-500" },
                  { to: "/wallet", icon: Package, title: "Rx Wallet", sub: "Digital documents", color: "bg-purple-500/10 text-purple-500" }
                ].map((action, i) => (
                  <Link key={i} to={action.to}>
                    <motion.div 
                      variants={cardInteractive}
                      initial="rest"
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <Card className="group hover:border-primary/50 transition-all cursor-pointer border-none shadow-sm bg-card overflow-hidden">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <motion.div 
                              variants={iconPop}
                              initial="rest"
                              whileHover="hover"
                              whileTap="tap"
                              className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", action.color, "group-hover:bg-primary group-hover:text-primary-foreground")}
                            >
                              <action.icon className="w-5 h-5" />
                            </motion.div>
                            <div>
                              <p className="font-bold text-foreground">{action.title}</p>
                              <p className="text-xs text-muted-foreground">{action.sub}</p>
                            </div>
                          </div>
                          <motion.div variants={chevronSlide} initial="rest" whileHover="hover">
                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </motion.div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </section>

            <DynamicAIInsight />
          </div>
        </div>
      </main>

      <Dialog open={!!editingMedicine} onOpenChange={(open) => !open && setEditingMedicine(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Reminder Times</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-foreground">{editingMedicine?.name}</p>
              <p className="text-xs text-muted-foreground">{editingMedicine?.dosage}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-reminder-time">Add time</Label>
              <div className="flex gap-2">
                <Input
                  id="new-reminder-time"
                  type="time"
                  value={newEditTime}
                  onChange={(event) => setNewEditTime(event.target.value)}
                />
                <Button type="button" onClick={addEditTime}>Add</Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {editTimes.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => removeEditTime(time)}
                  className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                  title="Remove this reminder time"
                >
                  {toDisplayTime(time)} x
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditingMedicine(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveSchedule} disabled={updateMedicine.isPending || saveDoseLog.isPending}>
              {(updateMedicine.isPending || saveDoseLog.isPending) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!medicineToDelete} onOpenChange={(open) => !open && setMedicineToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this medicine reminder?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes {medicineToDelete?.name || "this medicine"} and its dose reminders. Use this when the course is completed or no longer needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMedicine.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleDeleteMedicine();
              }}
              disabled={removeMedicine.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMedicine.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default Dashboard;
