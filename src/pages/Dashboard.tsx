"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Pill, LogOut, Plus, Calendar, TrendingUp, CheckCircle2 } from "lucide-react";
import MedicineCard from "@/components/MedicineCard";
import AddMedicineDialog from "@/components/AddMedicineDialog";
import { useAuth } from "@/context/AuthContext";

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  time: string;
  frequency: string;
  taken: boolean;
  instructions?: string;
}

const initialMedicines: Medicine[] = [
  { id: "1", name: "Metformin", dosage: "500mg", time: "08:00", frequency: "Daily", taken: true, instructions: "Take with food" },
  { id: "2", name: "Lisinopril", dosage: "10mg", time: "09:00", frequency: "Daily", taken: false },
  { id: "3", name: "Vitamin D3", dosage: "2000 IU", time: "12:00", frequency: "Daily", taken: false, instructions: "Take with lunch" },
  { id: "4", name: "Atorvastatin", dosage: "20mg", time: "20:00", frequency: "Daily", taken: false, instructions: "Take at bedtime" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // Fixed: Added logout to destructuring
  const [medicines, setMedicines] = useState<Medicine[]>(initialMedicines);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const takenCount = medicines.filter((m) => m.taken).length;
  const adherenceRate = Math.round((takenCount / medicines.length) * 100) || 0;

  const handleToggleTaken = (id: string) => {
    setMedicines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, taken: !m.taken } : m))
    );
  };

  const handleAddMedicine = (newMedicine: Omit<Medicine, "id" | "taken">) => {
    const medicine: Medicine = {
      ...newMedicine,
      id: Date.now().toString(),
      taken: false,
    };
    setMedicines((prev) => [...prev, medicine].sort((a, b) => a.time.localeCompare(b.time)));
  };

  const handleEditMedicine = (id: string) => {
    // For now, just open the add dialog. In a full app, this would pre-fill the form.
    setIsDialogOpen(true);
  };

  const handleDeleteMedicine = (id: string) => {
    setMedicines((prev) => prev.filter((m) => m.id !== id));
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      <header className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-[#4CAF50]/10 p-2 rounded-lg">
              <Pill className="w-5 h-5 text-[#4CAF50]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Good Morning, {user?.name?.split(" ")[0]}</h1>
              <p className="text-xs text-gray-500">Today, {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-gray-500 hover:text-red-500">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
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
              onClick={() => setIsDialogOpen(true)}
              className="text-[#4CAF50] border-[#4CAF50]/30 hover:bg-[#4CAF50]/10"
            >
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>

          {medicines.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
              <Pill className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No medicines added yet</p>
              <Button onClick={() => setIsDialogOpen(true)} className="bg-[#4CAF50] hover:bg-[#43A047]">
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
                  onEdit={handleEditMedicine}
                  onDelete={handleDeleteMedicine}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <AddMedicineDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onAdd={handleAddMedicine} />
    </div>
  );
}