"use client";

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Pill, Shield, Activity, Users, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const About = () => {
  const navigate = useNavigate();

  const values = [
    {
      icon: Clock,
      title: "Precision Timing",
      desc: "Smart dose reminders that adapt to your daily rhythm, so you never miss a critical medication window.",
    },
    {
      icon: Activity,
      title: "Health Analytics",
      desc: "Adherence streaks, trends, and AI-generated insights that connect your medication habits to how you feel.",
    },
    {
      icon: Shield,
      title: "Privacy-First",
      desc: "No trackers. No ads. Your data lives in your own encrypted Supabase instance — we never sell it.",
    },
    {
      icon: Users,
      title: "Family Care",
      desc: "One account to manage multiple family members, each with their own schedules and health logs.",
    },
  ];

  const stats = [
    { label: "Medicines", value: "200+" },
    { label: "Features", value: "10+" },
    { label: "Database", value: "Supabase" },
    { label: "AI Engine", value: "Gemini 1.5" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-background pb-32 p-6"
    >
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <Pill className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">About MediMind</h1>
          </div>
          <p className="text-emerald-600 font-medium text-lg">Your Health, Simplified.</p>
        </div>

        <div className="space-y-8">
          <section className="space-y-4">
            <p className="text-muted-foreground leading-relaxed text-lg">
              MediMind is a personal medication-management platform built for patients, caregivers, and families who deserve clarity — not complexity — when it comes to managing health.
            </p>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-600 p-6 rounded-r-2xl">
              <h3 className="font-bold text-emerald-900 dark:text-emerald-100 mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> Our Mission
              </h3>
              <p className="text-emerald-800 dark:text-emerald-200 italic">
                "To eliminate medication non-adherence through smart scheduling, contextual AI guidance, and a single unified dashboard for every aspect of a patient's health journey."
              </p>
            </div>
          </section>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <Card key={i} className="text-center border-none shadow-sm bg-card">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-emerald-600">{s.value}</div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{s.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">Core Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {values.map((v, i) => (
                <Card key={i} className="border-border bg-card">
                  <CardHeader className="pb-2">
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-2">
                      <v.icon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <CardTitle className="text-base">{v.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <Card className="bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30">
            <CardContent className="pt-6">
              <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                <strong>Medical Disclaimer:</strong> MediMind is a wellness tool, not a medical device. It does not replace advice from licensed healthcare professionals. Always consult your doctor or pharmacist before making changes to your medication regimen.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default About;