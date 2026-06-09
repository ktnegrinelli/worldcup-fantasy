import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "World Cup of Freedom",
        short_name: "World Cup",
        description: "World Cup Fantasy League",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#070b16",
        theme_color: "#070b16",
        icons: [
          {
            src: "/192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          }
        ]
      }
    })
  ]
});