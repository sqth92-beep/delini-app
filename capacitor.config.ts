import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.delini.app',
  appName: 'Delini',
  webDir: 'dist/public',
  backgroundColor: '#ffffff',
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    useLegacyBridge: false,
    buildOptions: {
      keystorePath: '',
      keystoreAlias: '',
      keystorePassword: '',
      keystoreAliasPassword: ''
    }
  },
  ios: {
    scheme: 'App',
    scrollEnabled: false,
    prefersStatusBarHidden: true,
    contentInset: 'automatic'
  },
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'delini.app',
    allowNavigation: [
      'https://delini-backend.onrender.com',
      'http://delini-backend.onrender.com',
      'http://localhost',
      'https://localhost',
      'capacitor://localhost',
      'http://192.168.*',
      'http://10.0.*'
    ],
    cleartext: true
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    },
    CapacitorCookies: {
      enabled: true
    },
    OneSignal: {
      appId: 'd4d5d6d7-eece-42c5-b891-94560d5ad7e3',
      promptOptions: {
        slidedown: {
          enabled: true,
          autoPrompt: true,
          timeDelay: 20,
          pageViews: 1
        }
      }
    },
    Geolocation: {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      androidProvider: 'auto',
      iosProvider: 'auto',
      backgroundMessage: 'يستخدم التطبيق موقعك لتحديد المحلات القريبة',
      permissionMessages: {
        android: {
          alwaysAndWhenInUse: '$(PRODUCT_NAME) يحتاج إلى الوصول لموقعك حتى عندما يكون التطبيق مغلقاً',
          whenInUse: '$(PRODUCT_NAME) يحتاج إلى الوصول لموقعك لتحديد المحلات القريبة'
        },
        ios: {
          alwaysAndWhenInUse: '$(PRODUCT_NAME) يحتاج إلى الوصول لموقعك حتى عندما يكون التطبيق مغلقاً',
          whenInUse: '$(PRODUCT_NAME) يحتاج إلى الوصول لموقعك لتحديد المحلات القريبة'
        }
      }
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_onesignal_default',
      iconColor: '#007AFF',
      sound: 'onesignal_default'
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
