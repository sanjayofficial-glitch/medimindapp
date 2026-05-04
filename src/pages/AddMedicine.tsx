import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Pill, Plus, Loader2, ChevronLeft, Thermometer, Droplets, Activity, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MedicineSelector } from "@/components/MedicineSelector";
import { MedicineDBEntry } from "@/data/medicineDatabase";
import { addMedicine, getFamilyMembers, FamilyMember, saveDoseLog } from "@/utils/storage";
import { cn } from "@/lib/utils";

const AddMedicine = () => {
  const navigate = useNavigate();
  const [selectedMed, setSelectedMed] = useState<MedicineDBEntry | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [times, setTimes] = useState<string[]>([""]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState("pill");

  const icons = [
    { id: "pill", icon: Pill },
    { id: "liquid", icon: Droplets },
    { id: "injection", icon: Activity },
    { id: "heart", icon: Heart },
    { id: "temp", icon: Thermometer }
  ];

  const frequencies = [
    "Once daily", "Twice daily", "Three times daily", "Four times daily",
    "Every morning", "Every night", "With breakfast", "With lunch",
    "With dinner", "As needed", "Every 12 hours", "Every 8 hours",
    "Every 6 hours", "Weekly", "Monthly"
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

  const addTimeField = () => setTimes([...times, ""]);
  const removeTimeField = (index: number) => {
    if (times.length > 1) setTimes(times.filter((_, i) => i !== index));
  };

  const handleTimeChange = (index: number, value: string) => {
    const newTimes = [...times];
    newTimes[index] = value;
    setTimes(newTimes);
  };

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
      const today = new Date().toISOString().split('T')[0];
      
      for (const time of validTimes) {
        const medicineId = `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        addMedicine({
          id: medicineId,
          familyMemberId: selectedMember,
          name: medicineName,
          dosage: dosage.trim(),
          times: [time.trim()],
          frequency,
          additionalText: notes.trim() || undefined
        });

        await saveDoseLog({
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          medicineId: medicineId,
          medicineName: medicineName,
          scheduledTime: time.trim(),
          date: today,
          status: "partial"
        });
      }
      toast.success(`Added ${validTimes.length} dose schedule(s) for ${medicineName}`);
      navigate("/dashboard");
    } catch (error) {
      toast.error("Failed to add medicine. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gray-50 pb-24"
    >
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <motion.div whileHover={{ x: -4 }}>
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900">Add Medicine</h1>
          <p className="text-gray-600 mt-1">Schedule a new medication for a family member</p>
        </div>

        <Card className="shadow-lg border-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Medicine Details</CardTitle>
            <CardDescription>Search our database or add a custom medicine</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Family Member</Label>
                <Select value={selectedMember} onValueChange={setSelectedMember}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select a family member" />
                  </SelectTrigger>
                  <SelectContent>
                    {familyMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Medicine</Label>
                <MedicineSelector onSelect={handleSelectMedicine} onCustom={handleCustomMedicine} />
              </div>

              <div className="space-y-3">
                <Label>Medication Type Icon</Label>
                <div className="flex gap-3">
                  {icons.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedIcon(item.id)}
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all border-2",
                        selectedIcon === item.id 
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200" 
                          : "bg-white border-gray-100 text-gray-400 hover:border-emerald-200"
                      )}
                    >
                      <item.icon className="w-6 h-6" />
                    </button>
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {selectedMed && !isCustom && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-2 overflow-hidden"
                  >
                    <div className="flex items-center gap-2">
                      <Pill className="w-4 h-4 text-emerald-600" />
                      <span className="font-medium text-emerald-900">{selectedMed.brand_name}</span>
                    </div>
                    <p className="text-sm text-emerald-700">{selectedMed.generic_name}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <Label>Dosage</Label>
                <Input
                  placeholder="e.g., 500mg, 1 tablet"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencies.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Times</Label>
                <AnimatePresence mode="popLayout">
                  {times.map((time, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex gap-2"
                    >
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
                    </motion.div>
                  ))}
                </AnimatePresence>
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addTimeField}
                    className="w-full h-11 border-dashed"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Another Time
                  </Button>
                </motion.div>
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Input
                  placeholder="e.g., Take with food"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-11"
                />
              </div>

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
                <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Medicine"}
                  </Button>
                </motion.div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default AddMedicine;