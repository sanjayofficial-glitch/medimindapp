"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wallet, Plus, ChevronLeft, Phone, Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { getPrescriptions, addPrescription, getFamilyMembers, FamilyMember, Prescription } from "@/utils/storage";
import { toast } from "sonner";

const PrescriptionWallet = () => {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60",
    pharmacyName: "",
    pharmacyPhone: "",
    expiryDate: "",
    familyMemberId: ""
  });

  const loadData = async () => {
    const rx = await getPrescriptions();
    const members = await getFamilyMembers();
    setPrescriptions(rx);
    setFamilyMembers(members);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.familyMemberId) return toast.error("Please fill in required fields");

    await addPrescription(formData);
    await loadData();
    setShowAdd(false);
    toast.success("Prescription added!");
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 pb-32 p-6"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Prescription Wallet</h1>
          </div>
          <Button onClick={() => setShowAdd(!showAdd)} className="bg-emerald-600">
            {showAdd ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> Add Document</>}
          </Button>
        </div>

        {showAdd && (
          <Card className="mb-8">
            <CardHeader><CardTitle>Add New Document</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Family Member</Label>
                  <Select onValueChange={v => setFormData({...formData, familyMemberId: v})}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {familyMembers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <Button type="submit" className="md:col-span-2 bg-emerald-600">Save</Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prescriptions.map(rx => (
            <Card key={rx.id}>
              <CardContent className="p-4">
                <h3 className="font-bold text-gray-900">{rx.title}</h3>
                <p className="text-xs text-emerald-600">{familyMembers.find(m => m.id === rx.familyMemberId)?.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default PrescriptionWallet;