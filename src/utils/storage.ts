import { toast } from "sonner";

export interface DoseLog {
  id: string;
  medicineId: string;
  medicineName: string;
  scheduledTime: string;
  actualTime?: string;
  date: string;
  status: "taken" | "missed" | "partial";
}

const STORAGE_KEY = "medimind_dose_logs";

export const getDoseLogs = async (): Promise<DoseLog[]> => {
  try {
    const logs = localStorage.getItem(STORAGE_KEY);
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    console.error("Failed to load dose logs:", error);
    return [];
  }
};

export const saveDoseLog = async (log: DoseLog): Promise<void> => {
  try {
    const logs = await getDoseLogs();
    const existingIndex = logs.findIndex(
      (l) => l.medicineId === log.medicineId && l.date === log.date
    );
    
    if (existingIndex >= 0) {
      logs[existingIndex] = log;
    } else {
      logs.push(log);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error("Failed to save dose log:", error);
    toast.error("Failed to save dose log");
  }
};

export const getDoseLogsForDate = async (date: string): Promise<DoseLog[]> => {
  const logs = await getDoseLogs();
  return logs.filter((log) => log.date === date);
};

export const getDoseLogsForMonth = async (
  year: number,
  month: number
): Promise<DoseLog[]> => {
  const logs = await getDoseLogs();
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  return logs.filter((log) => log.date.startsWith(monthPrefix));
};

export const generateMockData = async (): Promise<void> => {
  const mockLogs: DoseLog[] = [];
  const medicines = [
    { id: "med1", name: "Vitamin D", time: "08:00" },
    { id: "med2", name: "Metformin", time: "12:00" },
    { id: "med3", name: "Lisinopril", time: "20:00" },
  ];
  
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    if (date > today) break;
    
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    
    medicines.forEach((med) => {
      const rand = Math.random();
      let status: "taken" | "missed" | "partial" = "taken";
      let actualTime = med.time;
      
      if (rand > 0.85) {
        status = "missed";
        actualTime = undefined;
      } else if (rand > 0.7) {
        status = "partial";
        const [h, m] = med.time.split(":").map(Number);
        actualTime = `${String(h).padStart(2, "0")}:${String(m + 15).padStart(2, "0")}`;
      }
      
      mockLogs.push({
        id: `${med.id}-${dateStr}`,
        medicineId: med.id,
        medicineName: med.name,
        scheduledTime: med.time,
        actualTime,
        date: dateStr,
        status,
      });
    });
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockLogs));
  toast.success("Mock data generated for testing");
};