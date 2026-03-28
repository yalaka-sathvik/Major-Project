import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  resolve: {
    alias: {
      stream: "stream-browserify",
      crypto: "crypto-browserify",
      buffer: "buffer",
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      '/register': 'http://localhost:9000',
      '/verify-otp': 'http://localhost:9000',
      '/resend-otp': 'http://localhost:9000',
      '/login': 'http://localhost:9000',
      '/auth': 'http://localhost:9000',
      '/update-profile': 'http://localhost:9000',
      '/delete-profile': 'http://localhost:9000',
      '/history': 'http://localhost:9000',
      '/past-meeting': 'http://localhost:9000',
      '/check-meeting': 'http://localhost:9000',
      '/meeting': 'http://localhost:9000',
      '/uploads': 'http://localhost:9000',
    }
  }
});
