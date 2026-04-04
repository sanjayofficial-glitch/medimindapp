import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, Loader2, Pill, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Medicine, FamilyMember, getFamilyMembers, addMedicine } from "@/utils/storage";
import { MedicineDBEntry } from "@/data/medicineDatabase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MedicineSelector } from "@/components/MedicineSelector";

const AddMedicine = () => {
  // ... existing component code remains unchanged
  // (the component implementation from the previous fix)
  // Ensure the component body is exactly as previously provided
  const navigate = useNavigate();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isCustom, setIsCustom] = useState(false);
  const [formData, setFormData] = useState({
    familyMemberId: "self",
    name: "",
    dosage: "",
    times: [""], // Default to one time slot
    frequency: "daily",
    additionalText: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setFamilyMembers(getFamilyMembers());
  }, []);

  const handleMedicineSelect = (med: MedicineDBEntry) => {
    setFormData(prev => ({
      ...prev,
      name: med.brand_name,
      dosage: med.generic_name,
      additionalText: `Guidance: ${med.guidance}\n\nCautions: ${med.cautions}`
    }));
    setIsCustom(false);
  };

  const handleCustomToggle = () => {
    setIsCustom(true);
    setFormData(prev => ({ ...prev, name: "", dosage: "", additionalText: "" }));
  };

  const handleTimeChange = (index: number, value: string) => {
    const newTimes = [...formData.times];
    newTimes[index] = value;
    setFormData(prev => ({ ...prev, times: newTimes }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.dosage || formData.times.some(t => !t)) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const newMedicine: Medicine = {
      id: Date.now().toString(),
      familyMemberId: formData.familyMemberId,
      name: formData.name,
      dosage: formData.dosage,
      times: formData.times.filter(t => t),
      frequency: formData.frequency,
      additionalText: formData.additionalText || undefined
    };

    addMedicine(newMedicine);
    toast.success("Reminder set successfully!");
    setIsLoading(false);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <Link to="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Back to Dashboard</span>
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Set Reminder</h1>
          <p className="text-gray-600">Configure medication schedule for a family member</p>
        </div>

        <Card>
          <CardHeader className="space-x-2">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              <CardTitle className="text-xl font-bold">New Medicine</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="familyMember">Family Member *</Label>
                <Select 
                  value={formData.familyMemberId} 
                  onValueChange={(value) => setFormData({ ...formData, familyMemberId: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select family member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">Myself</SelectItem>
                    {familyMembers.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} ({member.relationship})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Medicine Selection</Label>
                <div className="space-y-2">
                  <MedicineSelector onSelect={handleMedicineSelect} onCustom={handleCustomToggle} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Medicine Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={isCustom ? "e.g., Vitamin D, Metformin" : "Auto-filled or enter custom"}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dosage">Dosage *</Label>
                <Input
                  id="dosage"
                  type="text"
                  placeholder={isCustom ? "e.g., 500mg, 1 tablet" : "Auto-filled or enter custom"}
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select 
                  value={formData.frequency} 
                  onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="twice-daily">Twice Daily</SelectItem>
                    <SelectItem value="three-times-daily">Three Times Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="as-needed">As Needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="times">Reminder Times *</Label>
                <div className="space-y-2">
                  {formData.times.map((time, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700 w-24">
                        {formData.frequency === "daily" ? "Time" :
                         formData.frequency === "twice-daily" ? `Time ${index + 1}` :
                         formData.frequency === "three-times-daily" ? `Time ${index + 1}` :
                         "Time"}
                      </span>
                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => handleTimeChange(index, e.target.value)}
                        className="h-11"
                        required                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.frequency === "twice-daily" && "Set two reminder times (e.g., morning and evening)"}
                  {formData.frequency === "three-times-daily" && "Set three reminder times (e.g., morning, afternoon, evening)"}
                  {formData.frequency === "weekly" && "Set the time for your weekly reminder"}
                  {formData.frequency === "as-needed" && "Set an optional reminder time"}
                  {formData.frequency === "daily" && "Set the time for your daily reminder"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalText">Additional Notes</Label>
                <Textarea
                  id="additionalText"
                  placeholder="e.g., Take with food, avoid sunlight..."
                  value={formData.additionalText}
                  onChange={(e) => setFormData({ ...formData, additionalText: e.target.value })}
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 h-11 text-base" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Set Reminder"}
                </Button>
                <Button type="button" variant="outline" className="h-11" onClick={() => navigate("/dashboard")}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Export the component as default to satisfy TypeScript and React expectations
export default AddMedicine;