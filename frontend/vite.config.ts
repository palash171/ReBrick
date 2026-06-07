import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Keep the main application bundle light and split the heavy 3D viewer stack
        // into separate cacheable chunks.
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          "three-core": ["three"],
          "three-react": ["@react-three/fiber"],
          "three-drei": ["@react-three/drei"],
        },
      },
    },
  },
});
