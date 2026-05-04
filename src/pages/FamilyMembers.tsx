import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Plus, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { addFamilyMember, getFamilyMembers, FamilyMember, updateFamilyMember, removeFamilyMember } from "@/utils/storage";

const FamilyMembers = () => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [formData, setFormData] = useState({ name: "", relationship: "" });

  const relationships = ["Self", "Spouse", "Child", "Parent", "Sibling", "Grandparent", "Other"];

  useEffect(() => {
    setFamilyMembers(getFamilyMembers());
  }, []);

  const handleAddMember = () => {
    if (!formData.name.trim() || !formData.relationship) return toast.error("Please fill in all fields");
    addFamilyMember({ id: `member_${Date.now()}`, name: formData.name.trim(), relationship: formData.relationship });
    setFamilyMembers(getFamilyMembers());
    setIsDialogOpen(false);
    setFormData({ name: "", relationship: "" });
    toast.success("Family member added!");
  };

  const handleUpdateMember = () => {
    if (!editingMember || !formData.name.trim() || !formData.relationship) return;
    updateFamilyMember({ ...editingMember, name: formData.name.trim(), relationship: formData.relationship });
    setFamilyMembers(getFamilyMembers());
    setIsDialogOpen(false);
    setEditingMember(null);
    setFormData({ name: "", relationship: "" });
    toast.success("Updated successfully!");
  };

  const handleDeleteMember = (id: string) => {
    if (confirm("Are you sure? This will remove all their medications.")) {
      removeFamilyMember(id);
      setFamilyMembers(getFamilyMembers());
      toast.success("Deleted successfully!");
    }
  };

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
            <p className="text-muted-foreground mt-1">Manage your family members and their medications</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingMember(null);
              setFormData({ name: "", relationship: "" });
            }
          }}>
            <DialogTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" /> Add Member
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="bg-card text-foreground">
              <DialogHeader>
                <DialogTitle>{editingMember ? "Edit Member" : "Add Member"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label>Relationship</Label>
                  <Select value={formData.relationship} onValueChange={(v) => setFormData({ ...formData, relationship: v })}>
                    <SelectTrigger className="bg-background"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {relationships.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={editingMember ? handleUpdateMember : handleAddMember} className="bg-emerald-600 hover:bg-emerald-700">
                  {editingMember ? "Update" : "Add"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {familyMembers.map((member, i) => (
              <motion.div
                key={member.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow bg-card border-border">
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
                        <Button variant="ghost" size="icon" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30" onClick={() => handleDeleteMember(member.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default FamilyMembers;