declare global {
  interface Window {
    OneSignal: {
      init: (options: OneSignalInitOptions) => Promise<void>;
      Notifications: {
        requestPermission: () => Promise<NotificationPermission>;
        getPermissionStatus: () => Promise<NotificationPermission>;
        addEventListener: (event: string, handler: (event: unknown) => void) => void;
      };
      getPlayerId: () => Promise<string | null>;
      setExternalUserId: (userId: string) => Promise<void>;
      isPushNotificationsEnabled: () => Promise<boolean>;
    };
  }
}

interface OneSignalInitOptions {
  appId: string;
  allowLocalhostAsSecureOrigin?: boolean;
  notifyButton?: object;
  welcomeNotification?: object;
}

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;

let oneSignalInitialized = false;
let oneSignalLoading = false;
let oneSignalInitPromise: Promise<boolean> | null = null;

export const isOneSignalSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && typeof window.OneSignal !== 'undefined';
};

export const initOneSignal = async (userId: string): Promise<boolean> => {
  if (!ONESIGNAL_APP_ID) {
    console.warn('[OneSignal] App ID not configured. Add VITE_ONESIGNAL_APP_ID to your .env file');
    return false;
  }

  if (oneSignalInitialized && window.OneSignal) {
    return true;
  }

  if (oneSignalInitPromise) {
    return oneSignalInitPromise;
  }

  if (typeof window === 'undefined') return false;

  oneSignalInitPromise = new Promise((resolve) => {
    if (window.OneSignal) {
      oneSignalInitialized = true;
      window.OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true,
        notifyButton: { enable: false },
        welcomeNotification: { disable: true },
      } as OneSignalInitOptions).then(() => {
        console.log('[OneSignal] Initialized successfully');
        window.OneSignal.setExternalUserId(userId).catch(console.error);
        resolve(true);
      }).catch((err) => {
        console.error('[OneSignal] Init error:', err);
        resolve(false);
      });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.onesignal.com/sdks/OneSignalSDK.js';
    script.async = true;
    script.onload = () => {
      console.log('[OneSignal] SDK script loaded');
      if (window.OneSignal) {
        window.OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true,
          notifyButton: { enable: false },
          welcomeNotification: { disable: true },
        } as OneSignalInitOptions).then(() => {
          console.log('[OneSignal] Initialized successfully');
          oneSignalInitialized = true;
          window.OneSignal.setExternalUserId(userId).catch(console.error);
          resolve(true);
        }).catch((err) => {
          console.error('[OneSignal] Init error:', err);
          resolve(false);
        });
      } else {
        console.error('[OneSignal] SDK not available after load');
        resolve(false);
      }
    };
    script.onerror = () => {
      console.error('[OneSignal] Failed to load SDK from CDN');
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return oneSignalInitPromise;
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
    const enabled = await window.OneSignal.isPushNotificationsEnabled();
    return enabled;
  } catch {
    try {
      const status = await window.OneSignal.Notifications.getPermissionStatus();
      return status === 'granted';
    } catch {
      return false;
    }
  }
};

export const subscribeToPush = async (userId: string): Promise<string | null> => {
  console.log('[OneSignal] Starting subscription for user:', userId);
  
  const initialized = await initOneSignal(userId);
  if (!initialized) {
    console.error('[OneSignal] Failed to initialize');
    return null;
  }

  console.log('[OneSignal] Requesting notification permission');
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    console.warn('[OneSignal] Permission not granted');
    return null;
  }

  console.log('[OneSignal] Getting player ID');
  const playerId = await getOneSignalPlayerId();
  if (playerId) {
    console.log('[OneSignal] Subscribed with player ID:', playerId);
  } else {
    console.warn('[OneSignal] No player ID returned');
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

export const setupNotificationClickHandler = (onNotificationClick: (data: Record<string, unknown>) => void) => {
  if (!window.OneSignal) return;

  window.OneSignal.Notifications.addEventListener('click', (event: unknown) => {
    console.log('[OneSignal] Notification clicked:', event);
    const clickEvent = event as { notification?: { launchData?: Record<string, unknown> } };
    const data = clickEvent?.notification?.launchData || {};
    onNotificationClick(data);
  });
};

export const isConfigured = (): boolean => {
  return !!ONESIGNAL_APP_ID;
};