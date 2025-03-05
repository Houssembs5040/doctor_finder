import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.doctorfinder',
  appName: 'Doctor Finder Pro',
  webDir: 'www',
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#3880ff',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'ionic' // Automatically resize content above keyboard
    }
  },
  android: {
    appendUserAgent: 'DoctorFinderApp',
    backgroundColor: '#3880ff'
  }
};

export default config;