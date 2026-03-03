import { motion } from 'framer-motion';
import appLogo from '@/assets/logo.png';
import { useTenant } from '@/contexts/TenantContext';

export function AppLoader({ message = "Loading..." }: { message?: string }) {
  // Try to get tenant branding — will be null on main domain or before context loads
  let tenant: { logo: string | null; primaryColor: string; name: string; appDisplayName: string | null; backgroundColor: string } | null = null;
  try {
    const ctx = useTenant();
    if (ctx.tenant) tenant = ctx.tenant;
  } catch {
    // Not wrapped in TenantProvider yet (e.g. index.html shell)
  }

  const logo = tenant?.logo || appLogo;
  const brandColor = tenant?.primaryColor || '#3B82F6';
  const bgColor = tenant ? tenant.backgroundColor : '#0B1120';
  const isDarkBg = !tenant; // default dark, school bg is usually light
  const textColor = isDarkBg ? 'rgba(255,255,255,0.4)' : `${brandColor}99`;
  const subtitleColor = isDarkBg ? 'rgba(255,255,255,0.25)' : `${brandColor}66`;
  const ringColor = isDarkBg ? 'rgba(255,255,255,0.1)' : `${brandColor}20`;
  const dotColor = isDarkBg ? 'rgba(255,255,255,0.4)' : brandColor;
  const glassColor = isDarkBg ? 'rgba(255,255,255,0.06)' : `${brandColor}10`;
  const glassBorder = isDarkBg ? 'rgba(255,255,255,0.08)' : `${brandColor}15`;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: bgColor }}
    >
      {/* Ambient gradient orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/3 w-[300px] h-[300px] rounded-full"
          style={{ background: `radial-gradient(circle, ${brandColor}1A, transparent 70%)` }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/3 w-[250px] h-[250px] rounded-full"
          style={{ background: `radial-gradient(circle, ${brandColor}14, transparent 70%)` }}
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Logo with pulse ring */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="relative">
          {/* Pulsing rings */}
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{ border: `1px solid ${ringColor}` }}
            animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{ border: `1px solid ${ringColor}` }}
            animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
          />

          {/* Logo container */}
          <motion.div
            className="w-16 h-16 rounded-2xl backdrop-blur-md flex items-center justify-center shadow-2xl overflow-hidden"
            style={{ background: glassColor, border: `1px solid ${glassBorder}` }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
          >
            <img src={logo} alt="Loading" className="w-10 h-10 object-contain" />
          </motion.div>
        </div>

        {/* School name (only on subdomain) */}
        {tenant && (
          <motion.p
            className="text-sm font-semibold tracking-wide"
            style={{ color: brandColor }}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {tenant.appDisplayName || tenant.name}
          </motion.p>
        )}

        {/* Animated dots loader */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ background: dotColor }}
              animate={{
                y: [0, -8, 0],
                opacity: [0.4, 1, 0.4],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* Message */}
        <motion.p
          className="text-xs font-medium tracking-wider uppercase"
          style={{ color: subtitleColor }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {message}
        </motion.p>
      </div>
    </div>
  );
}
