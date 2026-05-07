import { supabase } from "@/integrations/supabase/client";

// Helper to get current user ID
const getUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");
  return user.id;
};

// Save a new medicine to the database
export const addMedicine = async (medicine: Omit<Medicine, 'id'>): Promise<Medicine> => {
  try {
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
        if (error) {
      console.error("Supabase insert error:", error);
      throw new Error(error.message);
    }
    
    if (!data) {
      throw new Error("No data returned from insert operation");
    }
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