import { supabase } from "@/integrations/supabase/client";

export interface NotificationAction {
  type: 'taken' | 'snooze';
  medicineId: string;
  snoozeMinutes?: number;
}

const activeTimeouts = new Map<string, NodeJS.Timeout>();

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.log("Notifications not supported in this browser");
    return false;
  }
  
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  
  const permission = await Notification.requestPermission();
  console.log("Notification permission:", permission);
  return permission === "granted";
};

export const sendImmediateNotification = (title: string, body: string, tag?: string) => {
  if (Notification.permission !== "granted") {
    console.log("Cannot send notification - permission not granted");
    return false;
  }
  
  const notif = new Notification(title, {
    body,
    icon: "/favicon.ico",
    tag: tag || "medimind",
    requireInteraction: true
  });
  
  notif.onclick = () => {
    window.focus();
    notif.close();
  };
  
  return true;
};

export const showTestNotification = async (): Promise<boolean> => {
  const granted = await requestNotificationPermission();
  if (granted) {
    sendImmediateNotification(
      "MediMind Test", 
      "Notifications are working! You'll receive reminders for your medications.",
      "test"
    );
  }
  return granted;
};

export const showMedicineNotification = (
  medicineId: string, 
  medicineName: string, 
  userName: string, 
  isSnooze: boolean = false, 
  snoozeMinutes: number = 10
) => {
  if (Notification.permission !== "granted") {
    console.log("Cannot show notification - permission not granted");
    return;
  }

  const bodyText = isSnooze 
    ? `Reminder: You snoozed your ${medicineName} - it will alert again after ${snoozeMinutes} minutes`
    : `Hey ${userName}, don't forget your ${medicineName}!`;

  const notif = new Notification(
    isSnooze ? `⏰ Reminder: ${medicineName}` : "💊 Time for your medicine",
    {
      body: bodyText,
      icon: "/favicon.ico",
      tag: medicineId,
      requireInteraction: true,
    }
  );

  notif.onclick = () => {
    window.dispatchEvent(new CustomEvent("medimind_notification_action", {
      detail: { type: "taken", medicineId } as NotificationAction
    }));
    window.focus();
    notif.close();
  };
};

const parseTimeString = (timeStr: string): { hours: number; minutes: number } => {
  const trimmed = timeStr.trim();
  let hours: number;
  let minutes: number = 0;
  
  if (trimmed.includes(' ') && (trimmed.toUpperCase().includes('AM') || trimmed.toUpperCase().includes('PM'))) {
    const parts = trimmed.split(' ');
    const timePart = parts[0];
    const period = parts[1].toUpperCase();
    const [h, m] = timePart.split(':').map(Number);
    hours = h || 0;
    minutes = m || 0;
    
    if (period === 'PM' && hours < 12) hours += 12;
    else if (period === 'AM' && hours === 12) hours = 0;
  } else if (trimmed.includes(':')) {
    const [h, m] = trimmed.split(':').map(Number);
    hours = h || 0;
    minutes = m || 0;
  } else {
    hours = parseInt(trimmed) || 0;
    minutes = 0;
  }
  
  return { hours: Math.min(23, Math.max(0, hours)), minutes: Math.min(59, Math.max(0, minutes)) };
};

export const scheduleNotification = (
  medicineId: string,
  medicineName: string,
  time: string,
  userName: string
): { scheduled: boolean; nextRun: string } | undefined => {
  if (!("Notification" in window)) {
    console.log("Notifications not supported in this browser");
    return undefined;
  }
  
  if (Notification.permission !== "granted") {
    console.log("Notification permission not granted");
    return undefined;
  }
  
  cancelNotification(medicineId);

  const { hours, minutes } = parseTimeString(time);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);
  
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  const delay = Math.max(0, target.getTime() - now.getTime());
  const nextRun = target.toLocaleTimeString();
  
  console.log(`[NOTIF] Scheduling: "${medicineName}" at ${time} -> ${hours}:${minutes}, delay: ${delay}ms, will fire at ${nextRun}`);
  
  const timeoutId = setTimeout(() => {
    console.log(`[NOTIF] Triggering notification for: ${medicineName}`);
    showMedicineNotification(medicineId, medicineName, userName);
    scheduleNotification(medicineId, medicineName, time, userName);
  }, delay);
  
  activeTimeouts.set(medicineId, timeoutId);
  
  return { scheduled: true, nextRun };
};

export const scheduleAllNotifications = (medicines: { id: string; name: string; times: string[] }[], userName: string): void => {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    console.log("[NOTIF] Cannot schedule - permission not granted or not supported");
    return;
  }
  
  console.log("[NOTIF] Scheduling all notifications for", medicines.length, "medicines");
  
  medicines.forEach(medicine => {
    console.log("[NOTIF] Medicine:", medicine.name, "times:", medicine.times);
    medicine.times.forEach((time, index) => {
      const uniqueId = `${medicine.id}_${index}`;
      const result = scheduleNotification(uniqueId, medicine.name, time, userName);
      console.log("[NOTIF] Result:", result);
    });
  });
};

export const snoozeNotification = (medicineId: string, medicineName: string, userName: string, snoozeMinutes: number = 10) => {
  cancelNotification(medicineId);
  const delay = snoozeMinutes * 60 * 1000;
  console.log(`[NOTIF] Snoozing ${medicineName} for ${snoozeMinutes} minutes`);
  
  const timeoutId = setTimeout(() => showMedicineNotification(medicineId, medicineName, userName, true, snoozeMinutes), delay);
  activeTimeouts.set(medicineId, timeoutId);
};

export const cancelNotification = (medicineId: string) => {
  const timeout = activeTimeouts.get(medicineId);
  if (timeout) {
    clearTimeout(timeout);
    activeTimeouts.delete(medicineId);
  }
};

export const cancelAllNotifications = () => {
  console.log("[NOTIF] Cancelling all notifications");
  activeTimeouts.forEach((timeout) => clearTimeout(timeout));
  activeTimeouts.clear();
};

export const getNotificationPermissionStatus = (): boolean => {
  if (!("Notification" in window)) return false;
  console.log("[NOTIF] Current permission:", Notification.permission);
  return Notification.permission === "granted";
};

export const getScheduledNotificationCount = (): number => {
  return activeTimeouts.size;
};

export const sendPushNotification = async (
  userId: string,
  title: string,
  body: string,
  medicineId?: string
): Promise<boolean> => {
  try {
    const { error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        userId,
        title,
        body,
        medicineId
      }
    });

    if (error) {
      console.error('[NOTIF] Push notification error:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[NOTIF] Failed to send push notification:', error);
    return false;
  }
};
