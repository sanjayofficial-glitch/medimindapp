import { ChevronLeft, ChevronRight } from "lucide-react";
import { DoseLog } from "@/utils/storage";

interface DayStatusInfo {
  taken: number;
  missed: number;
  late: number;
}

interface HistoryCalendarProps {
  currentDate: Date;
  selectedDate: string;
  doseLogs: DoseLog[];
  onDateSelect: (date: string) => void;
  onMonthChange: (date: Date) => void;
}

const HistoryCalendar = ({
  currentDate,
  selectedDate,
  doseLogs,
  onDateSelect,
  onMonthChange,
}: HistoryCalendarProps) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const getDayStatusInfo = (day: number): DayStatusInfo => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(year, month, day);
    
    if (checkDate > today) return { taken: 0, missed: 0, late: 0 };
    
    const dayLogs = doseLogs.filter((log) => log.date === dateStr);
    return {
      taken: dayLogs.filter((l) => l.status === "taken").length,
      missed: dayLogs.filter((l) => l.status === "missed").length,
      late: dayLogs.filter((l) => l.status === "partial").length,
    };
  };
  
  const getDayStatus = (day: number): "green" | "yellow" | "red" | "gray" | "none" => {
    const info = getDayStatusInfo(day);
    const total = info.taken + info.missed + info.late;
    
    if (total === 0) return "none";
    
    if (info.taken === total) return "green";
    if (info.taken > 0) return "yellow";
    return "red";
  };
  
  const getDayColor = (status: string) => {
    switch (status) {
      case "green": return "bg-emerald-500 text-white";
      case "yellow": return "bg-amber-400 text-gray-900";
      case "red": return "bg-rose-500 text-white";
      case "gray": return "bg-gray-200 text-gray-400";
      default: return "bg-white text-gray-700 hover:bg-gray-50";
    }
  };
  
  const prevMonth = () => {
    onMonthChange(new Date(year, month - 1, 1));
  };
  
  const nextMonth = () => {
    onMonthChange(new Date(year, month + 1, 1));
  };
  
  const days = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="w-9 h-9" />);
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const status = getDayStatus(day);
    const statusInfo = getDayStatusInfo(day);
    const isSelected = selectedDate === dateStr;
    
    days.push(
      <div key={day} className="w-9 h-9 flex flex-col items-center justify-center">
        <button
          onClick={() => onDateSelect(dateStr)}
          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all ${getDayColor(status)} ${isSelected ? "ring-2 ring-offset-2 ring-blue-500" : ""}`}
        >
          {day}
        </button>
        {(statusInfo.taken > 0 || statusInfo.missed > 0 || statusInfo.late > 0) && (
          <div className="flex items-center gap-0.5 mt-0.5">
            {statusInfo.taken > 0 && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
            {statusInfo.missed > 0 && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
            {statusInfo.late > 0 && <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-xl font-bold text-gray-900">
          {monthNames[month]} {year}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>
      
      <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-xs text-gray-600">Taken</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-400" />
          <span className="text-xs text-gray-600">Late</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-xs text-gray-600">Missed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-200" />
          <span className="text-xs text-gray-600">Future</span>
        </div>
      </div>
    </div>
  );
};

export default HistoryCalendar;