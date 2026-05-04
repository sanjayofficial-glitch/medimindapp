import { Medicine } from "@/utils/storage";

export interface NotificationAction {
  type: 'taken' | 'snooze-5' | 'snooze-15' | 'snooze-30';
  medicineId: string;
}

const activeTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) return false;
  const permission = await Notification.requestPermission();
  return permission === "granted";
};

const createNotification = (medicineId: string, medicineName: string, userName: string) => {
  if (Notification.permission !== "granted") return;

  const options: NotificationOptions & { actions: { action: string; title: string }[] } = {
    body: `Hey ${userName}, don't forget your ${medicineName}!`,
    icon: "/favicon.ico",
    tag: medicineId,
    actions: [
      { action: "taken", title: "✅ Taken" },
      { action: "snooze-5", title: "⏰ Snooze (5min)" },
      { action: "snooze-15", title: "⏰ Snooze (15min)" },
      { action: "snooze-30", title: "⏰ Snooze (30min)" },
    ]
  };

  const notif = new Notification("Time for your medicine 💊", options);

  const handleAction = (action: string) => {
    window.dispatchEvent(new CustomEvent("medimind_notification_action", {
      detail: { type: action, medicineId } as NotificationAction
    }));
    notif.close();
  };

  notif.addEventListener("action", (e: Event) => {
    const action = (e as unknown as { action: string }).action;
    handleAction(action);
  });
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

export const snoozeNotification = (medicineId: string, medicineName: string, userName: string, duration: number = 5) => {
  cancelNotification(medicineId);
  const timeoutId = setTimeout(() => createNotification(medicineId, medicineName, userName), duration * 60 * 1000);
  activeTimeouts.set(medicineId, timeoutId);
};

export const cancelNotification = (medicineId: string) => {
  const timeout = activeTimeouts.get(medicineId);
  if (timeout) {
    clearTimeout(timeout);
    activeTimeouts.delete(medicineId);
  }
};

// Handle notification actions globally
window.addEventListener('medimind_notification_action', ((event: CustomEvent) => {
  const action = event.detail as NotificationAction;
  if (action.type.startsWith('snooze-')) {
    const duration = parseInt(action.type.split('-')[1], 10);
    snoozeNotification(action.medicineId, "Medicine", "User", duration);
  }
}) as EventListener);