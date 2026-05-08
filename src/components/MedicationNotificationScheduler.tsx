import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useDoseLogsForDate } from "@/hooks/use-queries";
import { supabase } from "@/integrations/supabase/client";
import { queryClient, QUERY_KEYS } from "@/lib/query-client";
import { DoseLog } from "@/utils/storage";
import { getCurrentTime24, getLocalDateString } from "@/utils/datetime";

const NOTIFICATION_LOOKBACK_MINUTES = 2;

const timeToMinutes = (time: string) => {
  const [hour = "0", minute = "0"] = time.split(":");
  return Number(hour) * 60 + Number(minute);
};

const shouldNotifyNow = (log: DoseLog, now = new Date()) => {
  if (log.status !== "partial" || log.notificationSentAt) return false;

  const currentMinutes = timeToMinutes(getCurrentTime24(now));
  const scheduledMinutes = timeToMinutes(log.scheduledTime);
  const minutesSinceScheduled = currentMinutes - scheduledMinutes;

  return minutesSinceScheduled >= 0 && minutesSinceScheduled <= NOTIFICATION_LOOKBACK_MINUTES;
};

const MedicationNotificationScheduler = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = getLocalDateString();
  const { data: todayLogs = [] } = useDoseLogsForDate(today);
  const notifiedDoseIds = useRef(new Set<string>());

  useEffect(() => {
    if (!user || typeof Notification === "undefined" || Notification.permission !== "granted") return;

    const showDueNotifications = async () => {
      const dueLogs = todayLogs.filter((log: DoseLog) => shouldNotifyNow(log) && !notifiedDoseIds.current.has(log.id));
      if (dueLogs.length === 0) return;

      for (const log of dueLogs) {
        notifiedDoseIds.current.add(log.id);

        const body = `Time to take ${log.medicineName}`;
        const notification = new Notification("Medication Reminder", {
          body,
          icon: "/favicon.ico",
          tag: `dose-${log.id}`,
          requireInteraction: true,
          data: {
            doseLogId: log.id,
            medicineId: log.medicineId,
          },
        });

        notification.onclick = () => {
          window.focus();
          navigate("/dashboard");
          notification.close();
        };

        toast.info(body, {
          action: {
            label: "Open",
            onClick: () => navigate("/dashboard"),
          },
        });

        const { error } = await supabase
          .from("dose_logs")
          .update({ notification_sent_at: new Date().toISOString(), notification_error: null })
          .eq("id", log.id);

        if (error) {
          console.error("[MedicationNotificationScheduler] Failed to mark notification as sent:", error);
        }
      }

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.doseLogsForDate(today) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.doseLogs });
    };

    showDueNotifications();
    const intervalId = window.setInterval(showDueNotifications, 30_000);
    return () => window.clearInterval(intervalId);
  }, [todayLogs, today, user, navigate]);

  return null;
};

export default MedicationNotificationScheduler;
