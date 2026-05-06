import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QUERY_KEYS } from "@/lib/query-client";
import type { FamilyMember, Medicine, DoseLog, LabResult, VitalLog, SymptomLog, MoodLog, Appointment, Prescription } from "@/utils/storage";

export const useFamilyMembers = () => {
  return useQuery({
    queryKey: QUERY_KEYS.familyMembers,
    queryFn: async (): Promise<FamilyMember[]> => {
      const { data, error } = await supabase.from('family_members').select('*');
      if (error) throw new Error(error.message);
      return data || [];
    },
  });
};

export const useMedicines = () => {
  return useQuery({
    queryKey: QUERY_KEYS.medicines,
    queryFn: async (): Promise<Medicine[]> => {
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
    },
  });
};

export const useDoseLogs = () => {
  return useQuery({
    queryKey: QUERY_KEYS.doseLogs,
    queryFn: async (): Promise<DoseLog[]> => {
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
    },
  });
};

export const useDoseLogsForDate = (date: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.doseLogsForDate(date),
    queryFn: async (): Promise<DoseLog[]> => {
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
    },
    enabled: !!date,
  });
};

export const useLabResults = () => {
  return useQuery({
    queryKey: QUERY_KEYS.labResults,
    queryFn: async (): Promise<LabResult[]> => {
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
    },
  });
};

export const useVitals = () => {
  return useQuery({
    queryKey: QUERY_KEYS.vitals,
    queryFn: async (): Promise<VitalLog[]> => {
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
    },
  });
};

export const useSymptoms = () => {
  return useQuery({
    queryKey: QUERY_KEYS.symptoms,
    queryFn: async (): Promise<SymptomLog[]> => {
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
    },
  });
};

export const useMoodLogs = () => {
  return useQuery({
    queryKey: QUERY_KEYS.moodLogs,
    queryFn: async (): Promise<MoodLog[]> => {
      const { data, error } = await supabase.from('mood_logs').select('*');
      if (error) throw new Error(error.message);
      return (data || []).map(m => ({
        id: m.id,
        familyMemberId: m.family_member_id,
        mood: m.mood,
        date: m.date,
        notes: m.notes
      }));
    },
  });
};

export const useAppointments = () => {
  return useQuery({
    queryKey: QUERY_KEYS.appointments,
    queryFn: async (): Promise<Appointment[]> => {
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
    },
  });
};

export const usePrescriptions = () => {
  return useQuery({
    queryKey: QUERY_KEYS.prescriptions,
    queryFn: async (): Promise<Prescription[]> => {
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

      if (error) throw new Error(error.message);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase.from('family_members').insert([{
        name: member.name,
        relationship: member.relationship,
        user_id: user.id
      }]).select().single();
      if (error) throw new Error(error.message);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase.from('medicines').insert([{
        family_member_id: medicine.familyMemberId,
        name: medicine.name,
        dosage: medicine.dosage,
        times: medicine.times,
        frequency: medicine.frequency,
        additional_text: medicine.additionalText,
        stock: medicine.stock,
        refill_at: medicine.refillAt,
        user_id: user.id
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from('dose_logs').upsert([{
        id: log.id,
        medicine_id: log.medicineId,
        medicine_name: log.medicineName,
        family_member_id: log.familyMemberId,
        scheduled_time: log.scheduledTime,
        actual_time: log.actualTime,
        date: log.date,
        status: log.status,
        user_id: user.id
      }]);
      if (error) throw new Error(error.message);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase.from('vitals').insert([{
        family_member_id: log.familyMemberId,
        type: log.type,
        value: log.value,
        unit: log.unit,
        date: log.date,
        time: log.time,
        notes: log.notes,
        user_id: user.id
      }]).select().single();
      if (error) throw new Error(error.message);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase.from('symptoms').insert([{
        family_member_id: log.familyMemberId,
        symptom: log.symptom,
        severity: log.severity,
        date: log.date,
        time: log.time,
        notes: log.notes,
        user_id: user.id
      }]).select().single();
      if (error) throw new Error(error.message);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase.from('mood_logs').insert([{
        family_member_id: log.familyMemberId,
        mood: log.mood,
        date: log.date,
        notes: log.notes,
        user_id: user.id
      }]).select().single();
      if (error) throw new Error(error.message);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase.from('appointments').insert([{
        family_member_id: appointment.familyMemberId,
        doctor_name: appointment.doctorName,
        specialty: appointment.specialty,
        date: appointment.date,
        time: appointment.time,
        location: appointment.location,
        notes: appointment.notes,
        user_id: user.id
      }]).select().single();
      if (error) throw new Error(error.message);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase.from('prescriptions').insert([{
        family_member_id: prescription.familyMemberId,
        title: prescription.title,
        image_url: prescription.imageUrl,
        pharmacy_name: prescription.pharmacyName,
        pharmacy_phone: prescription.pharmacyPhone,
        expiry_date: prescription.expiryDate,
        user_id: user.id
      }]).select().single();
      if (error) throw new Error(error.message);
      return data;
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
      if (error) throw new Error(error.message);
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
      const { error } = await supabase.from('family_members').update({
        name: member.name,
        relationship: member.relationship
      }).eq('id', member.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.familyMembers });
    },
  });
};

export const usePrefetchFamilyMembers = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.familyMembers,
      queryFn: async (): Promise<FamilyMember[]> => {
        const { data, error } = await supabase.from('family_members').select('*');
        if (error) throw new Error(error.message);
        return data || [];
      },
    });
  };
};

export const usePrefetchMedicines = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.medicines,
      queryFn: async (): Promise<Medicine[]> => {
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
      },
    });
  };
};