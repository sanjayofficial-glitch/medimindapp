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
  createdAt?: string;
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

// Helper to get current user ID
const getUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");
  return user.id;
};

// Storage functions
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
    status: d.status
  }));
};

export const getDoseLogsForDate = async (date: string): Promise<DoseLog[]> => {
  const { data, error } = await supabase.from('dose_logs').select('*').eq('date', date);
  if (error) throw new Error(error.message);
  return (data || []).map(d => ({
    id: d.id,
    medicineId: d.medicine_id,
    medicineName: d.medicine_name,
    familyMemberId: d.family_member_id,
    scheduledTime: d.scheduled_time,
    actualTime: d.actual_time,
    date: d.date,
    status: d.status
  }));
};

export const saveDoseLog = async (log: DoseLog): Promise<void> => {
  const userId = await getUserId();
  const { error } = await supabase.from('dose_logs').upsert([{
    id: log.id,
    medicine_id: log.medicineId,
    medicine_name: log.medicineName,
    family_member_id: log.familyMemberId,
    scheduled_time: log.scheduledTime,
    actual_time: log.actualTime,
    date: log.date,
    status: log.status,
    user_id: userId
  }]);
  if (error) throw new Error(error.message);
};

export const getVitalLogs = async (): Promise<VitalLog[]> => {
  const { data, error } = await supabase.from('vitals').select('*');
  if (error) throw new Error(error.message);
  return (data || []).map(v => ({
    id: v.id,
    familyMemberId: v.family_member_id,
    type: v.type,
    value: v.value,
    unit: v.unit,
    date: v.date,
    time: v.time,
    notes: v.notes
  }));
};

export const addVitalLog = async (log: Omit<VitalLog, 'id'>): Promise<void> => {
  const userId = await getUserId();
  const { error } = await supabase.from('vitals').insert([{
    family_member_id: log.familyMemberId,
    type: log.type,
    value: log.value,
    unit: log.unit,
    date: log.date,
    time: log.time,
    notes: log.notes,
    user_id: userId
  }]);
  if (error) throw new Error(error.message);
};

export const getSymptomLogs = async (): Promise<SymptomLog[]> => {
  const { data, error } = await supabase.from('symptoms').select('*');
  if (error) throw new Error(error.message);
  return (data || []).map(s => ({
    id: s.id,
    familyMemberId: s.family_member_id,
    symptom: s.symptom,
    severity: s.severity,
    date: s.date,
    time: s.time,
    notes: s.notes
  }));
};

export const addSymptomLog = async (log: Omit<SymptomLog, 'id'>): Promise<void> => {
  const userId = await getUserId();
  const { error } = await supabase.from('symptoms').insert([{
    family_member_id: log.familyMemberId,
    symptom: log.symptom,
    severity: log.severity,
    date: log.date,
    time: log.time,
    notes: log.notes,
    user_id: userId
  }]);
  if (error) throw new Error(error.message);
};

export const getMoodLogs = async (): Promise<MoodLog[]> => {
  const { data, error } = await supabase.from('mood_logs').select('*');
  if (error) throw new Error(error.message);
  return (data || []).map(m => ({
    id: m.id,
    familyMemberId: m.family_member_id,
    mood: m.mood,
    date: m.date,
    notes: m.notes
  }));
};

export const addMoodLog = async (log: Omit<MoodLog, 'id'>): Promise<void> => {
  const userId = await getUserId();
  const { error } = await supabase.from('mood_logs').insert([{
    family_member_id: log.familyMemberId,
    mood: log.mood,
    date: log.date,
    notes: log.notes,
    user_id: userId
  }]);
  if (error) throw new Error(error.message);
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

export const addMedicine = async (medicine: Omit<Medicine, 'id'>): Promise<Medicine> => {
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

export const updateMedicine = async (medicine: Medicine): Promise<void> => {
  const { error } = await supabase.from('medicines').update({
    family_member_id: medicine.familyMemberId,
    name: medicine.name,
    dosage: medicine.dosage,
    times: medicine.times,
    frequency: medicine.frequency,
    additional_text: medicine.additionalText,
    stock: medicine.stock,
    refill_at: medicine.refillAt
  }).eq('id', medicine.id);
  if (error) throw new Error(error.message);
};

export const getFamilyMembers = async (): Promise<FamilyMember[]> => {
  const { data, error } = await supabase.from('family_members').select('*');
  if (error) throw new Error(error.message);
  return data || [];
};

export const addFamilyMember = async (member: Omit<FamilyMember, 'id'>): Promise<FamilyMember> => {
  const userId = await getUserId();
  const { data, error } = await supabase.from('family_members').insert([{
    name: member.name,
    relationship: member.relationship,
    user_id: userId
  }]).select().single();
  if (error) throw new Error(error.message);
  return data;
};

export const updateFamilyMember = async (member: FamilyMember): Promise<void> => {
  const { error } = await supabase.from('family_members').update({
    name: member.name,
    relationship: member.relationship
  }).eq('id', member.id);
  if (error) throw new Error(error.message);
};

export const removeFamilyMember = async (id: string): Promise<void> => {
  const { error } = await supabase.from('family_members').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const getAppointments = async (): Promise<Appointment[]> => {
  const { data, error } = await supabase.from('appointments').select('*');
  if (error) throw new Error(error.message);
  return (data || []).map(a => ({
    id: a.id,
    familyMemberId: a.family_member_id,
    doctorName: a.doctor_name,
    specialty: a.specialty,
    date: a.date,
    time: a.time,
    location: a.location,
    notes: a.notes
  }));
};

export const addAppointment = async (appointment: Omit<Appointment, 'id'>): Promise<Appointment> => {
  const userId = await getUserId();
  const { data, error } = await supabase.from('appointments').insert([{
    family_member_id: appointment.familyMemberId,
    doctor_name: appointment.doctorName,
    specialty: appointment.specialty,
    date: appointment.date,
    time: appointment.time,
    location: appointment.location,
    notes: appointment.notes,
    user_id: userId
  }]).select().single();
  if (error) throw new Error(error.message);
  return {
    id: data.id,
    familyMemberId: data.family_member_id,
    doctorName: data.doctor_name,
    specialty: data.specialty,
    date: data.date,
    time: data.time,
    location: data.location,
    notes: data.notes
  };
};

export const getPrescriptions = async (): Promise<Prescription[]> => {
  const { data, error } = await supabase.from('prescriptions').select('*');
  if (error) throw new Error(error.message);
  return (data || []).map(p => ({
    id: p.id,
    familyMemberId: p.family_member_id,
    title: p.title,
    imageUrl: p.image_url,
    pharmacyName: p.pharmacy_name,
    pharmacyPhone: p.pharmacy_phone,
    expiryDate: p.expiry_date
  }));
};

export const addPrescription = async (prescription: Omit<Prescription, 'id'>): Promise<Prescription> => {
  const userId = await getUserId();
  const { data, error } = await supabase.from('prescriptions').insert([{
    family_member_id: prescription.familyMemberId,
    title: prescription.title,
    image_url: prescription.imageUrl,
    pharmacy_name: prescription.pharmacyName,
    pharmacy_phone: prescription.pharmacyPhone,
    expiry_date: prescription.expiryDate,
    user_id: userId
  }]).select().single();
  if (error) throw new Error(error.message);
  return {
    id: data.id,
    familyMemberId: data.family_member_id,
    title: data.title,
    imageUrl: data.image_url,
    pharmacyName: data.pharmacy_name,
    pharmacyPhone: data.pharmacy_phone,
    expiryDate: data.expiry_date
  };
};

export const removePrescription = async (id: string): Promise<void> => {
  const { error } = await supabase.from('prescriptions').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const getEmergencyProfile = async (): Promise<EmergencyProfile> => {
  const { data, error } = await supabase.from('emergency_profiles').select('*').single();
  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data ? {
    bloodType: data.blood_type,
    allergies: data.allergies,
    conditions: data.conditions,
    emergencyContacts: data.emergency_contacts
  } : { bloodType: "", allergies: [], conditions: [], emergencyContacts: [] };
};

export const saveEmergencyProfile = async (profile: EmergencyProfile): Promise<void> => {
  const userId = await getUserId();
  const { error } = await supabase.from('emergency_profiles').upsert([{
    blood_type: profile.bloodType,
    allergies: profile.allergies,
    conditions: profile.conditions,
    emergency_contacts: profile.emergencyContacts,
    user_id: userId
  }]);
  if (error) throw new Error(error.message);
};

export const getLabResults = async (): Promise<LabResult[]> => {
  const { data, error } = await supabase.from('lab_results').select('*');
  if (error) throw new Error(error.message);
  return (data || []).map(l => ({
    id: l.id,
    familyMemberId: l.family_member_id,
    testName: l.test_name,
    value: l.value.toString(),
    unit: l.unit,
    date: l.date,
    normalRange: l.normal_range,
    file_url: l.file_url
  }));
};

export const addLabResult = async (l: Omit<LabResult, 'id'> & { file_url?: string }) => {
  const userId = await getUserId();
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
    user_id: userId
  }]).select();

  if (error) throw new Error(error.message);
  return data?.[0];
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
  const userId = await getUserId();
  const mockDoseLogs = [
    {
      medicine_id: "med1",
      medicine_name: "Metformin",
      family_member_id: "member1",
      scheduled_time: "08:00",
      date: new Date().toISOString().split('T')[0],
      status: "taken",
      user_id: userId
    }
  ];
  
  const { error } = await supabase.from('dose_logs').insert(mockDoseLogs);
  if (error) throw new Error(error.message);
};