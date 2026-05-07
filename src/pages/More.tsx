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
  Info,
  Lock
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { iconPop, cardInteractive, chevronSlide, listItem } from "@/lib/animations";

const More = () => {
  const menuItems = [
    { title: "Emergency ID", icon: ShieldAlert, to: "/emergency-id", color: "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400", sub: "Critical medical info" },
    { title: "Appointments", icon: Calendar, to: "/appointments", color: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400", sub: "Doctor visits & notes" },
    { title: "Lab Results", icon: Beaker, to: "/lab-results", color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400", sub: "Biomarker tracking" },
    { title: "Medication Wiki", icon: BookOpen, to: "/wiki", color: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400", sub: "Drug education hub" },
    { title: "Mood Journal", icon: Smile, to: "/mood", color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400", sub: "Mental health tracking" },
    { title: "Prescription Wallet", icon: Wallet, to: "/wallet", color: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400", sub: "Digital document backup" },
    { title: "Circle of Care", icon: Users, to: "/family-members", color: "bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400", sub: "Caregiver collaboration" },
    { title: "Achievements", icon: Trophy, to: "/progress", color: "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400", sub: "Streaks & milestones" }
  ];

  const settingsItems = [
    { title: "Account Settings", icon: SettingsIcon, to: "/settings" },
    { title: "Help & FAQ", icon: HelpCircle, to: "/faq" },
    { title: "Privacy Policy", icon: Lock, to: "/privacy" },
    { title: "About MediMind", icon: Info, to: "/about" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pb-32 p-4 sm:p-6"
    >
      <div className="max-w-2xl mx-auto">
        <motion.h1 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl sm:text-3xl font-bold text-foreground mb-6 sm:mb-8"
        >
          Health Hub
        </motion.h1>
        
        <div className="space-y-3">
          {menuItems.map((item, i) => (
            <Link key={i} to={item.to}>
              <motion.div
                variants={listItem}
                initial="hidden"
                animate="visible"
                custom={i}
              >
                <motion.div 
                  variants={cardInteractive}
                  initial="rest"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Card className="group hover:border-emerald-500/50 transition-all cursor-pointer border-border bg-card shadow-sm overflow-hidden">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <motion.div 
                          variants={iconPop}
                          initial="rest"
                          whileHover="hover"
                          whileTap="tap"
                          className={cn("w-11 sm:w-12 h-11 sm:h-12 rounded-2xl flex items-center justify-center transition-colors", item.color, "group-hover:bg-emerald-600 group-hover:text-white")}
                        >
                          <item.icon className="w-5 sm:w-6 h-5 sm:h-6" />
                        </motion.div>
                        <div>
                          <p className="font-bold text-foreground">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.sub}</p>
                        </div>
                      </div>
                      <motion.div variants={chevronSlide} initial="rest" whileHover="hover">
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </Link>
          ))}
        </div>

        <div className="mt-10 sm:mt-12 space-y-4">
          <h3 className="font-bold text-foreground px-2">Settings & Support</h3>
          <div className="bg-card rounded-3xl shadow-sm overflow-hidden border border-border">
            {settingsItems.map((item, i) => (
              <Link 
                key={i} 
                to={item.to} 
                className="w-full flex items-center justify-between p-4 hover:bg-muted border-b border-border last:border-0 transition-colors"
              >
                <div className="flex items-center gap-3 text-foreground">
                  <motion.div whileHover={{ scale: 1.1 }} className="text-muted-foreground group-hover:text-foreground">
                    <item.icon className="w-5 h-5" />
                  </motion.div>
                  <span className="font-medium">{item.title}</span>
                </div>
                <motion.div variants={chevronSlide} initial="rest" whileHover="hover">
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default More;