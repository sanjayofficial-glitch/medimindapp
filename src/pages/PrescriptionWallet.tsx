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

  useEffect(() => {
    setPrescriptions(getPrescriptions());
    setFamilyMembers(getFamilyMembers());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.familyMemberId) return toast.error("Please fill in required fields");

    addPrescription({ ...formData, id: `rx_${Date.now()}` });
    setPrescriptions(getPrescriptions());
    setShowAdd(false);
    toast.success("Prescription added to wallet!");
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
            <p className="text-gray-600 mt-1">Digital backup for your medical documents</p>
          </div>
          <Button onClick={() => setShowAdd(!showAdd)} className="bg-emerald-600">
            {showAdd ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> Add Document</>}
          </Button>
        </div>

        {showAdd && (
          <Card className="mb-8 shadow-lg">
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
                  <Label>Document Title</Label>
                  <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Annual Physical Rx" />
                </div>
                <div className="space-y-2">
                  <Label>Pharmacy Name</Label>
                  <Input value={formData.pharmacyName} onChange={e => setFormData({...formData, pharmacyName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Pharmacy Phone</Label>
                  <Input value={formData.pharmacyPhone} onChange={e => setFormData({...formData, pharmacyPhone: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Expiry Date</Label>
                  <Input type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Upload Photo (URL for demo)</Label>
                  <Input value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
                </div>
                <Button type="submit" className="md:col-span-2 bg-emerald-600">Save to Wallet</Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prescriptions.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed">
              <Wallet className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500">Your wallet is empty.</p>
            </div>
          ) : (
            prescriptions.map(rx => (
              <Card key={rx.id} className="overflow-hidden hover:shadow-xl transition-all group">
                <div className="h-40 overflow-hidden relative">
                  <img src={rx.imageUrl} alt={rx.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                  <Button variant="secondary" size="icon" className="absolute top-2 right-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{rx.title}</h3>
                    <p className="text-xs text-emerald-600 font-medium">{familyMembers.find(m => m.id === rx.familyMemberId)?.name}</p>
                  </div>
                  
                  <div className="space-y-2 pt-2 border-t">
                    {rx.pharmacyName && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 flex items-center gap-1"><Wallet className="w-3 h-3" /> {rx.pharmacyName}</span>
                        {rx.pharmacyPhone && (
                          <a href={`tel:${rx.pharmacyPhone}`} className="text-emerald-600 hover:underline flex items-center gap-1">
                            <Phone className="w-3 h-3" /> Call
                          </a>
                        )}
                      </div>
                    )}
                    {rx.expiryDate && (
                      <div className="flex items-center gap-1 text-[10px] text-rose-500 font-bold uppercase">
                        <Calendar className="w-3 h-3" /> Expires: {rx.expiryDate}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PrescriptionWallet;