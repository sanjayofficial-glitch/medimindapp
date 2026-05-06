import { useState } from "react";
import { motion } from "framer-motion";
import { User, Plus, Edit2, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useFamilyMembers, useAddFamilyMember, useUpdateFamilyMember, useRemoveFamilyMember } from "@/hooks/use-queries";

const FamilyMembers = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", relationship: "" });

  const relationships = ["Self", "Spouse", "Child", "Parent", "Sibling", "Grandparent", "Other"];

  const { data: familyMembers = [], isLoading } = useFamilyMembers();
  const addFamilyMember = useAddFamilyMember();
  const updateFamilyMember = useUpdateFamilyMember();
  const removeFamilyMember = useRemoveFamilyMember();

  const handleAddMember = async () => {
    if (!formData.name.trim() || !formData.relationship) return toast.error("Please fill in all fields");
    try {
      await addFamilyMember.mutateAsync({ name: formData.name.trim(), relationship: formData.relationship });
      setIsDialogOpen(false);
      setFormData({ name: "", relationship: "" });
      toast.success("Family member added!");
    } catch (error) {
      toast.error("Failed to add member");
    }
  };

  const handleUpdateMember = async () => {
    if (!editingMember || !formData.name.trim() || !formData.relationship) return;
    try {
      await updateFamilyMember.mutateAsync({ ...editingMember, name: formData.name.trim(), relationship: formData.relationship });
      setIsDialogOpen(false);
      setEditingMember(null);
      setFormData({ name: "", relationship: "" });
      toast.success("Updated successfully!");
    } catch (error) {
      toast.error("Failed to update member");
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (confirm("Are you sure? This will remove all their medications.")) {
      try {
        await removeFamilyMember.mutateAsync(id);
        toast.success("Deleted successfully!");
      } catch (error) {
        toast.error("Failed to delete member");
      }
    }
  };

  const isPending = addFamilyMember.isPending || updateFamilyMember.isPending || removeFamilyMember.isPending;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background p-6 pb-32"
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Family Members</h1>
            <p className="text-muted-foreground mt-1">Manage your family members</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingMember(null);
              setFormData({ name: "", relationship: "" });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={isPending}>
                <Plus className="w-4 h-4 mr-2" /> Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card text-foreground">
              <DialogHeader>
                <DialogTitle>{editingMember ? "Edit Member" : "Add Member"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Relationship</Label>
                  <Select value={formData.relationship} onValueChange={(v) => setFormData({ ...formData, relationship: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {relationships.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={editingMember ? handleUpdateMember : handleAddMember} className="bg-emerald-600 hover:bg-emerald-700" disabled={isPending}>
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editingMember ? "Update" : "Add"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {familyMembers.map((member) => (
              <Card key={member.id} className="bg-card border-border">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                        <User className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-foreground">{member.name}</CardTitle>
                        <CardDescription className="text-muted-foreground">{member.relationship}</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingMember(member); setFormData({ name: member.name, relationship: member.relationship }); setIsDialogOpen(true); }}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-rose-500" onClick={() => handleDeleteMember(member.id)} disabled={removeFamilyMember.isPending}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default FamilyMembers;