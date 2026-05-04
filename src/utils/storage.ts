import { toast } from "sonner";

// Family Members
export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
}

export interface Medicine {
  id: string;
  familyMemberId: string;
  name: string;
  dosage: string;
  times: string[];
  frequency: string;
  additionalText?: string;
  stock?: number;
  refillAt?: number;
}

// Dose Logs
export interface DoseLog {
  id: string;
  medicineId: string;
  medicineName: string;
  scheduledTime: string;
  actualTime?: string;
  date: string;
  status: "taken" | "missed" | "partial";
}

// Vitals
export interface VitalLog {
  id: string;
  familyMemberId: string;
  type: "blood_pressure" | "blood_sugar" | "weight" | "heart_rate";
  value: string; // e.g., "120/80" or "95"
  unit: string;
  date: string;
  time: string;
  notes?: string;
}

// Symptoms
export interface SymptomLog {
  id: string;
  familyMemberId: string;
  symptom: string;
  severity: "mild" | "moderate" | "severe";
  date: string;
  time: string;
  notes?: string;
}

const DOSE_LOGS_KEY = "medimind_dose_logs";
const FAMILY_MEMBERS_KEY = "medimind_family_members";
const MEDICINES_KEY = "medimind_medicines";
const VITALS_KEY = "medimind_vitals";
const SYMPTOMS_KEY = "medimind_symptoms";

// Dose Logs
export const getDoseLogs = async (): Promise<DoseLog[]> => {
  try {
    const logs = localStorage.getItem(DOSE_LOGS_KEY);
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
      (l) => l.medicineId === log.medicineId && l.date === log.date && l.scheduledTime === log.scheduledTime
    );
    
    if (existingIndex >= 0) {
      logs[existingIndex] = log;
    } else {
      logs.push(log);
    }
    
    localStorage.setItem(DOSE_LOGS_KEY, JSON.stringify(logs));

    // Update stock if medicine is taken
    if (log.status === "taken") {
      const meds = getMedicines();
      const medIndex = meds.findIndex(m => m.id === log.medicineId);
      if (medIndex >= 0 && meds[medIndex].stock !== undefined) {
        meds[medIndex].stock = Math.max(0, (meds[medIndex].stock || 0) - 1);
        localStorage.setItem(MEDICINES_KEY, JSON.stringify(meds));
        
        if (meds[medIndex].stock === meds[medIndex].refillAt) {
          toast.warning(`Low stock alert: ${meds[medIndex].name}`, {
            description: `Only ${meds[medIndex].stock} doses remaining.`
          });
        }
      }
    }
  } catch (error) {
    console.error("Failed to save dose log:", error);
    toast.error("Failed to save dose log");
  }
};

export const getDoseLogsForDate = async (date: string): Promise<DoseLog[]> => {
  const logs = await getDoseLogs();
  return logs.filter((log) => log.date === date);
};

// Family Members
export const getFamilyMembers = (): FamilyMember[] => {
  try {
    const members = localStorage.getItem(FAMILY_MEMBERS_KEY);
    return members ? JSON.parse(members) : [];
  } catch (error) {
    console.error("Failed to load family members:", error);
    return [];
  }
};

export const addFamilyMember = (member: FamilyMember): void => {
  const members = getFamilyMembers();
  members.push(member);
  localStorage.setItem(FAMILY_MEMBERS_KEY, JSON.stringify(members));
};

export const updateFamilyMember = (updatedMember: FamilyMember): void => {
  const members = getFamilyMembers().map(m => 
    m.id === updatedMember.id ? updatedMember : m
  );
  localStorage.setItem(FAMILY_MEMBERS_KEY, JSON.stringify(members));
};

export const removeFamilyMember = (id: string): void => {
  const members = getFamilyMembers().filter(m => m.id !== id);
  localStorage.setItem(FAMILY_MEMBERS_KEY, JSON.stringify(members));
};

// Medicines
export const getMedicines = (): Medicine[] => {
  try {
    const meds = localStorage.getItem(MEDICINES_KEY);
    if (!meds) return [];
    const parsed = JSON.parse(meds);
    return parsed.map((med: any) => {
      if (med.time && !med.times) {
        return { ...med, times: [med.time] };
      }
      return med;
    });
  } catch (error) {
    console.error("Failed to load medicines:", error);
    return [];
  }
};

export const addMedicine = (medicine: Medicine): void => {
  const meds = getMedicines();
  meds.push(medicine);
  localStorage.setItem(MEDICINES_KEY, JSON.stringify(meds));
};

export const updateMedicine = (medicine: Medicine): void => {
  const meds = getMedicines().map(m => m.id === medicine.id ? medicine : m);
  localStorage.setItem(MEDICINES_KEY, JSON.stringify(meds));
};

export const removeMedicine = (id: string): void => {
  const meds = getMedicines().filter(m => m.id !== id);
  localStorage.setItem(MEDICINES_KEY, JSON.stringify(meds));
};

// Vitals
export const getVitalLogs = (): VitalLog[] => {
  try {
    const logs = localStorage.getItem(VITALS_KEY);
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    console.error("Failed to load vitals:", error);
    return [];
  }
};

export const addVitalLog = (log: VitalLog): void => {
  const logs = getVitalLogs();
  logs.push(log);
  localStorage.setItem(VITALS_KEY, JSON.stringify(logs));
};

// Symptoms
export const getSymptomLogs = (): SymptomLog[] => {
  try {
    const logs = localStorage.getItem(SYMPTOMS_KEY);
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    console.error("Failed to load symptoms:", error);
    return [];
  }
};

export const addSymptomLog = (log: SymptomLog): void => {
  const logs = getSymptomLogs();
  logs.push(log);
  localStorage.setItem(SYMPTOMS_KEY, JSON.stringify(logs));
};

export const generateMockData = async (): Promise<void> => {
  const mockLogs: DoseLog[] = [];
  const medicines = [
    { id: "med1", name: "Vitamin D", times: ["08:00"] },
    { id: "med2", name: "Metformin", times: ["12:00", "18:00"] },
    { id: "med3", name: "Lisinopril", times: ["08:00", "12:00", "20:00"] },
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
      med.times.forEach((time) => {
        const rand = Math.random();
        let status: "taken" | "missed" | "partial" = "taken";
        let actualTime: string | undefined = time;
        
        if (rand > 0.85) {
          status = "missed";
          actualTime = undefined;
        } else if (rand > 0.7) {
          status = "partial";
          const [h, m] = time.split(":").map(Number);
          actualTime = `${String(h).padStart(2, "0")}:${String(m + 15).padStart(2, "0")}`;
        }
        
        mockLogs.push({
          id: `${med.id}-${dateStr}-${time}`,
          medicineId: med.id,
          medicineName: med.name,
          scheduledTime: time,
          actualTime,
          date: dateStr,
          status,
        });
      });
    });
  }
  
  localStorage.setItem(DOSE_LOGS_KEY, JSON.stringify(mockLogs));
  toast.success("Mock data generated for testing");
};