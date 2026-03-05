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

/**
 * Draws an image onto a canvas at the target size.
 * For maskable icons, adds a colored background with padding.
 */
function createResizedIcon(
  imgSrc: string,
  size: number,
  maskable: boolean,
  bgColor: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Only set crossOrigin for HTTP URLs, not data URIs
    if (imgSrc.startsWith('http')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      if (maskable) {
        // Fill background for maskable (safe zone is inner 80%, so use 10% padding)
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, size, size);
        const padding = size * 0.1;
        const drawSize = size - padding * 2;
        // Fill the safe zone fully — stretch to fit
        ctx.drawImage(img, padding, padding, drawSize, drawSize);
      } else {
        // For "any" purpose, fill the entire canvas
        ctx.drawImage(img, 0, 0, size, size);
      }

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(URL.createObjectURL(blob));
        } else {
          reject(new Error('Failed to create icon blob'));
        }
      }, 'image/png');
    };
    img.onerror = () => {
      // Fallback: return the original src
      resolve(imgSrc);
    };
    img.src = imgSrc;
  });
}

export function useDynamicManifest(tenant: Tenant | null, role?: UserRole) {
  const blobUrlRef = useRef<string | null>(null);
  const iconBlobsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!tenant) return;

    let cancelled = false;

    const startUrl = role ? ROLE_START_URLS[role] : '/';
    const shortName = tenant.appShortName || tenant.name.slice(0, 12);
    const displayName = tenant.appDisplayName || tenant.name;
    const roleSuffix = role ? ` - ${role.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}` : '';
    const bgColor = tenant.backgroundColor || '#ffffff';
    const logoSrc = tenant.logo || '/pwa-icon-512.png';

    async function generateManifest() {
      // Generate properly sized icons
      const [icon192, icon512, maskable512] = await Promise.all([
        createResizedIcon(logoSrc, 192, false, bgColor),
        createResizedIcon(logoSrc, 512, false, bgColor),
        createResizedIcon(logoSrc, 512, true, bgColor),
      ]);

      if (cancelled) {
        [icon192, icon512, maskable512].forEach(u => {
          if (u.startsWith('blob:')) URL.revokeObjectURL(u);
        });
        return;
      }

      // Track icon blobs for cleanup
      iconBlobsRef.current = [icon192, icon512, maskable512].filter(u => u.startsWith('blob:'));

      const icons = [
        { src: icon192, sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: icon512, sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: maskable512, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ];

      const manifest = {
        name: `${displayName}${roleSuffix}`,
        short_name: shortName,
        start_url: startUrl,
        display: 'standalone' as const,
        orientation: 'portrait' as const,
        theme_color: tenant.primaryColor || '#4F46E5',
        background_color: bgColor,
        icons,
      };

      // Clean up previous manifest blob
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
      link.href = url;

      // Also update apple-touch-icon for iOS
      let appleIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
      if (!appleIcon) {
        appleIcon = document.createElement('link');
        appleIcon.rel = 'apple-touch-icon';
        document.head.appendChild(appleIcon);
      }
      appleIcon.href = icon192;
    }

    generateManifest();

    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      iconBlobsRef.current.forEach(u => URL.revokeObjectURL(u));
      iconBlobsRef.current = [];
    };
  }, [tenant, role]);
}
