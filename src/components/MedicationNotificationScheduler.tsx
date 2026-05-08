import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useDoseLogsForDate } from "@/hooks/use-queries";
import { supabase } from "@/integrations/supabase/client";
import { queryClient, QUERY_KEYS } from "@/lib/query-client";
import { DoseLog } from "@/utils/storage";
import { getLocalDateString } from "@/utils/datetime";

const NOTIFY_LOOKBACK_MINUTES = 30;
const POLL_INTERVAL_MS = 15_000;
const SNOOZE_MS = 10 * 60 * 1000;

const to24h = (time: string): number => {
  if (!time) return 0;
  
  const normalized =
    /^\d{2}:\d{2}$/.test(time)
      ? time
      : (() => {
          const trimmed = time.trim();
          const [tp, p = "AM"] = trimmed.split(" ");
          const [h = "0", m = "0"] = tp.split(":");
          let hour = Number(h);
          if (Number.isNaN(hour)) hour = 0;
          
          const periodUpper = p.toUpperCase();
          if (periodUpper === "PM" && hour < 12) hour += 12;
          if (periodUpper === "AM" && hour === 12) hour = 0;
          
          return `${hour.toString().padStart(2, "0")}:${m.padStart(2, "0")}`;
        })();
  const [h = "0", m = "0"] = normalized.split(":");
  return Number(h) * 60 + Number(m);
};

const nowMinutes = (): number => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

const isDue = (log: DoseLog): boolean => {
  // Must be pending and not yet sent notification
  if (log.status !== "pending" || log.notificationSentAt) return false;
  
  const scheduled = to24h(log.scheduledTime);
  const current = nowMinutes();
  
  // Due if current time is within the window after scheduled time
  return current >= scheduled && current <= scheduled + NOTIFY_LOOKBACK_MINUTES;
};

const isOverdue = (log: DoseLog): boolean => {
  // Only pending doses can be overdue
  if (log.status !== "pending") return false;
  return to24h(log.scheduledTime) < nowMinutes();
};

const MedicationNotificationScheduler = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [today] = useState(() => getLocalDateString());
  const { data: todayLogs = [], refetch } = useDoseLogsForDate(today);
  const notifiedDoseIds = useRef<Set<string>>(new Set());
  const locallyCreatedDoseKeys = useRef(new Set<string>());

  const handleTakeNow = useCallback(async (log: DoseLog) => {
    try {
      await supabase
        .from("dose_logs")
        .update({ status: "taken", actual_time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) })
        .eq("id", log.id);

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.doseLogsForDate(today) });
      toast.success(`${log.medicineName} marked as taken`);
    } catch (err) {
      console.error("[MedicationNotificationScheduler] Take now failed:", err);
      toast.error("Failed to mark dose as taken");
    }
  }, [today]);

  const checkAndNotify = useCallback(async () => {
    if (!user) return;
    
    try {
      await refetch();
    } catch (error) {
      console.error("[MedicationNotificationScheduler] Failed to refetch dose logs:", error);
      return;
    }
    
    // Check for due doses (within notification window)
    const dueLogs = todayLogs.filter(
      (log: DoseLog) => isDue(log) && !notifiedDoseIds.current.has(log.id) && !locallyCreatedDoseKeys.current.has(log.id)
    );

    // Check for overdue doses that haven't been notified
    const overdueLogs = todayLogs.filter(
      (log: DoseLog) => isOverdue(log) && !log.notificationSentAt && !notifiedDoseIds.current.has(log.id)
    );

    // Combine due and overdue, prioritizing overdue
    const logsToNotify = [...overdueLogs, ...dueLogs].filter(
      (log) => !notifiedDoseIds.current.has(log.id)
    );

    if (logsToNotify.length === 0) return;

    for (const log of logsToNotify) {
      // Mark as notified immediately to prevent duplicates
      notifiedDoseIds.current.add(log.id);

      const isOverdueLog = isOverdue(log);
      const body = isOverdueLog 
        ? `Overdue: Take ${log.medicineName}` 
        : `Time to take ${log.medicineName}`;

      // Try to show browser notification
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        try {
          const notif = new Notification("MediMind Reminder", {
            body,
            icon: "/favicon.ico",
            tag: `dose-${log.id}`,
            requireInteraction: false,
            data: { doseLogId: log.id, medicineId: log.medicineId },
          });

          notif.onclick = () => {
            window.focus();
            navigate("/dashboard");
            notif.close();
          };
        } catch (notifError) {
          console.error("[MedicationNotificationScheduler] Failed to show notification:", notifError);
        }
      }

      // Always show in-app toast
      toast.info(body, {
        duration: Infinity,
        action: { label: "Take Now", onClick: () => handleTakeNow(log) },
      });

      // Update the database to mark notification as sent
      try {
        await supabase
          .from("dose_logs")
          .update({ notification_sent_at: new Date().toISOString() })
          .eq("id", log.id)
          .eq("status", "pending");
        
        console.log(`[MedicationNotificationScheduler] Notified dose ${log.id}`);
      } catch (updateError) {
        console.error("[MedicationNotificationScheduler] Failed to update notification_sent_at:", updateError);
      }
    }

    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.doseLogsForDate(today) });
  }, [user, todayLogs, today, navigate, refetch, handleTakeNow]);

  useEffect(() => {
    if (!user) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;

    checkAndNotify();
    const intervalId = window.setInterval(checkAndNotify, POLL_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [user, checkAndNotify]);

  useEffect(() => {
    const lastDate = sessionStorage.getItem("scheduler_date");
    const currentDate = getLocalDateString();
    if (lastDate !== currentDate) {
      notifiedDoseIds.current.clear();
      locallyCreatedDoseKeys.current.clear();
      sessionStorage.setItem("scheduler_date", currentDate);
    }
  }, []);

  return null;
};

export default MedicationNotificationScheduler;