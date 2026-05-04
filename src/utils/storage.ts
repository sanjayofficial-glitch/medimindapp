import { supabase } from "@/integrations/supabase/client";

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

export interface Appointment {
  id: string;
  familyMemberId: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  location: string;
  notes: string;
}

export interface LabResult {
  id: string;
  familyMemberId: string;
  testName: string;
  value: string;
  unit: string;
  date: string;
  normalRange: string;
}

export interface MoodLog {
  id: string;
  familyMemberId: string;
  mood: "great" | "good" | "okay" | "bad" | "awful";
  date: string;
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

export interface EmergencyProfile {
  bloodType: string;
  allergies: string[];
  conditions: string[];
  emergencyContacts: { name: string; phone: string; relationship: string; }[];
}

// --- FAMILY MEMBERS ---
export const getFamilyMembers = async (): Promise<FamilyMember[]> => {
  const { data, error } = await supabase.from('family_members').select('*');
  if (error) throw error;
  return data || [];
};

export const addFamilyMember = async (m: Omit<FamilyMember, 'id'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('family_members').insert([{ ...m, user_id: user?.id }]);
  if (error) throw error;
};

export const updateFamilyMember = async (m: FamilyMember) => {
  const { error } = await supabase.from('family_members').update({
    name: m.name,
    relationship: m.relationship
  }).eq('id', m.id);
  if (error) throw error;
};

export const removeFamilyMember = async (id: string) => {
  const { error } = await supabase.from('family_members').delete().eq('id', id);
  if (error) throw error;
};

// --- MEDICINES ---
export const getMedicines = async (): Promise<Medicine[]> => {
  const { data, error } = await supabase.from('medicines').select('*');
  if (error) throw error;
  return data?.map(m => ({
    ...m,
    familyMemberId: m.family_member_id,
    additionalText: m.additional_text,
    refillAt: m.refill_at
  })) || [];
};

export const addMedicine = async (m: Omit<Medicine, 'id'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('medicines').insert([{
    family_member_id: m.familyMemberId,
    name: m.name,
    dosage: m.dosage,
    times: m.times,
    frequency: m.frequency,
    additional_text: m.additionalText,
    stock: m.stock,
    refill_at: m.refillAt,
    user_id: user?.id
  }]);
  if (error) throw error;
};

export const updateMedicine = async (m: Medicine) => {
  const { error } = await supabase.from('medicines').update({
    name: m.name,
    dosage: m.dosage,
    times: m.times,
    frequency: m.frequency,
    additional_text: m.additionalText,
    stock: m.stock,
    refill_at: m.refillAt
  }).eq('id', m.id);
  if (error) throw error;
};

// --- DOSE LOGS ---
export const getDoseLogs = async (): Promise<DoseLog[]> => {
  const { data, error } = await supabase.from('dose_logs').select('*');
  if (error) throw error;
  return data?.map(l => ({
    ...l,
    medicineId: l.medicine_id,
    medicineName: l.medicine_name,
    scheduledTime: l.scheduled_time,
    actualTime: l.actual_time
  })) || [];
};

export const getDoseLogsForDate = async (date: string): Promise<DoseLog[]> => {
  const { data, error } = await supabase.from('dose_logs').select('*').eq('date', date);
  if (error) throw error;
  return data?.map(l => ({
    ...l,
    medicineId: l.medicine_id,
    medicineName: l.medicine_name,
    scheduledTime: l.scheduled_time,
    actualTime: l.actual_time
  })) || [];
};

export const saveDoseLog = async (log: DoseLog): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('dose_logs').upsert({
    id: log.id.includes('log_') ? undefined : log.id,
    medicine_id: log.medicineId,
    medicine_name: log.medicineName,
    scheduled_time: log.scheduledTime,
    actual_time: log.actualTime,
    date: log.date,
    status: log.status,
    user_id: user?.id
  });
  if (error) throw error;
};

// --- VITALS ---
export const getVitalLogs = async (): Promise<VitalLog[]> => {
  const { data, error } = await supabase.from('vitals').select('*');
  if (error) throw error;
  return data?.map(v => ({ ...v, familyMemberId: v.family_member_id })) || [];
};

export const addVitalLog = async (l: Omit<VitalLog, 'id'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('vitals').insert([{
    family_member_id: l.familyMemberId,
    type: l.type,
    value: l.value,
    unit: l.unit,
    date: l.date,
    time: l.time,
    notes: l.notes,
    user_id: user?.id
  }]);
  if (error) throw error;
};

// --- SYMPTOMS ---
export const getSymptomLogs = async (): Promise<SymptomLog[]> => {
  const { data, error } = await supabase.from('symptoms').select('*');
  if (error) throw error;
  return data?.map(s => ({ ...s, familyMemberId: s.family_member_id })) || [];
};

export const addSymptomLog = async (l: Omit<SymptomLog, 'id'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('symptoms').insert([{
    family_member_id: l.familyMemberId,
    symptom: l.symptom,
    severity: l.severity,
    date: l.date,
    time: l.time,
    notes: l.notes,
    user_id: user?.id
  }]);
  if (error) throw error;
};

// --- APPOINTMENTS ---
export const getAppointments = async (): Promise<Appointment[]> => {
  const { data, error } = await supabase.from('appointments').select('*');
  if (error) throw error;
  return data?.map(a => ({ ...a, familyMemberId: a.family_member_id })) || [];
};

export const addAppointment = async (a: Omit<Appointment, 'id'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('appointments').insert([{
    family_member_id: a.familyMemberId,
    doctor_name: a.doctorName,
    specialty: a.specialty,
    date: a.date,
    time: a.time,
    location: a.location,
    notes: a.notes,
    user_id: user?.id
  }]);
  if (error) throw error;
};

// --- LAB RESULTS ---
export const getLabResults = async (): Promise<LabResult[]> => {
  const { data, error } = await supabase.from('lab_results').select('*');
  if (error) throw error;
  return data?.map(r => ({ ...r, familyMemberId: r.family_member_id, testName: r.test_name, normalRange: r.normal_range })) || [];
};

export const addLabResult = async (r: Omit<LabResult, 'id'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('lab_results').insert([{
    family_member_id: r.familyMemberId,
    test_name: r.testName,
    value: r.value,
    unit: r.unit,
    date: r.date,
    normal_range: r.normalRange,
    user_id: user?.id
  }]);
  if (error) throw error;
};

// --- MOOD LOGS ---
export const getMoodLogs = async (): Promise<MoodLog[]> => {
  const { data, error } = await supabase.from('mood_logs').select('*');
  if (error) throw error;
  return data?.map(m => ({ ...m, familyMemberId: m.family_member_id })) || [];
};

export const addMoodLog = async (m: Omit<MoodLog, 'id'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('mood_logs').insert([{
    family_member_id: m.familyMemberId,
    mood: m.mood,
    date: m.date,
    notes: m.notes,
    user_id: user?.id
  }]);
  if (error) throw error;
};

// --- PRESCRIPTIONS ---
export const getPrescriptions = async (): Promise<Prescription[]> => {
  const { data, error } = await supabase.from('prescriptions').select('*');
  if (error) throw error;
  return data?.map(p => ({
    ...p,
    familyMemberId: p.family_member_id,
    imageUrl: p.image_url,
    pharmacyName: p.pharmacy_name,
    pharmacyPhone: p.pharmacy_phone,
    expiryDate: p.expiry_date
  })) || [];
};

export const addPrescription = async (p: Omit<Prescription, 'id'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('prescriptions').insert([{
    family_member_id: p.familyMemberId,
    title: p.title,
    image_url: p.imageUrl,
    pharmacy_name: p.pharmacyName,
    pharmacy_phone: p.pharmacyPhone,
    expiry_date: p.expiryDate,
    user_id: user?.id
  }]);
  if (error) throw error;
};

// --- EMERGENCY PROFILE ---
export const getEmergencyProfile = async (): Promise<EmergencyProfile> => {
  const { data, error } = await supabase.from('emergency_profiles').select('*').single();
  if (error && error.code !== 'PGRST116') throw error;
  return data ? {
    bloodType: data.blood_type,
    allergies: data.allergies,
    conditions: data.conditions,
    emergencyContacts: data.emergency_contacts
  } : { bloodType: "", allergies: [], conditions: [], emergencyContacts: [] };
};

export const saveEmergencyProfile = async (p: EmergencyProfile) => {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('emergency_profiles').upsert({
    user_id: user?.id,
    blood_type: p.bloodType,
    allergies: p.allergies,
    conditions: p.conditions,
    emergency_contacts: p.emergencyContacts
  });
  if (error) throw error;
};

export const generateMockData = async () => {
  // Implementation for mock data generation if needed
};