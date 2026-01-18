import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.delini.app',
  appName: 'Delini',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'https://delini-backend.onrender.com',
      'http://delini-backend.onrender.com',
      'http://localhost',
      'https://localhost',
      'capacitor://localhost',
      'http://192.168.*',
      'http://10.0.*'
    ]
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    },
    CapacitorCookies: {
      enabled: true
    }
  }
};

export default config;
