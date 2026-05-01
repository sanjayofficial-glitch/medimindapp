"use client";

import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, History, Plus, Users, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const BottomTabBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide on auth and landing pages
  if (["/", "/login", "/signup"].includes(location.pathname)) {
    return null;
  }

  const tabs = [
    { name: "Home", path: "/dashboard", icon: Home },
    { name: "History", path: "/history", icon: History },
    { name: "Add", path: "/add-medicine", icon: Plus, isMain: true },
    { name: "Progress", path: "/progress", icon: BarChart3 },
    { name: "Family", path: "/family-members", icon: Users },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-3xl px-4 py-3 flex justify-between items-center"
      >
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          
          if (tab.isMain) {
            return (
              <motion.button
                key={tab.name}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(tab.path)}
                className="w-14 h-14 bg-primary text-white rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center transition-transform"
              >
                <Icon className="w-7 h-7" />
              </motion.button>
            );
          }

          return (
            <button
              key={tab.name}
              onClick={() => navigate(tab.path)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-xl transition-all",
                isActive 
                  ? "text-primary" 
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/5 rounded-xl -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Icon className="w-6 h-6" />
              </motion.div>
              <motion.span 
                initial={false}
                animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 4 }}
                className="text-[10px] font-bold tracking-tight"
              >
                {tab.name}
              </motion.span>
            </button>
          );
        })}
      </motion.div>
    </div>
  );
};

export default BottomTabBar;