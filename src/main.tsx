import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

// Build version injected at build time
const APP_VERSION = import.meta.env.VITE_APP_VERSION || Date.now().toString();

// Clear outdated service workers and caches on every load
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => {
      reg.update().catch(() => {});
    });
  });

  // Listen for new SW and auto-activate
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

// Clear old caches on startup
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => {
      // Remove any stale workbox/precache entries
      if (name.includes('precache') || name.includes('workbox')) {
        caches.delete(name);
      }
    });
  });
}

// Version check: store version and reload if mismatch detected
const storedVersion = sessionStorage.getItem('app_version');
if (storedVersion && storedVersion !== APP_VERSION) {
  sessionStorage.setItem('app_version', APP_VERSION);
  // Force a hard reload bypassing cache
  window.location.reload();
} else {
  sessionStorage.setItem('app_version', APP_VERSION);
}

createRoot(document.getElementById("root")!).render(<App />);
