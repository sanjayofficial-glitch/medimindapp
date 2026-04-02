import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { DoseLog } from "@/utils/storage";

interface DoseListProps {
  selectedDate: string;
  doseLogs: DoseLog[];
}

const DoseList = ({ selectedDate, doseLogs }: DoseListProps) => {
  const dayLogs = doseLogs.filter((log) => log.date === selectedDate);
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "taken":
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case "missed":
        return <XCircle className="w-5 h-5 text-rose-500" />;
      case "partial":
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      default:
        return null;
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case "taken":
        return "Taken";
      case "missed":
        return "Missed";
      case "partial":
        return "Late";
      default:
        return status;
    }
  };
  
  if (dayLogs.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No doses scheduled</h3>
        <p className="text-gray-500">No medications were scheduled for {formatDate(selectedDate)}</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-900">{formatDate(selectedDate)}</h3>
        <p className="text-sm text-gray-500 mt-1">{dayLogs.length} dose{dayLogs.length !== 1 ? "s" : ""} scheduled</p>
      </div>
      
      <div className="divide-y divide-gray-100">
        {dayLogs
          .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))
          .map((log) => (
            <div key={log.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                {getStatusIcon(log.status)}
                <div>
                  <p className="font-semibold text-gray-900">{log.medicineName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-sm text-gray-500">Scheduled: {log.scheduledTime}</span>
                    {log.actualTime && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span className="text-sm text-gray-500">Taken: {log.actualTime}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                log.status === "taken" ? "bg-emerald-100 text-emerald-700" :
                log.status === "missed" ? "bg-rose-100 text-rose-700" :
                "bg-amber-100 text-amber-700"
              }`}>
                {getStatusText(log.status)}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
};

export default DoseList;