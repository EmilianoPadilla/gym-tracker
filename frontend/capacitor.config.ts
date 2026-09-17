import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.emilianopadilla.gymtracker",
  appName: "Gym Tracker",
  webDir: "dist",
  server: {
    // Points the native shell at the already-deployed site, so pushing new
    // code to Vercel updates the app for everyone immediately - no rebuild
    // or reinstall needed except when the iOS free-developer certificate
    // expires (7 days), which is unrelated to the app's content.
    url: "https://gym-tracker.emilianopadilla.com",
    cleartext: false,
  },
};

export default config;
