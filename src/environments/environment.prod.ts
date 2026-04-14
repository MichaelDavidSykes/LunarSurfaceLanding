export const environment = {
  production: true,
  environment: 'production',
  apiUrl: 'https://api.lunarchain.net',
  appUrl: 'https://app.lunarchain.net',
  apiVersion: 'v1',
  // Add other production-specific configurations
  enableDebugLogging: false,
  enableAnalytics: true,
  // Feature flags for production
  features: {
    enableExperimentalFeatures: false,
    enableDebugMode: false
  },
  // Google Maps API configuration
  googleMaps: {
    apiKey: 'YOUR_GOOGLE_MAPS_API_KEY_HERE' // Replace with your actual API key
  },
  firebase: {
    // Add your production Firebase configuration here if needed
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  }
}; 
