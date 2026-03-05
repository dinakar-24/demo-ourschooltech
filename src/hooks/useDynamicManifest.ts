import { useEffect } from 'react';
import { useTenant } from '@/contexts/TenantContext';

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  teacher: 'Teacher',
  parent: 'Parent',
  student: 'Student',
};

export interface SchoolBrandingFallback {
  name?: string;
  logo?: string | null;
  subdomain?: string;
  appDisplayName?: string | null;
  appShortName?: string | null;
  primaryColor?: string;
  backgroundColor?: string;
}

export function useDynamicManifest(currentRole?: string, schoolFallback?: SchoolBrandingFallback) {
  const { tenant, isSubdomain } = useTenant();

  useEffect(() => {
    // Work if we have tenant OR school fallback data
    const hasTenant = isSubdomain && tenant;
    const hasFallback = schoolFallback?.subdomain;
    if (!hasTenant && !hasFallback) return;

    const roleLabel = currentRole ? (roleLabels[currentRole] || currentRole) : '';
    const dashboardPath = currentRole
      ? (currentRole === 'admin' ? '/admin/dashboard' : `/${currentRole}/dashboard`)
      : '/';

    // Resolve branding: tenant first, fallback second
    const subdomain = tenant?.subdomain || schoolFallback?.subdomain || '';
    const subUpper = subdomain.toUpperCase();
    const appName = tenant?.appDisplayName || tenant?.name || schoolFallback?.appDisplayName || schoolFallback?.name || 'School App';
    const shortNameBase = tenant?.appShortName || schoolFallback?.appShortName || subUpper;
    const logo = tenant?.logo || schoolFallback?.logo || null;
    const themeColor = tenant?.primaryColor || schoolFallback?.primaryColor || '#0F766E';
    const bgColor = tenant?.backgroundColor || schoolFallback?.backgroundColor || '#ffffff';

    // Role-specific naming: "SSE Admin", "SSE Parent"
    const name = roleLabel ? `${appName} - ${roleLabel}` : appName;
    const shortName = roleLabel ? `${subUpper} ${roleLabel}` : shortNameBase;

    // Build icons — split 'any' and 'maskable' to prevent cropping
    const icons = logo
      ? [
          { src: logo, sizes: '192x192', type: 'image/png', purpose: 'any' as const },
          { src: logo, sizes: '512x512', type: 'image/png', purpose: 'any' as const },
          { src: logo, sizes: '192x192', type: 'image/png', purpose: 'maskable' as const },
        ]
      : [
          { src: '/favicon.png', sizes: '192x192', type: 'image/png', purpose: 'any' as const },
          { src: '/favicon.png', sizes: '512x512', type: 'image/png', purpose: 'any' as const },
        ];

    const manifest = {
      id: `/${subdomain}/${currentRole || 'app'}`,
      name,
      short_name: shortName,
      description: `${appName}${roleLabel ? ` ${roleLabel} Portal` : ''}`,
      theme_color: themeColor,
      background_color: bgColor,
      display: 'standalone' as const,
      display_override: ['standalone', 'minimal-ui'],
      orientation: 'portrait' as const,
      start_url: dashboardPath,
      scope: '/',
      icons,
      categories: ['education'],
    };

    const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const existing = document.querySelector('link[rel="manifest"]');
    if (existing) existing.remove();

    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = url;
    document.head.appendChild(link);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [tenant, isSubdomain, currentRole, schoolFallback?.subdomain, schoolFallback?.logo, schoolFallback?.name]);
}
