import React, { useState, useEffect } from "react";
import { User, Plus, Edit2, Trash2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { addFamilyMember, getFamilyMembers, FamilyMember, updateFamilyMember, removeFamilyMember } from "@/utils/storage";

const FamilyMembers = () => {
  const { toast } = useToast();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    relationship: ""
  });

  const relationships = [
    "Self",
    "Spouse",
    "Child",
    "Parent",
    "Sibling",
    "Grandparent",
    "Grandchild",
    "Other"
  ];

  useEffect(() => {
    setFamilyMembers(getFamilyMembers());
  }, []);

  const handleAddMember = () => {
    if (!formData.name.trim() || !formData.relationship) {
      toast.error("Please fill in all fields");
      return;
    }

    const newMember: FamilyMember = {
      id: `member_${Date.now()}`,
      name: formData.name.trim(),
      relationship: formData.relationship
    };

    addFamilyMember(newMember);
    setFamilyMembers(getFamilyMembers());
    setFormData({ name: "", relationship: "" });
    setIsDialogOpen(false);
    toast.success("Family member added successfully!");
  };

  const handleEditMember = (member: FamilyMember) => {
    setEditingMember(member);
    setFormData({ name: member.name, relationship: member.relationship });
    setIsDialogOpen(true);
  };

  const handleUpdateMember = () => {
    if (!editingMember || !formData.name.trim() || !formData.relationship) {
      toast.error("Please fill in all fields");
      return;
    }

    const updatedMember: FamilyMember = {
      ...editingMember,
      name: formData.name.trim(),
      relationship: formData.relationship
    };

    updateFamilyMember(updatedMember);
    setFamilyMembers(getFamilyMembers());
    setEditingMember(null);
    setFormData({ name: "", relationship: "" });
    setIsDialogOpen(false);
    toast.success("Family member updated successfully!");
  };

  const handleDeleteMember = (id: string) => {
    if (confirm("Are you sure you want to delete this family member? This will also remove all their medications.")) {
      removeFamilyMember(id);
      setFamilyMembers(getFamilyMembers());
      toast.success("Family member deleted successfully!");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", relationship: "" });
    setEditingMember(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Family Members</h1>
            <p className="text-gray-600 mt-1">Manage your family members and their medications</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Family Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingMember ? "Edit Family Member" : "Add Family Member"}
                </DialogTitle>
                <DialogDescription>
                  {editingMember 
                    ? "Update the family member's information"
                    : "Enter details for a new family member"
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="col-span-3"
                    placeholder="Enter name"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="relationship" className="text-right">
                    Relationship
                  </Label>
                  <Select value={formData.relationship} onValueChange={(value) => setFormData({ ...formData, relationship: value })}>
                    <SelectTrigger id="relationship" className="col-span-3">
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      {relationships.map((rel) => (
                        <SelectItem key={rel} value={rel}>
                          {rel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={editingMember ? handleUpdateMember : handleAddMember}>
                  {editingMember ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  {editingMember ? "Update" : "Add"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {familyMembers.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No family members yet</h3>
              <p className="text-gray-500 mb-6">Add your first family member to start tracking their medications</p>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Member
                  </Button>
                </DialogTrigger>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {familyMembers.map((member) => (
              <Card key={member.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <User className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{member.name}</CardTitle>
                        <CardDescription className="text-sm">{member.relationship}</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditMember(member)}
                        className="h-8 w-8"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteMember(member.id)}
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Member ID:</span>
                      <span className="font-mono text-xs text-gray-600">{member.id}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Relationship:</span>
                      <span className="font-medium">{member.relationship}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyMembers;