import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Edit2, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { FamilyMember, getFamilyMembers, addFamilyMember, updateFamilyMember, removeFamilyMember } from "@/utils/storage";
import { useAuth } from "@/context/AuthContext";

const FamilyMembers = () => {
  const { user } = useAuth();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadFamilyMembers();
  }, []);

  const loadFamilyMembers = () => {
    const members = getFamilyMembers();
    setFamilyMembers(members);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !relationship.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    if (editingId) {
      updateFamilyMember({ id: editingId, name: name.trim(), relationship: relationship.trim() });
      toast.success("Family member updated!");
    } else {
      const newMember: FamilyMember = {
        id: Date.now().toString(),
        name: name.trim(),
        relationship: relationship.trim()
      };
      addFamilyMember(newMember);
      toast.success("Family member added!");
    }

    setName("");
    setRelationship("");
    setEditingId(null);
    setIsLoading(false);
    loadFamilyMembers();
  };

  const handleEdit = (member: FamilyMember) => {
    setName(member.name);
    setRelationship(member.relationship);
    setEditingId(member.id);
  };

  const handleCancelEdit = () => {
    setName("");
    setRelationship("");
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this family member?")) {
      removeFamilyMember(id);
      toast.success("Family member removed");
      loadFamilyMembers();
      if (editingId === id) {
        handleCancelEdit();
      }
    }
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
          <p className="text-gray-600">Manage family members for medication tracking</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">
              {editingId ? "Edit Family Member" : "Add Family Member"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="relationship">Relationship *</Label>
                <Input
                  id="relationship"
                  type="text"
                  placeholder="e.g., Spouse, Parent, Child"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="h-11"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 h-11" disabled={isLoading}>
                  {isLoading ? "Saving..." : editingId ? "Update" : "Add Member"}
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

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Your Family</h2>
          
          {/* Self */}
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{user?.name || "Myself"}</p>
                  <p className="text-sm text-gray-600">Self</p>
                </div>
              </div>
              <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                Primary
              </span>
            </CardContent>
          </Card>

          {/* Other family members */}
          {familyMembers.map((member) => (
            <Card key={member.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-600">{member.relationship}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(member)}
                    className="h-8 w-8"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(member.id)}
                    className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {familyMembers.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No family members added</h3>
                <p className="text-gray-500">Add family members to manage their medications</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default FamilyMembers;