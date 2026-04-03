import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Plus, LogOut, Clock, CheckCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Medicine, FamilyMember, getMedicines, getFamilyMembers } from "@/utils/storage";
import AIAssistant from "@/components/AIAssistant";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setMedicines(getMedicines());
    getFamilyMembers().then(setFamilyMembers);
    
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

  const getMemberName = (id: string) => {
    if (id === "self") return user?.name || "Myself";
    const member = familyMembers.find(m => m.id === id);
    return member ? member.name : "Unknown";
  };

  const todayMeds = medicines.sort((a, b) => a.times[0]?.localeCompare(b.times[0] || "") || 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{getGreeting()}, {user?.name}</h1>
            <p className="text-gray-600 mt-1">Here's your medication schedule for today</p>
          </div>
          <div className="flex gap-2">
            <Link to="/family-members">
              <Button variant="outline" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Family</span>
              </Button>
            </Link>
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
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
                        <p className="text-xs text-emerald-600 mt-0.5">For: {getMemberName(med.familyMemberId)}</p>
                        {med.times && med.times.length > 0 && (
                          <p className="text-sm text-gray-600 mt-1">
                            {med.times.join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-medium text-gray-700">{med.times[0]}</span>
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
      
      {/* AI Assistant FAB */}
      <AIAssistant />
    </div>
  );
};

export default Dashboard;