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
    id: log.id.includes('log_') ? undefined : log.id, // Handle local IDs
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