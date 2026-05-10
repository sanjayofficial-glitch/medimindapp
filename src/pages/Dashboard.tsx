const { data: medicines = [], isLoading: isMedicinesLoading } = useMedicines();
  const { data: todayLogs = [], isLoading: isLogsLoading, refetch } = useDoseLogsForDate(today);
    // Build schedule items only after data is available
  const scheduleItems = useMemo(() => {
    if (isMedicinesLoading || isLogsLoading) return [];
    
    const logStatusMap = new Map<string, { status: string; actualTime: string | null }>();
    todayLogs.forEach(log => {
      const key = `${log.medicineId}-${normalizeTime(log.scheduledTime)}`;
      logStatusMap.set(key, { status: log.status, actualTime: log.actualTime });
    });

    const items: ScheduleItem[] = [];
    medicines.forEach(med => {
      (med.times || []).forEach(time => {
        const normalizedTime = normalizeTime(time);
        const key = `${med.id}-${normalizedTime}`;
        const logStatus = logStatusMap.get(key);
        
        items.push({
          id: key,
          medicineId: med.id,
          medicineName: med.name,
          dosage: med.dosage || "",
          familyMemberId: med.familyMemberId,
          scheduledTime: normalizedTime,
          status: (logStatus?.status as "pending" | "taken" | "missed") || "pending",
          actualTime: logStatus?.actualTime || null
        });
      });
    });

    return items.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  }, [medicines, todayLogs, isMedicinesLoading, isLogsLoading]);