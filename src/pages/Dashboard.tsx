import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Pill, History, Users, Plus, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { getMedicines, getDoseLogsForDate, Medicine, DoseLog } from "@/utils/storage";

const Dashboard = () => {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [todayLogs, setTodayLogs] = useState<DoseLog[]>([]);
  const [today, setToday] = useState("");

  useEffect(() => {
    const d = new Date();
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    setToday(dateStr);
    setMedicines(getMedicines());
    getDoseLogsForDate(dateStr).then(setTodayLogs);
  }, []);

  const takenCount = todayLogs.filter((l) => l.status === "taken").length;
  const pendingCount = Math.max(0, medicines.length - takenCount);

  return (
    <div className="min-h-screen bg-gray-50">
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
                <p className="text-gray-500 text-center py-4">No medications scheduled for today.</p>
              ) : (
                <div className="space-y-3">
                  {todayLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{log.medicineName}</p>
                        <p className="text-sm text-gray-500">{log.scheduledTime}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        log.status === "taken" ? "bg-emerald-100 text-emerald-700" :
                        log.status === "missed" ? "bg-rose-100 text-rose-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {log.status}
                      </span>
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

export default Dashboard;