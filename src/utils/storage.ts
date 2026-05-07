import { supabase } from "@/integrations/supabase/client";

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