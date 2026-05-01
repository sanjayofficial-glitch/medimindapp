"use client";

import { useNavigate, useLocation } from "react-router-dom";
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
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-3xl px-4 py-3 flex justify-between items-center">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          
          if (tab.isMain) {
            return (
              <button
                key={tab.name}
                onClick={() => navigate(tab.path)}
                className="w-14 h-14 bg-primary text-white rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center transition-transform active:scale-90 hover:scale-105"
              >
                <Icon className="w-7 h-7" />
              </button>
            );
          }

          return (
            <button
              key={tab.name}
              onClick={() => navigate(tab.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-xl transition-all",
                isActive 
                  ? "text-primary" 
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Icon className={cn("w-6 h-6 transition-transform", isActive && "scale-110")} />
              <span className={cn(
                "text-[10px] font-bold tracking-tight",
                isActive ? "opacity-100" : "opacity-0"
              )}>
                {tab.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomTabBar;