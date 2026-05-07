import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QUERY_KEYS } from "@/lib/query-client";
import { FamilyMember, Medicine, DoseLog, Prescription, VitalLog, SymptomLog, MoodLog, Appointment, LabResult } from "@/utils/storage";

const getUserId = async (): Promise<string> => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  return data.user?.id || "";
};

export const useFamilyMembers = () => {
  return useQuery({
    queryKey: QUERY_KEYS.familyMembers,
    queryFn: async () => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []) as FamilyMember[];
    },
  });
};

export const useAddFamilyMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (member: { name: string; relationship: string }) => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('family_members')
        .insert([{ name: member.name, relationship: member.relationship, user_id: userId }])
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as FamilyMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.familyMembers });
    },
  });
};

export const useUpdateFamilyMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (member: FamilyMember) => {
      const { data, error } = await supabase
        .from('family_members')
        .update({ name: member.name, relationship: member.relationship })
        .eq('id', member.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as FamilyMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.familyMembers });
    },
  });
};

export const useRemoveFamilyMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('family_members').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.familyMembers });
    },
  });
};

export const useMedicines = () => {
  return useQuery({
    queryKey: QUERY_KEYS.medicines,
    queryFn: async () => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .eq('user_id', userId);
      if (error) throw new Error(error.message);
      return (data || []) as Medicine[];
    },
  });
};

export const useAddMedicine = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (medicine: Omit<Medicine, 'id'>) => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('medicines')
        .insert([{ ...medicine, user_id: userId }])
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Medicine;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.medicines });
    },
  });
};

export const useUpdateMedicine = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (medicine: Medicine) => {
      const { data, error } = await supabase
        .from('medicines')
        .update(medicine)
        .eq('id', medicine.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Medicine;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.medicines });
    },
  });
};

export const useRemoveMedicine = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('medicines').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.medicines });
    },
  });
};

export const useDoseLogs = () => {
  return useQuery({
    queryKey: QUERY_KEYS.doseLogs,
    queryFn: async () => {
      const { data, error } = await supabase.from('dose_logs').select('*');
      if (error) throw new Error(error.message);
      return (data || []) as DoseLog[];
    },
  });
};

export const useDoseLogsForDate = (date: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.doseLogsForDate(date),
    queryFn: async () => {
      const { data, error } = await supabase.from('dose_logs').select('*').eq('date', date);
      if (error) throw new Error(error.message);
      return (data || []) as DoseLog[];
    },
  });
};

export const useSaveDoseLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (log: DoseLog) => {
      const { data, error } = await supabase.from('dose_logs').upsert([log]).select().single();
      if (error) throw new Error(error.message);
      return data as DoseLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.doseLogs });
    },
  });
};

export const usePrescriptions = () => {
  return useQuery({
    queryKey: QUERY_KEYS.prescriptions,
    queryFn: async () => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('user_id', userId);
      if (error) throw new Error(error.message);
      return (data || []).map((d: { id: string; family_member_id: string; title: string; image_url: string; pharmacy_name: string; pharmacy_phone: string; expiry_date: string }) => ({
        id: d.id,
        familyMemberId: d.family_member_id,
        title: d.title,
        imageUrl: d.image_url,
        pharmacyName: d.pharmacy_name,
        pharmacyPhone: d.pharmacy_phone,
        expiryDate: d.expiry_date,
      })) as Prescription[];
    },
  });
};

export const useAddPrescription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rx: Omit<Prescription, 'id'>) => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('prescriptions')
        .insert([{
          family_member_id: rx.familyMemberId,
          title: rx.title,
          image_url: rx.imageUrl,
          pharmacy_name: rx.pharmacyName,
          pharmacy_phone: rx.pharmacyPhone,
          expiry_date: rx.expiryDate,
          user_id: userId,
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
        expiryDate: data.expiry_date,
      } as Prescription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.prescriptions });
    },
  });
};

export const useRemovePrescription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('prescriptions').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.prescriptions });
    },
  });
};

export const useVitalLogs = () => {
  return useQuery({
    queryKey: QUERY_KEYS.vitals,
    queryFn: async () => {
      const { data, error } = await supabase.from('vital_logs').select('*');
      if (error) throw new Error(error.message);
      return (data || []) as VitalLog[];
    },
  });
};

export const useAddVitalLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (log: Omit<VitalLog, 'id'>) => {
      const { data, error } = await supabase.from('vital_logs').insert([log]).select().single();
      if (error) throw new Error(error.message);
      return data as VitalLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vitals });
    },
  });
};

export const useSymptomLogs = () => {
  return useQuery({
    queryKey: QUERY_KEYS.symptoms,
    queryFn: async () => {
      const { data, error } = await supabase.from('symptom_logs').select('*');
      if (error) throw new Error(error.message);
      return (data || []) as SymptomLog[];
    },
  });
};

export const useAddSymptomLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (log: Omit<SymptomLog, 'id'>) => {
      const { data, error } = await supabase.from('symptom_logs').insert([log]).select().single();
      if (error) throw new Error(error.message);
      return data as SymptomLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.symptoms });
    },
  });
};

export const useMoodLogs = () => {
  return useQuery({
    queryKey: QUERY_KEYS.moodLogs,
    queryFn: async () => {
      const { data, error } = await supabase.from('mood_logs').select('*');
      if (error) throw new Error(error.message);
      return (data || []).map((d: { id: string; family_member_id: string; mood: string; date: string; notes: string | null; created_at: string }) => ({
        id: d.id,
        familyMemberId: d.family_member_id,
        mood: d.mood,
        date: d.date,
        notes: d.notes,
        createdAt: d.created_at,
      })) as MoodLog[];
    },
  });
};

export const useAddMoodLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (log: Omit<MoodLog, 'id'>) => {
      const { data, error } = await supabase
        .from('mood_logs')
        .insert([{
          family_member_id: log.familyMemberId,
          mood: log.mood,
          date: log.date,
          notes: log.notes,
        }])
        .select()
        .single();
      if (error) throw new Error(error.message);
      return {
        id: data.id,
        familyMemberId: data.family_member_id,
        mood: data.mood,
        date: data.date,
        notes: data.notes,
        createdAt: data.created_at,
      } as MoodLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.moodLogs });
    },
  });
};

export const useAppointments = () => {
  return useQuery({
    queryKey: QUERY_KEYS.appointments,
    queryFn: async () => {
      const { data, error } = await supabase.from('appointments').select('*');
      if (error) throw new Error(error.message);
      return (data || []) as Appointment[];
    },
  });
};

export const useAddAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (appointment: Omit<Appointment, 'id'>) => {
      const { data, error } = await supabase.from('appointments').insert([appointment]).select().single();
      if (error) throw new Error(error.message);
      return data as Appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.appointments });
    },
  });
};

export const useRemoveAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.appointments });
    },
  });
};

export const useLabResults = () => {
  return useQuery({
    queryKey: QUERY_KEYS.labResults,
    queryFn: async () => {
      const { data, error } = await supabase.from('lab_results').select('*');
      if (error) throw new Error(error.message);
      return (data || []) as LabResult[];
    },
  });
};

export const useAddLabResult = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (result: Omit<LabResult, 'id'>) => {
      const { data, error } = await supabase.from('lab_results').insert([result]).select().single();
      if (error) throw new Error(error.message);
      return data as LabResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.labResults });
    },
  });
};

export { useQueryClient };