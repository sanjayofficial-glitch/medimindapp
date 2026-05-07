import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { initOneSignal, subscribeToPush, isOneSignalEnabled, getOneSignalPlayerId, isOneSignalSupported } from '@/utils/onesignal';
import { useAuth } from '@/context/AuthContext';

export const useOneSignal = () => {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const checkSubscriptionStatus = useCallback(async () => {
    if (!user || !isOneSignalSupported()) {
      setIsEnabled(false);
      setIsLoading(false);
      return;
    }

    try {
      await initOneSignal(user.id);
      const enabled = await isOneSignalEnabled();
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
    if (!user || !isOneSignalSupported()) {
      console.warn('[useOneSignal] Cannot subscribe: user or OneSignal not supported');
      return false;
    }

    setIsSubscribing(true);
    try {
      const playerId = await subscribeToPush(user.id);
      
      if (playerId) {
        const { error } = await supabase.functions.invoke('save-onesignal-subscription', {
          body: { player_id: playerId, device_type: 'web' }
        });

        if (error) {
          console.error('[useOneSignal] Error saving subscription:', error);
        } else {
          console.log('[useOneSignal] Subscription saved successfully');
          setIsEnabled(true);
          return true;
        }
      }
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
    subscribe,
    unsubscribe,
    refresh: checkSubscriptionStatus,
  };
};