import { useEffect, useState } from "react";
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
  ShieldAlert,
  Trophy,
  Settings as SettingsIcon,
  Loader2,
  Bell
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
import { useDoseLogsForDate, useSaveDoseLog, useMedicines, useUpdateMedicine } from "@/hooks/use-queries";
import { DoseLog } from "@/utils/storage";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import InteractionChecker from "@/components/InteractionChecker";
import DynamicAIInsight from "@/components/DynamicAIInsight";
import { scheduleAllNotifications, snoozeNotification, cancelAllNotifications, getNotificationPermissionStatus, cancelNotification, requestNotificationPermission, showTestNotification, sendImmediateNotification, getScheduledNotificationCount } from "@/utils/notifications";
import { subscribeToPush, sendTestPushNotification, isPushSupported, requestPushPermission, getServiceWorkerRegistration } from "@/utils/push-notifications";
import { iconPop, cardInteractive, chevronSlide, buttonTap, scaleIn } from "@/lib/animations";

const Dashboard = () => {
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  const today = new Date().toISOString().split('T')[0];
  const { data: todayLogs = [], isLoading: isDataLoading, refetch } = useDoseLogsForDate(today);
  const { data: medicines = [] } = useMedicines();
  const saveDoseLog = useSaveDoseLog();
  const updateMedicine = useUpdateMedicine();

  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate("/login");
    }
  }, [user, isAuthLoading, navigate]);

  useEffect(() => {
    const initNotifications = async () => {
      if (!user) return;
      
      const permStatus = getNotificationPermissionStatus();
      setNotificationsEnabled(permStatus);
      
      if (permStatus && isPushSupported()) {
        const registration = await getServiceWorkerRegistration();
        if (registration) {
          await subscribeToPush(user.id);
          console.log('[DASHBOARD] Push notifications initialized');
        }
      }
    };
    initNotifications();
  }, [user]);

  useEffect(() => {
    if (notificationsEnabled && medicines.length > 0 && user) {
      const userName = user.user_metadata?.name || "User";
      console.log("[DASHBOARD] Scheduling notifications for medicines:", medicines.map(m => ({ name: m.name, times: m.times })));
      
      // Clear existing and reschedule
      cancelAllNotifications();
      scheduleAllNotifications(medicines, userName);
      
      const count = getScheduledNotificationCount();
      console.log("[DASHBOARD] Total scheduled:", count);
      
      if (count > 0) {
        // Show toast with scheduled count (only first time)
        const shownKey = `notif_shown_${new Date().toDateString()}`;
        if (!sessionStorage.getItem(shownKey)) {
          toast.info(`${count} reminder${count > 1 ? 's' : ''} scheduled for today`);
          sessionStorage.setItem(shownKey, 'true');
        }
      }
    }
    
    return () => {
      cancelAllNotifications();
    };
  }, [medicines, notificationsEnabled, user]);

  useEffect(() => {
    const handleNotificationAction = (event: CustomEvent) => {
      const { type, medicineId, snoozeMinutes } = event.detail;
      if (type === "taken") {
        const log = todayLogs.find(l => l.medicineId === medicineId);
        if (log) handleStatusUpdate(log, "taken");
        cancelNotification(medicineId);
      } else if (type === "snooze") {
        const log = todayLogs.find(l => l.medicineId === medicineId);
        if (log) {
          snoozeNotification(medicineId, log.medicineName, user?.user_metadata?.name || "User", snoozeMinutes || 10);
          toast.info(`Reminder snoozed for ${snoozeMinutes || 10} minutes`);
        }
      }
    };

    window.addEventListener("medimind_notification_action", handleNotificationAction as EventListener);
    return () => {
      window.removeEventListener("medimind_notification_action", handleNotificationAction as EventListener);
    };
  }, [todayLogs, user]);

  const handleStatusUpdate = async (log: DoseLog, status: "taken" | "missed") => {
    try {
      const updatedLog: DoseLog = {
        ...log,
        status,
        actualTime: status === "taken" ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : null
      };
      
      await saveDoseLog.mutateAsync(updatedLog);

      // Automatic stock decrement
      if (status === "taken") {
        const medicine = medicines.find(m => m.id === log.medicineId);
        if (medicine && medicine.stock !== undefined && medicine.stock > 0) {
          await updateMedicine.mutateAsync({
            ...medicine,
            stock: medicine.stock - 1
          });
          
          if (medicine.stock - 1 <= (medicine.refillAt || 5)) {
            toast.warning(`Low stock alert: ${medicine.name} (${medicine.stock - 1} left)`);
          }
        }
      }

      toast.success(`Marked ${log.medicineName} as ${status}`);
      refetch();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
    toast.success("Logged out successfully");
  };

  const takenCount = todayLogs.filter((l: DoseLog) => l.status === "taken").length;
  const pendingCount = todayLogs.filter((l: DoseLog) => l.status === "partial").length;
  const totalToday = todayLogs.length;
  const progress = totalToday > 0 ? (takenCount / totalToday) * 100 : 0;

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  if (isAuthLoading || (user && isDataLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm text-muted-foreground font-medium">Loading your health dashboard...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
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

            <motion.div 
              className={cn(
                "p-2 rounded-full cursor-pointer transition-colors",
                notificationsEnabled ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-500"
              )}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={async () => {
                if (!notificationsEnabled) {
                  const granted = await requestPushPermission();
                  if (granted && user) {
                    await subscribeToPush(user.id);
                    setNotificationsEnabled(true);
                    showTestNotification();
                    toast.success("Notifications enabled!");
                  } else {
                    toast.error("Please allow notifications in browser popup");
                  }
                } else {
                  // Test immediate notification
                  const sent = sendImmediateNotification(
                    "💊 MediMind Test",
                    "Your notification system is working! You'll receive reminders at scheduled times.",
                    "test"
                  );
                  if (sent) {
                    toast.success("Test notification sent!");
                  } else {
                    toast.error("Notifications blocked - check browser settings");
                  }
                }
              }}
              title={notificationsEnabled ? "Click to send test notification" : "Click to enable push notifications"}
            >
              <motion.div 
                animate={notificationsEnabled ? {} : { scale: [1, 1.2, 1], rotate: [0, 10, 0] }}
                transition={{ duration: 0.5, repeat: 2 }}
              >
                <Bell className="w-4 h-4" />
              </motion.div>
            </motion.div>

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
                  {pendingCount > 0 ? todayLogs.find((l: DoseLog) => l.status === "partial")?.scheduledTime : "All Clear"}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Stay on schedule</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
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
                  todayLogs.sort((a: DoseLog, b: DoseLog) => a.scheduledTime.localeCompare(b.scheduledTime)).map((log: DoseLog, i: number) => (
                    <motion.div 
                      key={log.id} 
                      layout
                      variants={scaleIn}
                      initial="hidden"
                      animate="visible"
                      custom={i}
                      whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
                      whileTap={{ scale: 0.99 }}
                      className={cn("flex items-center justify-between p-4 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow", log.status === "taken" && "opacity-70")}
                    >
                      <div className="flex items-center gap-4">
                        <motion.div 
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className={cn("w-12 h-12 rounded-xl flex items-center justify-center", log.status === "taken" ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary")}
                        >
                          <Pill className="w-6 h-6" />
                        </motion.div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-foreground">{log.medicineName}</p>
                            {log.status === "taken" && (
                              <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                              >
                                <CheckCircle2 className="w-4 h-4 text-primary" />
                              </motion.div>
                            )}
                          </div>
                          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {log.scheduledTime}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {log.status === "partial" ? (
                          <motion.div variants={buttonTap} whileTap="tap">
                            <Button 
                              className="h-10 px-6 rounded-full bg-primary text-primary-foreground" 
                              onClick={() => handleStatusUpdate(log, "taken")}
                              disabled={saveDoseLog.isPending}
                            >
                              {saveDoseLog.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Take Now"}
                            </Button>
                          </motion.div>
                        ) : (
                          <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={cn("px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest", log.status === "taken" ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive")}
                          >
                            {log.status}
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </section>

            <section>
              <InteractionChecker />
            </section>
          </div>

          <div className="space-y-8">
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
                    <motion.div 
                      variants={cardInteractive}
                      initial="rest"
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <Card className="group hover:border-primary/50 transition-all cursor-pointer border-none shadow-sm bg-card overflow-hidden">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <motion.div 
                              variants={iconPop}
                              initial="rest"
                              whileHover="hover"
                              whileTap="tap"
                              className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", action.color, "group-hover:bg-primary group-hover:text-primary-foreground")}
                            >
                              <action.icon className="w-5 h-5" />
                            </motion.div>
                            <div>
                              <p className="font-bold text-foreground">{action.title}</p>
                              <p className="text-xs text-muted-foreground">{action.sub}</p>
                            </div>
                          </div>
                          <motion.div variants={chevronSlide} initial="rest" whileHover="hover">
                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </motion.div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </section>

            <DynamicAIInsight />
          </div>
        </div>
      </main>
    </motion.div>
  );
};

export default Dashboard;