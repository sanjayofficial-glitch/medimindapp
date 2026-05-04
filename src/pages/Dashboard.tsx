"use client";

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, Variants } from "framer-motion";
import { 
  Pill, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ChevronRight, 
  LogOut,
  Activity,
  Package,
  Sparkles,
  Info,
  ShieldAlert,
  Trophy,
  Settings as SettingsIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { getDoseLogsForDate, saveDoseLog, DoseLog } from "@/utils/storage";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import InteractionChecker from "@/components/InteractionChecker";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [todayLogs, setTodayLogs] = useState<DoseLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const d = new Date();
      const dateStr = d.toISOString().split('T')[0];
      const logs = await getDoseLogsForDate(dateStr);
      setTodayLogs(logs);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      navigate("/login");
    }
  }, [user, navigate]);

  const handleStatusUpdate = async (log: DoseLog, status: "taken" | "missed") => {
    try {
      const updatedLog: DoseLog = {
        ...log,
        status,
        actualTime: status === "taken" ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : undefined
      };
      await saveDoseLog(updatedLog);
      toast.success(`Marked ${log.medicineName} as ${status}`);
      loadData();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
    toast.success("Logged out successfully");
  };

  const takenCount = todayLogs.filter((l) => l.status === "taken").length;
  const pendingCount = todayLogs.filter((l) => l.status === "partial").length;
  const totalToday = todayLogs.length;
  const progress = totalToday > 0 ? (takenCount / totalToday) * 100 : 0;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-background pb-32"
    >
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
                <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-primary mb-1">Good morning,</p>
              <h2 className="text-3xl font-bold text-foreground">{user?.user_metadata?.name || "Patient"}</h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card px-4 py-2 rounded-full border border-border shadow-sm">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div variants={itemVariants}>
            <Card className="border-none shadow-sm bg-card overflow-hidden h-full">
              <div className="h-1 bg-primary w-full" />
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Daily Progress</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{Math.round(progress)}%</div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>{takenCount}/{totalToday} Doses</span></div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card className="border-none shadow-sm bg-card h-full">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Adherence Streak</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold text-foreground">12 Days</div>
                  <div className="px-2 py-1 text-[10px] font-bold rounded uppercase bg-primary/10 text-primary flex items-center gap-1">
                    <Trophy className="w-3 h-3" /> Milestone
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Keep it up for a reward!</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card className="border-none shadow-sm bg-card h-full">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Next Dose</CardTitle></CardHeader>
              <CardContent>
                <div className={cn("text-3xl font-bold", pendingCount > 0 ? "text-foreground" : "text-primary")}>
                  {pendingCount > 0 ? todayLogs.find(l => l.status === "partial")?.scheduledTime : "All Clear"}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Stay on schedule</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Schedule */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-foreground">Today's Schedule</h3>
                <Link to="/add-medicine"><Button size="sm" className="rounded-full bg-primary text-primary-foreground"><Plus className="w-4 h-4 mr-1" /> Add New</Button></Link>
              </div>
              <div className="space-y-4">
                {todayLogs.length === 0 ? (
                  <div className="bg-card rounded-3xl p-12 text-center border-2 border-dashed border-border">
                    <Pill className="w-8 h-8 text-muted-foreground/30 mx-auto mb-4" />
                    <h4 className="text-lg font-bold text-foreground mb-2">No medications scheduled</h4>
                    <Link to="/add-medicine"><Button variant="outline" className="rounded-full">Get Started</Button></Link>
                  </div>
                ) : (
                  todayLogs.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime)).map((log) => (
                    <div key={log.id} className={cn("flex items-center justify-between p-4 bg-card rounded-2xl border border-border shadow-sm", log.status === "taken" && "opacity-70")}>
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", log.status === "taken" ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary")}>
                          <Pill className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-foreground">{log.medicineName}</p>
                            {log.status === "taken" && <CheckCircle2 className="w-4 h-4 text-primary" />}
                          </div>
                          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {log.scheduledTime}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {log.status === "partial" ? (
                          <Button className="h-10 px-6 rounded-full bg-primary text-primary-foreground" onClick={() => handleStatusUpdate(log, "taken")}>Take Now</Button>
                        ) : (
                          <div className={cn("px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest", log.status === "taken" ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive")}>
                            {log.status}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Interaction Checker */}
            <section>
              <InteractionChecker />
            </section>
          </div>

          <div className="space-y-8">
            {/* Health Hub Quick Links */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-foreground">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { to: "/appointments", icon: Calendar, title: "Appointments", sub: "Next: Dr. Smith", color: "bg-blue-500/10 text-blue-500" },
                  { to: "/lab-results", icon: Activity, title: "Lab Results", sub: "Track biomarkers", color: "bg-primary/10 text-primary" },
                  { to: "/mood", icon: Sparkles, title: "Mood Journal", sub: "Mental health", color: "bg-indigo-500/10 text-indigo-500" },
                  { to: "/wallet", icon: Package, title: "Rx Wallet", sub: "Digital documents", color: "bg-purple-500/10 text-purple-500" }
                ].map((action, i) => (
                  <Link key={i} to={action.to}>
                    <Card className="group hover:border-primary/50 transition-all cursor-pointer border-none shadow-sm bg-card">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", action.color, "group-hover:bg-primary group-hover:text-primary-foreground")}>
                            <action.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{action.title}</p>
                            <p className="text-xs text-muted-foreground">{action.sub}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>

            {/* AI Advice Card */}
            <Card className="bg-primary text-primary-foreground border-none shadow-xl shadow-primary/20 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="w-24 h-24" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  AI Health Insight
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm opacity-90 leading-relaxed">
                  You've been consistent with your Metformin for 5 days! AI analysis shows your mood is 20% better on days you take your meds before 9 AM.
                </p>
                <div className="flex items-center gap-2 bg-white/10 p-2 rounded-lg text-[10px] font-medium">
                  <Info className="w-3 h-3" />
                  <span>Tip: Consistency improves treatment efficacy by 40%.</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </motion.div>
  );
};

export default Dashboard;