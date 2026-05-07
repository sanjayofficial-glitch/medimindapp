import { supabase } from "@/integrations/supabase/client";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";

export interface PushSubscriptionData {
  id?: string;
  user_id: string;
  subscription: string;
  created_at?: string;
}

const convertSubscriptionToJson = (sub: PushSubscription): string => {
  return JSON.stringify({
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.toJSON().keys?.p256dh || '',
      auth: sub.toJSON().keys?.auth || ''
    }
  });
};

export const getServiceWorkerRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
  if ('serviceWorker' in navigator) {
    try {
      const existing = await navigator.serviceWorker.getRegistration('/sw.js');
      if (existing) {
        console.log('[PUSH] Existing Service Worker found:', existing.scope);
        return existing;
      }
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('[PUSH] Service Worker registered:', registration.scope);
      return registration;
    } catch (error) {
      console.error('[PUSH] Service Worker registration failed:', error);
      return null;
    }
  }
  console.warn('[PUSH] Service Workers not supported');
  return null;
};

export const requestPushPermission = async (): Promise<boolean> => {
  if (!('PushManager' in window)) {
    console.error('[PUSH] Push not supported');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('[PUSH] Notification permission granted');
      return true;
    } else {
      console.warn('[PUSH] Notification permission denied:', permission);
      return false;
    }
  } catch (error) {
    console.error('[PUSH] Error requesting permission:', error);
    return false;
  }
};

export const subscribeToPush = async (userId: string): Promise<PushSubscription | null> => {
  try {
    const registration = await getServiceWorkerRegistration();
    if (!registration) {
      console.error('[PUSH] No service worker registration');
      return null;
    }

    const existingSub = await registration.pushManager.getSubscription();
    if (existingSub) {
      console.log('[PUSH] Already subscribed, using existing subscription');
      await savePushSubscription(userId, existingSub);
      return existingSub;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    console.log('[PUSH] New subscription obtained');

    await savePushSubscription(userId, subscription);

    return subscription;
  } catch (error) {
    console.error('[PUSH] Failed to subscribe:', error);
    return null;
  }
};

export const unsubscribeFromPush = async (userId: string): Promise<boolean> => {
  try {
    const registration = await getServiceWorkerRegistration();
    if (!registration) return false;

    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      console.log('[PUSH] Unsubscribed successfully');
    }

    await deletePushSubscription(userId);
    return true;
  } catch (error) {
    console.error('[PUSH] Failed to unsubscribe:', error);
    return false;
  }
};

const savePushSubscription = async (userId: string, subscription: PushSubscription): Promise<void> => {
  const subscriptionJson = convertSubscriptionToJson(subscription);
  
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: userId,
      subscription: subscriptionJson,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });

  if (error) {
    console.error('[PUSH] Failed to save subscription:', error);
    throw error;
  }
  
  console.log('[PUSH] Subscription saved to Supabase');
};

const deletePushSubscription = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('[PUSH] Failed to delete subscription:', error);
  }
};

export const getPushSubscription = async (userId: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('[PUSH] Failed to get subscription:', error);
    return null;
  }

  return data?.subscription || null;
};

export const sendPushNotificationViaEdge = async (
  userId: string,
  title: string,
  body: string,
  url?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('webpush-reminders', {
      body: {
        user_id: userId,
        title,
        body,
        url: url || '/dashboard'
      }
    });

    if (error) {
      console.error('[PUSH] Edge function error:', error);
      return { success: false, error: error.message };
    }

    console.log('[PUSH] Notification sent successfully:', data);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[PUSH] Failed to send push notification:', errorMessage);
    return { success: false, error: errorMessage };
  }
};

export const checkAndSendDueMedicationReminders = async (userId: string): Promise<number> => {
  try {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const today = now.toISOString().split('T')[0];

    const { data: dueLogs, error: queryError } = await supabase
      .from('dose_logs')
      .select('*, medicines(name)')
      .eq('user_id', userId)
      .eq('date', today)
      .eq('status', 'pending')
      .lte('scheduled_time', currentTime);

    if (queryError) {
      console.error('[PUSH] Error querying due logs:', queryError);
      return 0;
    }

    if (!dueLogs || dueLogs.length === 0) {
      console.log('[PUSH] No due medications at this time');
      return 0;
    }

    const medicineNames = dueLogs.map((log: any) => log.medicines?.name || log.medicine_name).filter(Boolean);
    const uniqueMedicines = [...new Set(medicineNames)];
    
    const result = await sendPushNotificationViaEdge(
      userId,
      '💊 Time for your medicine',
      `Don't forget to take: ${uniqueMedicines.join(', ')}`,
      '/dashboard'
    );

    if (result.success) {
      console.log('[PUSH] Sent reminders for', dueLogs.length, 'medications');
      return dueLogs.length;
    } else {
      console.error('[PUSH] Failed to send reminders:', result.error);
      return 0;
    }
  } catch (error) {
    console.error('[PUSH] Error in checkAndSendDueMedicationReminders:', error);
    return 0;
  }
};

export const sendTestPushNotification = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase.functions.invoke('webpush-reminders', {
      body: {
        user_id: userId,
        title: 'MediMind Test',
        body: 'Your push notifications are working!'
      }
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('[PUSH] Failed to send test notification:', error);
    return false;
  }
};

export const isPushSupported = (): boolean => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const getNotificationPermission = (): NotificationPermission | 'unsupported' => {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
};

export const checkServiceWorkerReady = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) return false;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    console.log('[PUSH] Service Worker ready:', registration.scope);
    return true;
  } catch (error) {
    console.error('[PUSH] Service Worker not ready:', error);
    return false;
  }
};
