"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useFamilyMembers, useAddSymptomLog, useSymptomLogs } from "@/hooks/use-queries";
import { toast } from "sonner";

const SymptomLogger = () => {
  const navigate = useNavigate();
  const [selectedMember, setSelectedMember] = useState("");
  const [symptom, setSymptom] = useState("");
  const [notes, setNotes] = useState("");

  const { data: familyMembers = [], isLoading: membersLoading } = useFamilyMembers();
  const { data: logs = [], isLoading: logsLoading } = useSymptomLogs();
  const addSymptomLogMutation = useAddSymptomLog();

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !symptom) return toast.error("Please fill in all fields");

    try {
      await addSymptomLogMutation.mutateAsync({
        familyMemberId: selectedMember,
        symptom,
        severity: "mild",
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        notes
      });

      setSymptom("");
      setNotes("");
      toast.success("Symptom logged successfully");
    } catch (error) {
      toast.error("Failed to log symptom");
    }
  };

  const isLoading = membersLoading || logsLoading;

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
                <Button type="submit" className="w-full bg-emerald-600" disabled={addSymptomLogMutation.isPending}>
                  {addSymptomLogMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Log Symptom"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Symptom History</CardTitle></CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {logs.slice().reverse().map((log) => (
                      <div key={log.id} className="p-4 bg-white rounded-xl border border-gray-100">
                        <p className="font-bold">{log.symptom}</p>
                        <p className="text-xs text-gray-500">
                          {familyMembers.find(m => m.id === log.familyMemberId)?.name} • {log.date}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SymptomLogger;