import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Medicine, FamilyMember, getFamilyMembers, addMedicine } from "@/utils/storage";

const AddMedicine = () => {
  const navigate = useNavigate();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [formData, setFormData] = useState({
    familyMemberId: "self",
    name: "",
    dosage: "",
    time: "",
    frequency: "daily",
    additionalText: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setFamilyMembers(getFamilyMembers());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.dosage || !formData.time) {
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
      time: formData.time,
      frequency: formData.frequency,
      additionalText: formData.additionalText || undefined
    };

    addMedicine(newMedicine);
    toast.success("Reminder set successfully!");
    setIsLoading(false);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Dashboard</span>
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Set Reminder</h1>
          <p className="text-gray-600">Configure medication schedule for a family member</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Medication Details</CardTitle>
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
                {familyMembers.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    <Link to="/family-members" className="text-emerald-600 hover:underline">Add family members</Link> to manage their medications
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Medicine Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., Vitamin D, Metformin"
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
                  placeholder="e.g., 500mg, 1 tablet"
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value })}>
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
                <Label htmlFor="time">Reminder Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalText">Additional Notes</Label>
                <Textarea
                  id="additionalText"
                  placeholder="e.g., Take with food, avoid sunlight..."
                  value={formData.additionalText}
                  onChange={(e) => setFormData({ ...formData, additionalText: e.target.value })}
                  className="min-h-[80px]"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 h-11 text-base" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Set Reminder
                </Button>
                <Link to="/dashboard">
                  <Button type="button" variant="outline" className="h-11 text-base">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddMedicine;