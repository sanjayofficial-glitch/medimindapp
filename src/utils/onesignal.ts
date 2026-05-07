declare global {
  interface Window {
    OneSignal: any;
  }
}

interface OneSignalInitOptions {
  appId: string;
  allowLocalhostAsSecureOrigin?: boolean;
  notifyButton?: object;
  welcomeNotification?: object;
}

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;

export const isOneSignalSupported = (): boolean => {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator;
};

export const initOneSignal = async (userId: string): Promise<boolean> => {
  if (!ONESIGNAL_APP_ID) {
    console.warn('[OneSignal] App ID not configured');
    return false;
  }

  if (typeof window === 'undefined') return false;

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.onesignal.com/sdks/OneSignalSDK.js';
    script.async = true;
    script.onload = () => {
      if (window.OneSignal) {
        window.OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true,
          notifyButton: { enable: false },
          welcomeNotification: { disable: true },
        } as OneSignalInitOptions).then(() => {
          console.log('[OneSignal] Initialized successfully');
          
          window.OneSignal.setExternalUserId(userId).then(() => {
            console.log('[OneSignal] External user ID set:', userId);
          });
          
          resolve(true);
        });
      }
    };
    script.onerror = () => {
      console.error('[OneSignal] Failed to load SDK');
      resolve(false);
    };
    document.head.appendChild(script);
  });
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!window.OneSignal) {
    console.warn('[OneSignal] SDK not initialized');
    return false;
  }

  try {
    const permission = await window.OneSignal.Notifications.requestPermission();
    console.log('[OneSignal] Permission:', permission);
    return permission === 'granted';
  } catch (error) {
    console.error('[OneSignal] Permission error:', error);
    return false;
  }
};

export const getOneSignalPlayerId = async (): Promise<string | null> => {
  if (!window.OneSignal) return null;

  try {
    const playerId = await window.OneSignal.getPlayerId();
    return playerId;
  } catch (error) {
    console.error('[OneSignal] Get player ID error:', error);
    return null;
  }
};

export const isOneSignalEnabled = async (): Promise<boolean> => {
  if (!window.OneSignal) return false;

  try {
    return await window.OneSignal.Notifications.getPermissionStatus() === 'granted';
  } catch {
    return false;
  }
};

export const subscribeToPush = async (userId: string): Promise<string | null> => {
  const initialized = await initOneSignal(userId);
  if (!initialized) return null;

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return null;

  const playerId = await getOneSignalPlayerId();
  if (playerId) {
    console.log('[OneSignal] Subscribed with player ID:', playerId);
  }
  
  return playerId;
};

export const unsubscribeFromPush = async (): Promise<boolean> => {
  if (!window.OneSignal) return false;

  try {
    await window.OneSignal.setExternalUserId('');
    console.log('[OneSignal] Unsubscribed');
    return true;
  } catch (error) {
    console.error('[OneSignal] Unsubscribe error:', error);
    return false;
  }
};

export const sendTestNotification = async (): Promise<boolean> => {
  if (!window.OneSignal || !ONESIGNAL_APP_ID) return false;

  try {
    const playerId = await getOneSignalPlayerId();
    if (!playerId) {
      console.warn('[OneSignal] No player ID available');
      return false;
    }

    console.log('[OneSignal] Test notification sent to:', playerId);
    return true;
  } catch (error) {
    console.error('[OneSignal] Test notification error:', error);
    return false;
  }
};

export const setupNotificationClickHandler = (onNotificationClick: (data: Record<string, unknown>) => void) => {
  if (!window.OneSignal) return;

  window.OneSignal.Notifications.addEventListener('click', (event: any) => {
    console.log('[OneSignal] Notification clicked:', event);
    const data = event?.notification?.launchData || {};
    onNotificationClick(data);
  });
};