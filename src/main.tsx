import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

// Service worker: auto-update and reload on new version
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => reg.update().catch(() => {}));
  });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

// Clear stale workbox/precache entries on startup
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => {
      if (name.includes('precache') || name.includes('workbox')) {
        caches.delete(name);
      }
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
