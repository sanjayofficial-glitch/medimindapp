import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Users, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { FamilyMember, getFamilyMembers, addFamilyMember, removeFamilyMember, updateFamilyMember } from "@/utils/storage";

const FamilyMembers = () => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [formData, setFormData] = useState({ name: "", relationship: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMembers(getFamilyMembers());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.relationship) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    if (editingId) {
      const updatedMember: FamilyMember = {
        id: editingId,
        name: formData.name,
        relationship: formData.relationship
      };
      updateFamilyMember(updatedMember);
      setMembers(members.map(m => m.id === editingId ? updatedMember : m));
      toast.success("Family member updated!");
      setEditingId(null);
    } else {
      const newMember: FamilyMember = {
        id: Date.now().toString(),
        name: formData.name,
        relationship: formData.relationship
      };
      addFamilyMember(newMember);
      setMembers([...members, newMember]);
      toast.success("Family member added!");
    }

    setFormData({ name: "", relationship: "" });
    setIsLoading(false);
  };

  const handleEditMember = (member: FamilyMember) => {
    setEditingId(member.id);
    setFormData({ name: member.name, relationship: member.relationship });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: "", relationship: "" });
  };

  const handleRemoveMember = (id: string) => {
    removeFamilyMember(id);
    setMembers(members.filter(m => m.id !== id));
    if (editingId === id) handleCancelEdit();
    toast.info("Family member removed");
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Family Members</h1>
          <p className="text-gray-600">Manage who you want to remind for medications</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              {editingId ? "Edit Family Member" : "Add Family Member"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., Mom, Dad, Sister"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="relationship">Relationship</Label>
                <Input
                  id="relationship"
                  type="text"
                  placeholder="e.g., Mother, Father, Sibling"
                  value={formData.relationship}
                  onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                  className="h-11"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 h-11" disabled={isLoading}>
                  {isLoading ? (editingId ? "Updating..." : "Adding...") : <><Plus className="w-4 h-4 mr-2" /> {editingId ? "Update Member" : "Add Member"}</>}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" className="h-11" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {members.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No family members added yet</p>
            </div>
          ) : (
            members.map(member => (
              <div key={member.id} className={`flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm transition-all ${editingId === member.id ? "ring-2 ring-emerald-500" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-emerald-700 font-semibold text-sm">{member.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.relationship}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleEditMember(member)}
                    className="text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-gray-400 hover:text-rose-500 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FamilyMembers;