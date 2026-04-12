export const environment = {
    production: false,
    environment: 'local',
    apiUrl: 'http://localhost:8000',
    apiVersion: 'v1',
    // Add other local-specific configurations
    enableDebugLogging: true,
    enableAnalytics: false,
    // Feature flags for local environment
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
//# sourceMappingURL=environment.local.js.map