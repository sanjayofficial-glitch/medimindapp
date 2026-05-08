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
        window.OneSignal = oneSignal;

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

    window.setTimeout(() => {
      if (!oneSignalInitialized) {
        console.error('[OneSignal] SDK initialization timed out');
        oneSignalInitPromise = null;
        resolve(false);
      }
    }, 12000);
  });

  return oneSignalInitPromise;
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!window.OneSignal) {
    console.warn('[OneSignal] SDK not initialized');
    return false;
  }

  try {
    if (Notification.permission === 'denied') {
      console.warn('[OneSignal] Browser notification permission is blocked');
      return false;
    }

    if (Notification.permission === 'default') {
      const browserPermission = await Notification.requestPermission();
      if (browserPermission !== 'granted') {
        console.warn('[OneSignal] Browser permission prompt was not granted:', browserPermission);
        return false;
      }
    }

    await window.OneSignal.Notifications.requestPermission();
    const hasPermission = window.OneSignal.Notifications.permission || Notification.permission === 'granted';
    console.log('[OneSignal] Permission granted:', hasPermission);
    return hasPermission;
  } catch (error) {
    console.error('[OneSignal] Permission error:', error);
    return false;
  }
};

export const requestBrowserNotificationPermission = async (): Promise<boolean> => {
  if (typeof Notification === 'undefined') {
    console.warn('[OneSignal] Browser notifications are not available');
    return false;
  }

  if (Notification.permission === 'granted') return true;

  if (Notification.permission === 'denied') {
    console.warn('[OneSignal] Browser notification permission is blocked');
    return false;
  }

  const permission = await Notification.requestPermission();
  console.log('[OneSignal] Browser permission:', permission);
  return permission === 'granted';
};

export const hasNotificationPermission = (): boolean => {
  return typeof Notification !== 'undefined' && Notification.permission === 'granted';
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

const waitForSubscriptionId = async (timeoutMs = 20000): Promise<string | null> => {
  const existingId = await getOneSignalPlayerId();
  if (existingId) return existingId;

  if (!window.OneSignal) return null;

  return new Promise((resolve) => {
    let settled = false;
    let poll = 0;
    let timeout = 0;

    const finish = (subscriptionId: string | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      window.clearInterval(poll);
      resolve(subscriptionId);
    };

    timeout = window.setTimeout(() => finish(null), timeoutMs);
    poll = window.setInterval(() => {
      const subscriptionId = window.OneSignal?.User.PushSubscription.id || null;
      if (subscriptionId) {
        finish(subscriptionId);
      }
    }, 500);

    window.OneSignal?.User.PushSubscription.addEventListener('change', (event) => {
      const subscriptionId = event.current?.id || window.OneSignal?.User.PushSubscription.id || null;
      if (subscriptionId) {
        finish(subscriptionId);
      }
    });
  });
};

export const subscribeToPush = async (userId: string): Promise<string | null> => {
  console.log('[OneSignal] Starting subscription for user:', userId);

  const browserPermission = await requestBrowserNotificationPermission();
  if (!browserPermission) {
    console.warn('[OneSignal] Browser permission not granted');
    return null;
  }

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

export const restorePushSubscription = async (userId: string): Promise<string | null> => {
  const initialized = await initOneSignal(userId);
  if (!initialized || !hasNotificationPermission()) return null;

  await window.OneSignal?.User.PushSubscription.optIn();
  return waitForSubscriptionId();
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
