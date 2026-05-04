"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Smile, Meh, Frown, Angry, ChevronLeft, Sparkles, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { getMoodLogs, addMoodLog, getFamilyMembers, FamilyMember, MoodLog } from "@/utils/storage";
import { toast } from "sonner";

const MoodJournal = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<MoodLog[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [selectedMood, setSelectedMood] = useState<MoodLog["mood"] | null>(null);
  const [notes, setNotes] = useState("");

  const moods: { type: MoodLog["mood"], icon: any, color: string, label: string }[] = [
    { type: "great", icon: Smile, color: "text-emerald-500 bg-emerald-50", label: "Great" },
    { type: "good", icon: Smile, color: "text-blue-500 bg-blue-50", label: "Good" },
    { type: "okay", icon: Meh, color: "text-amber-500 bg-amber-50", label: "Okay" },
    { type: "bad", icon: Frown, color: "text-orange-500 bg-orange-50", label: "Bad" },
    { type: "awful", icon: Angry, color: "text-rose-500 bg-rose-50", label: "Awful" }
  ];

  useEffect(() => {
    setLogs(getMoodLogs());
    setFamilyMembers(getFamilyMembers());
  }, []);

  const handleSave = () => {
    if (!selectedMood || !selectedMember) return toast.error("Please select a member and mood");
    
    const newLog: MoodLog = {
      id: `mood_${Date.now()}`,
      familyMemberId: selectedMember,
      mood: selectedMood,
      date: new Date().toISOString().split('T')[0],
      notes
    };

    addMoodLog(newLog);
    setLogs(getMoodLogs());
    setSelectedMood(null);
    setNotes("");
    toast.success("Mood logged! Take care of yourself.");
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
          <p className="text-gray-600 mt-1">Track your emotional well-being and find patterns</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>How are you feeling today?</CardTitle>
                <CardDescription>Select a family member and log your mood</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {familyMembers.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMember(m.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedMember === m.id ? "bg-indigo-600 text-white" : "bg-white border text-gray-600"
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between gap-2">
                  {moods.map(m => (
                    <button
                      key={m.type}
                      onClick={() => setSelectedMood(m.type)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all flex-1 ${
                        selectedMood === m.type ? "ring-2 ring-indigo-600 scale-105" : "opacity-60 hover:opacity-100"
                      } ${m.color}`}
                    >
                      <m.icon className="w-8 h-8" />
                      <span className="text-[10px] font-bold uppercase">{m.label}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Textarea 
                    placeholder="What's on your mind? Any specific triggers?" 
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="min-h-[100px] rounded-2xl"
                  />
                </div>

                <Button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-2xl">
                  Log Mood
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="font-bold text-gray-900">Recent Entries</h3>
              {logs.slice().reverse().map(log => {
                const moodInfo = moods.find(m => m.type === log.mood);
                const member = familyMembers.find(m => m.id === log.familyMemberId);
                return (
                  <Card key={log.id} className="border-none shadow-sm">
                    <CardContent className="p-4 flex items-start gap-4">
                      <div className={`p-3 rounded-2xl shrink-0 ${moodInfo?.color}`}>
                        {moodInfo && <moodInfo.icon className="w-6 h-6" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-gray-900">{moodInfo?.label}</p>
                            <p className="text-xs text-gray-500">{log.date} • {member?.name}</p>
                          </div>
                        </div>
                        {log.notes && <p className="mt-2 text-sm text-gray-600 italic">"{log.notes}"</p>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-none shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" /> AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-indigo-50">
                <p>We've noticed you report a "Great" mood more often on days you complete your Vitamin D schedule.</p>
                <div className="p-3 bg-white/10 rounded-xl">
                  <p className="font-bold flex items-center gap-2 mb-1">
                    <Sparkles className="w-3 h-3" /> Quick Exercise
                  </p>
                  <p className="text-xs">Try 4-7-8 breathing: Inhale for 4s, hold for 7s, exhale for 8s.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-indigo-100">
              <CardHeader><CardTitle className="text-indigo-900">Mental Health Tips</CardTitle></CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-3">
                <p>• Consistency is key to identifying triggers.</p>
                <p>• Physical health and mental health are deeply connected.</p>
                <p>• Don't hesitate to reach out to a professional if you're feeling overwhelmed.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MoodJournal;