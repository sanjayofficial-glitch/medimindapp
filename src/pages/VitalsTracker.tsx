"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, Heart, Scale, Droplets, Plus, ChevronLeft, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { getFamilyMembers, FamilyMember, addVitalLog, getVitalLogs, VitalLog } from "@/utils/storage";
import { toast } from "sonner";

const VitalsTracker = () => {
  const navigate = useNavigate();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [vitals, setVitals] = useState<VitalLog[]>([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [type, setType] = useState<VitalLog["type"]>("blood_pressure");
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setFamilyMembers(getFamilyMembers());
    setVitals(getVitalLogs());
  }, []);

  const handleAddVital = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !value) return toast.error("Please fill in all fields");

    const unit = type === "blood_pressure" ? "mmHg" : type === "blood_sugar" ? "mg/dL" : type === "weight" ? "kg" : "bpm";
    
    const newLog: VitalLog = {
      id: `vital_${Date.now()}`,
      familyMemberId: selectedMember,
      type,
      value,
      unit,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      notes
    };

    addVitalLog(newLog);
    setVitals(getVitalLogs());
    setValue("");
    setNotes("");
    toast.success("Vital recorded successfully");
  };

  const getIcon = (type: VitalLog["type"]) => {
    switch (type) {
      case "blood_pressure": return <Activity className="w-5 h-5 text-rose-500" />;
      case "blood_sugar": return <Droplets className="w-5 h-5 text-amber-500" />;
      case "weight": return <Scale className="w-5 h-5 text-emerald-500" />;
      case "heart_rate": return <Heart className="w-5 h-5 text-red-500" />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gray-50 pb-32 p-6"
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Vitals Tracker</h1>
          <p className="text-gray-600 mt-1">Monitor and record key health indicators</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Record New Vital</CardTitle>
              <CardDescription>Log a measurement for a family member</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddVital} className="space-y-4">
                <div className="space-y-2">
                  <Label>Family Member</Label>
                  <Select value={selectedMember} onValueChange={setSelectedMember}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      {familyMembers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Vital Type</Label>
                  <Select value={type} onValueChange={(v: any) => setType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blood_pressure">Blood Pressure</SelectItem>
                      <SelectItem value="blood_sugar">Blood Sugar</SelectItem>
                      <SelectItem value="weight">Weight</SelectItem>
                      <SelectItem value="heart_rate">Heart Rate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input 
                    placeholder={type === "blood_pressure" ? "120/80" : "Value"} 
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Input 
                    placeholder="e.g., After exercise" 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" /> Record Vital
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent History</CardTitle>
                  <CardDescription>Your latest health measurements</CardDescription>
                </div>
                <History className="w-5 h-5 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vitals.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No vitals recorded yet.</p>
                  ) : (
                    vitals.slice().reverse().map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-gray-50 rounded-lg">
                            {getIcon(log.type)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">
                              {log.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {familyMembers.find(m => m.id === log.familyMemberId)?.name} • {log.date} at {log.time}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-emerald-600">{log.value} <span className="text-xs text-gray-400 font-normal">{log.unit}</span></p>
                          {log.notes && <p className="text-[10px] text-gray-400 italic">{log.notes}</p>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VitalsTracker;