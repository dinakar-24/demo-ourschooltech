import { useEffect, useRef } from 'react';
import type { Tenant } from '@/contexts/TenantContext';
import type { UserRole } from '@/contexts/AuthContext';

const ROLE_START_URLS: Record<UserRole, string> = {
  super_admin: '/super-admin/dashboard',
  school_admin: '/admin/dashboard',
  teacher: '/teacher/dashboard',
  parent: '/parent/dashboard',
  student: '/student/dashboard',
};

export function useDynamicManifest(tenant: Tenant | null, role?: UserRole) {
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!tenant) return;

    const startUrl = role ? ROLE_START_URLS[role] : '/';
    const shortName = tenant.appShortName || tenant.name.slice(0, 12);
    const displayName = tenant.appDisplayName || tenant.name;
    const roleSuffix = role ? ` - ${role.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}` : '';

    const icons: Array<{ src: string; sizes: string; type: string; purpose?: string }> = [];
    if (tenant.logo) {
      icons.push(
        { src: tenant.logo, sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: tenant.logo, sizes: '512x512', type: 'image/png', purpose: 'any' },
      );
    } else {
      icons.push(
        { src: '/favicon.png', sizes: '192x192', type: 'image/png' },
        { src: '/favicon.png', sizes: '512x512', type: 'image/png' },
      );
    }

    const manifest = {
      name: `${displayName}${roleSuffix}`,
      short_name: shortName,
      start_url: startUrl,
      display: 'standalone' as const,
      orientation: 'portrait' as const,
      theme_color: tenant.primaryColor || '#4F46E5',
      background_color: tenant.backgroundColor || '#ffffff',
      icons,
    };

    // Clean up previous blob
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }

    const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
    const url = URL.createObjectURL(blob);
    blobUrlRef.current = url;

    // Inject or update <link rel="manifest">
    let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    // Only override with blob if tenant has meaningful branding
    if (tenant.logo || tenant.primaryColor) {
      link.href = url;
    }

    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [tenant, role]);
}
