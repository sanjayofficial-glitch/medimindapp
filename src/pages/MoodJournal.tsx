"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Smile, Meh, Frown, Angry, ChevronLeft, History, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useFamilyMembers, useMoodLogs, useAddMoodLog } from "@/hooks/use-queries";
import { toast } from "sonner";
import { MoodLog } from "@/utils/storage";

const moodMessages: Record<string, string> = {
  great:   "You're feeling great today! Keep that energy going 🌟",
  good:    "You're doing well! Keep up the positivity 🌟",
  okay:    "It's okay to feel okay. Tomorrow is a new day 💙",
  bad:     "It's okay to feel down. Be gentle with yourself 💙",
  awful:   "Feeling awful is valid. Reach out if you need support 💙",
};

const MoodJournal = () => {
  const navigate = useNavigate();
  const [selectedMember, setSelectedMember] = useState("");
  const [selectedMood, setSelectedMood] = useState<MoodLog["mood"] | null>(null);
  const [notes, setNotes] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [motivationalMessage, setMotivationalMessage] = useState("");

  const { data: familyMembers = [], isLoading: membersLoading } = useFamilyMembers();
  const { data: moodLogs = [], isLoading: logsLoading } = useMoodLogs();
  const addMoodLog = useAddMoodLog();

  const moods: { type: MoodLog["mood"], icon: any, color: string, label: string }[] = [
    { type: "great", icon: Smile, color: "text-emerald-500 bg-emerald-50 border-emerald-200", label: "Great" },
    { type: "good", icon: Smile, color: "text-blue-500 bg-blue-50 border-blue-200", label: "Good" },
    { type: "okay", icon: Meh, color: "text-amber-500 bg-amber-50 border-amber-200", label: "Okay" },
    { type: "bad", icon: Frown, color: "text-orange-500 bg-orange-50 border-orange-200", label: "Bad" },
    { type: "awful", icon: Angry, color: "text-rose-500 bg-rose-50 border-rose-200", label: "Awful" }
  ];

  const handleSave = async () => {
    if (!selectedMember) return toast.error("Please select a family member");
    if (!selectedMood) return toast.error("Please select your current mood");
    
    try {
      await addMoodLog.mutateAsync({
        familyMemberId: selectedMember,
        mood: selectedMood,
        date: new Date().toISOString().split('T')[0],
        notes: notes.trim() || undefined
      });

      const message = moodMessages[selectedMood] || "Mood logged!";
      setMotivationalMessage(message);
      setShowMessage(true);
      setSelectedMood(null);
      setNotes("");
      toast.success("Mood logged successfully!");
    } catch (error) {
      toast.error("Failed to log mood. Please try again.");
    }
  };

  const isLoading = membersLoading || logsLoading;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-indigo-50/30 pb-32 p-6"
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2 text-indigo-700 hover:bg-indigo-100">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Mood Journal</h1>
          <p className="text-indigo-600 font-medium">Track your emotional well-being alongside your treatment.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-indigo-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">How are you feeling today?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-500">Select Family Member</p>
                  <div className="flex flex-wrap gap-2">
                    {familyMembers.map(m => (
                      <button 
                        key={m.id} 
                        onClick={() => setSelectedMember(m.id)} 
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          selectedMember === m.id 
                            ? "bg-indigo-600 text-white shadow-md" 
                            : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"
                        }`}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-500">Select Mood</p>
                  <div className="flex justify-between gap-2">
                    {moods.map(m => (
                      <button 
                        key={m.type} 
                        onClick={() => setSelectedMood(m.type)} 
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl flex-1 border-2 transition-all ${
                          selectedMood === m.type 
                            ? `ring-2 ring-indigo-600 ring-offset-2 ${m.color}` 
                            : "bg-white border-gray-100 opacity-60 hover:opacity-100"
                        }`}
                      >
                        <m.icon className="w-8 h-8" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-500">Notes (Optional)</p>
                  <Textarea 
                    placeholder="What's on your mind? Any symptoms or side effects?"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[100px] border-gray-200 focus:ring-indigo-500"
                  />
                </div>

                <Button 
                  onClick={handleSave} 
                  disabled={addMoodLog.isPending || !selectedMember || !selectedMood}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg font-bold shadow-lg shadow-indigo-100"
                >
                  {addMoodLog.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Log Mood Entry"}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="h-full border-indigo-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-600" />
                  Recent History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  </div>
                ) : moodLogs.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Smile className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-sm">No mood entries yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {moodLogs.slice().reverse().slice(0, 5).map((log) => {
                      const moodInfo = moods.find(m => m.type === log.mood);
                      const member = familyMembers.find(m => m.id === log.familyMemberId);
                      return (
                        <div key={log.id} className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-lg ${moodInfo?.color}`}>
                                {moodInfo && <moodInfo.icon className="w-4 h-4" />}
                              </div>
                              <span className="text-xs font-bold text-gray-900">{member?.name}</span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium">{log.date}</span>
                          </div>
                          {log.notes && (
                            <div className="flex gap-2 mt-2 pt-2 border-t border-gray-50">
                              <MessageSquare className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
                              <p className="text-xs text-gray-600 italic line-clamp-2">{log.notes}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog open={showMessage} onOpenChange={setShowMessage}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-indigo-600">Mood Logged!</DialogTitle>
              <DialogDescription className="text-center text-base pt-2">
                {motivationalMessage}
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  );
};

export default MoodJournal;