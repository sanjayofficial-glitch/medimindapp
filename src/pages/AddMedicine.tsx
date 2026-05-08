"use client";

import { useState } from "react";
import { ChevronLeft, Loader2, Pill, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useFamilyMembers, useAddMedicine, useMedicines } from "@/hooks/use-queries";
import { MedicineDBEntry } from "@/data/medicineDatabase";
import { MedicineSelector } from "@/components/MedicineSelector";
import { toast } from "sonner";
import { queryClient } from "@/lib/query-client";
import { QUERY_KEYS } from "@/lib/query-client";
import { getLocalDateString, normalizeTime, toDisplayTime } from "@/utils/datetime";

const AddMedicine = () => {
  const navigate = useNavigate();
  const [selectedMember, setSelectedMember] = useState("");
  const [selectedMed, setSelectedMed] = useState<MedicineDBEntry | null>(null);
  const [customName, setCustomName] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [times, setTimes] = useState<string[]>([]);
  const [newHour, setNewHour] = useState("");
  const [newMinute, setNewMinute] = useState("");
  const [newPeriod, setNewPeriod] = useState("AM");
  
  const { data: familyMembers = [] } = useFamilyMembers();
  const { data: existingMedicines = [] } = useMedicines();
  const addMedicineMutation = useAddMedicine();

  const pad = (n: string) => n.padStart(2, "0");
  const hourOptions = Array.from({ length: 12 }, (_, i) => `${i + 1}`);
  const minuteOptions = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

  const addTime = () => {
    if (!newHour || !newMinute) return toast.error("Select hour and minute");
    const formatted = `${pad(newHour)}:${pad(newMinute)} ${newPeriod}`;
    const normalized = normalizeTime(formatted);
    if (times.includes(normalized)) return toast.error("Time already added");
    setTimes(prev => [...prev, normalized].sort());
    setNewHour("");
    setNewMinute("");
    setNewPeriod("AM");
  };

  const removeTime = (index: number) => {
    setTimes(prev => prev.filter((_, i) => i !== index));
  };

  const handleCopySchedule = (medicineId: string) => {
    const sourceMed = existingMedicines.find(m => m.id === medicineId);
    if (sourceMed && sourceMed.times) {
      setTimes(sourceMed.times.map(normalizeTime).sort());
      setFrequency(sourceMed.frequency);
      toast.success(`Copied schedule from ${sourceMed.name}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return toast.error("Please select a family member");
    
    const medicineName = isCustom ? customName.trim() : selectedMed?.brand_name;
    if (!medicineName) return toast.error("Please select or enter a medicine name");
    
    if (!dosage.trim()) return toast.error("Please enter a dosage");
    if (!frequency) return toast.error("Please select a frequency");
    if (times.length === 0) return toast.error("Please add at least one time");

    // Check for duplicates
    const isDuplicate = existingMedicines.some(
      m => m.familyMemberId === selectedMember && 
      m.name.toLowerCase() === medicineName.toLowerCase()
    );

    if (isDuplicate) {
      return toast.error(`${medicineName} is already scheduled for this family member`);
    }

    try {
      await addMedicineMutation.mutateAsync({
        familyMemberId: selectedMember,
        name: medicineName,
        dosage: dosage.trim(),
        times: times.map(normalizeTime),
        frequency: frequency,
      });

      toast.success(`Added ${medicineName} to schedule`);
      
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.medicines });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.doseLogs });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.doseLogsForDate(getLocalDateString()) });
      
      navigate("/dashboard");
    } catch (error) {
      console.error("Error adding medicine:", error);
      toast.error("Failed to add medicine. Please try again.");
    }
  };

  const isSubmitting = addMedicineMutation.isPending;

  return (
    <div className="min-h-screen bg-gray-50 pb-32 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Add Medicine</h1>
          <p className="text-gray-600 mt-1">Schedule a new medication for yourself or a family member</p>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader className="bg-emerald-600 text-white rounded-t-2xl">
            <CardTitle className="flex items-center gap-2">
              <Pill className="w-5 h-5" />
              Medication Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-gray-700">Family Member</Label>
                  <Select value={selectedMember} onValueChange={setSelectedMember}>
                    <SelectTrigger className="h-11 bg-white">
                      <SelectValue placeholder="Who is this for?" />
                    </SelectTrigger>
                    <SelectContent>
                      {familyMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name} ({member.relationship})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-bold text-gray-700">Medicine Name</Label>
                  {isCustom ? (
                    <div className="flex gap-2">
                      <Input 
                        value={customName} 
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Enter medicine name..."
                        className="h-11"
                        autoFocus
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => { setIsCustom(false); setCustomName(""); setSelectedMed(null); }}
                        className="text-xs text-emerald-600"
                      >
                        Search DB
                      </Button>
                    </div>
                  ) : (
                    <MedicineSelector 
                      onSelect={(med) => {
                        setSelectedMed(med);
                        setIsCustom(false);
                      }}
                      onCustom={() => {
                        setIsCustom(true);
                        setSelectedMed(null);
                      }}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-bold text-gray-700">Dosage</Label>
                  <Input
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="e.g., 500mg, 1 tablet, 5ml"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-bold text-gray-700">Frequency</Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger className="h-11 bg-white">
                      <SelectValue placeholder="How often?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Once daily">Once daily</SelectItem>
                      <SelectItem value="Twice daily">Twice daily</SelectItem>
                      <SelectItem value="Three times daily">Three times daily</SelectItem>
                      <SelectItem value="Four times daily">Four times daily</SelectItem>
                      <SelectItem value="As needed">As needed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 p-4 sm:p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-bold text-gray-700">Dose Schedule</Label>
                  {existingMedicines.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Copy className="w-3 h-3 text-emerald-600" />
                      <Select onValueChange={handleCopySchedule}>
                        <SelectTrigger className="h-8 text-[10px] bg-white border-emerald-100 text-emerald-700 w-[140px]">
                          <SelectValue placeholder="Copy schedule from..." />
                        </SelectTrigger>
                        <SelectContent>
                          {existingMedicines.map(m => (
                            <SelectItem key={m.id} value={m.id} className="text-xs">{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                  <div className="col-span-1">
                    <Select value={newHour} onValueChange={setNewHour}>
                      <SelectTrigger className="h-11 sm:h-12 bg-white text-sm">
                        <SelectValue placeholder="Hour" />
                      </SelectTrigger>
                      <SelectContent>
                        {hourOptions.map((hour) => (
                          <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-1">
                    <Select value={newMinute} onValueChange={setNewMinute}>
                      <SelectTrigger className="h-11 sm:h-12 bg-white text-sm">
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent>
                        {minuteOptions.map((minute) => (
                          <SelectItem key={minute} value={minute}>{minute}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-1">
                    <Select value={newPeriod} onValueChange={setNewPeriod}>
                      <SelectTrigger className="h-11 sm:h-12 bg-white text-sm">
                        <SelectValue placeholder="AM/PM" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="PM">PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="button"
                    onClick={addTime}
                    className="col-span-3 sm:col-span-4 h-11 sm:h-12 bg-emerald-600 hover:bg-emerald-700 text-sm font-medium"
                  >
                    + Add Time
                  </Button>
                </div>

                {times.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {times.map((time, index) => (
                      <div key={index} className="flex items-center gap-2 px-3 py-2 rounded-full bg-white border border-emerald-100 text-sm shadow-sm">
                        <span className="font-bold text-emerald-700">{toDisplayTime(time)}</span>
                        <button
                          type="button"
                          onClick={() => removeTime(index)}
                          className="text-gray-400 hover:text-rose-500 transition-colors text-lg leading-none"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-bold shadow-xl shadow-emerald-100 transition-all active:scale-[0.98]" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving Medication...
                  </>
                ) : (
                  "Save Medication Schedule"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddMedicine;