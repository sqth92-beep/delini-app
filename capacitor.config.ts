import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.delini.app',
  appName: 'Delini',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'delini-backend.onrender.com'
    ]
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
