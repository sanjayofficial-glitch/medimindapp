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

  useEffect(() => {
    setFamilyMembers(getFamilyMembers());
    setLogs(getSymptomLogs());
  }, []);

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !symptom) return toast.error("Please fill in all fields");

    const newLog: SymptomLog = {
      id: `symptom_${Date.now()}`,
      familyMemberId: selectedMember,
      symptom,
      severity,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      notes
    };

    addSymptomLog(newLog);
    setLogs(getSymptomLogs());
    setSymptom("");
    setNotes("");
    toast.success("Symptom logged successfully");
  };

  const getSeverityColor = (sev: SymptomLog["severity"]) => {
    switch (sev) {
      case "mild": return "bg-emerald-100 text-emerald-700";
      case "moderate": return "bg-amber-100 text-amber-700";
      case "severe": return "bg-rose-100 text-rose-700";
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
          <h1 className="text-3xl font-bold text-gray-900">Symptom Logger</h1>
          <p className="text-gray-600 mt-1">Track how you feel and identify potential side effects</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Log Symptom</CardTitle>
              <CardDescription>Record a new symptom or side effect</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddLog} className="space-y-4">
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
                  <Label>Symptom</Label>
                  <Input 
                    placeholder="e.g., Dizziness, Nausea" 
                    value={symptom}
                    onChange={(e) => setSymptom(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select value={severity} onValueChange={(v: any) => setSeverity(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mild">Mild</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea 
                    placeholder="Describe when it started, how long it lasted..." 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" /> Log Symptom
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Symptom History</CardTitle>
                <CardDescription>Review your logged symptoms over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {logs.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-500">No symptoms logged yet.</p>
                    </div>
                  ) : (
                    logs.slice().reverse().map((log) => (
                      <div key={log.id} className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                              <Thermometer className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{log.symptom}</p>
                              <p className="text-xs text-gray-500">
                                {familyMembers.find(m => m.id === log.familyMemberId)?.name} • {log.date} at {log.time}
                              </p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getSeverityColor(log.severity)}`}>
                            {log.severity}
                          </span>
                        </div>
                        {log.notes && (
                          <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 italic">
                            "{log.notes}"
                          </div>
                        )}
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

export default SymptomLogger;