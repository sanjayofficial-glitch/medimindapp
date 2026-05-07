import { supabase } from "@/integrations/supabase/client";

// ========================
// Type Definitions
// ========================
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
  status: 'taken' | 'missed' | 'partial';
}

export interface FamilyMember {
  id: string;
  userId: string;
  name: string;
  relationship: string;
  createdAt: string;
}

export interface VitalLog {
  id: string;
  familyMemberId: string;
  type: 'blood_pressure' | 'blood_sugar' | 'weight' | 'heart_rate';
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
  severity: 'mild' | 'moderate' | 'severe';
  date: string;
  time: string;
  notes?: string;
}

export interface MoodLog {
  id: string;
  familyMemberId: string;
  mood: 'great' | 'good' | 'okay' | 'bad' | 'awful';
  date: string;
  notes?: string;
}

export interface LabResult {
  id: string;
  familyMemberId: string;
  testName: string;
  value: string;
  unit: string;
  date: string;
  normalRange?: string;
  file_url?: string;
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

export interface EmergencyProfile {
  bloodType?: string;
  allergies: string[];
  conditions: string[];
  emergencyContacts: any[];
}

// ========================
// Helper Functions
// ========================
const getUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");
  return user.id;
};

// ========================
// Medicine Functions
// ========================
export const addMedicine = async (medicine: Omit<Medicine, 'id'>): Promise<Medicine> => {
  try {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('medicines')
      .insert([{
        family_member_id: medicine.familyMemberId,
        name: medicine.name,
        dosage: medicine.dosage,
        times: medicine.times,
        frequency: medicine.frequency,
        additional_text: medicine.additionalText,
        stock: medicine.stock,
        refill_at: medicine.refillAt,
        user_id: userId
      }])
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
  } catch (err) {
    console.error("addMedicine error:", err);
    throw err;
  }
};

export const getMedicines = async (): Promise<Medicine[]> => {
  try {
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
  } catch (err) {
    console.error("getMedicines error:", err);
    throw err;
  }
};

export const updateMedicine = async (medicine: Medicine): Promise<void> => {
  try {
    const { error } = await supabase
      .from('medicines')
      .update({
        family_member_id: medicine.familyMemberId,
        name: medicine.name,
        dosage: medicine.dosage,
        times: medicine.times,
        frequency: medicine.frequency,
        additional_text: medicine.additionalText,
        stock: medicine.stock,
        refill_at: medicine.refillAt
      })
      .eq('id', medicine.id);
    if (error) throw new Error(error.message);
  } catch (err) {
    console.error("updateMedicine error:", err);
    throw err;
  }
};

// ========================
// Dose Log Functions
// ========================
export const getDoseLogs = async (): Promise<DoseLog[]> => {
  try {
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
  } catch (err) {
    console.error("getDoseLogs error:", err);
    throw err;
  }
};

export const saveDoseLog = async (log: DoseLog): Promise<DoseLog> => {
  try {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('dose_logs')
      .upsert([{
        id: log.id,
        medicine_id: log.medicineId,
        medicine_name: log.medicineName,
        family_member_id: log.familyMemberId,
        scheduled_time: log.scheduledTime,
        actual_time: log.actualTime,
        date: log.date,
        status: log.status,
        user_id: userId
      }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return {
      id: data.id,
      medicineId: data.medicine_id,
      medicineName: data.medicine_name,
      familyMemberId: data.family_member_id,
      scheduledTime: data.scheduled_time,
      actualTime: data.actual_time,
      date: data.date,
      status: data.status
    };
  } catch (err) {
    console.error("saveDoseLog error:", err);
    throw err;
  }
};

// ========================
// Family Member Functions
// ========================
export const getFamilyMembers = async (): Promise<FamilyMember[]> => {
  try {
    const { data, error } = await supabase.from('family_members').select('*');
    if (error) throw new Error(error.message);
    return (data || []).map(m => ({
      id: m.id,
      userId: m.user_id,
      name: m.name,
      relationship: m.relationship,
      createdAt: m.created_at
    }));
  } catch (err) {
    console.error("getFamilyMembers error:", err);
    throw err;
  }
};

export const addFamilyMember = async (member: Omit<FamilyMember, 'id' | 'userId' | 'createdAt'>): Promise<FamilyMember> => {
  try {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('family_members')
      .insert([{ name: member.name, relationship: member.relationship, user_id: userId }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      relationship: data.relationship,
      createdAt: data.created_at
    };
  } catch (err) {
    console.error("addFamilyMember error:", err);
    throw err;
  }
};

// ========================
// Vital Log Functions
// ========================
export const getVitalLogs = async (): Promise<VitalLog[]> => {
  try {
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
  } catch (err) {
    console.error("getVitalLogs error:", err);
    throw err;
  }
};

export const addVitalLog = async (log: Omit<VitalLog, 'id'>): Promise<VitalLog> => {
  try {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('vitals')
      .insert([{
        family_member_id: log.familyMemberId,
        type: log.type,
        value: log.value,
        unit: log.unit,
        date: log.date,
        time: log.time,
        notes: log.notes,
        user_id: userId
      }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return {
      id: data.id,
      familyMemberId: data.family_member_id,
      type: data.type,
      value: data.value,
      unit: data.unit,
      date: data.date,
      time: data.time,
      notes: data.notes
    };
  } catch (err) {
    console.error("addVitalLog error:", err);
    throw err;
  }
};

// ========================
// Symptom Log Functions
// ========================
export const getSymptomLogs = async (): Promise<SymptomLog[]> => {
  try {
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
  } catch (err) {
    console.error("getSymptomLogs error:", err);
    throw err;
  }
};

export const addSymptomLog = async (log: Omit<SymptomLog, 'id'>): Promise<SymptomLog> => {
  try {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('symptoms')
      .insert([{
        family_member_id: log.familyMemberId,
        symptom: log.symptom,
        severity: log.severity,
        date: log.date,
        time: log.time,
        notes: log.notes,
        user_id: userId
      }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return {
      id: data.id,
      familyMemberId: data.family_member_id,
      symptom: data.symptom,
      severity: data.severity,
      date: data.date,
      time: data.time,
      notes: data.notes
    };
  } catch (err) {
    console.error("addSymptomLog error:", err);
    throw err;
  }
};

// ========================
// Mood Log Functions
// ========================
export const getMoodLogs = async (): Promise<MoodLog[]> => {
  try {
    const { data, error } = await supabase.from('mood_logs').select('*');
    if (error) throw new Error(error.message);
    return (data || []).map(m => ({
      id: m.id,
      familyMemberId: m.family_member_id,
      mood: m.mood,
      date: m.date,
      notes: m.notes
    }));
  } catch (err) {
    console.error("getMoodLogs error:", err);
    throw err;
  }
};

export const addMoodLog = async (log: Omit<MoodLog, 'id'>): Promise<MoodLog> => {
  try {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('mood_logs')
      .insert([{
        family_member_id: log.familyMemberId,
        mood: log.mood,
        date: log.date,
        notes: log.notes,
        user_id: userId
      }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return {
      id: data.id,
      familyMemberId: data.family_member_id,
      mood: data.mood,
      date: data.date,
      notes: data.notes
    };
  } catch (err) {
    console.error("addMoodLog error:", err);
    throw err;
  }
};

// ========================
// Lab Result Functions
// ========================
export const getLabResults = async (): Promise<LabResult[]> => {
  try {
    const { data, error } = await supabase.from('lab_results').select('*');
    if (error) throw new Error(error.message);
    return (data || []).map(l => ({
      id: l.id,
      familyMemberId: l.family_member_id,
      testName: l.test_name,
      value: l.value,
      unit: l.unit,
      date: l.date,
      normalRange: l.normal_range,
      file_url: l.file_url
    }));
  } catch (err) {
    console.error("getLabResults error:", err);
    throw err;
  }
};

// ========================
// Appointment Functions
// ========================
export const getAppointments = async (): Promise<Appointment[]> => {
  try {
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
  } catch (err) {
    console.error("getAppointments error:", err);
    throw err;
  }
};

export const addAppointment = async (appointment: Omit<Appointment, 'id'>): Promise<Appointment> => {
  try {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('appointments')
      .insert([{
        family_member_id: appointment.familyMemberId,
        doctor_name: appointment.doctorName,
        specialty: appointment.specialty,
        date: appointment.date,
        time: appointment.time,
        location: appointment.location,
        notes: appointment.notes,
        user_id: userId
      }])
      .select()
      .single();
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
  } catch (err) {
    console.error("addAppointment error:", err);
    throw err;
  }
};

// ========================
// Prescription Functions
// ========================
export const getPrescriptions = async (): Promise<Prescription[]> => {
  try {
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
  } catch (err) {
    console.error("getPrescriptions error:", err);
    throw err;
  }
};

// ========================
// Emergency Profile Functions
// ========================
export const getEmergencyProfile = async (): Promise<EmergencyProfile> => {
  try {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('emergency_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message); // PGRST116 = no rows
    return data ? {
      bloodType: data.blood_type,
      allergies: data.allergies || [],
      conditions: data.conditions || [],
      emergencyContacts: data.emergency_contacts || []
    } : { allergies: [], conditions: [], emergencyContacts: [] };
  } catch (err) {
    console.error("getEmergencyProfile error:", err);
    throw err;
  }
};

export const saveEmergencyProfile = async (profile: EmergencyProfile): Promise<void> => {
  try {
    const userId = await getUserId();
    const { error } = await supabase
      .from('emergency_profiles')
      .upsert([{
        user_id: userId,
        blood_type: profile.bloodType,
        allergies: profile.allergies,
        conditions: profile.conditions,
        emergency_contacts: profile.emergencyContacts
      }]);
    if (error) throw new Error(error.message);
  } catch (err) {
    console.error("saveEmergencyProfile error:", err);
    throw err;
  }
};

// ========================
// Mock Data Generator
// ========================
export const generateMockData = async (): Promise<void> => {
  try {
    const userId = await getUserId();
    const mockLogs = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const times = ['08:00', '14:00', '20:00'];
      for (const time of times) {
        mockLogs.push({
          id: `mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          medicine_id: 'mock_med_1',
          medicine_name: 'Metformin 500mg',
          family_member_id: 'mock_member_1',
          scheduled_time: time,
          actual_time: Math.random() > 0.3 ? time : undefined,
          date: dateStr,
          status: Math.random() > 0.3 ? 'taken' : 'missed',
          user_id: userId
        });
      }
    }
    const { error } = await supabase.from('dose_logs').insert(mockLogs);
    if (error) throw new Error(error.message);
  } catch (err) {
    console.error("generateMockData error:", err);
    throw err;
  }
};