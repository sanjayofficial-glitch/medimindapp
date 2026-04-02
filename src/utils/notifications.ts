export interface NotificationAction {
  type: 'taken' | 'snooze';
  medicineId: string;
}

const activeTimeouts = new Map<string, NodeJS.Timeout>();

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) return false;
  const permission = await Notification.requestPermission();
  return permission === "granted";
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

export const snoozeNotification = (medicineId: string, medicineName: string, userName: string, minutes: number = 10) => {
  cancelNotification(medicineId);
  const timeoutId = setTimeout(() => createNotification(medicineId, medicineName, userName), minutes * 60 * 1000);
  activeTimeouts.set(medicineId, timeoutId);
};

export const cancelNotification = (medicineId: string) => {
  const timeout = activeTimeouts.get(medicineId);
  if (timeout) {
    clearTimeout(timeout);
    activeTimeouts.delete(medicineId);
  }
};

// Snooze tracking helpers (using localStorage as web equivalent to AsyncStorage)
export const getSnoozeCount = (medicineId: string): number => {
  const snoozes = JSON.parse(localStorage.getItem("medimind_snoozes") || "{}");
  return snoozes[medicineId] || 0;
};

export const incrementSnoozeCount = (medicineId: string) => {
  const snoozes = JSON.parse(localStorage.getItem("medimind_snoozes") || "{}");
  snoozes[medicineId] = (snoozes[medicineId] || 0) + 1;
  localStorage.setItem("medimind_snoozes", JSON.stringify(snoozes));
};

export const resetSnoozeCount = (medicineId: string) => {
  const snoozes = JSON.parse(localStorage.getItem("medimind_snoozes") || "{}");
  delete snoozes[medicineId];
  localStorage.setItem("medimind_snoozes", JSON.stringify(snoozes));
};

export const logSnoozeEvent = (medicineId: string, minutes: number) => {
  const logs = JSON.parse(localStorage.getItem("medimind_snooze_logs") || "[]");
  logs.push({ medicineId, minutes, timestamp: new Date().toISOString() });
  localStorage.setItem("medimind_snooze_logs", JSON.stringify(logs));
};