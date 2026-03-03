import { createContext, useContext, useState, useEffect, ReactNode } from 'react';


const BASE_DOMAIN = 'ourschooltech.com';

export interface Tenant {
  schoolId: string;
  name: string;
  code: string;
  logo: string | null;
  primaryColor: string;
  accentColor: string;
  secondaryColor: string;
  backgroundColor: string;
  splashScreenImageUrl: string | null;
  appDisplayName: string | null;
  appShortName: string | null;
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
  if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return null;
  }

  if (hostname.endsWith(`.${BASE_DOMAIN}`)) {
    const sub = hostname.replace(`.${BASE_DOMAIN}`, '');
    if (sub && !['www', 'app', 'admin'].includes(sub)) {
      return sub;
    }
  }

  // Preview/staging URLs — no subdomain logic
  return null;
}

function hexToHsl(hex: string): string {
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
}

function applyTenantBranding(tenant: Tenant) {
  const root = document.documentElement;

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

  if (tenant.secondaryColor) {
    try {
      const hsl = hexToHsl(tenant.secondaryColor);
      root.style.setProperty('--secondary', hsl);
    } catch (e) {
      console.warn('Invalid secondary color:', tenant.secondaryColor);
    }
  }

  // Update page title
  if (tenant.appDisplayName || tenant.name) {
    document.title = tenant.appDisplayName || tenant.name;
  }

  // Update favicon if logo exists
  if (tenant.logo) {
    let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = tenant.logo;
  }

  // Update theme-color meta
  if (tenant.primaryColor) {
    let metaTheme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!metaTheme) {
      metaTheme = document.createElement('meta');
      metaTheme.setAttribute('name', 'theme-color');
      document.head.appendChild(metaTheme);
    }
    metaTheme.setAttribute('content', tenant.primaryColor);
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
        // Direct fetch to bypass Supabase client lock contention
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/get_school_by_code`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ _code: subdomain }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeout);

        if (!res.ok) {
          setTenantError(`School "${subdomain}" not found or inactive.`);
          setIsLoading(false);
          return;
        }

        const data = await res.json();

        if (!data) {
          setTenantError(`School "${subdomain}" not found or inactive.`);
          setIsLoading(false);
          return;
        }

        const school = data as {
          id: string;
          name: string;
          code: string;
          logo: string | null;
          primary_color: string | null;
          accent_color: string | null;
          secondary_color: string | null;
          background_color: string | null;
          splash_screen_image_url: string | null;
          app_display_name: string | null;
          app_short_name: string | null;
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
          secondaryColor: school.secondary_color || '#1a1a2e',
          backgroundColor: school.background_color || '#ffffff',
          splashScreenImageUrl: school.splash_screen_image_url,
          appDisplayName: school.app_display_name,
          appShortName: school.app_short_name,
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
