export const environment = {
  production: false,
  environment: 'development',
  apiUrl: 'https://api.lunarchain.net',
  appUrl: 'https://app.lunarchain.net',
  apiVersion: 'v1',
  // Add other development-specific configurations
  enableDebugLogging: true,
  enableAnalytics: false,
  // Feature flags for development
  features: {
    enableExperimentalFeatures: true,
    enableDebugMode: true
  },
  // Google Maps API configuration
  googleMaps: {
    apiKey: 'YOUR_GOOGLE_MAPS_API_KEY_HERE' // Replace with your actual API key
  },
  firebase: {
    // Add your Firebase configuration here if needed
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  }
}; 
