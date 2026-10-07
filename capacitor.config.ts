import type { CapacitorConfig } from '@capacitor/cli';
const config:CapacitorConfig={appId:'mg.soratro.app',appName:'SORATRO',webDir:'dist',server:{androidScheme:'https'},plugins:{SplashScreen:{launchShowDuration:800,backgroundColor:'#17151C',androidScaleType:'CENTER_INSIDE',showSpinner:false},StatusBar:{backgroundColor:'#17151C',style:'LIGHT'}}};
export default config;
