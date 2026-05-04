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

  useEffect(() => {
    setAppointments(getAppointments());
    setFamilyMembers(getFamilyMembers());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.doctorName || !formData.date || !formData.familyMemberId) {
      return toast.error("Please fill in required fields");
    }

    const newAppt: Appointment = {
      ...formData,
      id: `appt_${Date.now()}`
    };

    addAppointment(newAppt);
    setAppointments(getAppointments());
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
            <p className="text-gray-600 mt-1">Manage your medical visits and doctor notes</p>
          </div>
          <Button onClick={() => setShowAdd(!showAdd)} className="bg-emerald-600 hover:bg-emerald-700">
            {showAdd ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> New Visit</>}
          </Button>
        </div>

        {showAdd && (
          <Card className="mb-8 shadow-lg border-emerald-100">
            <CardHeader>
              <CardTitle>Schedule Appointment</CardTitle>
            </CardHeader>
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
                  <Input value={formData.doctorName} onChange={e => setFormData({...formData, doctorName: e.target.value})} placeholder="Dr. Smith" />
                </div>
                <div className="space-y-2">
                  <Label>Specialty</Label>
                  <Input value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})} placeholder="Cardiologist" />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Clinic Address</Label>
                  <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="123 Medical Way" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Notes for Doctor (Questions/Symptoms)</Label>
                  <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Ask about the new dosage..." />
                </div>
                <Button type="submit" className="md:col-span-2 bg-emerald-600">Save Appointment</Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {appointments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed">
              <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500">No upcoming appointments.</p>
            </div>
          ) : (
            appointments.sort((a, b) => a.date.localeCompare(b.date)).map(appt => (
              <Card key={appt.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex gap-4">
                      <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex flex-col items-center justify-center text-emerald-600 shrink-0">
                        <span className="text-[10px] font-bold uppercase">{new Date(appt.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                        <span className="text-xl font-bold">{new Date(appt.date).getDate()}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{appt.doctorName}</h3>
                        <p className="text-sm text-emerald-600 font-medium">{appt.specialty}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><User className="w-3 h-3" /> {familyMembers.find(m => m.id === appt.familyMemberId)?.name}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {appt.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {appt.location && (
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(appt.location)}`, '_blank')}>
                          <MapPin className="w-3 h-3 mr-1" /> Open in Maps
                        </Button>
                      )}
                      {appt.notes && (
                        <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600 border border-gray-100">
                          <p className="font-bold mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Notes:</p>
                          {appt.notes}
                        </div>
                      )}
                    </div>
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

export default Appointments;