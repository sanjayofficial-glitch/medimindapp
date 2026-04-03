4 | ...
```

This means the file still has the dyad-write tags in it. I need to write the complete file content without those tags. Let me write the History.tsx file with the correct content.</think>I see the issue - the History.tsx file still contains the corrupted dyad-write tags. Let me write the complete file with proper code:<tool_call>
<function=dyad-write>
<parameter=description>
Writing complete History.tsx file
</parameter>
<parameter=path>
src/pages/History.tsx
</parameter>
<parameter=value>
import { useState, useEffect } from "react";
import { ArrowLeft, TrendingUp, Database } from "lucide-react";
import { Link } from "react-router-dom";
import HistoryCalendar from "@/components/HistoryCalendar";
import DoseList from "@/components/DoseList";
import { DoseLog, getDoseLogsForMonth, generateMockData } from "@/utils/storage";
import { Button } from "@/components/ui/button";

const History = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  });
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>([]);
  const [compliance, setCompliance] = useState(0);
  
  useEffect(() => {
    const loadLogs = async () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const logs = await getDoseLogsForMonth(year, month);
      setDoseLogs(logs);
      
      if (logs.length > 0) {
        const taken = logs.filter((l) => l.status === "taken").length;
        const percentage = Math.round((taken / logs.length) * 100);
        setCompliance(percentage);
      } else {
        setCompliance(0);
      }
    };
    
    loadLogs();
  }, [currentDate]);
  
  const handleMonthChange = (date: Date) => {
    setCurrentDate(date);
  };
  
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };
  
  const handleGenerateMock = async () => {
    await generateMockData();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const logs = await getDoseLogsForMonth(year, month);
    setDoseLogs(logs);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Home</span>
          </Link>
          <Button
            onClick={handleGenerateMock}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Database className="w-4 h-4" />
            Generate Test Data
          </Button>
        </div>
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Medication History</h1>
          <p className="text-gray-600">Track your adherence and review past doses</p>
        </div>
        
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium mb-1">Month Compliance</p>
              <p className="text-4xl font-bold">{compliance}%</p>
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
              <TrendingUp className="w-5 h-5" />
              <span className="font-semibold">
                {compliance >= 80 ? "Excellent" : compliance >= 60 ? "Good" : "Needs Improvement"}
              </span>
            </div>
          </div>
        </div>
        
        <HistoryCalendar
          currentDate={currentDate}
          selectedDate={selectedDate}
          doseLogs={doseLogs}
          onDateSelect={handleDateSelect}
          onMonthChange={handleMonthChange}
        />
        
        <div className="mt-6">
          <DoseList selectedDate={selectedDate} doseLogs={doseLogs} />
        </div>
      </div>
    </div>
  );
};

export default History;
</parameter>
</function>
</tool_call><dyad-write path="src/pages/Dashboard.tsx" description="Restoring green theme to Dashboard cards and accents">
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Plus, LogOut, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  time: string;
  frequency: string;
}

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const stored = localStorage.getItem("medimind_medicines");
    if (stored) setMedicines(JSON.parse(stored));
    
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    toast.info("Logged out successfully");
    navigate("/");
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const todayMeds = medicines.sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{getGreeting()}, {user?.name}</h1>
            <p className="text-gray-600 mt-1">Here's your medication schedule for today</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link to="/add-medicine" className="md:col-span-1">
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-emerald-200 bg-emerald-50">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center mb-3">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Add Medicine</h3>
                <p className="text-sm text-gray-600 mt-1">Schedule a new medication</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/history" className="md:col-span-2">
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-green-200 bg-green-50">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mb-3">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">View History</h3>
                <p className="text-sm text-gray-600 mt-1">Track adherence with color-coded calendar</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Today's Schedule</CardTitle>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {todayMeds.length} medication{todayMeds.length !== 1 ? "s" : ""}
            </span>
          </CardHeader>
          <CardContent>
            {todayMeds.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No medications scheduled</h3>
                <p className="text-gray-500 mb-4">Add your first medicine to get started</p>
                <Link to="/add-medicine">
                  <Button>Add Medicine</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {todayMeds.map((med) => (
                  <div key={med.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{med.name}</p>
                        <p className="text-sm text-gray-500">{med.dosage} • {med.frequency}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-medium text-gray-700">{med.time}</span>
                      <button className="p-2 hover:bg-emerald-100 rounded-full transition-colors" title="Mark as taken">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
</parameter>
</function>
</tool_call><dyad-write path="src/pages/Index.tsx" description="Restoring green theme to landing page">
import { Link } from "react-router-dom";
import { Pill, ArrowRight } from "lucide-react";
import { MadeWithDyad } from "@/components/made-with-dyad";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">MediMind</h1>
          <p className="text-xl text-gray-600">Your smart medication companion</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Link
            to="/login"
            className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Pill className="w-6 h-6 text-emerald-600" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Get Started</h2>
            <p className="text-gray-600">Sign in or create an account to begin tracking your medications</p>
          </Link>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 opacity-60">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <Pill className="w-6 h-6 text-gray-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Features</h2>
            <p className="text-gray-600">• Medication tracking • History analytics • Smart reminders</p>
          </div>
        </div>
        
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Index;