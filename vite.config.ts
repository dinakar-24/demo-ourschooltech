import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const buildId = Date.now().toString();

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    define: {
      __APP_BUILD_ID__: JSON.stringify(buildId),
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      {
        name: "inject-build-id",
        transformIndexHtml(html) {
          return html.replace(/__APP_BUILD_ID__/g, buildId);
        },
      },
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "favicon.png", "images/ost-logo.png"],
        workbox: {
          navigateFallbackDenylist: [/^\/~oauth/],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "supabase-api",
                expiration: { maxEntries: 50, maxAgeSeconds: 300 },
              },
            },
          ],
        },
        manifest: {
          name: "Our School Tech",
          short_name: "OurSchool",
          description: "Smart School Management for Modern Education",
          start_url: "/",
          display: "standalone",
          orientation: "portrait",
          theme_color: "#0F766E",
          background_color: "#ffffff",
          icons: [
            {
              src: "/pwa-icon-512.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/pwa-icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/pwa-icon-maskable-512.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "maskable",
            },
            {
              src: "/pwa-icon-maskable-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
      }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime"],
    },
    optimizeDeps: {
      include: ["date-fns"],
    },
  };
});