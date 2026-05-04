"use client";

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, Variants } from "framer-motion";
import { 
  Pill, 
  History, 
  Users, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ChevronRight, 
  Bell,
  LogOut,
  Activity,
  Package,
  Thermometer
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
import { getMedicines, getDoseLogsForDate, saveDoseLog, Medicine, DoseLog } from "@/utils/storage";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import InteractionChecker from "@/components/InteractionChecker";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [todayLogs, setTodayLogs] = useState<DoseLog[]>([]);

  const loadData = async () => {
    const d = new Date();
    const dateStr = d.toISOString().split('T')[0];
    const allMeds = getMedicines();
    setMedicines(allMeds);
    const logs = await getDoseLogsForDate(dateStr);
    setTodayLogs(logs);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusUpdate = async (log: DoseLog, status: "taken" | "missed") => {
    const updatedLog: DoseLog = {
      ...log,
      status,
      actualTime: status === "taken" ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : undefined
    };
    await saveDoseLog(updatedLog);
    toast.success(`Marked ${log.medicineName} as ${status}`);
    loadData();
  };

  const handleLogout = () => {
    logout();
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

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-slate-50 pb-32"
    >
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/dashboard">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Pill className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900 leading-tight">MediMind</h1>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Clinical Dashboard</p>
              </div>
            </div>
          </Link>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full text-slate-500 hover:bg-slate-100 relative">
              <Bell className="w-5 h-5" />
              {pendingCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative h-8 w-8 rounded-full p-0 overflow-hidden border border-slate-200">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'default'}`} alt="avatar" className="h-full w-full object-cover" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || "Patient"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email || "patient@medimind.com"}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-rose-600 cursor-pointer">
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
              <h2 className="text-3xl font-bold text-slate-900">{user?.name || "Patient"}</h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div variants={itemVariants}>
            <Card className="border-none shadow-sm bg-white overflow-hidden h-full">
              <div className="h-1 bg-primary w-full" />
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Daily Progress</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{Math.round(progress)}%</div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-slate-500 mb-1"><span>{takenCount}/{totalToday} Doses</span></div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card className="border-none shadow-sm bg-white h-full">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Active Meds</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold text-slate-900">{medicines.length}</div>
                  <div className="px-2 py-1 text-[10px] font-bold rounded uppercase bg-emerald-50 text-emerald-600">Stable</div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Across all family members</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card className="border-none shadow-sm bg-white h-full">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Next Dose</CardTitle></CardHeader>
              <CardContent>
                <div className={cn("text-3xl font-bold", pendingCount > 0 ? "text-slate-900" : "text-emerald-600")}>
                  {pendingCount > 0 ? todayLogs.find(l => l.status === "partial")?.scheduledTime : "All Clear"}
                </div>
                <p className="text-xs text-slate-500 mt-2">Stay on schedule</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Schedule */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Today's Schedule</h3>
                <Link to="/add-medicine"><Button size="sm" className="rounded-full bg-primary"><Plus className="w-4 h-4 mr-1" /> Add New</Button></Link>
              </div>
              <div className="space-y-4">
                {todayLogs.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
                    <Pill className="w-8 h-8 text-slate-300 mx-auto mb-4" />
                    <h4 className="text-lg font-bold text-slate-900 mb-2">No medications scheduled</h4>
                    <Link to="/add-medicine"><Button variant="outline" className="rounded-full">Get Started</Button></Link>
                  </div>
                ) : (
                  todayLogs.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime)).map((log) => (
                    <div key={log.id} className={cn("flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm", log.status === "taken" && "bg-slate-50/50")}>
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", log.status === "taken" ? "bg-emerald-100 text-emerald-600" : "bg-primary/10 text-primary")}>
                          <Pill className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900">{log.medicineName}</p>
                            {log.status === "taken" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          </div>
                          <p className="text-xs font-medium text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {log.scheduledTime}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {log.status === "partial" ? (
                          <Button className="h-10 px-6 rounded-full bg-primary" onClick={() => handleStatusUpdate(log, "taken")}>Take Now</Button>
                        ) : (
                          <div className={cn("px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest", log.status === "taken" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
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
            {/* Health Hub */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-slate-900">Health Hub</h3>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { to: "/vitals", icon: Activity, title: "Vitals", sub: "BP, Sugar, Weight", color: "bg-rose-50 text-rose-600" },
                  { to: "/refills", icon: Package, title: "Refills", sub: "Stock management", color: "bg-blue-50 text-blue-600" },
                  { to: "/symptoms", icon: Thermometer, title: "Symptoms", sub: "Log side effects", color: "bg-amber-50 text-amber-600" },
                  { to: "/history", icon: History, title: "History", sub: "Past adherence", color: "bg-indigo-50 text-indigo-600" },
                  { to: "/family-members", icon: Users, title: "Family", sub: "Manage members", color: "bg-emerald-50 text-emerald-600" }
                ].map((action, i) => (
                  <Link key={i} to={action.to}>
                    <Card className="group hover:border-primary/50 transition-all cursor-pointer border-none shadow-sm">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", action.color, "group-hover:bg-primary group-hover:text-white")}>
                            <action.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{action.title}</p>
                            <p className="text-xs text-slate-500">{action.sub}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>

            <Card className="bg-primary text-white border-none shadow-lg shadow-primary/20">
              <CardHeader><CardTitle className="text-lg">Health Tip</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-primary-foreground/80 leading-relaxed">
                  Consistency is key to effective treatment. Try to take your medications at the same time every day.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </motion.div>
  );
};

export default Dashboard;