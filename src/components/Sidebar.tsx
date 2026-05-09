"use client";

import { useNavigate, useLocation } from "react-router-dom";
import { Home, History, Plus, LayoutGrid, MoreHorizontal, Pill, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  if (["/", "/login", "/signup"].includes(location.pathname)) {
    return null;
  }

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: Home },
    { name: "History", path: "/history", icon: History },
    { name: "Add Medicine", path: "/add-medicine", icon: Plus },
    { name: "Health Hub", path: "/hub", icon: LayoutGrid },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border h-screen sticky top-0 shrink-0">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Pill className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">MediMind</span>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-border">
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-border">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'default'}`} alt="avatar" />
          </div>
          <div className="flex flex-col min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{user?.user_metadata?.name || "Patient"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
          onClick={() => logout()}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;