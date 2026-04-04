import { useState, useEffect } from "react";
import HistoryCalendar from "@/components/HistoryCalendar";
import DoseList from "@/components/DoseList";
import { getDoseLogs, DoseLog, generateMockData } from "@/utils/storage";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const MedicationHistory = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>([]);

  const loadLogs = async () => {
    const logs = await getDoseLogs();
    setDoseLogs(logs);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleGenerateMock = async () => {
    await generateMockData();
    loadLogs();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Medication History</h1>
            <p className="text-gray-600 mt-1">Review your past adherence and scheduled doses</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGenerateMock}
            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Mock Data
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <HistoryCalendar
              currentDate={currentMonth}
              selectedDate={selectedDate}
              doseLogs={doseLogs}
              onDateSelect={setSelectedDate}
              onMonthChange={setCurrentMonth}
            />
          </div>
          
          <div className="lg:col-span-2">
            <DoseList
              selectedDate={selectedDate}
              doseLogs={doseLogs}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicationHistory;