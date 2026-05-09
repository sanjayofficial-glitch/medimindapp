"use client";

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  ChevronLeft, 
  Activity, 
  Stethoscope, 
  FileText, 
  BookOpen, 
  Package, 
  ShieldAlert, 
  Calendar, 
  Sparkles, 
  Wallet,
  TrendingUp,
  Users,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/animations";

const HealthHub = () => {
  const navigate = useNavigate();

  const features = [
    { title: "My Reminders", icon: Bell, path: "/reminders", color: "text-amber-600", bg: "bg-amber-50" },
    { title: "Vitals Tracker", icon: Activity, path: "/vitals", color: "text-rose-500", bg: "bg-rose-50" },
    { title: "Symptom Log", icon: Stethoscope, path: "/symptoms", color: "text-blue-500", bg: "bg-blue-50" },
    { title: "Lab Results", icon: FileText, path: "/lab-results", color: "text-amber-500", bg: "bg-amber-50" },
    { title: "Medication Wiki", icon: BookOpen, path: "/wiki", color: "text-emerald-500", bg: "bg-emerald-50" },
    { title: "Refill Manager", icon: Package, path: "/refills", color: "text-orange-500", bg: "bg-orange-50" },
    { title: "Emergency ID", icon: ShieldAlert, path: "/emergency-id", color: "text-red-600", bg: "bg-red-50" },
    { title: "Appointments", icon: Calendar, path: "/appointments", color: "text-indigo-500", bg: "bg-indigo-50" },
    { title: "Mood Journal", icon: Sparkles, path: "/mood", color: "text-purple-500", bg: "bg-purple-50" },
    { title: "Rx Wallet", icon: Wallet, path: "/wallet", color: "text-cyan-500", bg: "bg-cyan-50" },
    { title: "Health Progress", icon: TrendingUp, path: "/progress", color: "text-green-600", bg: "bg-green-50" },
    { title: "Family Care", icon: Users, path: "/family-members", color: "text-slate-600", bg: "bg-slate-50" },
  ];

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="bg-card border-b border-border sticky top-0 z-40 px-4 h-16 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full md:hidden">
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Health Hub</h1>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-8">
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {features.map((feature, idx) => (
            <motion.div key={idx} variants={staggerItem}>
              <Card 
                className="border-none shadow-sm hover:shadow-lg transition-all cursor-pointer active:scale-95 overflow-hidden group"
                onClick={() => navigate(feature.path)}
              >
                <CardContent className="p-6 md:p-8 flex flex-col items-center text-center gap-4">
                  <div className={cn("w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", feature.bg, feature.color)}>
                    <feature.icon className="w-7 h-7 md:w-8 md:h-8" />
                  </div>
                  <span className="text-sm font-bold text-foreground leading-tight">{feature.title}</span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  );
};

export default HealthHub;