import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: theme } = useQuery({
    queryKey: ['system-settings', 'theme-colors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings' as any)
        .select('value')
        .eq('key', 'theme')
        .maybeSingle();
      if (error) throw error;
      return (data as any)?.value as { primary_color: string; accent_color: string } | null;
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!theme) return;
    const root = document.documentElement;

    const primaryHSL = hexToHSL(theme.primary_color);
    const accentHSL = hexToHSL(theme.accent_color);

    if (primaryHSL) {
      root.style.setProperty('--primary', primaryHSL);
      const hoverHex = darken(theme.primary_color, 20);
      const mutedHex = lighten(theme.primary_color, 200);
      if (hoverHex) root.style.setProperty('--primary-hover', hexToHSL(hoverHex)!);
      if (mutedHex) root.style.setProperty('--primary-muted', hexToHSL(mutedHex)!);
      root.style.setProperty('--ring', primaryHSL);
      // Sidebar active color
      const sidebarPrimaryHex = lighten(theme.primary_color, 40);
      if (sidebarPrimaryHex) root.style.setProperty('--sidebar-primary', hexToHSL(sidebarPrimaryHex)!);
    }

    if (accentHSL) {
      root.style.setProperty('--accent', accentHSL);
      const hoverHex = darken(theme.accent_color, 20);
      const mutedHex = lighten(theme.accent_color, 200);
      if (hoverHex) root.style.setProperty('--accent-hover', hexToHSL(hoverHex)!);
      if (mutedHex) root.style.setProperty('--accent-muted', hexToHSL(mutedHex)!);
    }
  }, [theme]);

  return <>{children}</>;
}
