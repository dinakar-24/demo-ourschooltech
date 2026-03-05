import { useEffect, useRef } from 'react';
import { useTenant } from '@/contexts/TenantContext';

const roleLabels: Record<string, string> = {
  super_admin: 'SuperAdmin',
  admin: 'Admin',
  school_admin: 'Admin',
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
  const cleanupRef = useRef<string | null>(null);

  useEffect(() => {
    // Work if we have tenant OR school fallback data OR super_admin role
    const hasTenant = isSubdomain && tenant;
    const hasFallback = schoolFallback?.subdomain;
    const isSuperAdmin = currentRole === 'super_admin';
    if (!hasTenant && !hasFallback && !isSuperAdmin) return;

    const roleLabel = currentRole ? (roleLabels[currentRole] || currentRole) : '';
    const dashboardPath = currentRole
      ? (currentRole === 'admin' || currentRole === 'school_admin'
        ? '/admin/dashboard'
        : currentRole === 'super_admin'
          ? '/super-admin/dashboard'
          : `/${currentRole}/dashboard`)
      : '/';

    // Resolve branding: tenant first, fallback second
    const subdomain = tenant?.subdomain || schoolFallback?.subdomain || '';
    const subUpper = subdomain.toUpperCase();
    const appName = tenant?.appDisplayName || tenant?.name || schoolFallback?.appDisplayName || schoolFallback?.name || 'School App';
    const shortNameBase = tenant?.appShortName || schoolFallback?.appShortName || subUpper;
    const logo = tenant?.logo || schoolFallback?.logo || null;
    const themeColor = tenant?.primaryColor || schoolFallback?.primaryColor || '#0F766E';
    const bgColor = tenant?.backgroundColor || schoolFallback?.backgroundColor || '#ffffff';

    // Role-specific naming with hyphen: "SSE-Admin", "SSE-Parent"
    const name = isSuperAdmin
      ? 'OST Super Admin'
      : roleLabel ? `${appName} - ${roleLabel}` : appName;
    const shortName = isSuperAdmin
      ? 'OST-SuperAdmin'
      : roleLabel ? `${subUpper}-${roleLabel}` : shortNameBase;

    // Generate maskable icon with safe-zone padding using canvas
    const generateMaskableIcon = (logoUrl: string, bg: string, size: number): Promise<string> => {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        // Fill background
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, size, size);
        // Draw logo in safe zone (40% padding on each side = 60% icon area centered)
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const padding = size * 0.2;
          const iconSize = size - padding * 2;
          ctx.drawImage(img, padding, padding, iconSize, iconSize);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(logoUrl); // fallback to raw logo
        img.src = logoUrl;
      });
    };

    const buildManifest = async () => {
      let maskableIconUrl: string | null = null;
      if (logo) {
        try {
          maskableIconUrl = await generateMaskableIcon(logo, bgColor, 512);
        } catch { maskableIconUrl = null; }
      }

      const icons = logo
        ? [
            { src: logo, sizes: '192x192', type: 'image/png', purpose: 'any' as const },
            { src: logo, sizes: '512x512', type: 'image/png', purpose: 'any' as const },
            { src: maskableIconUrl || logo, sizes: '512x512', type: 'image/png', purpose: 'maskable' as const },
          ]
        : [
            { src: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' as const },
            { src: '/pwa-icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' as const },
            { src: '/favicon.png', sizes: '192x192', type: 'image/png', purpose: 'any' as const },
          ];

      const manifest = {
        id: `/${subdomain || 'ost'}/${currentRole || 'app'}`,
        name,
        short_name: shortName,
        description: `${isSuperAdmin ? 'OST' : appName}${roleLabel ? ` ${roleLabel} Portal` : ''}`,
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
      const manifestUrl = URL.createObjectURL(blob);

      const existing = document.querySelector('link[rel="manifest"]');
      if (existing) existing.remove();

      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = manifestUrl;
      document.head.appendChild(link);

      // Store URL for cleanup
      cleanupRef.current = manifestUrl;
    };

    buildManifest();

    return () => {
      if (cleanupRef.current) {
        URL.revokeObjectURL(cleanupRef.current);
      }
    };
  }, [tenant, isSubdomain, currentRole, schoolFallback?.subdomain, schoolFallback?.logo, schoolFallback?.name]);
}
