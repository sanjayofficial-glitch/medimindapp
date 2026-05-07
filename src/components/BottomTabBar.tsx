"use client";

import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, History, Plus, BarChart3, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { iconBounce, buttonTap } from "@/lib/animations";

const BottomTabBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  if (["/", "/login", "/signup"].includes(location.pathname)) {
    return null;
  }

  const tabs = [
    { name: "Home", path: "/dashboard", icon: Home },
    { name: "History", path: "/history", icon: History },
    { name: "Add", path: "/add-medicine", icon: Plus, isMain: true },
    { name: "Progress", path: "/progress", icon: BarChart3 },
    { name: "More", path: "/more", icon: MoreHorizontal },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-card/80 backdrop-blur-xl border border-border shadow-2xl rounded-3xl px-3 py-2.5 flex justify-between items-center"
      >
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          
          if (tab.isMain) {
            return (
              <motion.button
                key={tab.name}
                whileHover={{ scale: 1.15, rotate: 90 }}
                whileTap={{ scale: 0.85 }}
                onClick={() => navigate(tab.path)}
                className="w-12 h-12 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/25 flex items-center justify-center transition-transform"
              >
                <motion.div variants={iconBounce} initial="rest" whileHover="hover" whileTap="tap">
                  <Icon className="w-6 h-6" />
                </motion.div>
              </motion.button>
            );
          }

          return (
            <motion.button
              key={tab.name}
              onClick={() => navigate(tab.path)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 px-2 py-1 rounded-xl transition-all",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              variants={buttonTap}
              whileTap="tap"
            >
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/10 rounded-xl -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <motion.div
                animate={{ scale: isActive ? 1.15 : 1 }}
                variants={iconBounce}
                initial="rest"
                whileHover="hover"
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Icon className="w-5 h-5" />
              </motion.div>
              <motion.span 
                initial={false}
                animate={{ 
                  opacity: isActive ? 1 : 0.7, 
                  y: isActive ? 0 : 2,
                  fontSize: isActive ? '0.65rem' : '0.6rem'
                }}
                className="font-bold tracking-tight"
              >
                {tab.name}
              </motion.span>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
};

export default BottomTabBar;