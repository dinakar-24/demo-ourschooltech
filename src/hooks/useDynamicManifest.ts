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
    if (!isSubdomain || !tenant || !currentRole) return;

    const roleLabel = roleLabels[currentRole] || currentRole;
    const dashboardPath = currentRole === 'admin' ? '/admin/dashboard' : `/${currentRole}/dashboard`;

    const manifest = {
      name: `${tenant.name} - ${roleLabel}`,
      short_name: `${tenant.code.toUpperCase()} ${roleLabel}`,
      description: `${tenant.name} ${roleLabel} Portal`,
      theme_color: tenant.primaryColor,
      background_color: '#F8FAFC',
      display: 'standalone' as const,
      orientation: 'portrait' as const,
      start_url: dashboardPath,
      scope: `/${currentRole}`,
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

    // Remove existing manifest link
    const existing = document.querySelector('link[rel="manifest"]');
    if (existing) {
      existing.remove();
    }

    // Add new manifest link
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = url;
    document.head.appendChild(link);

    // Also update theme-color meta tag
    let metaTheme = document.querySelector('meta[name="theme-color"]');
    if (!metaTheme) {
      metaTheme = document.createElement('meta');
      metaTheme.setAttribute('name', 'theme-color');
      document.head.appendChild(metaTheme);
    }
    metaTheme.setAttribute('content', tenant.primaryColor);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [tenant, isSubdomain, currentRole]);
}
