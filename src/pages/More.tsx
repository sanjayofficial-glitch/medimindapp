"use client";

import { motion } from "framer-motion";
import {
  Users,
  AlertTriangle,
  Package,
  ChevronRight,
  Pill,
  TrendingUp,
  Users as UsersIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/animations";

const More = () => {
  const navigate = useNavigate();
  const location = useLocation();

  if (["/", "/login", "/signup"].includes(location.pathname)) {
    return null;
  }

  const features = [
    {
      title: "Health Tools",
      items: [
        { icon: Heart, label: "Vitals Tracker", path: "/vitals", color: "text-rose-500", bg: "bg-rose-50" },
        { icon: Stethoscope, label: "Symptom Log", path: "/symptoms", color: "text-blue-500", bg: "bg-blue-50" },
        { icon: FileText, label: "Lab Results", path: "/lab-results", color: "text-amber-500", bg: "bg-amber-50" },
      ]
    },
    {
      title: "Account & Settings",
      items: [
        { icon: Users, label: "Profile Settings", path: "/settings", color: "text-slate-600", bg: "bg-slate-100" },
        { icon: Shield, label: "Privacy & Security", path: "/privacy", color: "text-slate-600", bg: "bg-slate-100" },
        { icon: Settings, label: "App Settings", path: "/settings", color: "text-slate-600", bg: "bg-slate-100" },
      ]
    },
    {
      title: "Support",
      items: [
        { icon: AlertTriangle, label: "Help Center", path: "/help", color: "text-slate-600", bg: "bg-slate-100" },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-white border-b px-4 py-6 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-slate-900">More</h1>
      </div>

      <main className="container max-w-md mx-auto px-4 py-6 space-y-8">
        {/* AI Assistant Section */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">AI Assistant</h2>
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <AIButton />
          </div>
        </section>

        {features.map((group, idx) => (
          <section key={idx} className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">{group.title}</h2>
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              {group.items.map((item, itemIdx) => (
                <Button
                  key={itemIdx}
                  variant="ghost"
                  className="w-full justify-start h-14 px-4 hover:bg-slate-50 rounded-none"
                  onClick={() => navigate(item.path)}
                >
                  <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center ${item.color} mr-3`}>
                    {item.icon as any}
                  </div>
                  <span className="font-medium text-slate-700">{item.label}</span>
                </Button>
              ))}
            </div>
          </section>
        ))}

        <Button
          variant="ghost"
          className="w-full justify-start h-14 px-4 text-red-600 hover:text-red-700 hover:bg-red-50 bg-white rounded-2xl shadow-sm"
          onClick={() => navigate("/login")}
        >
          <LogOut className="w-4 h-4 mr-3" /> Sign Out
        </Button>
      </main>
    </div>
  );
};

export default More;