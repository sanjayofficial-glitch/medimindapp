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

export const showTestNotification = async (): Promise<boolean> => {
  const granted = await requestNotificationPermission();
  if (granted) {
    new Notification("MediMind", {
      body: "Notifications are working! You'll receive reminders for your medications.",
      icon: "/favicon.ico",
      tag: "test"
    });
  }
  return granted;
};

const createNotification = (medicineId: string, medicineName: string, userName: string, isSnooze: boolean = false, snoozeMinutes: number = 10) => {
  if (Notification.permission !== "granted") return;

  const bodyText = isSnooze 
    ? `Reminder: You snoozed your ${medicineName} - it will alert again after ${snoozeMinutes} minutes`
    : `Hey ${userName}, don't forget your ${medicineName}!`;

  const options: NotificationOptions & { actions: { action: string; title: string }[] } = {
    body: bodyText,
    icon: "/favicon.ico",
    tag: medicineId,
    requireInteraction: true,
    actions: [
      { action: "taken", title: "✅ Taken" },
      { action: "snooze_10", title: "⏰ +10 min" },
      { action: "snooze_20", title: "⏰ +20 min" }
    ]
  };

  const title = isSnooze 
    ? `Reminder: ${medicineName} (after ${snoozeMinutes} min)` 
    : "Time for your medicine 💊";

  const notif = new Notification(title, options);

  const handleAction = (action: string) => {
    let snoozeMins = 10;
    if (action === "snooze_20") snoozeMins = 20;
    
    window.dispatchEvent(new CustomEvent("medimind_notification_action", {
      detail: { 
        type: action.startsWith("snooze") ? "snooze" : action, 
        medicineId,
        snoozeMinutes: action.startsWith("snooze") ? snoozeMins : undefined
      } as NotificationAction
    }));
    notif.close();
  };

  notif.addEventListener("action", (e: Event) => {
    const actionEvent = e as unknown as { action: string };
    handleAction(actionEvent.action);
  });
  notif.onclick = () => handleAction("taken");
};

const convertTo24Hour = (timeStr: string): { hours: number; minutes: number } => {
  const parts = timeStr.trim().split(' ');
  let hours: number;
  let minutes: number = 0;
  
  if (parts.length === 2) {
    const [timePart, period] = parts;
    const [h, m] = timePart.split(':').map(Number);
    hours = h;
    minutes = m || 0;
    
    if (period.toUpperCase() === 'PM' && hours < 12) {
      hours += 12;
    } else if (period.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }
  } else {
    const [h, m] = timeStr.split(':').map(Number);
    hours = h;
    minutes = m || 0;
  }
  
  return { hours, minutes };
};

export const scheduleNotification = (
  medicineId: string,
  medicineName: string,
  time: string,
  userName: string
) => {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    console.log("Notification permission not granted, skipping schedule");
    return;
  }
  
  cancelNotification(medicineId);

  const { hours, minutes } = convertTo24Hour(time);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);

  const delay = target.getTime() - now.getTime();
  console.log(`Scheduling notification for ${medicineName} at ${time} (${hours}:${minutes}), delay: ${delay}ms`);
  
  const timeoutId = setTimeout(() => {
    createNotification(medicineId, medicineName, userName);
    scheduleNotification(medicineId, medicineName, time, userName);
  }, delay);
  
  activeTimeouts.set(medicineId, timeoutId);
};

export const scheduleAllNotifications = (medicines: { id: string; name: string; times: string[] }[], userName: string) => {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  
  medicines.forEach(medicine => {
    medicine.times.forEach((time, index) => {
      const uniqueId = `${medicine.id}_${index}`;
      scheduleNotification(uniqueId, medicine.name, time, userName);
    });
  });
};

export const snoozeNotification = (medicineId: string, medicineName: string, userName: string, snoozeMinutes: number = 10) => {
  cancelNotification(medicineId);
  const delay = snoozeMinutes * 60 * 1000;
  console.log(`Snoozing notification for ${medicineName} for ${snoozeMinutes} minutes`);
  
  const timeoutId = setTimeout(() => createNotification(medicineId, medicineName, userName, true, snoozeMinutes), delay);
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
  activeTimeouts.forEach((timeout) => clearTimeout(timeout));
  activeTimeouts.clear();
};

export const getNotificationPermissionStatus = (): boolean => {
  if (!("Notification" in window)) return false;
  return Notification.permission === "granted";
};