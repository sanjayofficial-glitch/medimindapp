"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Search, Pill, Clock, Save } from "lucide-react";
import { toast } from "sonner";

const COMMON_MEDICINES = [
  "Paracetamol", "Metformin", "Amlodipine", "Atorvastatin", "Omeprazole",
  "Aspirin", "Azithromycin", "Cetirizine", "Pantoprazole", "Vitamin D3"
];

const DOSAGE_OPTIONS = ["250mg", "500mg", "1000mg"];
const FREQUENCY_OPTIONS = ["Once daily", "Twice daily", "Three times daily"];

const getSuggestedTimes = (frequency: string) => {
  switch (frequency) {
    case "Once daily": return ["08:00"];
    case "Twice daily": return ["08:00", "20:00"];
    case "Three times daily": return ["08:00", "14:00", "20:00"];
    default: return ["08:00"];
  }
};

export default function AddMedicine() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedMedicine, setSelectedMedicine] = useState<string | null>(null);
  const [dosage, setDosage] = useState("500mg");
  const [frequency, setFrequency] = useState("Once daily");
  const [suggestedTimes, setSuggestedTimes] = useState<string[]>(["08:00"]);

  const filteredMedicines = COMMON_MEDICINES.filter(m =>
    m.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setSuggestedTimes(getSuggestedTimes(frequency));
  }, [frequency]);

  const handleSave = () => {
    if (!selectedMedicine) {
      toast.error("Please select a medicine");
      return;
    }

    const newMedicine = {
      id: Date.now().toString(),
      name: selectedMedicine,
      dosage,
      time: suggestedTimes[0],
      frequency,
      taken: false,
      instructions: `Take ${dosage} ${frequency.toLowerCase()}`,
      reminderTimes: suggestedTimes
    };

    const existing = JSON.parse(localStorage.getItem("medimind_medicines") || "[]");
    localStorage.setItem("medimind_medicines", JSON.stringify([...existing, newMedicine]));
    toast.success("Medicine saved successfully!");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-8">
      <header className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-gray-800">Add Medicine</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {!selectedMedicine ? (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search medicine name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-xl h-12 bg-white border-gray-200"
              />
            </div>
            <div className="grid gap-2">
              {filteredMedicines.map((med) => (
                <button
                  key={med}
                  onClick={() => setSelectedMedicine(med)}
                  className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-[#4CAF50]/30 hover:bg-[#4CAF50]/5 transition-all text-left"
                >
                  <div className="bg-[#4CAF50]/10 p-2 rounded-lg">
                    <Pill className="w-5 h-5 text-[#4CAF50]" />
                  </div>
                  <span className="font-medium text-gray-800">{med}</span>
                </button>
              ))}
              {filteredMedicines.length === 0 && (
                <p className="text-center text-gray-500 py-4">No medicines found</p>
              )}
            </div>
          </div>
        ) : (
          <Card className="border-0 shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-[#4CAF50]/10 p-3 rounded-xl">
                <Pill className="w-6 h-6 text-[#4CAF50]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{selectedMedicine}</h2>
                <p className="text-sm text-gray-500">Configure your dosage & schedule</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Dosage</label>
                <Select value={dosage} onValueChange={setDosage}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOSAGE_OPTIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Frequency</label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#4CAF50]" />
                  Suggested Reminder Times
                </label>
                <div className="flex flex-wrap gap-2">
                  {suggestedTimes.map((time, idx) => (
                    <div key={idx} className="bg-[#4CAF50]/10 text-[#4CAF50] px-3 py-1.5 rounded-lg text-sm font-medium">
                      {time}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setSelectedMedicine(null)} className="flex-1 rounded-xl h-11">
                Back
              </Button>
              <Button onClick={handleSave} className="flex-1 bg-[#4CAF50] hover:bg-[#43A047] text-white rounded-xl h-11">
                <Save className="w-4 h-4 mr-2" /> Save Medicine
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}