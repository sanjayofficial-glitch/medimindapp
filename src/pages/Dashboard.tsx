import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Pill, History, Users, Plus, CheckCircle, Clock, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { getMedicines, getDoseLogsForDate, saveDoseLog, Medicine, DoseLog } from "@/utils/storage";
import { toast } from "sonner";

const Dashboard = () => {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [todayLogs, setTodayLogs] = useState<DoseLog[]>([]);
  const [today, setToday] = useState("");

  const loadData = async () => {
    const d = new Date();
    const dateStr = d.toISOString().split('T')[0];
    setToday(dateStr);
    
    const allMeds = getMedicines();
    setMedicines(allMeds);
    
    const logs = await getDoseLogsForDate(dateStr);
    
    // If no logs exist for today but we have medicines, we should show them as pending
    // In a real app, a background job or initial load would generate these
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

  const takenCount = todayLogs.filter((l) => l.status === "taken").length;
  const pendingCount = todayLogs.filter((l) => l.status === "partial").length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.name || "User"}!</h1>
            <p className="text-gray-600 mt-1">Here's your medication overview for today.</p>
          </div>
          <Link to="/add-medicine">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" /> Add Medicine
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Medicines</CardTitle>
              <Pill className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{medicines.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taken Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{takenCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/history" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <History className="w-4 h-4 mr-2" /> View History
                </Button>
              </Link>
              <Link to="/family-members" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" /> Manage Family
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              {todayLogs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No medications scheduled for today.</p>
                  <Link to="/add-medicine">
                    <Button variant="link" className="text-emerald-600">Add your first medicine</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayLogs.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime)).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-white border rounded-xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          log.status === "taken" ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400"
                        )}>
                          <Pill className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{log.medicineName}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {log.scheduledTime}
                          </p>
                        </div>
                      </div>
                      
                      {log.status === "partial" ? (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                            onClick={() => handleStatusUpdate(log, "missed")}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            className="h-8 bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => handleStatusUpdate(log, "taken")}
                          >
                            <Check className="w-4 h-4 mr-1" /> Take
                          </Button>
                        </div>
                      ) : (
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          log.status === "taken" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                        )}>
                          {log.status}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

import { cn } from "@/lib/utils";
export default Dashboard;