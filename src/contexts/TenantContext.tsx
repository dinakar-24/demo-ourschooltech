import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

// ─────────────────────────────────────────────────────────────────────────
// Migrated from Supabase (`get_school_by_code` RPC) to the Express backend.
//
// Deliberately uses a bare axios call rather than the shared `api` instance
// from '@/lib/api': this runs BEFORE login, and `api`'s response interceptor
// treats a 401 as an expired session. The resolve endpoint is public
// (routes/schools.js mounts no `authenticate` middleware), so there is no
// token to attach and no refresh flow to trigger.
// ─────────────────────────────────────────────────────────────────────────

const BASE_DOMAIN = 'ourschooltech.com';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

export interface Tenant {
  schoolId: string;
  name: string;
  code: string;
  subdomain: string;
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

/** Raw payload from GET /api/schools/resolve/subdomain/:subdomain */
interface RawSchool {
  id: string;
  name: string;
  subdomain: string;
  schoolCode: string;
  logo: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  secondaryColor: string | null;
  backgroundColor: string | null;
  splashScreenImageUrl: string | null;
  appDisplayName: string | null;
  appShortName: string | null;
  isActive: boolean;
  isSuspended: boolean;
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

function setMeta(nameOrProperty: string, content: string) {
  const isOg = nameOrProperty.startsWith('og:') || nameOrProperty.startsWith('twitter:');
  const selector = isOg
    ? `meta[property="${nameOrProperty}"], meta[name="${nameOrProperty}"]`
    : `meta[name="${nameOrProperty}"]`;

  let el = document.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    if (isOg) {
      el.setAttribute('property', nameOrProperty);
    }
    el.setAttribute('name', nameOrProperty);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
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

  // Dynamic OG & Twitter meta tags for social previews
  const schoolName = tenant.appDisplayName || tenant.name;
  const schoolUrl = `https://${tenant.subdomain}.ourschooltech.com`;
  const description = `${schoolName} - School Portal`;
  const image = tenant.logo || `${schoolUrl}/favicon.png`;

  setMeta('og:title', schoolName);
  setMeta('og:description', description);
  setMeta('og:image', image);
  setMeta('og:url', schoolUrl);
  setMeta('og:type', 'website');
  setMeta('og:site_name', schoolName);

  setMeta('twitter:title', schoolName);
  setMeta('twitter:description', description);
  setMeta('twitter:image', image);
  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:site', '');

  setMeta('author', schoolName);
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
        // The endpoint rejects suspended/inactive schools with a 403 and a
        // `code`, so the is_active check that used to live here is handled by
        // the catch block below.
        const { data } = await axios.get<{ school: RawSchool }>(
          `${API_BASE_URL}/schools/resolve/subdomain/${encodeURIComponent(subdomain)}`,
        );
        const school = data.school;

        const tenantData: Tenant = {
          schoolId: school.id,
          name: school.name,
          code: school.schoolCode,
          subdomain: school.subdomain || school.schoolCode.toLowerCase(),
          logo: school.logo,
          primaryColor: school.primaryColor || '#0F766E',
          accentColor: school.accentColor || '#E69500',
          secondaryColor: school.secondaryColor || '#1a1a2e',
          backgroundColor: school.backgroundColor || '#ffffff',
          splashScreenImageUrl: school.splashScreenImageUrl,
          appDisplayName: school.appDisplayName,
          appShortName: school.appShortName,
        };

        setTenant(tenantData);
        applyTenantBranding(tenantData);

        // Cache for pre-React branding on next refresh
        try {
          const payload = JSON.stringify({
            title: tenantData.appDisplayName || tenantData.name,
            logo: tenantData.logo,
            color: tenantData.primaryColor,
          });
          sessionStorage.setItem(`tenant_${subdomain}`, payload);
          localStorage.setItem(`tenant_${subdomain}`, payload);
        } catch (e) { /* quota exceeded — ignore */ }
      } catch (err) {
        // Map the endpoint's status/code onto the tenantError values
        // TenantErrorPage already understands. 404 SCHOOL_NOT_FOUND →
        // 'not_found'; 403 SCHOOL_SUSPENDED / SCHOOL_INACTIVE → 'inactive'
        // (the old RPC path collapsed both into 'inactive' too). Anything
        // else — network failure, 500 — keeps the generic retry message
        // rather than telling the user their school doesn't exist.
        const status = axios.isAxiosError(err) ? err.response?.status : undefined;

        if (status === 404) {
          setTenantError('not_found');
        } else if (status === 403) {
          setTenantError('inactive');
        } else {
          console.error('Tenant resolution error:', err);
          setTenantError('Failed to resolve school. Please try again.');
        }
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
