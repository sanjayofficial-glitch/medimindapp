declare global {
  interface Window {
    OneSignalDeferred?: Array<(oneSignal: OneSignalSdk) => void | Promise<void>>;
    OneSignal?: OneSignalSdk;
  }
}

interface OneSignalSdk {
  init: (options: OneSignalInitOptions) => Promise<void>;
  login: (externalId: string) => Promise<void>;
  logout: () => Promise<void>;
  Notifications: {
    requestPermission: () => Promise<void>;
    isPushSupported: () => boolean;
    permission: boolean;
    addEventListener: (event: string, handler: (event: unknown) => void) => void;
  };
  User: {
    PushSubscription: {
      id: string | null;
      optedIn: boolean;
      optIn: () => Promise<void>;
      optOut: () => Promise<void>;
      addEventListener: (event: string, handler: (event: PushSubscriptionChangeEvent) => void) => void;
    };
  };
}

interface OneSignalInitOptions {
  appId: string;
  allowLocalhostAsSecureOrigin?: boolean;
  notifyButton?: object;
  welcomeNotification?: object;
}

interface PushSubscriptionChangeEvent {
  current?: {
    id?: string | null;
    optedIn?: boolean;
    token?: string | null;
  };
  previous?: {
    id?: string | null;
    optedIn?: boolean;
    token?: string | null;
  };
}

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;

let oneSignalInitialized = false;
let oneSignalInitPromise: Promise<boolean> | null = null;

export const isOneSignalSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'Notification' in window && window.isSecureContext;
};

export const initOneSignal = async (userId: string): Promise<boolean> => {
  if (!ONESIGNAL_APP_ID) {
    console.warn('[OneSignal] App ID not configured. Add VITE_ONESIGNAL_APP_ID to your .env file');
    return false;
  }

  if (!isOneSignalSupported()) {
    console.warn('[OneSignal] Web push is not supported in this browser/context');
    return false;
  }

  if (oneSignalInitialized && window.OneSignal) {
    await window.OneSignal.login(userId).catch(console.error);
    return true;
  }

  if (oneSignalInitPromise) {
    return oneSignalInitPromise;
  }

  if (typeof window === 'undefined') return false;

  oneSignalInitPromise = new Promise((resolve) => {
    const initialize = async (oneSignal: OneSignalSdk) => {
      try {
        await oneSignal.init({
          appId: ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true,
          notifyButton: { enable: false },
          welcomeNotification: { disable: true },
        } as OneSignalInitOptions);

        await oneSignal.login(userId);
        oneSignalInitialized = true;
        console.log('[OneSignal] Initialized successfully');
        resolve(true);
      } catch (err) {
        console.error('[OneSignal] Init error:', err);
        oneSignalInitPromise = null;
        resolve(false);
      }
    };

    if (window.OneSignal) {
      initialize(window.OneSignal);
      return;
    }

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(initialize);

    const script = document.createElement('script');
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.defer = true;
    script.onerror = () => {
      console.error('[OneSignal] Failed to load SDK from CDN');
      oneSignalInitPromise = null;
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
    await window.OneSignal.Notifications.requestPermission();
    const hasPermission = window.OneSignal.Notifications.permission || Notification.permission === 'granted';
    console.log('[OneSignal] Permission granted:', hasPermission);
    return hasPermission;
  } catch (error) {
    console.error('[OneSignal] Permission error:', error);
    return false;
  }
};

export const getOneSignalPlayerId = async (): Promise<string | null> => {
  if (!window.OneSignal) return null;

  try {
    return window.OneSignal.User.PushSubscription.id;
  } catch (error) {
    console.error('[OneSignal] Get subscription ID error:', error);
    return null;
  }
};

export const isOneSignalEnabled = async (): Promise<boolean> => {
  if (!window.OneSignal) return false;

  try {
    return window.OneSignal.User.PushSubscription.optedIn && !!window.OneSignal.User.PushSubscription.id;
  } catch {
    return false;
  }
};

const waitForSubscriptionId = async (timeoutMs = 10000): Promise<string | null> => {
  const existingId = await getOneSignalPlayerId();
  if (existingId) return existingId;

  if (!window.OneSignal) return null;

  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => resolve(null), timeoutMs);

    window.OneSignal?.User.PushSubscription.addEventListener('change', (event) => {
      const subscriptionId = event.current?.id || window.OneSignal?.User.PushSubscription.id || null;
      if (subscriptionId) {
        window.clearTimeout(timeout);
        resolve(subscriptionId);
      }
    });
  });
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

  await window.OneSignal?.User.PushSubscription.optIn();

  console.log('[OneSignal] Getting subscription ID');
  const playerId = await waitForSubscriptionId();
  if (playerId) {
    console.log('[OneSignal] Subscribed with subscription ID:', playerId);
  } else {
    console.warn('[OneSignal] No subscription ID returned');
  }

  return playerId;
};

export const unsubscribeFromPush = async (): Promise<boolean> => {
  if (!window.OneSignal) return false;

  try {
    await window.OneSignal.User.PushSubscription.optOut();
    await window.OneSignal.logout();
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
    const clickEvent = event as { notification?: { additionalData?: Record<string, unknown>; launchData?: Record<string, unknown> } };
    const data = clickEvent?.notification?.additionalData || clickEvent?.notification?.launchData || {};
    onNotificationClick(data);
  });
};

export const isConfigured = (): boolean => {
  return !!ONESIGNAL_APP_ID;
};
