import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getFamilyMembers, FamilyMember, addMedicine, saveDoseLog } from "@/utils/storage";
import { medicineDatabase, MedicineDBEntry } from "@/data/medicineDatabase";

const AddMedicine = () => {
  const navigate = useNavigate();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [selectedMed, setSelectedMed] = useState<MedicineDBEntry | null>(null);
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [times, setTimes] = useState<string[]>([""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadMembers = async () => {
      const members = await getFamilyMembers();
      setFamilyMembers(members);
    };
    loadMembers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return toast.error("Please select a family member");
    if (!dosage.trim()) return toast.error("Please enter a dosage");
    if (!frequency) return toast.error("Please select a frequency");
    const validTimes = times.filter(t => t.trim());
    if (validTimes.length === 0) return toast.error("Please add at least one time");

    setIsSubmitting(true);
    try {
      const medicineName = selectedMed?.brand_name || "Custom Medicine";
      const newMedicine = await addMedicine({
        familyMemberId: selectedMember,
        name: medicineName,
        dosage: dosage.trim(),
        times: validTimes,
        frequency: frequency,
      });

      const today = new Date().toISOString().split('T')[0];
      for (const time of validTimes) {
        await saveDoseLog({
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          medicineId: newMedicine.id,
          medicineName: newMedicine.name,
          familyMemberId: selectedMember,
          scheduledTime: time.trim(),
          date: today,
          status: "partial",
        });
      }

      toast.success(`Added ${validTimes.length} dose schedule(s) for ${medicineName}`);
      navigate("/dashboard");
    } catch (error) {
      console.error("Error adding medicine:", error);
      toast.error("Failed to add medicine. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTime = () => setTimes([...times, ""]);
  const removeTime = (index: number) => setTimes(times.filter((_, i) => i !== index));
  const updateTime = (index: number, value: string) => {
    const newTimes = [...times];
    newTimes[index] = value;
    setTimes(newTimes);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
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
                    const med = medicineDatabase.find(m => m.brand_name === value);
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

              <div className="space-y-2">
                <Label>Times</Label>
                {times.map((time, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={time}
                      onChange={(e) => updateTime(index, e.target.value)}
                      placeholder="HH:MM"
                    />
                    {times.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeTime(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addTime}>
                  Add Time
                </Button>
              </div>

              <Button type="submit" className="w-full bg-emerald-600" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Medicine"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddMedicine;