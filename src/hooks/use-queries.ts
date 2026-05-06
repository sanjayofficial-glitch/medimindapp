import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QUERY_KEYS, queryClient } from "@/lib/query-client";
import type { FamilyMember, Medicine, DoseLog, LabResult, VitalLog, SymptomLog, MoodLog, Appointment, Prescription } from "@/utils/storage";

export const useFamilyMembers = () => {
  return useQuery({
    queryKey: QUERY_KEYS.familyMembers,
    queryFn: async (): Promise<FamilyMember[]> => {
      const { data, error } = await supabase.from('family_members').select('*');
      if (error) throw error;
      return data || [];
    },
  });
};

export const useMedicines = () => {
  return useQuery({
    queryKey: QUERY_KEYS.medicines,
    queryFn: async (): Promise<Medicine[]> => {
      const { data, error } = await supabase.from('medicines').select('*');
      if (error) throw error;
      return data || [];
    },
  });
};

export const useDoseLogs = () => {
  return useQuery({
    queryKey: QUERY_KEYS.doseLogs,
    queryFn: async (): Promise<DoseLog[]> => {
      const { data, error } = await supabase.from('dose_logs').select('*');
      if (error) throw error;
      return data || [];
    },
  });
};

export const useDoseLogsForDate = (date: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.doseLogsForDate(date),
    queryFn: async (): Promise<DoseLog[]> => {
      const { data, error } = await supabase.from('dose_logs').select('*').eq('date', date);
      if (error) throw error;
      return data || [];
    },
    enabled: !!date,
  });
};

export const useLabResults = () => {
  return useQuery({
    queryKey: QUERY_KEYS.labResults,
    queryFn: async (): Promise<LabResult[]> => {
      const { data, error } = await supabase.from('lab_results').select('*');
      if (error) throw error;
      return data || [];
    },
  });
};

export const useVitals = () => {
  return useQuery({
    queryKey: QUERY_KEYS.vitals,
    queryFn: async (): Promise<VitalLog[]> => {
      const { data, error } = await supabase.from('vitals').select('*');
      if (error) throw error;
      return data || [];
    },
  });
};

export const useSymptoms = () => {
  return useQuery({
    queryKey: QUERY_KEYS.symptoms,
    queryFn: async (): Promise<SymptomLog[]> => {
      const { data, error } = await supabase.from('symptoms').select('*');
      if (error) throw error;
      return data || [];
    },
  });
};

export const useMoodLogs = () => {
  return useQuery({
    queryKey: QUERY_KEYS.moodLogs,
    queryFn: async (): Promise<MoodLog[]> => {
      const { data, error } = await supabase.from('mood_logs').select('*');
      if (error) throw error;
      return data || [];
    },
  });
};

export const useAppointments = () => {
  return useQuery({
    queryKey: QUERY_KEYS.appointments,
    queryFn: async (): Promise<Appointment[]> => {
      const { data, error } = await supabase.from('appointments').select('*');
      if (error) throw error;
      return data || [];
    },
  });
};

export const usePrescriptions = () => {
  return useQuery({
    queryKey: QUERY_KEYS.prescriptions,
    queryFn: async (): Promise<Prescription[]> => {
      const { data, error } = await supabase.from('prescriptions').select('*');
      if (error) throw error;
      return data || [];
    },
  });
};

export const useAddLabResult = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (l: Omit<LabResult, 'id'> & { file_url?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
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
        user_id: user.id
      }]).select();

      if (error) throw error;
      return data?.[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.labResults });
    },
  });
};

export const useAddFamilyMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (member: Omit<FamilyMember, 'id'>) => {
      const { data, error } = await supabase.from('family_members').insert([member]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.familyMembers });
    },
  });
};

export const useAddMedicine = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (medicine: Omit<Medicine, 'id'>) => {
      const { data, error } = await supabase.from('medicines').insert([medicine]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.medicines });
    },
  });
};

export const useSaveDoseLog = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (log: DoseLog) => {
      const { error } = await supabase.from('dose_logs').upsert([log]);
      if (error) throw error;
      return log;
    },
    onSuccess: (log) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.doseLogs });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.doseLogsForDate(log.date) });
    },
  });
};

export const useAddVitalLog = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (log: Omit<VitalLog, 'id'>) => {
      const { data, error } = await supabase.from('vitals').insert([log]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vitals });
    },
  });
};

export const useAddSymptomLog = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (log: Omit<SymptomLog, 'id'>) => {
      const { data, error } = await supabase.from('symptoms').insert([log]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.symptoms });
    },
  });
};

export const useAddMoodLog = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (log: Omit<MoodLog, 'id'>) => {
      const { data, error } = await supabase.from('mood_logs').insert([log]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.moodLogs });
    },
  });
};

export const useAddAppointment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (appointment: Omit<Appointment, 'id'>) => {
      const { data, error } = await supabase.from('appointments').insert([appointment]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.appointments });
    },
  });
};

export const useAddPrescription = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (prescription: Omit<Prescription, 'id'>) => {
      const { data, error } = await supabase.from('prescriptions').insert([prescription]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.prescriptions });
    },
  });
};

export const useUpdateMedicine = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (medicine: Medicine) => {
      const { error } = await supabase.from('medicines').update(medicine).eq('id', medicine.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.medicines });
    },
  });
};

export const useRemoveFamilyMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('family_members').delete().eq('id', id);
      if (error) throw error;
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
      const { error } = await supabase.from('family_members').update(member).eq('id', member.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.familyMembers });
    },
  });
};

export const usePrefetchFamilyMembers = () => {
  return () => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.familyMembers,
      queryFn: async (): Promise<FamilyMember[]> => {
        const { data, error } = await supabase.from('family_members').select('*');
        if (error) throw error;
        return data || [];
      },
    });
  };
};

export const usePrefetchMedicines = () => {
  return () => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.medicines,
      queryFn: async (): Promise<Medicine[]> => {
        const { data, error } = await supabase.from('medicines').select('*');
        if (error) throw error;
        return data || [];
      },
    });
  };
};