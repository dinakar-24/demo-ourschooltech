/**
 * Lightweight device fingerprint generator.
 * Produces a stable-ish identifier per browser/device without external libraries.
 * NOT meant for tracking — used only for per-device OTP rate limiting.
 */

let cachedId: string | null = null;
const STORAGE_KEY = 'app_device_id';

function generateFingerprint(): string {
  const nav = navigator;
  const screen = window.screen;

  const components = [
    nav.userAgent,
    nav.language,
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    nav.hardwareConcurrency?.toString() ?? '',
    (nav as any).deviceMemory?.toString() ?? '',
    nav.maxTouchPoints?.toString() ?? '',
    nav.platform ?? '',
  ];

  return simpleHash(components.join('|'));
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  // Combine with a random component stored in localStorage for uniqueness
  const random = getOrCreateRandom();
  return `${Math.abs(hash).toString(36)}-${random}`;
}

function getOrCreateRandom(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    const random = crypto.randomUUID().slice(0, 8);
    localStorage.setItem(STORAGE_KEY, random);
    return random;
  } catch {
    // Private browsing or storage unavailable
    return crypto.randomUUID().slice(0, 8);
  }
}

export function getDeviceId(): string {
  if (cachedId) return cachedId;
  cachedId = generateFingerprint();
  return cachedId;
}
