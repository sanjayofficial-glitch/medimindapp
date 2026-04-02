"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Pill, LogOut, Plus, Calendar, TrendingUp, CheckCircle2, Flame } from "lucide-react";
import MedicineCard from "@/components/MedicineCard";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { cancelNotification, snoozeNotification, type NotificationAction } from "@/utils/notifications";

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  time: string;
  frequency: string;
  taken: boolean;
  takenAt?: string;
  instructions?: string;
}

interface DoseLog {
  medicineId: string;
  scheduledTime: string;
  takenTime: string;
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

  useEffect(() => {
    localStorage.setItem("medimind_medicines", JSON.stringify(medicines));
  }, [medicines]);

  useEffect(() => {
    const handleNotificationAction = (event: Event) => {
      const { type, medicineId } = (event as CustomEvent<NotificationAction>).detail;
      const medicine = medicines.find(m => m.id === medicineId);
      if (!medicine) return;

      if (type === "taken") {
        handleToggleTaken(medicineId);
        toast.success("Marked as taken via notification!");
      } else if (type === "snooze") {
        snoozeNotification(medicineId, medicine.name, user?.name || "User");
        toast.info("Reminder snoozed for 10 minutes");
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
        return { ...m, taken: isNowTaken, takenAt: isNowTaken ? new Date().toISOString() : undefined };
      }
      return m;
    });

    setMedicines(updatedMedicines);

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
    </div>
  );
}