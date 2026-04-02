export interface NotificationAction {
  type: 'taken' | 'snooze' | 'snooze_10' | 'snooze_30';
  medicineId: string;
}

export interface SnoozeEvent {
  medicineId: string;
  date: string;
  snoozeCount: number;
  times: string[];
}

export interface MissedDose {
  medicineId: string;
  medicineName: string;
  scheduledTime: string;
  missedAt: string;
}

const activeTimeouts = new Map<string, NodeJS.Timeout>();
const SNOOZE_KEY = "medimind_snooze_events";
const MISSED_KEY = "medimind_missed_doses";

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) return false;
  const permission = await Notification.requestPermission();
  return permission === "granted";
};

const getSnoozeData = (medicineId: string): SnoozeEvent | null => {
  const all = JSON.parse(localStorage.getItem(SNOOZE_KEY) || "{}");
  const today = new Date().toISOString().split("T")[0];
  return all[medicineId]?.date === today ? all[medicineId] : null;
};

const updateSnoozeData = (medicineId: string, minutes: number) => {
  const all = JSON.parse(localStorage.getItem(SNOOZE_KEY) || "{}");
  const today = new Date().toISOString().split("T")[0];
  const existing = all[medicineId]?.date === today ? all[medicineId] : { medicineId, date: today, snoozeCount: 0, times: [] };
  
  existing.snoozeCount += 1;
  existing.times.push(new Date().toISOString());
  all[medicineId] = existing;
  localStorage.setItem(SNOOZE_KEY, JSON.stringify(all));
  return existing.snoozeCount;
};

export const getSnoozeCount = (medicineId: string): number => {
  const data = getSnoozeData(medicineId);
  return data?.snoozeCount || 0;
};

export const resetSnoozeCount = (medicineId: string) => {
  const all = JSON.parse(localStorage.getItem(SNOOZE_KEY) || "{}");
  delete all[medicineId];
  localStorage.setItem(SNOOZE_KEY, JSON.stringify(all));
};

const createNotification = (medicineId: string, medicineName: string, userName: string) => {
  if (Notification.permission !== "granted") return;

  const notif = new Notification("Time for your medicine 💊", {
    body: `Hey ${userName}, don't forget your ${medicineName}!`,
    icon: "/favicon.ico",
    tag: medicineId,
    actions: [
      { action: "taken", title: "✅ Taken" },
      { action: "snooze", title: "⏰ Snooze" }
    ]
  });

  const handleAction = (action: string) => {
    window.dispatchEvent(new CustomEvent("medimind_notification_action", {
      detail: { type: action, medicineId } as NotificationAction
    }));
    notif.close();
  };

  notif.addEventListener("action", (e: any) => handleAction(e.action));
  notif.onclick = () => handleAction("taken");
};

export const scheduleNotification = (
  medicineId: string,
  medicineName: string,
  time: string,
  userName: string
) => {
  if (!("Notification" in window)) return;
  cancelNotification(medicineId);

  const [hours, minutes] = time.split(":").map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);

  const delay = target.getTime() - now.getTime();
  const timeoutId = setTimeout(() => createNotification(medicineId, medicineName, userName), delay);
  activeTimeouts.set(medicineId, timeoutId);
};

export const snoozeNotification = (
  medicineId: string, 
  medicineName: string, 
  userName: string, 
  minutes: number
) => {
  cancelNotification(medicineId);
  const snoozeCount = updateSnoozeData(medicineId, minutes);
  
  const timeoutId = setTimeout(() => createNotification(medicineId, medicineName, userName), minutes * 60 * 1000);
  activeTimeouts.set(medicineId, timeoutId);
  
  return snoozeCount;
};

export const cancelNotification = (medicineId: string) => {
  const timeout = activeTimeouts.get(medicineId);
  if (timeout) {
    clearTimeout(timeout);
    activeTimeouts.delete(medicineId);
  }
};

export const checkMissedDoses = (medicines: any[]): MissedDose[] => {
  const now = new Date();
  const missed: MissedDose[] = [];
  const existingMissed = JSON.parse(localStorage.getItem(MISSED_KEY) || "[]");
  const today = now.toISOString().split("T")[0];

  medicines.forEach(med => {
    if (med.taken) return;
    
    const [hours, minutes] = med.time.split(":").map(Number);
    const scheduled = new Date();
    scheduled.setHours(hours, minutes, 0, 0);
    
    const diffMinutes = (now.getTime() - scheduled.getTime()) / (1000 * 60);
    
    if (diffMinutes > 15) {
      const alreadyLogged = existingMissed.some(
        (m: MissedDose) => m.medicineId === med.id && m.missedAt.startsWith(today)
      );
      
      if (!alreadyLogged) {
        missed.push({
          medicineId: med.id,
          medicineName: med.name,
          scheduledTime: med.time,
          missedAt: now.toISOString()
        });
      }
    }
  });

  if (missed.length > 0) {
    const updated = [...existingMissed, ...missed];
    localStorage.setItem(MISSED_KEY, JSON.stringify(updated));
    
    const doseLogs = JSON.parse(localStorage.getItem("medimind_dose_logs") || "[]");
    missed.forEach(m => {
      doseLogs.push({
        medicineId: m.medicineId,
        scheduledTime: m.scheduledTime,
        takenTime: m.missedAt,
        status: "missed"
      });
    });
    localStorage.setItem("medimind_dose_logs", JSON.stringify(doseLogs));
  }

  return missed;
};

export const getTodayMissedDoses = (): MissedDose[] => {
  const all = JSON.parse(localStorage.getItem(MISSED_KEY) || "[]");
  const today = new Date().toISOString().split("T")[0];
  return all.filter((m: MissedDose) => m.missedAt.startsWith(today));
};