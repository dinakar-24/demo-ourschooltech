import { useTenant } from '@/contexts/TenantContext';

export function SchoolSplashScreen() {
  const { tenant } = useTenant();

  if (!tenant) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500"
      style={{ backgroundColor: tenant.backgroundColor || '#ffffff' }}
    >
      {/* Splash image or logo */}
      {tenant.splashScreenImageUrl ? (
        <img
          src={tenant.splashScreenImageUrl}
          alt={tenant.name}
          className="w-32 h-32 object-contain mb-6 animate-in fade-in zoom-in duration-500" loading="eager" fetchPriority="high" decoding="sync"
        />
      ) : tenant.logo ? (
        <img
          src={tenant.logo}
          alt={tenant.name}
          className="w-24 h-24 rounded-2xl object-contain mb-6 animate-in fade-in zoom-in duration-500" loading="eager" fetchPriority="high" decoding="sync"
        />
      ) : (
        <div
          className="w-24 h-24 rounded-2xl flex items-center justify-center mb-6 animate-in fade-in zoom-in duration-500"
          style={{ backgroundColor: `${tenant.primaryColor}15` }}
        >
          <span className="text-4xl font-bold" style={{ color: tenant.primaryColor }}>
            {tenant.name.charAt(0)}
          </span>
        </div>
      )}

      {/* School name */}
      <h1
        className="text-xl font-bold mb-2 animate-in fade-in slide-in-from-bottom-2 duration-700"
        style={{ color: tenant.primaryColor }}
      >
        {tenant.appDisplayName || tenant.name}
      </h1>

      {/* Loading spinner */}
      <div className="mt-6">
        <div
          className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: `${tenant.primaryColor}40`, borderTopColor: 'transparent' }}
        />
      </div>
    </div>
  );
}
