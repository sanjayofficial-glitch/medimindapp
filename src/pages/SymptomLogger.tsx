"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Thermometer, Plus, ChevronLeft, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { getFamilyMembers, FamilyMember, addSymptomLog, getSymptomLogs, SymptomLog } from "@/utils/storage";
import { toast } from "sonner";

const SymptomLogger = () => {
  const navigate = useNavigate();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [logs, setLogs] = useState<SymptomLog[]>([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [symptom, setSymptom] = useState("");
  const [severity, setSeverity] = useState<SymptomLog["severity"]>("mild");
  const [notes, setNotes] = useState("");

  const loadData = async () => {
    const members = await getFamilyMembers();
    const symptomLogs = await getSymptomLogs();
    setFamilyMembers(members);
    setLogs(symptomLogs);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !symptom) return toast.error("Please fill in all fields");

    await addSymptomLog({
      familyMemberId: selectedMember,
      symptom,
      severity,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      notes
    });

    await loadData();
    setSymptom("");
    setNotes("");
    toast.success("Symptom logged successfully");
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
          <h1 className="text-3xl font-bold text-gray-900">Symptom Logger</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1">
            <CardHeader><CardTitle>Log Symptom</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleAddLog} className="space-y-4">
                <div className="space-y-2">
                  <Label>Family Member</Label>
                  <Select value={selectedMember} onValueChange={setSelectedMember}>
                    <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                    <SelectContent>
                      {familyMembers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Symptom</Label>
                  <Input value={symptom} onChange={(e) => setSymptom(e.target.value)} />
                </div>
                <Button type="submit" className="w-full bg-emerald-600">Log Symptom</Button>
              </form>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Symptom History</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {logs.slice().reverse().map((log) => (
                    <div key={log.id} className="p-4 bg-white rounded-xl border border-gray-100">
                      <p className="font-bold">{log.symptom}</p>
                      <p className="text-xs text-gray-500">{familyMembers.find(m => m.id === log.familyMemberId)?.name} • {log.date}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SymptomLogger;