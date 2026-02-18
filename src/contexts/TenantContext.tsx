import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

const BASE_DOMAIN = 'ourschooltech.com';

export interface Tenant {
  schoolId: string;
  name: string;
  code: string;
  logo: string | null;
  primaryColor: string;
  accentColor: string;
}

interface TenantContextType {
  tenant: Tenant | null;
  isSubdomain: boolean;
  isLoading: boolean;
  tenantError: string | null;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  isSubdomain: false,
  isLoading: true,
  tenantError: null,
});

function extractSubdomain(hostname: string): string | null {
  // localhost or IP — no subdomain
  if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return null;
  }

  // Check for .ourschooltech.com suffix
  if (hostname.endsWith(`.${BASE_DOMAIN}`)) {
    const sub = hostname.replace(`.${BASE_DOMAIN}`, '');
    // Ignore 'www', 'app', 'admin' as they're not school subdomains
    if (sub && !['www', 'app', 'admin'].includes(sub)) {
      return sub;
    }
  }

  // Preview/staging URLs (lovable.app) — no subdomain logic
  return null;
}

function applyTenantBranding(tenant: Tenant) {
  const root = document.documentElement;

  // Convert hex to HSL for CSS variable compatibility
  const hexToHsl = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
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
  };

  if (tenant.primaryColor) {
    try {
      const hsl = hexToHsl(tenant.primaryColor);
      root.style.setProperty('--primary', hsl);
      root.style.setProperty('--sidebar-primary', hsl);
    } catch (e) {
      console.warn('Invalid primary color:', tenant.primaryColor);
    }
  }

  if (tenant.accentColor) {
    try {
      const hsl = hexToHsl(tenant.accentColor);
      root.style.setProperty('--accent', hsl);
    } catch (e) {
      console.warn('Invalid accent color:', tenant.accentColor);
    }
  }
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isSubdomain, setIsSubdomain] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tenantError, setTenantError] = useState<string | null>(null);

  useEffect(() => {
    const subdomain = extractSubdomain(window.location.hostname);

    if (!subdomain) {
      setIsSubdomain(false);
      setIsLoading(false);
      return;
    }

    setIsSubdomain(true);

    const resolveTenant = async () => {
      try {
        const { data, error } = await supabase.rpc('get_school_by_code', {
          _code: subdomain,
        });

        if (error || !data) {
          setTenantError(`School "${subdomain}" not found or inactive.`);
          setIsLoading(false);
          return;
        }

        const school = data as unknown as {
          id: string;
          name: string;
          code: string;
          logo: string | null;
          primary_color: string | null;
          accent_color: string | null;
          is_active: boolean;
        };

        if (!school.is_active) {
          setTenantError(`School "${subdomain}" is currently inactive.`);
          setIsLoading(false);
          return;
        }

        const tenantData: Tenant = {
          schoolId: school.id,
          name: school.name,
          code: school.code,
          logo: school.logo,
          primaryColor: school.primary_color || '#0F766E',
          accentColor: school.accent_color || '#E69500',
        };

        setTenant(tenantData);
        applyTenantBranding(tenantData);
      } catch (err) {
        console.error('Tenant resolution error:', err);
        setTenantError('Failed to resolve school. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    resolveTenant();
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, isSubdomain, isLoading, tenantError }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
