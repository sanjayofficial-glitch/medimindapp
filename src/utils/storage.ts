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
  file_url?: string;
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
    relationship: m.relationship  }).eq('id', m.id);
  if (error) throw error;
};

export const removeFamilyMember = async (id: string) => {
  const { error } = await supabase.from('family_members').delete().eq('id', id);
  if (error) throw error;
}

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
  const { data, error } = await supabase.from('medicines').insert([{
    family_member_id: m.familyMemberId,
    name: m.name,
    dosage: m.dosage,
    times: m.times,
    frequency: m.frequency,
    additional_text: m.additionalText,
    stock: m.stock,
    refill_at: m.refillAt,
    user_id: user?.id
  }]).select().single();
  if (error) throw error;
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
}

// --- DOSE LOGS ---
export const getDoseLogs = async (): Promise<DoseLog[]> => {
  const { data, error } = await supabase.from('dose_logs').select('*');
  if (error) throw error;
  return data?.map(l => ({
    ...l,
    medicineId: l.medicine_id,
    medicineName: l.medicine_name,
    familyMemberId: l.family_member_id,
    scheduledTime: l.scheduled_time,
    actualTime: l.actual_time  })) || [];
};

export const getDoseLogsForDate = async (date: string): Promise<DoseLog[]> => {
  const { data, error } = await supabase.from('dose_logs').select('*').eq('date', date);
  if (error) throw error;
  return data?.map(l => ({
    ...l,
    medicineId: l.medicine_id,
    medicineName: l.medicine_name,
    familyMemberId: l.family_member_id,
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
    family_member_id: log.familyMemberId,
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
    user_id: user?.id  }]);
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
    user_id: user?.id  }]);
  if (error) throw error;
};

// --- LAB RESULTS ---
export const getLabResults = async (): Promise<LabResult[]> => {
  const { data, error } = await supabase.from('lab_results').select('*');
  if (error) throw error;
  return data?.map(r => ({
    ...r,
    familyMemberId: r.family_member_id,
    testName: r.test_name,
    value: r.value,
    unit: r.unit,
    date: r.date,
    normalRange: r.normal_range,
    file_url: r.file_url
  })) || [];
};

export const addLabResult = async (l: Omit<LabResult, 'id'> & { file_url?: string }) => {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('lab_results').insert([{
    family_member_id: l.familyMemberId,
    test_name: l.testName,
    value: parseFloat(l.value),
    unit: l.unit,
    date: l.date,
    normal_range: l.normalRange,
    file_url: l.file_url,
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
    expiryDate: p.expiry_date  })) || [];
};

export const addPrescription = async (p: Omit<Prescription, 'id'>) => {
  const { error } = await supabase.from('prescriptions').insert([{
    family_member_id: p.familyMemberId,
    title: p.title,
    image_url: p.imageUrl,
    pharmacy_name: p.pharmacyName,
    pharmacy_phone: p.pharmacyPhone,
    expiry_date: p.expiryDate
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // 1. Create a family member if none exist
  const members = await getFamilyMembers();
  let memberId = members[0]?.id;
  
  if (!memberId) {
    const { data: newMember, error: memberError } = await supabase
      .from('family_members')
      .insert([{ name: "Self", relationship: "Self", user_id: user.id }])
      .select()
      .single();
    if (memberError) throw memberError;
    memberId = newMember.id;
  }

  // 2. Create a medicine if none exist
  const medicines = await getMedicines();
  let medId = medicines[0]?.id;
  let medName = medicines[0]?.name || "Metformin";

  if (!medId) {
    const { data: newMed, error: medError } = await supabase
      .from('medicines')
      .insert([{
        family_member_id: memberId,
        name: "Metformin",
        dosage: "500mg",
        times: ["08:00", "20:00"],
        frequency: "Twice daily",
        user_id: user.id
      }])
      .select()
      .single();
    if (medError) throw medError;
    medId = newMed.id;
    medName = newMed.name;
  }

  // 3. Generate logs for the last 30 days
  const today = new Date();
  const logs = [];
  
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Morning dose
    logs.push({
      medicine_id: medId,
      medicine_name: medName,
      scheduled_time: '08:00',
      actual_time: Math.random() > 0.1 ? '08:15' : undefined,
      date: dateStr,
      status: Math.random() > 0.1 ? 'taken' : 'missed',
      user_id: user.id,
      family_member_id: memberId
    });

    // Evening dose
    logs.push({
      medicine_id: medId,
      medicine_name: medName,
      scheduled_time: '20:00',
      actual_time: Math.random() > 0.15 ? '20:10' : undefined,
      date: dateStr,
      status: Math.random() > 0.15 ? 'taken' : 'missed',
      user_id: user.id,
      family_member_id: memberId    });
  }
  
  const { error: logError } = await supabase.from('dose_logs').insert(logs);
  if (logError) throw logError;
};

// --- FILE UPLOAD HELPER ---
export const uploadFile = async (file: File): Promise<string> => {
  if (!file) return "";
  
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Only JPEG, PNG, GIF, and PDF files are allowed");
  }

  // Generate unique file name
  const fileName = `${Date.now()}-${file.name}`;
  
  // Upload to Supabase storage
  const { error } = await supabase.storage.from('lab-results').upload(fileName, file);
  if (error) throw error;
  
  // Get public URL
  const { data: publicUrlResponse } = await supabase.storage.from('lab-results').getPublicUrl(fileName);
  return publicUrlResponse.publicUrl;
};