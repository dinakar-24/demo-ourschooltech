import { useEffect, createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * ⚠️ NOT MIGRATED — BLOCKED on two separate gaps.
 *
 * 1. Platform theme — reads the `system_settings` table (key = 'theme').
 *    There is no SystemSettings Prisma model and no endpoint. Nothing to
 *    migrate to. (Also blocks hooks/useSystemSettings.ts.)
 *
 * 2. School theme — GET /api/auth/me already returns the user's school with
 *    `primaryColor`, so half of this could move today. But `accentColor` was
 *    only just added to the School model and is not yet exposed by /auth/me,
 *    and migrating primary alone would apply a school's primary against the
 *    platform's accent. Deferred so both move together.
 *
 * Note: TenantContext.applyTenantBranding() also writes --primary/--accent,
 * from the (now Express-backed) subdomain resolve. On a subdomain both run and
 * whichever resolves last wins. Worth reconciling when this file migrates.
 */

interface ThemeColors {
  primary_color: string;
  accent_color: string;
}

const ThemeContext = createContext<ThemeColors | null>(null);
export const useThemeColors = () => useContext(ThemeContext);

function hexToHSL(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function darken(hex: string, amount: number): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  const r = Math.max(0, parseInt(result[1], 16) - amount);
  const g = Math.max(0, parseInt(result[2], 16) - amount);
  const b = Math.max(0, parseInt(result[3], 16) - amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function lighten(hex: string, amount: number): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  const r = Math.min(255, parseInt(result[1], 16) + amount);
  const g = Math.min(255, parseInt(result[2], 16) + amount);
  const b = Math.min(255, parseInt(result[3], 16) + amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function applyTheme(primary: string, accent: string) {
  const root = document.documentElement;
  const primaryHSL = hexToHSL(primary);
  const accentHSL = hexToHSL(accent);

  if (primaryHSL) {
    root.style.setProperty('--primary', primaryHSL);
    const hoverHex = darken(primary, 20);
    const mutedHex = lighten(primary, 200);
    if (hoverHex) root.style.setProperty('--primary-hover', hexToHSL(hoverHex)!);
    if (mutedHex) root.style.setProperty('--primary-muted', hexToHSL(mutedHex)!);
    root.style.setProperty('--ring', primaryHSL);
    const sidebarPrimaryHex = lighten(primary, 40);
    if (sidebarPrimaryHex) root.style.setProperty('--sidebar-primary', hexToHSL(sidebarPrimaryHex)!);
  }

  if (accentHSL) {
    root.style.setProperty('--accent', accentHSL);
    const hoverHex = darken(accent, 20);
    const mutedHex = lighten(accent, 200);
    if (hoverHex) root.style.setProperty('--accent-hover', hexToHSL(hoverHex)!);
    if (mutedHex) root.style.setProperty('--accent-muted', hexToHSL(mutedHex)!);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Fetch platform-level theme (fallback for super admin / no school)
  const { data: platformTheme } = useQuery({
    queryKey: ['system-settings', 'theme-colors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings' as any)
        .select('value')
        .eq('key', 'theme')
        .maybeSingle();
      if (error) throw error;
      return (data as any)?.value as ThemeColors | null;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch the current user's school colors
  const { data: schoolTheme } = useQuery({
    queryKey: ['school-theme-colors'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get user's school_id from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.school_id) return null;

      const { data: school } = await supabase
        .from('schools')
        .select('primary_color, accent_color')
        .eq('id', profile.school_id)
        .maybeSingle();

      if (!school) return null;
      return {
        primary_color: (school as any).primary_color || null,
        accent_color: (school as any).accent_color || null,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  // School colors take priority over platform colors
  const activeTheme: ThemeColors | null = (() => {
    // If user has school colors, use those
    if (schoolTheme?.primary_color && schoolTheme?.accent_color) {
      return schoolTheme as ThemeColors;
    }
    // Fall back to platform theme
    return platformTheme || null;
  })();

  useEffect(() => {
    if (!activeTheme) return;
    applyTheme(activeTheme.primary_color, activeTheme.accent_color);
  }, [activeTheme]);

  return (
    <ThemeContext.Provider value={activeTheme}>
      {children}
    </ThemeContext.Provider>
  );
}
