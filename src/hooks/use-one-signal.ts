import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { initOneSignal, subscribeToPush, unsubscribeFromPush, isOneSignalEnabled, getOneSignalPlayerId, isOneSignalSupported, isConfigured } from '@/utils/onesignal';
import { useAuth } from '@/context/AuthContext';

export const useOneSignal = () => {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isConfiguredOneSignal, setIsConfiguredOneSignal] = useState(true);

  const checkSubscriptionStatus = useCallback(async () => {
    console.log('[useOneSignal] Checking subscription status...', { user: !!user, supported: isOneSignalSupported() });
    
    if (!isConfigured()) {
      console.warn('[useOneSignal] OneSignal not configured - missing VITE_ONESIGNAL_APP_ID');
      setIsConfiguredOneSignal(false);
      setIsEnabled(false);
      setIsLoading(false);
      return;
    }

    if (!user || !isOneSignalSupported()) {
      console.log('[useOneSignal] Cannot check - user or OneSignal not supported');
      setIsEnabled(false);
      setIsLoading(false);
      return;
    }

    try {
      await initOneSignal(user.id);
      const enabled = await isOneSignalEnabled();
      console.log('[useOneSignal] Push enabled:', enabled);
      setIsEnabled(enabled);
    } catch (error) {
      console.error('[useOneSignal] Error checking status:', error);
      setIsEnabled(false);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkSubscriptionStatus();
  }, [checkSubscriptionStatus]);

  const subscribe = useCallback(async () => {
    console.log('[useOneSignal] Subscribe called');
    
    if (!isConfigured()) {
      console.error('[useOneSignal] OneSignal not configured');
      return false;
    }

    if (!user || !isOneSignalSupported()) {
      console.warn('[useOneSignal] Cannot subscribe: user or OneSignal not supported');
      return false;
    }

    setIsSubscribing(true);
    try {
      console.log('[useOneSignal] Starting push subscription...');
      const playerId = await subscribeToPush(user.id);
      console.log('[useOneSignal] Got playerId:', playerId);
      
      if (playerId) {
        console.log('[useOneSignal] Saving subscription to Supabase...');
        const { error } = await supabase.functions.invoke('save-onesignal-subscription', {
          body: { player_id: playerId, device_type: 'web' }
        });

        if (error) {
          console.error('[useOneSignal] Error saving subscription:', error);
          return false;
        }

        console.log('[useOneSignal] Subscription saved successfully');
        setIsEnabled(true);
        return true;
      }
      
      console.warn('[useOneSignal] No playerId returned');
      return false;
    } catch (error) {
      console.error('[useOneSignal] Subscribe error:', error);
      return false;
    } finally {
      setIsSubscribing(false);
    }
  }, [user]);

  const unsubscribe = useCallback(async () => {
    if (!user) return false;

    try {
      const playerId = await getOneSignalPlayerId();
      
      if (playerId) {
        await supabase
          .from('onesignal_subscriptions')
          .update({ is_active: false })
          .eq('user_id', user.id)
          .eq('player_id', playerId);
      }

      await unsubscribeFromPush();
      setIsEnabled(false);
      return true;
    } catch (error) {
      console.error('[useOneSignal] Unsubscribe error:', error);
      return false;
    }
  }, [user]);

  return {
    isEnabled,
    isLoading,
    isSubscribing,
    isSupported: isOneSignalSupported(),
    isConfigured: isConfiguredOneSignal,
    subscribe,
    unsubscribe,
    refresh: checkSubscriptionStatus,
  };
};
