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
  family_member_id: string;
  name: string;
  dosage: string;
  times: string[];
  frequency: string;
  additionalText?: string;
  stock?: number;
  refill_at?: number;
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

export interface Prescription {
  id: string;
  familyMemberId: string;
  title: string;
  imageUrl: string;
  pharmacyName: string;
  pharmacyPhone: string;
  expiryDate: string;
}

// ========================
// Supabase Client
// ========================
const { supabase } = supabase;

// ========================
// Prescription Functions
// ========================
export const savePrescription = async (prescription: Omit<Prescription, 'id'>): Promise<Prescription> => {
  try {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('prescriptions')
      .insert([{
        family_member_id: prescription.familyMemberId,
        title: prescription.title,
        image_url: prescription.imageUrl,
        pharmacy_name: prescription.pharmacyName,
        pharmacy_phone: prescription.pharmacyPhone,
        expiry_date: prescription.expiryDate,
        user_id: userId
      }])
      .select()
      .single();

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
  } catch (err) {
    console.error("savePrescription error:", err);
    throw err;
  }
};

// ========================
// Dose Log Functions
// ========================
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

export const saveDoseLog = async (log: DoseLog) => {
  const { error } = await supabase.from('dose_logs').upsert([{
    id: log.id,
    medicineId: log.medicineId,
    medicineName: log.medicineName,
    familyMemberId: log.familyMemberId,
    scheduledTime: log.scheduledTime,
    actualTime: log.actualTime,
    date: log.date,
    status: log.status
  }]);
  if (error) throw new Error(error.message);
  return log;
};

// ========================
// Medicine Functions
// ========================
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
  try {
    const userId = await getUserId();
    const { data, error } = await supabase.from('medicines').insert([{
      family_member_id: medicine.familyMemberId,
      name: medicine.name,
      dosage: medicine.dosage,
      times: medicine.times,
      frequency: medicine.frequency,
      additionalText: medicine.additionalText,
      stock: medicine.stock,
      refillAt: medicine.refillAt,
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
  } catch (err) {
    console.error("saveMedicine error:", err);
    throw err;
  }
};

// ========================
// Other Helper Functions
// ========================
export const getUserId = async (): Promise<string> => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  return data.user?.id || "";
};

const PROFILE_PICTURE_KEY = "medi_mind_profile_picture";

export const saveProfilePicture = (base64: string): void => {
  try {
    localStorage.setItem(PROFILE_PICTURE_KEY, base64);
  } catch (err) {
    console.error("Error saving profile picture:", err);
  }
};

export const getProfilePicture = (): string | null => {
  try {
    return localStorage.getItem(PROFILE_PICTURE_KEY);
  } catch (err) {
    console.error("Error getting profile picture:", err);
    return null;
  }
};

export const removeProfilePicture = (): void => {
  try {
    localStorage.removeItem(PROFILE_PICTURE_KEY);
  } catch (err) {
    console.error("Error removing profile picture:", err);
  }
};