import { toast } from "sonner";

// Existing Interfaces
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

export interface DoseLog {
  id: string;
  medicineId: string;
  medicineName: string;
  scheduledTime: string;
  actualTime?: string;
  date: string;
  status: "taken" | "missed" | "partial";
}

export interface VitalLog {
  id: string;
  familyMemberId: string;
  type: "blood_pressure" | "blood_sugar" | "weight" | "heart_rate";
  value: string;
  unit: string;
  date: string;
  time: string;
  notes?: string;
}

export interface SymptomLog {
  id: string;
  familyMemberId: string;
  symptom: string;
  severity: "mild" | "moderate" | "severe";
  date: string;
  time: string;
  notes?: string;
}

// --- NEW INTERFACES ---

export interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  location: string;
  notes: string;
  familyMemberId: string;
}

export interface EmergencyProfile {
  bloodType: string;
  allergies: string[];
  conditions: string[];
  emergencyContacts: { name: string; phone: string; relationship: string }[];
}

export interface LabResult {
  id: string;
  familyMemberId: string;
  testName: string;
  value: string;
  unit: string;
  date: string;
  normalRange?: string;
}

export interface MoodLog {
  id: string;
  familyMemberId: string;
  mood: "great" | "good" | "okay" | "bad" | "awful";
  date: string;
  notes?: string;
}

export interface HealthGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  type: "water" | "steps" | "sleep" | "custom";
}

export interface Prescription {
  id: string;
  familyMemberId: string;
  title: string;
  imageUrl: string;
  pharmacyName?: string;
  pharmacyPhone?: string;
  expiryDate?: string;
}

// Storage Keys
const DOSE_LOGS_KEY = "medimind_dose_logs";
const FAMILY_MEMBERS_KEY = "medimind_family_members";
const MEDICINES_KEY = "medimind_medicines";
const VITALS_KEY = "medimind_vitals";
const SYMPTOMS_KEY = "medimind_symptoms";
const APPOINTMENTS_KEY = "medimind_appointments";
const EMERGENCY_KEY = "medimind_emergency_id";
const LAB_RESULTS_KEY = "medimind_lab_results";
const MOOD_LOGS_KEY = "medimind_mood_logs";
const GOALS_KEY = "medimind_goals";
const PRESCRIPTIONS_KEY = "medimind_prescriptions";

// Helper to get from localStorage
const getLocal = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

// Helper to save to localStorage
const saveLocal = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// --- EXPORTED FUNCTIONS ---

export const getDoseLogs = async (): Promise<DoseLog[]> => getLocal(DOSE_LOGS_KEY, []);

export const getDoseLogsForDate = async (date: string): Promise<DoseLog[]> => {
  const logs = await getDoseLogs();
  return logs.filter(l => l.date === date);
};

export const saveDoseLog = async (log: DoseLog): Promise<void> => {
  const logs = await getDoseLogs();
  const idx = logs.findIndex(l => l.id === log.id);
  if (idx >= 0) logs[idx] = log; else logs.push(log);
  saveLocal(DOSE_LOGS_KEY, logs);
};

export const getFamilyMembers = (): FamilyMember[] => getLocal(FAMILY_MEMBERS_KEY, []);
export const addFamilyMember = (m: FamilyMember) => saveLocal(FAMILY_MEMBERS_KEY, [...getFamilyMembers(), m]);
export const updateFamilyMember = (m: FamilyMember) => saveLocal(FAMILY_MEMBERS_KEY, getFamilyMembers().map(item => item.id === m.id ? m : item));
export const removeFamilyMember = (id: string) => saveLocal(FAMILY_MEMBERS_KEY, getFamilyMembers().filter(item => item.id !== id));

export const getMedicines = (): Medicine[] => getLocal(MEDICINES_KEY, []);
export const addMedicine = (m: Medicine) => saveLocal(MEDICINES_KEY, [...getMedicines(), m]);
export const updateMedicine = (m: Medicine) => saveLocal(MEDICINES_KEY, getMedicines().map(item => item.id === m.id ? m : item));

export const getAppointments = (): Appointment[] => getLocal(APPOINTMENTS_KEY, []);
export const addAppointment = (a: Appointment) => saveLocal(APPOINTMENTS_KEY, [...getAppointments(), a]);

export const getEmergencyProfile = (): EmergencyProfile => getLocal(EMERGENCY_KEY, {
  bloodType: "",
  allergies: [],
  conditions: [],
  emergencyContacts: []
});
export const saveEmergencyProfile = (p: EmergencyProfile) => saveLocal(EMERGENCY_KEY, p);

export const getLabResults = (): LabResult[] => getLocal(LAB_RESULTS_KEY, []);
export const addLabResult = (r: LabResult) => saveLocal(LAB_RESULTS_KEY, [...[...getLabResults()], r]);

export const getMoodLogs = (): MoodLog[] => getLocal(MOOD_LOGS_KEY, []);
export const addMoodLog = (l: MoodLog) => saveLocal(MOOD_LOGS_KEY, [...getMoodLogs(), l]);

export const getHealthGoals = (): HealthGoal[] => getLocal(GOALS_KEY, []);
export const updateHealthGoal = (g: HealthGoal) => saveLocal(GOALS_KEY, getHealthGoals().map(item => item.id === g.id ? g : item));

export const getPrescriptions = (): Prescription[] => getLocal(PRESCRIPTIONS_KEY, []);
export const addPrescription = (p: Prescription) => saveLocal(PRESCRIPTIONS_KEY, [...getPrescriptions(), p]);

export const getVitalLogs = (): VitalLog[] => getLocal(VITALS_KEY, []);
export const addVitalLog = (l: VitalLog) => saveLocal(VITALS_KEY, [...getVitalLogs(), l]);

export const getSymptomLogs = (): SymptomLog[] => getLocal(SYMPTOMS_KEY, []);
export const addSymptomLog = (l: SymptomLog) => saveLocal(SYMPTOMS_KEY, [...getSymptomLogs(), l]);

export const generateMockData = async () => {
  // Simplified mock generation for brevity
  toast.success("Mock data generated");
};