import { supabase } from "@/integrations/supabase/client";

// ========================
// Types
// ========================
export interface FamilyMember {
  id: string;
  user_id: string;
  name: string;
  relationship: string;
  created_at: string;
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
  familyMemberId: string;
  scheduledTime: string;
  actualTime: string | null;
  date: string;
  status: string;
  notificationSentAt?: string | null;
  notificationError?: string | null;
  snoozedUntil?: string | null;
}

export interface VitalLog {
  id: string;
  familyMemberId: string;
  type: string;
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
  severity: string;
  date: string;
  time: string;
  notes?: string;
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

export interface MoodLog {
  id: string;
  familyMemberId: string;
  mood: string;
  date: string;
  notes?: string;
  createdAt?: string;
}

export interface LabResult {
  id: string;
  familyMemberId: string;
  testName: string;
  value: string;
  unit: string;
  date: string;
  notes?: string;
  normalRange?: string;
  file_url?: string;
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

export interface EmergencyProfile {
  bloodType: string;
  allergies: string[];
  conditions: string[];
  emergencyContacts: { name: string; relationship: string; phone: string }[];
  medications: { name: string; dosage: string; frequency: string }[];
  doctors: { name: string; specialty: string; phone: string }[];
  organDonor: string;
  medicalNotes: string;
  height: string;
  weight: string;
  insuranceProvider: string;
  insurancePolicy: string;
  medicalDevices: string[];
}

// ========================
// Storage Functions
// ========================

export const getUserId = async (): Promise<string> => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  return data.user?.id || "";
};

export const getFamilyMembers = async (): Promise<FamilyMember[]> => {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  return data || [];
};

export const getMedicines = async (): Promise<Medicine[]> => {
  const { data, error } = await supabase.from('medicines').select('*');
  if (error) throw new Error(error.message);
  return (data || []).map(m => ({
    id: m.id,
    familyMemberId: m.family_member_id,
    name: m.name,
    dosage: m.dosage,
    times: m.times,
    frequency: m.frequency,
    additionalText: m.additional_text,
    stock: m.stock,
    refillAt: m.refill_at
  }));
};

export const saveMedicine = async (medicine: Omit<Medicine, 'id'>): Promise<Medicine> => {
  const userId = await getUserId();
  const { data, error } = await supabase.from('medicines').insert([{
    family_member_id: medicine.familyMemberId,
    name: medicine.name,
    dosage: medicine.dosage,
    times: medicine.times,
    frequency: medicine.frequency,
    additional_text: medicine.additionalText,
    stock: medicine.stock,
    refill_at: medicine.refillAt,
    user_id: userId
  }]).select().single();
  if (error) throw new Error(error.message);
  return {
    id: data.id,
    familyMemberId: data.family_member_id,
    name: data.name,
    dosage: data.dosage,
    times: data.times,
    frequency: data.frequency,
    additionalText: data.additional_text,
    stock: data.stock,
    refillAt: data.refill_at
  };
};

export const updateMedicine = async (medicine: Medicine): Promise<Medicine> => {
  const { data, error } = await supabase
    .from('medicines')
    .update({
      name: medicine.name,
      dosage: medicine.dosage,
      times: medicine.times,
      frequency: medicine.frequency,
      additional_text: medicine.additionalText,
      stock: medicine.stock,
      refill_at: medicine.refillAt
    })
    .eq('id', medicine.id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return {
    id: data.id,
    familyMemberId: data.family_member_id,
    name: data.name,
    dosage: data.dosage,
    times: data.times,
    frequency: data.frequency,
    additionalText: data.additional_text,
    stock: data.stock,
    refillAt: data.refill_at
  };
};

export const getDoseLogs = async (): Promise<DoseLog[]> => {
  const { data, error } = await supabase.from('dose_logs').select('*');
  if (error) throw new Error(error.message);
  return (data || []).map(d => ({
    id: d.id,
    medicineId: d.medicine_id,
    medicineName: d.medicine_name,
    familyMemberId: d.family_member_id,
    scheduledTime: d.scheduled_time,
    actualTime: d.actual_time,
    date: d.date,
    status: d.status,
    notificationSentAt: d.notification_sent_at,
    notificationError: d.notification_error,
    snoozedUntil: d.snoozed_until
  }));
};

export const saveDoseLog = async (log: DoseLog) => {
  const { error } = await supabase.from('dose_logs').upsert([{
    id: log.id,
    medicine_id: log.medicineId,
    medicine_name: log.medicineName,
    family_member_id: log.familyMemberId,
    scheduled_time: log.scheduledTime,
    actual_time: log.actualTime,
    date: log.date,
    status: log.status,
    user_id: await getUserId(),
    snoozed_until: log.snoozedUntil
  }]);
  if (error) throw new Error(error.message);
  return log;
};

export const saveDoseLogsBatch = async (logs: DoseLog[]) => {
  if (logs.length === 0) return [];
  const userId = await getUserId();
  const { error } = await supabase.from('dose_logs').upsert(
    logs.map(log => ({
      id: log.id,
      medicine_id: log.medicineId,
      medicine_name: log.medicineName,
      family_member_id: log.familyMemberId,
      scheduled_time: log.scheduledTime,
      actual_time: log.actualTime,
      date: log.date,
      status: log.status,
      user_id: userId,
      snoozed_until: log.snoozedUntil
    }))
  );
  if (error) throw new Error(error.message);
  return logs;
};

export const getVitalLogs = async (): Promise<VitalLog[]> => {
  const { data, error } = await supabase.from('vitals').select('*');
  if (error) throw new Error(error.message);
  return data || [];
};

export const addVitalLog = async (log: Omit<VitalLog, 'id'>): Promise<VitalLog> => {
  const userId = await getUserId();
  const { data, error } = await supabase.from('vitals').insert([{ ...log, user_id: userId }]).select().single();
  if (error) throw new Error(error.message);
  return data;
};

export const getSymptomLogs = async (): Promise<SymptomLog[]> => {
  const { data, error } = await supabase.from('symptoms').select('*');
  if (error) throw new Error(error.message);
  return data || [];
};

export const addSymptomLog = async (log: Omit<SymptomLog, 'id'>): Promise<SymptomLog> => {
  const userId = await getUserId();
  const { data, error } = await supabase.from('symptoms').insert([{ ...log, user_id: userId }]).select().single();
  if (error) throw new Error(error.message);
  return data;
};

export const getAppointments = async (): Promise<Appointment[]> => {
  const { data, error } = await supabase.from('appointments').select('*');
  if (error) throw new Error(error.message);
  return data || [];
};

export const addAppointment = async (appointment: Omit<Appointment, 'id'>): Promise<Appointment> => {
  const userId = await getUserId();
  const { data, error } = await supabase.from('appointments').insert([{ ...appointment, user_id: userId }]).select().single();
  if (error) throw new Error(error.message);
  return data;
};

export const getEmergencyProfile = async (): Promise<EmergencyProfile> => {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('emergency_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  
  return data ? {
    bloodType: data.blood_type || "",
    allergies: data.allergies || [],
    conditions: data.conditions || [],
    emergencyContacts: data.emergency_contacts || [],
    medications: data.medications || [],
    doctors: data.doctors || [],
    organDonor: data.organ_donor || "unspecified",
    medicalNotes: data.medical_notes || "",
    height: data.height || "",
    weight: data.weight || "",
    insuranceProvider: data.insurance_provider || "",
    insurancePolicy: data.insurance_policy || "",
    medicalDevices: data.medical_devices || []
  } : { 
    bloodType: "", 
    allergies: [], 
    conditions: [], 
    emergencyContacts: [],
    medications: [],
    doctors: [],
    organDonor: "unspecified",
    medicalNotes: "",
    height: "",
    weight: "",
    insuranceProvider: "",
    insurancePolicy: "",
    medicalDevices: []
  };
};

export const saveEmergencyProfile = async (profile: EmergencyProfile) => {
  const userId = await getUserId();
  const { error } = await supabase.from('emergency_profiles').upsert([{
    user_id: userId,
    blood_type: profile.bloodType,
    allergies: profile.allergies,
    conditions: profile.conditions,
    emergency_contacts: profile.emergencyContacts,
    medications: profile.medications,
    doctors: profile.doctors,
    organ_donor: profile.organDonor,
    medical_notes: profile.medicalNotes,
    height: profile.height,
    weight: profile.weight,
    insurance_provider: profile.insuranceProvider,
    insurance_policy: profile.insurancePolicy,
    medical_devices: profile.medicalDevices
  }]);
  if (error) throw new Error(error.message);
};

export const generateMockData = async () => {
  console.log("Mock data generation not implemented yet");
};

const PROFILE_PICTURE_KEY = "medi_mind_profile_picture";

export const saveProfilePicture = (base64: string): void => {
  localStorage.setItem(PROFILE_PICTURE_KEY, base64);
};

export const getProfilePicture = (): string | null => {
  return localStorage.getItem(PROFILE_PICTURE_KEY);
};

export const removeProfilePicture = (): void => {
  localStorage.removeItem(PROFILE_PICTURE_KEY);
};