import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// VAPID public key - safe to be in frontend code (publishable)
const VAPID_PUBLIC_KEY = 'BHKzZGbgn4i6IrcE8ayRzwAb8KKaJgovLxKrWCg4M-W5-YnHXQsfDtpm-Hn5TsLl-pzi7Ep1VzcpFY9PYIHSOFw';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window);
  }, []);

  // Check existing subscription on mount
  useEffect(() => {
    if (!isSupported || !user?.id) return;
    
    navigator.serviceWorker.ready.then(async (registration: any) => {
      const subscription = await registration.pushManager?.getSubscription();
      setIsSubscribed(!!subscription);
    }).catch(() => {});
  }, [isSupported, user?.id]);

  const subscribe = useCallback(async () => {
    if (!isSupported || !user?.id || !VAPID_PUBLIC_KEY) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') return false;

      const registration: any = await navigator.serviceWorker.ready;
      
      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      if (!subscription) return false;

      const subJson = subscription.toJSON();
      
      // Save to database
      const { error } = await supabase.from('push_subscriptions').upsert(
        {
          user_id: user.id,
          school_id: user.schoolId || null,
          endpoint: subJson.endpoint!,
          p256dh: subJson.keys!.p256dh!,
          auth: subJson.keys!.auth!,
          device_info: navigator.userAgent.slice(0, 200),
        },
        { onConflict: 'user_id,endpoint' }
      );

      if (error) {
        console.error('Failed to save push subscription:', error);
        return false;
      }

      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error('Push subscription failed:', err);
      return false;
    }
  }, [isSupported, user]);

  return { permission, isSubscribed, isSupported, subscribe };
}
