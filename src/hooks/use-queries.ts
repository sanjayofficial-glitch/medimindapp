import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QUERY_KEYS } from "@/lib/query-client";
import { FamilyMember, Medicine, DoseLog, Prescription, VitalLog, SymptomLog, MoodLog, Appointment, LabResult, saveDoseLogsBatch } from "@/utils/storage";

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
      })) as Medicine[];
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
        .insert([{
          family_member_id: medicine.familyMemberId,
          name: medicine.name,
          dosage: medicine.dosage,
          times: medicine.times,
          frequency: medicine.frequency,
          additional_text: medicine.additionalText,
          stock: medicine.stock ?? 0,
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
      } as Medicine;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.medicines });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.doseLogs });
    },
  });
};

export const useUpdateMedicine = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (medicine: Medicine) => {
      const { data, error } = await supabase
        .from('medicines')
        .update({
          name: medicine.name,
          dosage: medicine.dosage,
          times: medicine.times,
          frequency: medicine.frequency,
          additional_text: medicine.additionalText,
          stock: medicine.stock,
          refill_at: medicine.refillAt
        })
        .eq('id', medicine.id)
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
      } as Medicine;
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
      const { error: doseLogError } = await supabase.from('dose_logs').delete().eq('medicine_id', id);
      if (doseLogError) throw new Error(doseLogError.message);

      const { error } = await supabase.from('medicines').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.medicines });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.doseLogs });
    },
  });
};

export const useDoseLogs = () => {
  return useQuery({
    queryKey: QUERY_KEYS.doseLogs,
    queryFn: async () => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('dose_logs')
        .select('*')
        .eq('user_id', userId);
      if (error) throw new Error(error.message);
      return (data || []).map(d => ({
        id: d.id,
        medicineId: d.medicine_id,
        medicineName: d.medicine_name,
        familyMemberId: d.family_member_id,
        scheduledTime: d.scheduled_time,
        actualTime: d.actual_time,
        date: d.date,
        status: d.status,
        notificationSentAt: d.notification_sent_at,
        notificationError: d.notification_error
      })) as DoseLog[];
    },
  });
};

export const useDoseLogsForDate = (date: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.doseLogsForDate(date),
    queryFn: async () => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('dose_logs')
        .select('*')
        .eq('date', date)
        .eq('user_id', userId);
      if (error) throw new Error(error.message);
      return (data || []).map(d => ({
        id: d.id,
        medicineId: d.medicine_id,
        medicineName: d.medicine_name,
        familyMemberId: d.family_member_id,
        scheduledTime: d.scheduled_time,
        actualTime: d.actual_time,
        date: d.date,
        status: d.status,
        notificationSentAt: d.notification_sent_at,
        notificationError: d.notification_error
      })) as DoseLog[];
    },
    staleTime: 0,
  });
};

export const useSaveDoseLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (log: DoseLog) => {
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
        status: data.status,
        notificationSentAt: data.notification_sent_at,
        notificationError: data.notification_error
      } as DoseLog;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.doseLogs });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.doseLogsForDate(variables.date) });
    },
  });
};

export const useSaveDoseLogsBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveDoseLogsBatch,
    onSuccess: (_, variables) => {
      if (variables.length > 0) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.doseLogs });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.doseLogsForDate(variables[0].date) });
      }
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
      return (data || []).map(d => ({
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
          expiry_date: rx.expiry_date,
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
      })) as VitalLog[];
    },
  });
};

export const useAddVitalLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (log: Omit<VitalLog, 'id'>) => {
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
      } as VitalLog;
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
      })) as SymptomLog[];
    },
  });
};

export const useAddSymptomLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (log: Omit<SymptomLog, 'id'>) => {
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
      } as SymptomLog;
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
      return (data || []).map(d => ({
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
      return (data || []).map(a => ({
        id: a.id,
        familyMemberId: a.family_member_id,
        doctorName: a.doctor_name,
        specialty: a.specialty,
        date: a.date,
        time: a.time,
        location: a.location,
        notes: a.notes
      })) as Appointment[];
    },
  });
};

export const useAddAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (appointment: Omit<Appointment, 'id'>) => {
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
      } as Appointment;
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
      return (data || []).map(l => ({
        id: l.id,
        familyMemberId: l.family_member_id,
        testName: l.test_name,
        value: l.value,
        unit: l.unit,
        date: l.date,
        notes: l.notes,
        normalRange: l.normal_range,
        file_url: l.file_url
      })) as LabResult[];
    },
  });
};

export const useAddLabResult = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (result: Omit<LabResult, 'id'>) => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('lab_results')
        .insert([{
          family_member_id: result.familyMemberId,
          test_name: result.testName,
          value: result.value,
          unit: result.unit,
          date: result.date,
          notes: result.notes,
          normal_range: result.normalRange,
          file_url: result.file_url,
          user_id: userId
        }])
        .select()
        .single();
      if (error) throw new Error(error.message);
      
      return {
        id: data.id,
        familyMemberId: data.family_member_id,
        testName: data.test_name,
        value: data.value,
        unit: data.unit,
        date: data.date,
        notes: data.notes,
        normalRange: data.normal_range,
        file_url: data.file_url
      } as LabResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.labResults });
    },
  });
};

export { useQueryClient };