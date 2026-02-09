import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/contexts/AuthContext';

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'];
const LAST_ACTIVITY_KEY = 'ost_last_activity';
const CHECK_INTERVAL_MS = 60_000; // check every minute

export function useSessionTimeout(role: UserRole | undefined, onTimeout: () => void) {
  const timeoutMinutesRef = useRef<number | null>(null);

  // Fetch the timeout for the current role from system_settings
  useEffect(() => {
    if (!role) return;

    const fetchTimeout = async () => {
      const { data, error } = await supabase
        .from('system_settings' as any)
        .select('value')
        .eq('key', 'session_security')
        .single();

      if (error || !data) {
        // Fallback defaults (minutes)
        const defaults: Record<string, number> = {
          super_admin: 30, school_admin: 60, teacher: 480, parent: 4320, student: 4320,
        };
        timeoutMinutesRef.current = defaults[role] ?? 60;
        return;
      }

      const settings = (data as any).value;
      const key = `timeout_${role}`;
      timeoutMinutesRef.current = parseInt(settings[key] ?? '60', 10);
    };

    fetchTimeout();
  }, [role]);

  // Track activity
  const recordActivity = useCallback(() => {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  }, []);

  useEffect(() => {
    if (!role) return;

    // Record initial activity
    recordActivity();

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, recordActivity, { passive: true }));

    const interval = setInterval(() => {
      const timeoutMin = timeoutMinutesRef.current;
      if (!timeoutMin) return;

      const lastActivity = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || '0', 10);
      const elapsed = Date.now() - lastActivity;
      const timeoutMs = timeoutMin * 60 * 1000;

      if (elapsed >= timeoutMs) {
        onTimeout();
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, recordActivity));
      clearInterval(interval);
    };
  }, [role, recordActivity, onTimeout]);
}
