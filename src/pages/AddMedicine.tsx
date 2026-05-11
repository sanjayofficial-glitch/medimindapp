"use client";

import { useState } from "react";
import { ChevronLeft, Loader2, Pill, Copy, Clock, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useFamilyMembers, useAddMedicine, useMedicines, useSaveDoseLogsBatch } from "@/hooks/use-queries";
import { MedicineDBEntry } from "@/data/medicineDatabase";
import { MedicineSelector } from "@/components/MedicineSelector";
import { ClockTimePicker } from "@/components/ClockTimePicker";
import { toast } from "sonner";
import { queryClient } from "@/lib/query-client";
import { QUERY_KEYS } from "@/lib/query-client";
import { getLocalDateString, normalizeTime, toDisplayTime } from "@/utils/datetime";
import { format, addDays } from "date-fns";
import { DoseLog } from "@/utils/storage";

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
  const saveDoseLogsBatch = useSaveDoseLogsBatch();

  const pad = (n: string) => n.padStart(2, "0");

  const quickPresets = [
    { label: "Morning", time: "08:00 AM" },
    { label: "Noon", time: "12:00 PM" },
    { label: "Evening", time: "06:00 PM" },
    { label: "Night", time: "10:00 PM" },
  ];

  const addTime = (timeStr?: string) => {
    let normalized: string;
    
    if (timeStr) {
      normalized = normalizeTime(timeStr);
    } else {
      if (!newHour || !newMinute) return toast.error("Select hour and minute");
      const formatted = `${pad(newHour)}:${pad(newMinute)} ${newPeriod}`;
      normalized = normalizeTime(formatted);
    }

    if (times.includes(normalized)) return toast.error("Time already added");
    setTimes(prev => [...prev, normalized].sort());
    
    if (!timeStr) {
      setNewHour("");
      setNewMinute("");
      // Keep period as is for convenience
    }
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

    const isDuplicate = existingMedicines.some(
      m => m.familyMemberId === selectedMember && 
      m.name.toLowerCase() === medicineName.toLowerCase()
    );

    if (isDuplicate) {
      return toast.error(`${medicineName} is already scheduled for this family member`);
    }

    try {
      const addedMedicine = await addMedicineMutation.mutateAsync({
        familyMemberId: selectedMember,
        name: medicineName,
        dosage: dosage.trim(),
        times: times.map(normalizeTime),
        frequency: frequency,
      });

      const newDoseLogs: DoseLog[] = [];
      for (let i = 0; i < 7; i++) {
        const date = addDays(new Date(), i);
        const dateStr = format(date, 'yyyy-MM-dd');
        for (const time of times.map(normalizeTime)) {
          newDoseLogs.push({
            id: crypto.randomUUID(),
            medicineId: addedMedicine.id,
            medicineName: medicineName,
            familyMemberId: selectedMember,
            scheduledTime: time,
            actualTime: null,
            date: dateStr,
            status: 'pending',
          });
        }
      }
      
      if (newDoseLogs.length > 0) {
        await saveDoseLogsBatch.mutateAsync(newDoseLogs);
      }

      toast.success(`Added ${medicineName} to schedule`);
      
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.medicines }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.doseLogs }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.doseLogsForDate(getLocalDateString()) })
      ]);
      
      navigate("/dashboard");
    } catch (error) {
      console.error("Error adding medicine:", error);
      toast.error("Failed to add medicine. Please try again.");
    }
  };

  const isSubmitting = addMedicineMutation.isPending;

  return (
    <div className="min-h-screen bg-gray-50 pb-32 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 -ml-2">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Add Medicine</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Schedule a new medication for yourself or a family member</p>
        </div>

        <Card className="border-none shadow-lg overflow-hidden">
          <CardHeader className="bg-emerald-600 text-white p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Pill className="w-5 h-5" />
              Medication Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-bold text-gray-700">Family Member</Label>
                  <Select value={selectedMember} onValueChange={setSelectedMember}>
                    <SelectTrigger className="h-11 sm:h-12 bg-white">
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
                  <Label className="text-xs sm:text-sm font-bold text-gray-700">Medicine Name</Label>
                  {isCustom ? (
                    <div className="flex gap-2">
                      <Input 
                        value={customName} 
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Enter medicine name..."
                        className="h-11 sm:h-12"
                        autoFocus
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => { setIsCustom(false); setCustomName(""); setSelectedMed(null); }}
                        className="text-xs text-emerald-600 px-2"
                      >
                        Search
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
                  <Label className="text-xs sm:text-sm font-bold text-gray-700">Dosage</Label>
                  <Input
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="e.g., 500mg, 1 tablet, 5ml"
                    className="h-11 sm:h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-bold text-gray-700">Frequency</Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger className="h-11 sm:h-12 bg-white">
                      <SelectValue placeholder="How often?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Once daily">Once daily</SelectItem>
                      <SelectItem value="Twice daily">Twice daily</SelectItem>
                      <SelectItem value="Three times daily">Three times daily</SelectItem>
                      <SelectItem value="Four times daily">Four times daily</SelectItem>
                      <SelectItem value="Every 8 hours">Every 8 hours</SelectItem>
                      <SelectItem value="Every 12 hours">Every 12 hours</SelectItem>
                      <SelectItem value="Specific days">Specific days of the week</SelectItem>
                      <SelectItem value="Weekly">Weekly (select day)</SelectItem>
                      <SelectItem value="Biweekly">Biweekly</SelectItem>
                      <SelectItem value="Monthly">Monthly (select date)</SelectItem>
                      <SelectItem value="As needed">As needed (PRN)</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-6 p-4 sm:p-8 bg-emerald-50/30 rounded-[2rem] border border-emerald-100/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-100 rounded-xl">
                      <Clock className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <Label className="text-base font-bold text-gray-800">Dose Schedule</Label>
                      <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Set medication times</p>
                    </div>
                  </div>
                  {existingMedicines.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Select onValueChange={handleCopySchedule}>
                        <SelectTrigger className="h-9 text-[11px] bg-white border-emerald-100 text-emerald-700 w-full sm:w-[180px] rounded-xl shadow-sm">
                          <Copy className="w-3 h-3 mr-2" />
                          <SelectValue placeholder="Copy from existing..." />
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

                <div className="space-y-6">
                  <div className="flex flex-wrap gap-2">
                    {quickPresets.map((preset) => (
                      <Button
                        key={preset.label}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addTime(preset.time)}
                        className="text-[11px] font-bold h-9 bg-white border-emerald-100 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 rounded-xl transition-all active:scale-95"
                      >
                        {preset.label} <span className="ml-1 opacity-50 font-medium">{preset.time}</span>
                      </Button>
                    ))}
                  </div>

                  <ClockTimePicker 
                    hour={newHour}
                    minute={newMinute}
                    period={newPeriod}
                    onHourChange={setNewHour}
                    onMinuteChange={setNewMinute}
                    onPeriodChange={setNewPeriod}
                  />

                  <Button
                    type="button"
                    onClick={() => addTime()}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 transition-all active:scale-[0.98]"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add This Time to Schedule
                  </Button>
                </div>

                {times.length > 0 && (
                  <div className="space-y-3 pt-6 border-t border-emerald-100/50">
                    <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Scheduled Times</Label>
                    <div className="flex flex-wrap gap-2">
                      {times.map((time, index) => (
                        <div 
                          key={index} 
                          className="group flex items-center gap-3 px-4 py-2 rounded-2xl bg-white border border-emerald-100 text-sm shadow-sm animate-in zoom-in duration-300 hover:border-emerald-300 transition-all"
                        >
                          <span className="font-black text-emerald-700 tabular-nums">{toDisplayTime(time)}</span>
                          <button
                            type="button"
                            onClick={() => removeTime(index)}
                            className="text-gray-300 hover:text-rose-500 transition-colors p-1 -mr-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-black rounded-3xl shadow-xl shadow-emerald-100 transition-all active:scale-[0.98] mt-8" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
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