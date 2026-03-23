import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.motycore.app',
  appName: 'MotyCore',
  webDir: '.output/public',
  server: {
    url: 'https://motycore.vercel.app/',  // ← il tuo URL Vercel
    cleartext: false
  }
};

export default config;
