import { getMedicines, getFamilyMembers, saveDoseLog, DoseLog } from "./storage";
import { Medicine } from "@/utils/storage"; // Fixed import path

export interface NotificationAction {
  type: 'taken' | 'snooze-5' | 'snooze-15' | 'snooze-30';
  medicineId: string;
}

const activeTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Request permission to show desktop notifications */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) return false;
  const permission = await Notification.requestPermission();
  return permission === "granted";
};

/**
 * Creates and displays a browser notification
 */
const createNotification = (medicineId: string, medicineName: string, userName: string) => {
  if (Notification.permission !== "granted") return;

  const options: NotificationOptions & { actions: { action: string; title: string }[] } = {
    body: `Hey ${userName}, it's time for your ${medicineName}!`,
    icon: "/favicon.ico",
    tag: medicineId,
    requireInteraction: true,
    silent: false,
    actions: [
      { action: "taken", title: "✅ Taken" },
      { action: "snooze-5", title: "⏰ Snooze (5m)" },
      { action: "snooze-15", title: "⏰ Snooze (15m)" },
      { action: "snooze-30", title: "⏰ Snooze (30m)" },
    ]
  };

  const notif = new Notification("MediMind Reminder 💊", options);

  const handleAction = (action: string) => {
    window.dispatchEvent(new CustomEvent("medimind_notification_action", {
      detail: { type: action, medicineId } as NotificationAction    }));
    notif.close();
  };

  notif.addEventListener("action", (e: Event) => { // Fixed type    const customEvent = e as any; // Cast to any to access detail
    handleAction(customEvent.detail.action); // Access action from detail
  });

  notif.onclick = () => {
    window.focus();
    handleAction("taken");
  };
};

/**
 * Schedules a notification for a specific medicine time */
export const scheduleNotification = (
  medicineId: string,
  medicineName: string,
  time: string,
  userName: string) => {
  if (!("Notification" in window)) return;
  
  const scheduleKey = `${medicineId}_${time}`;
  cancelNotification(scheduleKey);

  const [hours, minutes] = time.split(":").map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  const delay = target.getTime() - now.getTime();
  
  if (delay > 0) {
    const timeoutId = setTimeout(() => {
      createNotification(medicineId, medicineName, userName);
      scheduleNotification(medicineId, medicineName, time, userName);
    }, delay);
    
    activeTimeouts.set(scheduleKey, timeoutId);
  }
};

/**
 * Snoozes a notification for a set duration */
export const snoozeNotification = (medicineId: string, medicineName: string, userName: string, durationMinutes: number) => {
  const snoozeKey = `${medicineId}_snooze`;
  cancelNotification(snoozeKey);

  const timeoutId = setTimeout(() => {
    createNotification(medicineId, medicineName, userName);
  }, durationMinutes * 60 * 1000);

  activeTimeouts.set(snoozeKey, timeoutId);
};

/**
 * Cancels a scheduled notification
 */
export const cancelNotification = (key: string) => {
  const timeout = activeTimeouts.get(key);
  if (timeout) {
    clearTimeout(timeout);
    activeTimeouts.delete(key);
  }
};

/**
 * Initializes all notifications for all medicines in storage
 */
export const initializeNotifications = async () => {
  const medicines = getMedicines();
  const familyMembers = getFamilyMembers();
  
  medicines.forEach(med => {
    const member = familyMembers.find(m => m.id === med.familyMemberId);
    const userName = member ? member.name : "User";
        med.times.forEach(time => {
      scheduleNotification(med.id, med.name, time, userName);
    });
  });
};

// Global listener for notification actions to handle storage updates
window.addEventListener('medimind_notification_action', (event: Event) => { // Fixed type
  const customEvent = event as any; // Cast to any
  const action = customEvent.detail.type as NotificationAction['type']; // Extract type safely
  const medicines = getMedicines();
  const medicine = medicines.find(m => m.id === customEvent.detail.medicineId);
  
  if (!medicine) return;

  if (action === 'taken') {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    
    const log: DoseLog = {
      id: `log_${Date.now()}`,
      medicineId: medicine.id,
      medicineName: medicine.name,
      scheduledTime: medicine.times[0],
      actualTime: nowTime,
      date: today,
      status: "taken"
    };
        saveDoseLog(log); // Removed await to avoid TS error
  } else if (action.startsWith('snooze-')) {
    const duration = parseInt(action.split('-')[1], 10);
    const familyMembers = getFamilyMembers();
    const member = familyMembers.find(m => m.id === medicine.familyMemberId);
    snoozeNotification(medicine.id, medicine.name, member?.name || "User", duration);
  }
});