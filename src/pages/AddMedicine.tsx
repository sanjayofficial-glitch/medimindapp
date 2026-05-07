"use client";

import { useState } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useFamilyMembers, useAddMedicine, useSaveDoseLog } from "@/hooks/use-queries";
import { medicineDatabase, MedicineDBEntry } from "@/data/medicineDatabase";
import { toast } from "sonner";

const AddMedicine = () => {
  const navigate = useNavigate();
  const [selectedMember, setSelectedMember] = useState("");
  const [selectedMed, setSelectedMed] = useState<MedicineDBEntry | null>(null);
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [times, setTimes] = useState<string[]>([]);
  const [newHour, setNewHour] = useState("");
  const [newMinute, setNewMinute] = useState("");
  const [newPeriod, setNewPeriod] = useState("AM");
  
  const { data: familyMembers = [] } = useFamilyMembers();
  const addMedicineMutation = useAddMedicine();
  const saveDoseLogMutation = useSaveDoseLog();

  const pad = (n: string) => n.padStart(2, "0");
  const hourOptions = Array.from({ length: 12 }, (_, i) => `${i + 1}`);
  const minuteOptions = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

  const addTime = () => {
    if (!newHour || !newMinute) return toast.error("Select hour and minute");
    const formatted = `${pad(newHour)}:${pad(newMinute)} ${newPeriod}`;
    setTimes(prev => [...prev, formatted]);
    setNewHour("");
    setNewMinute("");
    setNewPeriod("AM");
  };

  const removeTime = (index: number) => {
    setTimes(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return toast.error("Please select a family member");
    if (!dosage.trim()) return toast.error("Please enter a dosage");
    if (!frequency) return toast.error("Please select a frequency");
    if (times.length === 0) return toast.error("Please add at least one time");

    try {
      const medicineName = selectedMed?.brand_name || "Custom Medicine";
      const newMedicine = await addMedicineMutation.mutateAsync({
        familyMemberId: selectedMember,
        name: medicineName,
        dosage: dosage.trim(),
        times: times,
        frequency: frequency,
      });

      const today = new Date().toISOString().split("T")[0];
      for (const timeStr of times) {
        const [timePart] = timeStr.split(" ");
        const [hour, minute] = timePart.split(":");
        const scheduledTime = `${hour}:${minute}`;
        await saveDoseLogMutation.mutateAsync({
          id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          medicineId: newMedicine.id,
          medicineName: newMedicine.name,
          familyMemberId: selectedMember,
          scheduledTime: scheduledTime,
          actualTime: null,
          date: today,
          status: "partial",
        });
      }

      toast.success(`Added ${times.length} dose schedule(s) for ${medicineName}`);
      navigate("/dashboard");
    } catch (error) {
      console.error("Error adding medicine:", error);
      toast.error("Failed to add medicine. Please try again.");
    }
  };

  const isSubmitting = addMedicineMutation.isPending || saveDoseLogMutation.isPending;

  return (
    <div className="min-h-screen bg-gray-50 pb-32 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Add Medicine</h1>
          <p className="text-gray-600 mt-1">Add a new medication to your schedule</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Medication Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Family Member</Label>
                  <Select value={selectedMember} onValueChange={setSelectedMember}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      {familyMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Medicine</Label>
                  <Select onValueChange={(value) => {
                    const med = medicineDatabase.find((m) => m.brand_name === value);
                    setSelectedMed(med || null);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select medicine" />
                    </SelectTrigger>
                    <SelectContent>
                      {medicineDatabase.map((med) => (
                        <SelectItem key={med.brand_name} value={med.brand_name}>
                          {med.brand_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Dosage</Label>
                  <Input
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="e.g., 500mg"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
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

              <div className="space-y-4">
                <Label>Times (AM/PM)</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-sm font-medium">Hour</Label>
                    <Select value={newHour} onValueChange={setNewHour}>
                      <SelectTrigger>
                        <SelectValue placeholder="Hour" />
                      </SelectTrigger>
                      <SelectContent>
                        {hourOptions.map((hour) => (
                          <SelectItem key={hour} value={hour}>
                            {hour}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Minute</Label>
                    <Select value={newMinute} onValueChange={setNewMinute}>
                      <SelectTrigger>
                        <SelectValue placeholder="Minute" />
                      </SelectTrigger>
                      <SelectContent>
                        {minuteOptions.map((minute) => (
                          <SelectItem key={minute} value={minute}>
                            {minute}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Period</Label>
                    <Select value={newPeriod} onValueChange={setNewPeriod}>
                      <SelectTrigger>
                        <SelectValue placeholder="AM/PM" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="PM">PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  onClick={addTime}
                >
                  Add Time
                </Button>

                {times.length > 0 && (
                  <div className="space-y-2 mt-2">
                    <p className="text-xs text-gray-600">Scheduled times:</p>
                    {times.map((time, index) => (
                      <div key={index} className="flex items-center justify-between px-3 py-1 rounded-full bg-emerald-50 text-sm">
                        <span className="font-medium">{time}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTime(index)}
                          className="text-emerald-600 hover:text-emerald-900"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-100 transition-all active:scale-[0.98]" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Medicine"
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