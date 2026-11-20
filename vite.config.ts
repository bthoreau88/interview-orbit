import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Local API (api/InterviewOrbit.Api, http profile). Same-origin /api keeps the browser free of CORS setup.
  server: { proxy: { "/api": "http://localhost:5110" } },
  preview: { proxy: { "/api": "http://localhost:5110" } },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "jsdom",
  },
});
