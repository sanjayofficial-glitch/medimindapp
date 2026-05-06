import { supabase } from "@/integrations/supabase/client";

// Type definitions
export interface DoseLog {
  id: string;
  medicineId: string;
  medicineName: string;
  familyMemberId: string;
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

export interface MoodLog {
  id: string;
  familyMemberId: string;
  mood: "great" | "good" | "okay" | "bad" | "awful";
  date: string;
  notes?: string;
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

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  createdAt?: string; // Made optional as it's handled by DB
}

export interface Appointment {
  id: string;
  familyMemberId: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  location: string;
  notes?: string;
}

export interface Prescription {
  id: string;
  familyMemberId: string;
  title: string;
  imageUrl: string;
  pharmacyName: string;
  pharmacyPhone: string;
  expiryDate: string;
}

export interface LabResult {
  id: string;
  familyMemberId: string;
  testName: string;
  value: string;
  unit: string;
  date: string;
  normalRange: string;
  file_url?: string;
}

export interface EmergencyProfile {
  bloodType: string;
  allergies: string[];
  conditions: string[];
  emergencyContacts: any[];
}

// Storage functions
export const getDoseLogs = async (): Promise<DoseLog[]> => {
  const { data, error } = await supabase.from('dose_logs').select('*');
  if (error) throw new Error(error.message);
  return data || [];
};

export const getDoseLogsForDate = async (date: string): Promise<DoseLog[]> => {
  const { data, error } = await supabase.from('dose_logs').select('*').eq('date', date);
  if (error) throw new Error(error.message);
  return data || [];
};

export const saveDoseLog = async (log: DoseLog): Promise<void> => {
  const { error } = await supabase.from('dose_logs').upsert([log]);
  if (error) throw new Error(error.message);
};

export const getVitalLogs = async (): Promise<VitalLog[]> => {
  const { data, error } = await supabase.from('vitals').select('*');
  if (error) throw new Error(error.message);
  return data || [];
};

export const addVitalLog = async (log: Omit<VitalLog, 'id'>): Promise<void> => {
  const { error } = await supabase.from('vitals').insert([log]);
  if (error) throw new Error(error.message);
};

export const getSymptomLogs = async (): Promise<SymptomLog[]> => {
  const { data, error } = await supabase.from('symptoms').select('*');
  if (error) throw new Error(error.message);
  return data || [];
};

export const addSymptomLog = async (log: Omit<SymptomLog, 'id'>): Promise<void> => {
  const { error } = await supabase.from('symptoms').insert([log]);
  if (error) throw new Error(error.message);
};

export const getMoodLogs = async (): Promise<MoodLog[]> => {
  const { data, error } = await supabase.from('mood_logs').select('*');
  if (error) throw new Error(error.message);
  return data || [];
};

export const addMoodLog = async (log: Omit<MoodLog, 'id'>): Promise<void> => {
  const { error } = await supabase.from('mood_logs').insert([log]);
  if (error) throw new Error(error.message);
};

export const getMedicines = async (): Promise<Medicine[]> => {
  const { data, error } = await supabase.from('medicines').select('*');
  if (error) throw new Error(error.message);
  return data || [];
};

export const addMedicine = async (medicine: Omit<Medicine, 'id'>): Promise<Medicine> => {
  const { data, error } = await supabase.from('medicines').insert([medicine]).select().single();
  if (error) throw new Error(error.message);
  return data;
};

export const updateMedicine = async (medicine: Medicine): Promise<void> => {
  const { error } = await supabase.from('medicines').update(medicine).eq('id', medicine.id);
  if (error) throw new Error(error.message);
};

export const getFamilyMembers = async (): Promise<FamilyMember[]> => {
  const { data, error } = await supabase.from('family_members').select('*');
  if (error) throw new Error(error.message);
  return data || [];
};

export const addFamilyMember = async (member: Omit<FamilyMember, 'id'>): Promise<FamilyMember> => {
  const { data, error } = await supabase.from('family_members').insert([member]).select().single();
  if (error) throw new Error(error.message);
  return data;
};

export const updateFamilyMember = async (member: FamilyMember): Promise<void> => {
  const { error } = await supabase.from('family_members').update(member).eq('id', member.id);
  if (error) throw new Error(error.message);
};

export const removeFamilyMember = async (id: string): Promise<void> => {
  const { error } = await supabase.from('family_members').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const getAppointments = async (): Promise<Appointment[]> => {
  const { data, error } = await supabase.from('appointments').select('*');
  if (error) throw new Error(error.message);
  return data || [];
};

export const addAppointment = async (appointment: Omit<Appointment, 'id'>): Promise<Appointment> => {
  const { data, error } = await supabase.from('appointments').insert([appointment]).select().single();
  if (error) throw new Error(error.message);
  return data;
};

export const getPrescriptions = async (): Promise<Prescription[]> => {
  const { data, error } = await supabase.from('prescriptions').select('*');
  if (error) throw new Error(error.message);
  return data || [];
};

export const addPrescription = async (prescription: Omit<Prescription, 'id'>): Promise<Prescription> => {
  const { data, error } = await supabase.from('prescriptions').insert([prescription]).select().single();
  if (error) throw new Error(error.message);
  return data;
};

export const getEmergencyProfile = async (): Promise<EmergencyProfile> => {
  const { data, error } = await supabase.from('emergency_profiles').select('*').single();
  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data || { bloodType: "", allergies: [], conditions: [], emergencyContacts: [] };
};

export const saveEmergencyProfile = async (profile: EmergencyProfile): Promise<void> => {
  const { error } = await supabase.from('emergency_profiles').upsert([profile]);
  if (error) throw new Error(error.message);
};

export const getLabResults = async (): Promise<LabResult[]> => {
  const { data, error } = await supabase.from('lab_results').select('*');
  if (error) throw new Error(error.message);
  return data || [];
};

export const addLabResult = async (l: Omit<LabResult, 'id'> & { file_url?: string }) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const numericValue = parseFloat(l.value);
  if (isNaN(numericValue)) {
    throw new Error(`Invalid value "${l.value}". Please enter a numeric value.`);
  }

  const { data, error } = await supabase.from('lab_results').insert([{
    family_member_id: l.familyMemberId,
    test_name: l.testName,
    value: numericValue,
    unit: l.unit,
    date: l.date,
    normal_range: l.normalRange,
    file_url: l.file_url,
    user_id: user.id
  }]).select();

  if (error) {
    console.error("Supabase error adding lab result:", error);
    throw new Error(`Failed to save lab result: ${error.message}`);
  }
  
  if (!data || data.length === 0) {
    throw new Error("Failed to save lab result: No data returned");
  }
  
  return data[0];
};

export const uploadFile = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `lab-results/${fileName}`;

  const { error } = await supabase.storage.from('lab-results').upload(filePath, file);
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from('lab-results').getPublicUrl(filePath);
  return data.publicUrl;
};

export const generateMockData = async (): Promise<void> => {
  const mockDoseLogs: DoseLog[] = [
    {
      id: "mock1",
      medicineId: "med1",
      medicineName: "Metformin",
      familyMemberId: "member1",
      scheduledTime: "08:00",
      date: new Date().toISOString().split('T')[0],
      status: "taken"
    }
  ];
  
  const { error } = await supabase.from('dose_logs').insert(mockDoseLogs);
  if (error) throw new Error(error.message);
};