"use client";

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const PRIVACY = [
  {
    title: "1. Introduction",
    content:
      "MediMind ('we', 'our', or 'the platform') is committed to protecting your personal health information. This Privacy Policy explains what data we collect, how we store and use it, and your rights as a user. By using MediMind, you agree to the practices described here.",
  },
  {
    title: "2. What Data We Collect",
    bullets: [
      "Account Data: Email address and hashed password (managed by Supabase Auth).",
      "Health Data: Medication names, dosages, schedules, dose logs, vitals readings, symptom entries, and prescription images.",
      "Family Member Data: Names and health data for any family profiles you create.",
      "Usage Data: We do not collect analytics or behavioral tracking data.",
      "AI Interaction Data: Queries are transmitted directly to Google's Gemini API. MediMind does not log these conversations.",
    ],
  },
  {
    title: "3. How We Store Your Data",
    content:
      "All personal and health data is stored in Supabase, providing encryption at rest (AES-256) and in transit (TLS). Row-Level Security (RLS) ensures only your authenticated account can access your data.",
  },
  {
    title: "4. AI & Third-Party Services",
    bullets: [
      "Google Gemini API: Powers the AI assistant. Your API key is stored locally in your browser.",
      "Supabase: Our database and authentication provider.",
      "No Other Third Parties: We do not integrate with advertising or social media platforms.",
    ],
  },
  {
    title: "5. How We Use Your Data",
    bullets: [
      "To provide core features like scheduling and dose tracking.",
      "To power personalized AI health insights.",
      "To generate health reports for your providers.",
      "We never sell your data or use it for advertising.",
    ],
  },
  {
    title: "6. Your Rights",
    bullets: [
      "Access: View all your stored data through the dashboard.",
      "Export: Download your data in CSV or JSON format.",
      "Correction: Edit or delete any entry from within the app.",
      "Deletion: Permanently remove your account and all associated data.",
    ],
  },
];

const PrivacyPolicy = () => {
  const navigate = useNavigate();

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
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-4">Effective Date: May 2025 · Last Updated: May 2026</p>
        </div>

        <div className="space-y-6">
          <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30">
            <CardContent className="pt-6">
              <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium leading-relaxed">
                <strong>TL;DR:</strong> MediMind stores your health data in your own encrypted Supabase database. We have no proprietary backend, no ads, no trackers, and we never sell your data.
              </p>
            </CardContent>
          </Card>

          {PRIVACY.map((section, idx) => (
            <div key={idx} className="space-y-3">
              <h2 className="text-lg font-bold text-foreground">{section.title}</h2>
              {section.content && (
                <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>
              )}
              {section.bullets && (
                <ul className="list-disc pl-5 space-y-2">
                  {section.bullets.map((bullet, i) => (
                    <li key={i} className="text-sm text-muted-foreground leading-relaxed">{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          <div className="pt-8 border-t border-border">
            <p className="text-[10px] text-muted-foreground text-center italic">
              MediMind handles personal health information (PHI). Users in regulated environments should verify their specific Supabase plan and consult legal counsel before clinical deployment.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PrivacyPolicy;