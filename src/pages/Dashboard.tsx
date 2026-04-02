"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Pill, LogOut, Plus, Calendar, TrendingUp, CheckCircle2, Flame, AlertTriangle } from "lucide-react";
import MedicineCard from "@/components/MedicineCard";
import SnoozeDialog from "@/components/SnoozeDialog";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { 
  cancelNotification, 
  snoozeNotification, 
  type NotificationAction,
  getSnoozeCount,
  incrementSnoozeCount,
  resetSnoozeCount,
  logSnoozeEvent
} from "@/utils/notifications";

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  time: string;
  frequency: string;
  taken: boolean;
  takenAt?: string;
  instructions?: string;
  missed?: boolean;
}

interface DoseLog {
  medicineId: string;
  scheduledTime: string;
  takenTime?: string;
  status: "taken" | "missed";
}

const initialMedicines: Medicine[] = [
  { id: "1", name: "Metformin", dosage: "500mg", time: "08:00", frequency: "Daily", taken: true, instructions: "Take with food" },
  { id: "2", name: "Lisinopril", dosage: "10mg", time: "09:00", frequency: "Daily", taken: false },
  { id: "3", name: "Vitamin D3", dosage: "2000 IU", time: "12:00", frequency: "Daily", taken: false, instructions: "Take with lunch" },
  { id: "4", name: "Atorvastatin", dosage: "20mg", time: "20:00", frequency: "Daily", taken: false, instructions: "Take at bedtime" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>(() => {
    const stored = localStorage.getItem("medimind_medicines");
    return stored ? JSON.parse(stored) : initialMedicines;
  });
  const [streak, setStreak] = useState(() => {
    return parseInt(localStorage.getItem("medimind_streak") || "0", 10);
  });
  
  const [snoozeDialogOpen, setSnoozeDialogOpen] = useState(false);
  const [selectedMedicineForSnooze, setSelectedMedicineForSnooze] = useState<Medicine | null>(null);
  const [missedMedicines, setMissedMedicines] = useState<Medicine[]>([]);
  
  const medicinesRef = useRef(medicines);
  useEffect(() => { medicinesRef.current = medicines; }, [medicines]);

  useEffect(() => {
    localStorage.setItem("medimind_medicines", JSON.stringify(medicines));
  }, [medicines]);

  // Check for missed doses every minute
  useEffect(() => {
    const checkMissedDoses = () => {
      const now = new Date();
      const currentMeds = medicinesRef.current;
      
      const missed = currentMeds.filter(m => {
        if (m.taken || m.missed) return false;
        const [hours, minutes] = m.time.split(":").map(Number);
        const scheduled = new Date();
        scheduled.setHours(hours, minutes, 0, 0);
        const diffMs = now.getTime() - scheduled.getTime();
        return diffMs > 15 * 60 * 1000; // 15 minutes
      });
      
      if (missed.length > 0) {
        setMissedMedicines(missed);
        setMedicines(prev => {
          const hasChanges = prev.some(m => missed.find(missed => missed.id === m.id) && !m.missed);
          if (!hasChanges) return prev;
          return prev.map(m => 
            missed.find(missed => missed.id === m.id) ? { ...m, missed: true } : m
          );
        });
        
        const logs = JSON.parse(localStorage.getItem("medimind_dose_logs") || "[]");
        missed.forEach(m => {
          if (!logs.some((l: DoseLog) => l.medicineId === m.id && l.status === "missed")) {
            logs.push({ medicineId: m.id, scheduledTime: m.time, status: "missed" });
          }
        });
        localStorage.setItem("medimind_dose_logs", JSON.stringify(logs));
      }
    };

    checkMissedDoses();
    const interval = setInterval(checkMissedDoses, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleNotificationAction = (event: Event) => {
      const { type, medicineId } = (event as CustomEvent<NotificationAction>).detail;
      const medicine = medicines.find(m => m.id === medicineId);
      if (!medicine) return;

      if (type === "taken") {
        handleToggleTaken(medicineId);
        toast.success("Marked as taken via notification!");
      } else if (type === "snooze") {
        setSelectedMedicineForSnooze(medicine);
        setSnoozeDialogOpen(true);
      }
    };

    window.addEventListener("medimind_notification_action", handleNotificationAction);
    return () => window.removeEventListener("medimind_notification_action", handleNotificationAction);
  }, [medicines, user]);

  const takenCount = medicines.filter((m) => m.taken).length;
  const adherenceRate = medicines.length > 0 ? Math.round((takenCount / medicines.length) * 100) : 0;

  const handleToggleTaken = (id: string) => {
    const updatedMedicines = medicines.map((m) => {
      if (m.id === id) {
        const isNowTaken = !m.taken;
        return { ...m, taken: isNowTaken, takenAt: isNowTaken ? new Date().toISOString() : undefined, missed: false };
      }
      return m;
    });

    setMedicines(updatedMedicines);
    resetSnoozeCount(id);
    setMissedMedicines(prev => prev.filter(m => m.id !== id));

    const medicine = medicines.find(m => m.id === id);
    if (medicine && !medicine.taken) {
      const doseLog: DoseLog = {
        medicineId: id,
        scheduledTime: medicine.time,
        takenTime: new Date().toISOString(),
        status: "taken"
      };
      const logs = JSON.parse(localStorage.getItem("medimind_dose_logs") || "[]");
      logs.push(doseLog);
      localStorage.setItem("medimind_dose_logs", JSON.stringify(logs));

      toast.success("Great job! 💪 Keep the streak going!");

      const allTaken = updatedMedicines.every(m => m.taken);
      if (allTaken && updatedMedicines.length > 0) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        localStorage.setItem("medimind_streak", newStreak.toString());
      }
    }
  };

  const handleSnooze = (minutes: number) => {
    if (!selectedMedicineForSnooze) return;
    
    const count = getSnoozeCount(selectedMedicineForSnooze.id);
    incrementSnoozeCount(selectedMedicineForSnooze.id);
    logSnoozeEvent(selectedMedicineForSnooze.id, minutes);
    
    snoozeNotification(selectedMedicineForSnooze.id, selectedMedicineForSnooze.name, user?.name || "User", minutes);
    
    if (count >= 2) {
      toast.warning("⚠️ You've snoozed twice. Please take your medicine now.");
    } else {
      toast.info(`Reminder snoozed for ${minutes} minutes`);
    }
    
    setSnoozeDialogOpen(false);
    setSelectedMedicineForSnooze(null);
  };

  const handleDeleteMedicine = (id: string) => {
    cancelNotification(id);
    setMedicines((prev) => prev.filter((m) => m.id !== id));
    toast.info("Medicine & reminder removed");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      <header className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-[#4CAF50]/10 p-2 rounded-lg">
              <Pill className="w-5 h-5 text-[#4CAF50]" />
            </div>
            <span className="text-xl font-bold text-gray-800">MediMind</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-semibold text-orange-600">{streak} day streak</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-gray-500 hover:text-red-500">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {missedMedicines.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-orange-800 font-medium">
                You missed your {missedMedicines.map(m => m.name).join(", ")} dose ❤️ Take care
              </p>
              <p className="text-orange-600 text-sm mt-1">Consider rescheduling or taking it now if possible.</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            Good Morning, {user?.name || "User"} 👋
          </h2>
          <p className="text-gray-500">Here's your medication schedule for today.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Adherence</span>
                <TrendingUp className="w-4 h-4 text-[#4CAF50]" />
              </div>
              <div className="text-2xl font-bold text-gray-800 mb-1">{adherenceRate}%</div>
              <Progress value={adherenceRate} className="h-2 bg-gray-100" />
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Taken</span>
                <CheckCircle2 className="w-4 h-4 text-[#4CAF50]" />
              </div>
              <div className="text-2xl font-bold text-gray-800 mb-1">{takenCount}/{medicines.length}</div>
              <p className="text-xs text-gray-500">Doses completed today</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#4CAF50]" />
              Today's Schedule
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/add-medicine")}
              className="text-[#4CAF50] border-[#4CAF50]/30 hover:bg-[#4CAF50]/10"
            >
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>

          {medicines.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
              <Pill className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">Add your first medicine to get started</p>
              <Button onClick={() => navigate("/add-medicine")} className="bg-[#4CAF50] hover:bg-[#43A047]">
                Add Your First Medicine
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {medicines.map((med) => (
                <MedicineCard 
                  key={med.id} 
                  medicine={med} 
                  onToggleTaken={handleToggleTaken}
                  onEdit={() => {}}
                  onDelete={handleDeleteMedicine}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {selectedMedicineForSnooze && (
        <SnoozeDialog
          open={snoozeDialogOpen}
          onOpenChange={setSnoozeDialogOpen}
          onSnooze={handleSnooze}
          medicineName={selectedMedicineForSnooze.name}
          snoozeCount={getSnoozeCount(selectedMedicineForSnooze.id)}
        />
      )}
    </div>
  );
}