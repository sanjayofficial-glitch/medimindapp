import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Pill, Plus, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MedicineSelector } from "@/components/MedicineSelector";
import { medicineDatabase, MedicineDBEntry } from "@/data/medicineDatabase";
import { addMedicine, getFamilyMembers, FamilyMember } from "@/utils/storage";
import { cn } from "@/lib/utils";

const AddMedicine = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedMed, setSelectedMed] = useState<MedicineDBEntry | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [times, setTimes] = useState<string[]>([""]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const frequencies = [
    "Once daily",
    "Twice daily",
    "Three times daily",
    "Four times daily",
    "Every morning",
    "Every night",
    "With breakfast",
    "With lunch",
    "With dinner",
    "As needed",
    "Every 12 hours",
    "Every 8 hours",
    "Every 6 hours",
    "Weekly",
    "Monthly"
  ];

  useEffect(() => {
    setFamilyMembers(getFamilyMembers());
  }, []);

  const handleSelectMedicine = (med: MedicineDBEntry) => {
    setSelectedMed(med);
    setIsCustom(false);
    setDosage(med.generic_name);
  };

  const handleCustomMedicine = () => {
    setSelectedMed(null);
    setIsCustom(true);
    setDosage("");
  };

  const addTimeField = () => {
    setTimes([...times, ""]);
  };

  const removeTimeField = (index: number) => {
    if (times.length > 1) {
      setTimes(times.filter((_, i) => i !== index));
    }
  };

  const handleTimeChange = (index: number, value: string) => {
    const newTimes = [...times];
    newTimes[index] = value;
    setTimes(newTimes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMember) {
      toast.error("Please select a family member");
      return;
    }
    
    if (!dosage.trim()) {
      toast.error("Please enter a dosage");
      return;
    }
    
    if (!frequency) {
      toast.error("Please select a frequency");
      return;
    }
    
    const validTimes = times.filter(t => t.trim());
    if (validTimes.length === 0) {
      toast.error("Please add at least one time");
      return;
    }

    setIsSubmitting(true);

    try {
      const medicineName = selectedMed?.brand_name || "Custom Medicine";
      
      validTimes.forEach((time) => {
        const medicine = {
          id: `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          familyMemberId: selectedMember,
          name: medicineName,
          dosage: dosage.trim(),
          times: [time.trim()],
          frequency,
          additionalText: notes.trim() || undefined
        };
        addMedicine(medicine);
      });

      toast.success(`Added ${validTimes.length} dose schedule(s) for ${medicineName}`);
      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to add medicine:", error);
      toast.error("Failed to add medicine. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            ← Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Add Medicine</h1>
          <p className="text-gray-600 mt-1">Schedule a new medication for a family member</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle>Medicine Details</CardTitle>
            <CardDescription>
              Search our database or add a custom medicine
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Family Member Selection */}
              <div className="space-y-2">
                <Label htmlFor="family-member">Family Member</Label>
                <Select value={selectedMember} onValueChange={setSelectedMember}>
                  <SelectTrigger id="family-member" className="h-11">
                    <SelectValue placeholder="Select a family member" />
                  </SelectTrigger>
                  <SelectContent>
                    {familyMembers.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No family members added
                      </SelectItem>
                    ) : (
                      familyMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name} ({member.relationship})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {familyMembers.length === 0 && (
                  <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    Add family members first in the Family tab
                  </p>
                )}
              </div>

              {/* Medicine Selector */}
              <div className="space-y-2">
                <Label>Medicine</Label>
                <MedicineSelector 
                  onSelect={handleSelectMedicine}
                  onCustom={handleCustomMedicine}
                />
              </div>

              {/* Custom Medicine Name (shown only when custom is selected) */}
              {isCustom && (
                <div className="space-y-2">
                  <Label htmlFor="custom-name">Custom Medicine Name</Label>
                  <Input
                    id="custom-name"
                    placeholder="e.g., My Special Pill"
                    value={selectedMed?.brand_name || ""}
                    onChange={(e) => setSelectedMed({
                      brand_name: e.target.value,
                      generic_name: "",
                      disease: "",
                      guidance: "",
                      cautions: ""
                    })}
                    className="h-11"
                  />
                </div>
              )}

              {/* Selected Medicine Info */}
              {selectedMed && !isCustom && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Pill className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium text-emerald-900">{selectedMed.brand_name}</span>
                  </div>
                  <p className="text-sm text-emerald-700">{selectedMed.generic_name}</p>
                  <p className="text-xs text-emerald-600">
                    <strong>Condition:</strong> {selectedMed.disease}
                  </p>
                  <details className="text-xs text-emerald-700">
                    <summary className="cursor-pointer hover:text-emerald-900 font-medium">Guidance</summary>
                    <p className="mt-1">{selectedMed.guidance}</p>
                  </details>
                  <details className="text-xs text-emerald-700">
                    <summary className="cursor-pointer hover:text-emerald-900 font-medium">Cautions</summary>
                    <p className="mt-1">{selectedMed.cautions}</p>
                  </details>
                </div>
              )}

              {/* Dosage */}
              <div className="space-y-2">
                <Label htmlFor="dosage">Dosage</Label>
                <Input
                  id="dosage"
                  placeholder="e.g., 500mg, 1 tablet, 5ml"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  className="h-11"
                  required
                />
              </div>

              {/* Frequency */}
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger id="frequency" className="h-11">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencies.map((freq) => (
                      <SelectItem key={freq} value={freq}>
                        {freq}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Times */}
              <div className="space-y-3">
                <Label>Times</Label>
                {times.map((time, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => handleTimeChange(index, e.target.value)}
                      className="h-11 flex-1"
                      required
                    />
                    {times.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeTimeField(index)}
                        className="h-11 w-11 shrink-0"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTimeField}
                  className="w-full h-11 border-dashed"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Time
                </Button>
                <p className="text-xs text-gray-500">
                  Add all times when this medicine should be taken
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="e.g., Take with food, avoid alcohol, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1 h-11"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Medicine"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddMedicine;