"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Smile, Meh, Frown, Angry, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { getMoodLogs, addMoodLog, getFamilyMembers, FamilyMember, MoodLog } from "@/utils/storage";
import { toast } from "sonner";

const MoodJournal = () => {
  const navigate = useNavigate();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [selectedMood, setSelectedMood] = useState<MoodLog["mood"] | null>(null);
  const [notes] = useState("");

  const moods: { type: MoodLog["mood"], icon: any, color: string, label: string }[] = [
    { type: "great", icon: Smile, color: "text-emerald-500 bg-emerald-50", label: "Great" },
    { type: "good", icon: Smile, color: "text-blue-500 bg-blue-50", label: "Good" },
    { type: "okay", icon: Meh, color: "text-amber-500 bg-amber-50", label: "Okay" },
    { type: "bad", icon: Frown, color: "text-orange-500 bg-orange-50", label: "Bad" },
    { type: "awful", icon: Angry, color: "text-rose-500 bg-rose-50", label: "Awful" }
  ];

  const loadData = async () => {
    await getMoodLogs();
    const members = await getFamilyMembers();
    setFamilyMembers(members);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    if (!selectedMood || !selectedMember) return toast.error("Please select a member and mood");
    
    await addMoodLog({
      familyMemberId: selectedMember,
      mood: selectedMood,
      date: new Date().toISOString().split('T')[0],
      notes
    });

    await loadData();
    setSelectedMood(null);
    toast.success("Mood logged!");
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-indigo-50/30 pb-32 p-6"
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Mood Journal</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>How are you feeling?</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {familyMembers.map(m => (
                    <button key={m.id} onClick={() => setSelectedMember(m.id)} className={`px-4 py-2 rounded-full text-sm ${selectedMember === m.id ? "bg-indigo-600 text-white" : "bg-white border"}`}>
                      {m.name}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between gap-2">
                  {moods.map(m => (
                    <button key={m.type} onClick={() => setSelectedMood(m.type)} className={`flex flex-col items-center gap-2 p-3 rounded-2xl flex-1 ${selectedMood === m.type ? "ring-2 ring-indigo-600" : "opacity-60"} ${m.color}`}>
                      <m.icon className="w-8 h-8" />
                    </button>
                  ))}
                </div>
                <Button onClick={handleSave} className="w-full bg-indigo-600">Log Mood</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MoodJournal;