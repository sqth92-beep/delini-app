import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.delini.app',
  appName: 'delini-app',
  webDir: 'dist', // تأكد أن هذا المجلد هو الذي ينتج عن عملية الـ build
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
