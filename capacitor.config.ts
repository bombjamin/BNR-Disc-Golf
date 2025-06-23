
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.barnoneranch.golfscore',
  appName: 'Bar None Ranch Golf',
  webDir: 'client/dist',
  server: {
    androidScheme: 'https'
  },
  ios: {
    scheme: 'Bar None Ranch Golf',
    contentInset: 'automatic'
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#edede9',
      showSpinner: false
    }
  }
};

export default config;
