"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, User, Plus, ChevronLeft, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { getAppointments, addAppointment, getFamilyMembers, FamilyMember, Appointment } from "@/utils/storage";
import { toast } from "sonner";

const Appointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  
  const [formData, setFormData] = useState({
    doctorName: "",
    specialty: "",
    date: "",
    time: "",
    location: "",
    notes: "",
    familyMemberId: ""
  });

  const loadData = async () => {
    const appts = await getAppointments();
    const members = await getFamilyMembers();
    setAppointments(appts);
    setFamilyMembers(members);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.doctorName || !formData.date || !formData.familyMemberId) {
      return toast.error("Please fill in required fields");
    }

    await addAppointment(formData);
    await loadData();
    setShowAdd(false);
    toast.success("Appointment scheduled!");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gray-50 pb-32 p-6"
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          </div>
          <Button onClick={() => setShowAdd(!showAdd)} className="bg-emerald-600">
            {showAdd ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> New Visit</>}
          </Button>
        </div>

        {showAdd && (
          <Card className="mb-8">
            <CardHeader><CardTitle>Schedule Appointment</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Family Member</Label>
                  <Select onValueChange={v => setFormData({...formData, familyMemberId: v})}>
                    <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                    <SelectContent>
                      {familyMembers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Doctor Name</Label>
                  <Input value={formData.doctorName} onChange={e => setFormData({...formData, doctorName: e.target.value})} />
                </div>
                <Button type="submit" className="md:col-span-2 bg-emerald-600">Save Appointment</Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {appointments.map(appt => (
            <Card key={appt.id}>
              <CardContent className="p-6">
                <h3 className="font-bold text-gray-900">{appt.doctorName}</h3>
                <p className="text-sm text-emerald-600">{appt.specialty}</p>
                <p className="text-xs text-gray-500">{appt.date} at {appt.time}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Appointments;