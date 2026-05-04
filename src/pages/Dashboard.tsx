"use client";

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { 
  Pill, 
  History, 
  Users, 
  Plus, 
  CheckCircle2, 
  Clock, 
  X, 
  Calendar, 
  ChevronRight, 
  Bell,
  LogOut,
  User as UserIcon,
  Settings
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
import { PageSkeleton, StatsSkeleton, CardSkeleton } from "@/components/LoadingSkeleton";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [todayLogs, setTodayLogs] = useState<DoseLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const d = new Date();
      const dateStr = d.toISOString().split('T')[0];
      const allMeds = getMedicines();
      setMedicines(allMeds);
      const logs = await getDoseLogsForDate(dateStr);
      setTodayLogs(logs);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Skeleton className="h-16 w-full bg-white border-b border-slate-200" />
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-24 w-full bg-white rounded-2xl" />
          <StatsSkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-8 w-40" />
              <CardSkeleton count={3} />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-20 bg-white rounded-2xl" />
              <Skeleton className="h-32 bg-primary/10 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

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

  const showNotifications = () => {
    toast.info("You have no new notifications", {
      description: "We'll alert you when it's time for your next dose."
    });
  };

  const takenCount = todayLogs.filter((l) => l.status === "taken").length;
  const pendingCount = todayLogs.filter((l) => l.status === "partial").length;
  const totalToday = todayLogs.length;
  const progress = totalToday > 0 ? (takenCount / totalToday) * 100 : 0;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-slate-50 pb-32"
    >
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/dashboard">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Pill className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900 leading-tight">MediMind</h1>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Clinical Dashboard</p>
              </div>
            </motion.div>
          </Link>
          
          <div className="flex items-center gap-2">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full text-slate-500 hover:bg-slate-100 relative"
                onClick={showNotifications}
              >
                <Bell className="w-5 h-5" />
                {pendingCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" 
                  />
                )}
              </Button>
            </motion.div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative h-8 w-8 rounded-full p-0 overflow-hidden border border-slate-200"
                >
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'default'}`} 
                    alt="avatar" 
                    className="h-full w-full object-cover"
                  />
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || "Patient"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email || "patient@medimind.com"}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-rose-600 cursor-pointer" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome & Summary */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-primary mb-1">Good morning,</p>
              <h2 className="text-3xl font-bold text-slate-900">{user?.name || "Patient"}</h2>
            </div>
            <motion.div 
              whileHover={{ y: -2 }}
              className="flex items-center gap-2 text-sm text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm"
            >
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </motion.div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { title: "Daily Progress", value: `${Math.round(progress)}%`, sub: `${takenCount}/${totalToday} Doses`, color: "bg-primary", progress: true },
            { title: "Active Meds", value: medicines.length, sub: "Across all family members", badge: "Stable" },
            { title: "Next Dose", value: pendingCount > 0 ? todayLogs.find(l => l.status === "partial")?.scheduledTime : "All Clear", sub: "Stay on schedule", badge: pendingCount > 0 ? "Upcoming" : null }
          ].map((stat, i) => (
            <motion.div key={i} variants={itemVariants} whileHover={{ y: -4 }}>
              <Card className="border-none shadow-sm bg-white overflow-hidden h-full">
                {stat.color && <div className={`h-1 ${stat.color} w-full`} />}
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{stat.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className={cn("text-3xl font-bold text-slate-900", stat.value === "All Clear" && "text-emerald-600")}>{stat.value}</div>
                    {stat.badge && (
                      <div className={cn(
                        "px-2 py-1 text-[10px] font-bold rounded uppercase",
                        stat.badge === "Stable" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                      )}>
                        {stat.badge}
                      </div>
                    )}
                  </div>
                  {stat.progress ? (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>{stat.sub}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-primary" 
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 mt-2">{stat.sub}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Schedule */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div variants={itemVariants} className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Today's Schedule</h3>
              <Link to="/add-medicine">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="sm" className="rounded-full bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-1" /> Add New
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            {todayLogs.length === 0 ? (
              <motion.div 
                variants={itemVariants}
                className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200"
              >
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Pill className="w-8 h-8 text-slate-300" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">No medications scheduled</h4>
                <p className="text-slate-500 mb-6">Start by adding your first medication to your schedule.</p>
                <Link to="/add-medicine">
                  <Button variant="outline" className="rounded-full">Get Started</Button>
                </Link>
              </motion.div>
            ) : (
              <motion.div variants={containerVariants} className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {todayLogs.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime)).map((log) => (
                    <motion.div 
                      key={log.id} 
                      layout
                      variants={itemVariants}
                      exit={{ opacity: 0, x: -20 }}
                      whileHover={{ x: 4 }}
                      className={cn(
                        "group flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md",
                        log.status === "taken" && "bg-slate-50/50"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                          log.status === "taken" ? "bg-emerald-100 text-emerald-600" : "bg-primary/10 text-primary"
                        )}>
                          <Pill className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900">{log.medicineName}</p>
                            {log.status === "taken" && (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              </motion.div>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {log.scheduledTime}
                            </span>
                            <span className="text-[10px] text-slate-300">•</span>
                            <span className="text-xs font-medium text-slate-400">Daily Dose</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {log.status === "partial" ? (
                          <>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-10 w-10 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                                onClick={() => handleStatusUpdate(log, "missed")}
                              >
                                <X className="w-5 h-5" />
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button 
                                className="h-10 px-6 rounded-full bg-primary hover:bg-primary/90 shadow-sm"
                                onClick={() => handleStatusUpdate(log, "taken")}
                              >
                                Take Now
                              </Button>
                            </motion.div>
                          </>
                        ) : (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={cn(
                              "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest",
                              log.status === "taken" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                            )}
                          >
                            {log.status}
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            <motion.h3 variants={itemVariants} className="text-xl font-bold text-slate-900">Quick Access</motion.h3>
            <div className="grid grid-cols-1 gap-4">
              {[
                { to: "/history", icon: History, title: "History", sub: "Review past doses", color: "bg-indigo-50 text-indigo-600", hover: "group-hover:bg-indigo-600" },
                { to: "/family-members", icon: Users, title: "Family", sub: "Manage members", color: "bg-emerald-50 text-emerald-600", hover: "group-hover:bg-emerald-600" }
              ].map((action, i) => (
                <Link key={i} to={action.to}>
                  <motion.div variants={itemVariants} whileHover={{ x: 8 }}>
                    <Card className="group hover:border-primary/50 transition-all cursor-pointer border-none shadow-sm">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", action.color, action.hover, "group-hover:text-white")}>
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
                  </motion.div>
                </Link>
              ))}

              <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }}>
                <Card className="bg-primary text-white border-none shadow-lg shadow-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg">Health Tip</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-primary-foreground/80 leading-relaxed">
                      Consistency is key to effective treatment. Try to take your medications at the same time every day.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </motion.div>
  );
};

export default Dashboard;