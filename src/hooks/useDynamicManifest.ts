import { useEffect } from 'react';
import { useTenant } from '@/contexts/TenantContext';

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  teacher: 'Teacher',
  parent: 'Parent',
  student: 'Student',
};

export function useDynamicManifest(currentRole?: string) {
  const { tenant, isSubdomain } = useTenant();

  useEffect(() => {
    if (!isSubdomain || !tenant) return;

    const roleLabel = currentRole ? (roleLabels[currentRole] || currentRole) : '';
    const dashboardPath = currentRole
      ? (currentRole === 'admin' ? '/admin/dashboard' : `/${currentRole}/dashboard`)
      : '/';

    const appName = tenant.appDisplayName || tenant.name;
    const shortName = tenant.appShortName || tenant.code.toUpperCase();

    const manifest = {
      name: roleLabel ? `${appName} - ${roleLabel}` : appName,
      short_name: roleLabel ? `${shortName} ${roleLabel}` : shortName,
      description: `${appName}${roleLabel ? ` ${roleLabel} Portal` : ''}`,
      theme_color: tenant.primaryColor,
      background_color: tenant.backgroundColor || '#ffffff',
      display: 'standalone' as const,
      orientation: 'portrait' as const,
      start_url: dashboardPath,
      scope: '/',
      icons: tenant.logo
        ? [
            { src: tenant.logo, sizes: '192x192', type: 'image/png' },
            { src: tenant.logo, sizes: '512x512', type: 'image/png', purpose: 'any maskable' as const },
          ]
        : [
            { src: '/favicon.png', sizes: '192x192', type: 'image/png' },
            { src: '/favicon.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' as const },
          ],
    };

    const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const existing = document.querySelector('link[rel="manifest"]');
    if (existing) existing.remove();

    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = url;
    document.head.appendChild(link);

    // Theme-color is now handled in TenantContext

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [tenant, isSubdomain, currentRole]);
}
