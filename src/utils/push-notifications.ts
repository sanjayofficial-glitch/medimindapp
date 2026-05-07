import { supabase } from "@/integrations/supabase/client";

const VAPID_PUBLIC_KEY = "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";

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

export const sendTestPushNotification = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        userId,
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