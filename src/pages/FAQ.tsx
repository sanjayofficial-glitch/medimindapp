"use client";

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQS = [
  {
    category: "Getting Started",
    items: [
      {
        q: "What is MediMind?",
        a: "MediMind is a web-based medication management platform that helps you track medicines, log doses, monitor vitals, store prescriptions, and get AI-powered answers to medication questions — all in one place.",
      },
      {
        q: "Who is MediMind built for?",
        a: "MediMind is designed for patients managing chronic conditions, caregivers looking after elderly family members, and anyone who takes multiple medications and wants a reliable daily system.",
      },
      {
        q: "Do I need to create an account?",
        a: "Yes. MediMind uses Supabase authentication (email + password) to keep your health data secure and synced across devices. Creating an account is free.",
      },
      {
        q: "Is MediMind available on mobile?",
        a: "MediMind is a responsive, mobile-first web app. It works on any modern browser on your phone, tablet, or desktop — no app store download required.",
      },
    ],
  },
  {
    category: "Medications & Scheduling",
    items: [
      {
        q: "How do I add a new medication?",
        a: "Navigate to Add Medicine from the dashboard or bottom tab bar. Enter the medicine name, dosage, frequency, and preferred times. The app creates a daily dose schedule automatically.",
      },
      {
        q: "Can I manage medications for my family members?",
        a: "Yes. The Family Members module lets one account manage multiple profiles — each with their own medication list, dose logs, and health data.",
      },
      {
        q: "What happens if I miss a dose?",
        a: "MediMind logs the dose as missed and updates your adherence score. The AI assistant can offer guidance, but always consult your doctor about what to do after a missed dose.",
      },
      {
        q: "Can I export my medication history?",
        a: "Yes. MediMind can generate CSV or JSON reports of your medication history that you can share with your doctor or pharmacist.",
      },
    ],
  },
  {
    category: "AI Assistant",
    items: [
      {
        q: "How does the AI health assistant work?",
        a: "The assistant is powered by Google Gemini 1.5 Flash. It is given your current medication list, recent dose logs, and a curated database of 200+ medicines so it can answer context-aware questions about interactions, food timing, side effects, and more.",
      },
      {
        q: "Is the AI a replacement for my doctor?",
        a: "Absolutely not. Every AI response ends with a mandatory disclaimer: 'I am an AI, not a doctor.' MediMind is a decision-support tool — final medical decisions must involve a licensed professional.",
      },
      {
        q: "Where is my Gemini API key stored?",
        a: "Your API key is stored only in your browser's localStorage under 'medimind_ai_settings'. It is never sent to any MediMind server. Requests go directly from your browser to Google's endpoint.",
      },
      {
        q: "What can I ask the AI assistant?",
        a: "Common questions include: 'Should I take ibuprofen with food?', 'What are the side effects of metformin?', 'Can I take these two medicines together?', or 'Why is my adherence lower on weekends?'",
      },
    ],
  },
  {
    category: "Data & Privacy",
    items: [
      {
        q: "Where is my health data stored?",
        a: "All personal health data (medications, dose logs, vitals, symptoms) is stored in a Supabase PostgreSQL database. Supabase encrypts data at rest and uses TLS for all data in transit.",
      },
      {
        q: "Can MediMind see my data?",
        a: "No. Your data is protected by Supabase Row-Level Security (RLS), meaning only your authenticated account can read or write your rows. MediMind does not have a backend server that processes your data.",
      },
      {
        q: "Does MediMind use any trackers or ads?",
        a: "No. MediMind does not include any analytics SDKs (like Google Analytics or Mixpanel) and is entirely ad-free. The only external services are Supabase and Google Gemini (optional).",
      },
      {
        q: "Can I delete my data?",
        a: "Yes. Deleting your Supabase account removes all your data permanently. A 'Delete My Account' flow is available in Settings. You can also download all your data before deletion.",
      },
    ],
  },
];

const FAQ = () => {
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
              <HelpCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Help & FAQ</h1>
          </div>
        </div>

        <div className="space-y-10">
          {FAQS.map((section, idx) => (
            <section key={idx} className="space-y-4">
              <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-widest px-1">{section.category}</h2>
              <Accordion type="single" collapsible className="w-full space-y-2">
                {section.items.map((item, i) => (
                  <AccordionItem key={i} value={`${idx}-${i}`} className="bg-card border border-border rounded-xl px-4 overflow-hidden">
                    <AccordionTrigger className="hover:no-underline py-4 text-left font-semibold text-sm">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-4">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default FAQ;