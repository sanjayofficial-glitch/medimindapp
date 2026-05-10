"use client";

import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, History, Plus, LayoutGrid, MoreHorizontal, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonTap } from "@/lib/animations";

const BottomTabBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  if (["/", "/login", "/signup"].includes(location.pathname)) {
    return null;
  }

  const tabs = [
    { name: "Home", path: "/dashboard", icon: Home },
    { name: "Care", path: "/caregiver", icon: Users },
    { name: "History", path: "/history", icon: History },
    { name: "Add", path: "/add-medicine", icon: Plus, isMain: true },
    { name: "Hub", path: "/hub", icon: LayoutGrid },
    { name: "More", path: "/more", icon: MoreHorizontal },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 pb-safe z-50 flex justify-center pointer-events-none">
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="w-full max-w-md px-4 pb-6 pointer-events-auto"
      >
        <div className="bg-card/90 backdrop-blur-xl border border-border shadow-2xl rounded-[2.5rem] px-2 py-2 flex justify-between items-center">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            const Icon = tab.icon;
            
            if (tab.isMain) {
              return (
                <motion.button
                  key={tab.name}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navigate(tab.path)}
                  className="w-14 h-14 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/25 flex items-center justify-center transition-transform -mt-2"
                >
                  <Icon className="w-7 h-7" />
                </motion.button>
              );
            }

            return (
              <motion.button
                key={tab.name}
                onClick={() => navigate(tab.path)}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 flex-1 h-12 rounded-2xl transition-all",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                variants={buttonTap}
                whileTap="tap"
              >
                <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
                <span className="text-[10px] font-bold tracking-tight">
                  {tab.name}
                </span>
                {isActive && (
                  <motion.div 
                    layoutId="activeTabIndicator"
                    className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default BottomTabBar;