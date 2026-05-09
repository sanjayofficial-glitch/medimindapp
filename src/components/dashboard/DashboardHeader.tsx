"use client";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Pill, ShieldAlert, LogOut, Settings as SettingsIcon, Sparkles, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { useAI } from "@/context/AIContext";
import AIChatModal from "@/components/AIChatModal";
import { User } from "@supabase/supabase-js";

interface DashboardHeaderProps {
  user: User | null;
  onLogout: () => void;
}

const DashboardHeader = ({ user, onLogout }: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const { aiEnabled, setAiEnabled } = useAI();
  const [aiChatOpen, setAiChatOpen] = useState(false);

  return (
    <header className="bg-card border-b border-border sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/dashboard">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Pill className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground leading-tight">MediMind</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Clinical Dashboard</p>
            </div>
          </div>
        </Link>
        
        <div className="flex items-center gap-2">
          {aiEnabled && (
            <Button 
              variant="outline" 
              size="icon"
              className="rounded-full border-emerald-200 text-emerald-600 hover:bg-emerald-50"
              onClick={() => setAiChatOpen(true)}
              title="Chat with AI"
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
          )}
          
          <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-full">
            <Sparkles className={`w-4 h-4 ${aiEnabled ? "text-emerald-500" : "text-muted-foreground"}`} />
            <Switch 
              checked={aiEnabled} 
              onCheckedChange={setAiEnabled}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>

          <Button 
            variant="destructive" 
            size="sm" 
            className="rounded-full shadow-lg shadow-destructive/20 animate-pulse"
            onClick={() => navigate("/emergency-id")}
          >
            <ShieldAlert className="w-4 h-4 mr-1" /> Emergency
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative h-8 w-8 rounded-full p-0 overflow-hidden border border-border">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'default'}`} alt="avatar" className="h-full w-full object-cover" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.user_metadata?.name || "Patient"}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email || "patient@medimind.com"}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
                <SettingsIcon className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <AIChatModal open={aiChatOpen} onOpenChange={setAiChatOpen} />
      </div>
    </header>
  );
};

export default DashboardHeader;