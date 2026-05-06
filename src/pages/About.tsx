"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const TABS = ["About", "FAQ", "Privacy Policy"];

const ABOUT = {
  tagline: "Your Health, Simplified.",
  description:
    "MediMind is a personal medication-management platform built for patients, caregivers, and families who deserve clarity — not complexity — when it comes to managing health.",
  mission:
    "Our mission is to eliminate medication non-adherence through smart scheduling, contextual AI guidance, and a single unified dashboard for every aspect of a patient's health journey.",
  values: [
    {
      icon: "⏰",
      title: "Precision Timing",
      desc: "Smart dose reminders that adapt to your daily rhythm, so you never miss a critical medication window.",
    },
    {
      icon: "📊",
      title: "Health Analytics",
      desc: "Adherence streaks, trends, and AI-generated insights that connect your medication habits to how you feel.",
    },
    {
      icon: "🔒",
      title: "Privacy-First",
      desc: "No trackers. No ads. Your data lives in your own encrypted Supabase instance — we never sell it.",
    },
    {
      icon: "👨‍👩‍👧",
      title: "Family Care",
      desc: "One account to manage multiple family members, each with their own schedules and health logs.",
    },
  ],
  stats: [
    { label: "Medicines in database", value: "200+" },
    { label: "Core features", value: "10+" },
    { label: "Data stored with", value: "Supabase" },
    { label: "AI model", value: "Gemini 1.5" },
  ],
  team: "MediMind was designed with a product-first mindset — built for real users navigating chronic illness, caregiving, and the everyday friction of managing multiple prescriptions.",
  disclaimer:
    "MediMind is a wellness tool, not a medical device. It does not replace advice from licensed healthcare professionals. Always consult your doctor or pharmacist before making changes to your medication regimen.",
};

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

const PRIVACY = [
  {
    title: "1. Introduction",
    content:
      "MediMind ('we', 'our', or 'the platform') is committed to protecting your personal health information. This Privacy Policy explains what data we collect, how we store and use it, and your rights as a user. By using MediMind, you agree to the practices described here. If you do not agree, please discontinue use and delete your account.",
  },
  {
    title: "2. What Data We Collect",
    content: null,
    bullets: [
      "Account Data: Email address and hashed password (managed by Supabase Auth).",
      "Health Data: Medication names, dosages, schedules, dose logs, vitals readings (blood pressure, glucose, weight, etc.), symptom entries, mood journal entries, and prescription images you upload.",
      "Family Member Data: Names and health data for any family profiles you create and manage.",
      "Usage Data: We do not collect analytics or behavioral tracking data. No third-party analytics SDKs are present in the codebase.",
      "AI Interaction Data: Queries you send to the AI assistant are transmitted directly from your browser to Google's Gemini API. MediMind does not log or store these conversations.",
    ],
  },
  {
    title: "3. How We Store Your Data",
    content:
      "All personal and health data is stored in Supabase, a cloud database platform that provides: (a) encryption at rest using AES-256, (b) TLS encryption for all data in transit, and (c) Row-Level Security (RLS) policies that ensure only your authenticated account can access your rows. MediMind operates as a pure front-end application with no proprietary backend server — your data flows directly between your browser and Supabase.",
  },
  {
    title: "4. AI & Third-Party Services",
    content: null,
    bullets: [
      "Google Gemini API: Used to power the AI health assistant. Your Gemini API key is stored only in your browser's localStorage and is never transmitted to any MediMind server. Queries go directly from your browser to Google. Google's own privacy policy governs how they handle these requests.",
      "Supabase: Our database and authentication provider. Supabase's privacy policy and data processing agreement apply to data stored on their platform.",
      "No Other Third Parties: MediMind does not integrate with advertising networks, social media platforms, or analytics providers.",
    ],
  },
  {
    title: "5. How We Use Your Data",
    content: null,
    bullets: [
      "To provide core features: scheduling, dose tracking, adherence analytics, family management, and health logging.",
      "To power AI insights: your medication list and dose history are included in AI prompts so the assistant can give personalized answers.",
      "To generate reports: your data can be exported as CSV or JSON for sharing with healthcare providers.",
      "We do not use your data for advertising, profiling, or sale to third parties — ever.",
    ],
  },
  {
    title: "6. Your Rights",
    content: null,
    bullets: [
      "Access: You can view all your stored data through the MediMind dashboard at any time.",
      "Export: Use Settings → Download My Data to receive a full export in CSV or JSON format.",
      "Correction: You can edit or delete any medication, log entry, or profile from within the app.",
      "Deletion: Settings → Delete My Account permanently removes all your data from Supabase.",
      "GDPR (EU Users): You have the right to access, rectify, erase, restrict, and port your data. Contact us to exercise these rights.",
      "CCPA (California Users): You have the right to know what personal information is collected and to request deletion. MediMind does not sell personal information.",
    ],
  },
  {
    title: "7. Security Practices",
    content: null,
    bullets: [
      "The app is served exclusively over HTTPS.",
      "Authentication tokens (JWTs) are stored in memory — not in persistent cookies.",
      "Supabase RLS policies ensure strict per-user data isolation.",
      "No server-side code in MediMind's own infrastructure — attack surface is limited to Supabase and the browser.",
      "AI API keys are client-side only and cleared on logout.",
    ],
  },
  {
    title: "8. Regulatory Considerations",
    content:
      "MediMind handles personal health information (PHI). If you are deploying or using MediMind in the United States, note that HIPAA compliance depends on whether Supabase's hosting tier includes a signed Business Associate Agreement (BAA). In the EU, GDPR applies to all health data. MediMind's architecture (no proprietary backend, encrypted storage, no analytics) is designed to minimize regulatory risk, but users in regulated environments should verify their specific Supabase plan and consult legal counsel before clinical deployment.",
  },
  {
    title: "9. Medical Disclaimer",
    content:
      "MediMind is a wellness and medication management tool. It is not a medical device, clinical decision-support system, or substitute for professional medical advice. The AI assistant is explicitly labeled as an AI — not a doctor. Always consult a licensed healthcare professional before making any changes to your medication regimen. MediMind accepts no liability for clinical outcomes resulting from use of the platform.",
  },
  {
    title: "10. Changes to This Policy",
    content:
      "We may update this Privacy Policy as the platform evolves. Material changes will be communicated via an in-app notice. Continued use after changes are posted constitutes acceptance of the updated policy. The effective date at the top of this document indicates when it was last revised.",
  },
  {
    title: "11. Contact",
    content:
      "For privacy questions, data requests, or security concerns, please reach out through the MediMind support channel listed in the app's Settings page. We aim to respond to all inquiries within 72 hours.",
  },
];

export default function About() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("About");
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  return (
    <div style={{ fontFamily: "'Georgia', 'Times New Roman', serif", background: "#f8f9fb", minHeight: "100vh", color: "#1a1a2e", paddingBottom: "100px" }}>
      {/* Header */}
      <header style={{ background: "linear-gradient(135deg, #0f2c5c 0%, #1a4a8a 60%, #1565c0 100%)", color: "#fff", padding: "48px 24px 36px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "20px", left: "20px", zIndex: 20 }}>
          <Button variant="ghost" onClick={() => navigate(-1)} style={{ color: "#fff", background: "rgba(255,255,255,0.1)" }}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </div>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.04) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 50%)" }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 32 }}>💊</span>
            <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px" }}>MediMind</span>
          </div>
          <p style={{ fontSize: 14, opacity: 0.7, letterSpacing: "3px", textTransform: "uppercase", marginBottom: 4 }}>
            Product Documentation
          </p>
          <p style={{ fontSize: 13, opacity: 0.5, fontStyle: "italic" }}>Researched & authored by Product Management</p>
        </div>
      </header>

      {/* Tab Bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e8eaf0", display: "flex", justifyContent: "center", gap: 0, position: "sticky", top: 0, zIndex: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "16px 32px",
              border: "none",
              borderBottom: activeTab === tab ? "3px solid #1565c0" : "3px solid transparent",
              background: "none",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: activeTab === tab ? 700 : 500,
              color: activeTab === tab ? "#1565c0" : "#666",
              letterSpacing: "0.5px",
              transition: "all 0.2s",
              fontFamily: "inherit",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "40px 20px 80px" }}>
        {/* ── ABOUT ── */}
        {activeTab === "About" && (
          <div>
            {/* Hero */}
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <h1 style={{ fontSize: 36, fontWeight: 700, color: "#0f2c5c", marginBottom: 16, lineHeight: 1.2 }}>{ABOUT.tagline}</h1>
              <p style={{ fontSize: 17, color: "#444", lineHeight: 1.8, maxWidth: 640, margin: "0 auto 20px" }}>{ABOUT.description}</p>
              <div style={{ background: "linear-gradient(135deg, #e3f0ff, #f0f7ff)", borderLeft: "4px solid #1565c0", borderRadius: 8, padding: "16px 24px", textAlign: "left", maxWidth: 640, margin: "0 auto" }}>
                <p style={{ fontSize: 15, color: "#1a3a6b", lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>
                  <strong>Mission:</strong> {ABOUT.mission}
                </p>
              </div>
            </div>

            {/* Core Values */}
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f2c5c", marginBottom: 20, borderBottom: "2px solid #e0e8f8", paddingBottom: 10 }}>Core Value Propositions</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 48 }}>
              {ABOUT.values.map((v) => (
                <div key={v.title} style={{ background: "#fff", border: "1px solid #e0e8f8", borderRadius: 12, padding: "20px 22px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{v.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0f2c5c", marginBottom: 6 }}>{v.title}</div>
                  <div style={{ fontSize: 14, color: "#555", lineHeight: 1.6 }}>{v.desc}</div>
                </div>
              ))}
            </div>

            {/* At a Glance */}
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f2c5c", marginBottom: 20, borderBottom: "2px solid #e0e8f8", paddingBottom: 10 }}>At a Glance</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 48 }}>
              {ABOUT.stats.map((s) => (
                <div key={s.label} style={{ background: "#0f2c5c", color: "#fff", borderRadius: 10, padding: "20px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>{s.value}</div>
                  <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: "0.5px", lineHeight: 1.4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Tech Stack */}
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f2c5c", marginBottom: 16, borderBottom: "2px solid #e0e8f8", paddingBottom: 10 }}>Technology Stack</h2>
            <div style={{ background: "#fff", border: "1px solid #e0e8f8", borderRadius: 12, padding: "20px 24px", marginBottom: 48 }}>
              {[
                ["Frontend", "React 19 · TypeScript · Tailwind CSS · shadcn/ui · Framer Motion"],
                ["Backend", "Supabase (PostgreSQL + Auth + Row-Level Security)"],
                ["AI", "Google Gemini 1.5 Flash (client-side, user-supplied API key)"],
                ["Routing", "React Router"],
                ["Data", "IndexedDB (offline) + Supabase (cloud sync)"],
                ["Deployment", "Vercel (HTTPS)"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 16, padding: "10px 0", borderBottom: "1px solid #f0f4fc" }}>
                  <div style={{ width: 100, fontWeight: 700, fontSize: 13, color: "#1565c0", flexShrink: 0 }}>{k}</div>
                  <div style={{ fontSize: 14, color: "#444" }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Context */}
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f2c5c", marginBottom: 12, borderBottom: "2px solid #e0e8f8", paddingBottom: 10 }}>Product Context</h2>
            <p style={{ fontSize: 15, color: "#444", lineHeight: 1.8, marginBottom: 24 }}>{ABOUT.team}</p>

            {/* Disclaimer */}
            <div style={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 10, padding: "16px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f57f17", marginBottom: 6, letterSpacing: "0.5px" }}>⚠ MEDICAL DISCLAIMER</div>
              <p style={{ fontSize: 14, color: "#5d4037", lineHeight: 1.7, margin: 0 }}>{ABOUT.disclaimer}</p>
            </div>
          </div>
        )}

        {/* ── FAQ ── */}
        {activeTab === "FAQ" && (
          <div>
            <div style={{ marginBottom: 36 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: "#0f2c5c", marginBottom: 8 }}>Frequently Asked Questions</h1>
              <p style={{ fontSize: 15, color: "#666" }}>Everything you need to know about using MediMind as a patient, caregiver, or developer.</p>
            </div>
            {FAQS.map((section) => (
              <div key={section.category} style={{ marginBottom: 40 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ height: 2, width: 20, background: "#1565c0" }} />
                  <h2 style={{ fontSize: 13, fontWeight: 700, color: "#1565c0", letterSpacing: "2px", textTransform: "uppercase", margin: 0 }}>{section.category}</h2>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {section.items.map((item, i) => {
                    const key = `${section.category}-${i}`;
                    const isOpen = openFaq === key;
                    return (
                      <div key={i} style={{ background: "#fff", border: `1px solid ${isOpen ? "#1565c0" : "#e0e8f8"}`, borderRadius: 10, overflow: "hidden", transition: "border-color 0.2s", boxShadow: isOpen ? "0 4px 16px rgba(21,101,192,0.08)" : "none" }}>
                        <button
                          onClick={() => setOpenFaq(isOpen ? null : key)}
                          style={{ width: "100%", padding: "16px 20px", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, textAlign: "left", fontFamily: "inherit" }}
                        >
                          <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1a2e", lineHeight: 1.4 }}>{item.q}</span>
                          <span style={{ fontSize: 20, color: "#1565c0", flexShrink: 0, transform: isOpen ? "rotate(45deg)" : "none", transition: "transform 0.2s" }}>+</span>
                        </button>
                        {isOpen && (
                          <div style={{ padding: "0 20px 18px", borderTop: "1px solid #e8f0fe" }}>
                            <p style={{ fontSize: 14, color: "#444", lineHeight: 1.8, margin: "14px 0 0" }}>{item.a}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div style={{ background: "linear-gradient(135deg, #0f2c5c, #1565c0)", borderRadius: 12, padding: "24px 28px", color: "#fff", textAlign: "center" }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>💬</div>
              <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Still have questions?</p>
              <p style={{ fontSize: 13, opacity: 0.8 }}>Visit the Settings page in MediMind to reach our support team. We respond within 72 hours.</p>
            </div>
          </div>
        )}

        {/* ── PRIVACY POLICY ── */}
        {activeTab === "Privacy Policy" && (
          <div>
            <div style={{ marginBottom: 36 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: "#0f2c5c", marginBottom: 8 }}>Privacy Policy</h1>
              <p style={{ fontSize: 13, color: "#999", marginBottom: 12 }}>Effective Date: May 2025 · Last Updated: May 2026</p>
              <div style={{ background: "#e8f5e9", border: "1px solid #a5d6a7", borderRadius: 8, padding: "12px 18px" }}>
                <p style={{ fontSize: 13, color: "#2e7d32", margin: 0, lineHeight: 1.6 }}>
                  <strong>TL;DR:</strong> MediMind stores your health data in your own encrypted Supabase database. We have no proprietary backend, no ads, no trackers, and we never sell your data. Your AI API key never leaves your browser.
                </p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {PRIVACY.map((section, idx) => (
                <div key={idx} style={{ paddingBottom: 32, borderBottom: idx < PRIVACY.length - 1 ? "1px solid #e8eaf0" : "none", marginBottom: 32 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0f2c5c", marginBottom: 14 }}>{section.title}</h2>
                  {section.content && (
                    <p style={{ fontSize: 14, color: "#444", lineHeight: 1.85, margin: 0 }}>{section.content}</p>
                  )}
                  {section.bullets && (
                    <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                      {section.bullets.map((b, bi) => (
                        <li key={bi} style={{ fontSize: 14, color: "#444", lineHeight: 1.75 }}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
            <div style={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 10, padding: "16px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f57f17", marginBottom: 6, letterSpacing: "0.5px" }}>⚠ NOT LEGAL OR MEDICAL ADVICE</div>
              <p style={{ fontSize: 13, color: "#5d4037", lineHeight: 1.7, margin: 0 }}>
                This Privacy Policy is a product management draft document. It has not been reviewed by legal counsel. Before deploying MediMind in a clinical or regulated environment, consult a lawyer specializing in healthcare data privacy (HIPAA, GDPR, or applicable local regulations).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ background: "#0f2c5c", color: "rgba(255,255,255,0.5)", textAlign: "center", padding: "20px", fontSize: 12, letterSpacing: "0.5px" }}>
        © 2026 MediMind · Product Management Documentation · Not for clinical deployment without legal review
      </footer>
    </div>
  );
}