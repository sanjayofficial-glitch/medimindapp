"use client";

import { motion } from "framer-motion";
import { 
  ShieldAlert, 
  Calendar, 
  Beaker, 
  BookOpen, 
  Smile, 
  Wallet, 
  Users, 
  ChevronRight,
  Trophy,
  Settings as SettingsIcon,
  HelpCircle,
  Info
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const More = () => {
  const menuItems = [
    { title: "Emergency ID", icon: ShieldAlert, to: "/emergency-id", color: "bg-rose-50 text-rose-600", sub: "Critical medical info" },
    { title: "Appointments", icon: Calendar, to: "/appointments", color: "bg-blue-50 text-blue-600", sub: "Doctor visits & notes" },
    { title: "Lab Results", icon: Beaker, to: "/lab-results", color: "bg-emerald-50 text-emerald-600", sub: "Biomarker tracking" },
    { title: "Medication Wiki", icon: BookOpen, to: "/wiki", color: "bg-amber-50 text-amber-600", sub: "Drug education hub" },
    { title: "Mood Journal", icon: Smile, to: "/mood", color: "bg-indigo-50 text-indigo-600", sub: "Mental health tracking" },
    { title: "Prescription Wallet", icon: Wallet, to: "/wallet", color: "bg-purple-50 text-purple-600", sub: "Digital document backup" },
    { title: "Circle of Care", icon: Users, to: "/family-members", color: "bg-teal-50 text-teal-600", sub: "Caregiver collaboration" },
    { title: "Achievements", icon: Trophy, to: "/progress", color: "bg-yellow-50 text-yellow-600", sub: "Streaks & milestones" }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 pb-32 p-6"
    >
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Health Hub</h1>
        
        <div className="space-y-3">
          {menuItems.map((item, i) => (
            <Link key={i} to={item.to}>
              <Card className="group hover:border-emerald-500/50 transition-all cursor-pointer border-none shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors", item.color, "group-hover:bg-emerald-600 group-hover:text-white")}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.sub}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-600 transition-colors" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-12 space-y-6">
          <h3 className="font-bold text-gray-900 px-2">Settings & Support</h3>
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            <Link to="/settings" className="w-full flex items-center justify-between p-4 hover:bg-gray-50 border-b last:border-0">
              <div className="flex items-center gap-3 text-gray-700">
                <SettingsIcon className="w-5 h-5" />
                <span className="font-medium">Account Settings</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </Link>
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 border-b last:border-0">
              <div className="flex items-center gap-3 text-gray-700">
                <HelpCircle className="w-5 h-5" />
                <span className="font-medium">Help & Support</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 border-b last:border-0">
              <div className="flex items-center gap-3 text-gray-700">
                <Info className="w-5 h-5" />
                <span className="font-medium">About MediMind</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default More;