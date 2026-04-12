import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

// Suppress Google Maps API warnings globally when no API key is configured
const originalWarn = console.warn;
const originalError = console.error;

console.warn = function(...args) {
  if (args[0] && typeof args[0] === 'string' && 
      (args[0].includes('NoApiKeys') || 
       args[0].includes('InvalidKey') || 
       args[0].includes('Geocoding Service') ||
       args[0].includes('Google Maps JavaScript API warning') ||
       args[0].includes('Google Maps JavaScript API has been loaded directly without loading=async') ||
       args[0].includes('You must use an API key to authenticate each request to Google Maps Platform APIs') ||
       args[0].includes('maps-no-account'))) {
    return; // Suppress these specific warnings
  }
  originalWarn.apply(console, args);
};

console.error = function(...args) {
  if (args[0] && typeof args[0] === 'string' && 
      (args[0].includes('Geocoding Service') ||
       args[0].includes('maps-no-account') ||
       args[0].includes('Google Maps Platform APIs'))) {
    return; // Suppress these specific errors
  }
  originalError.apply(console, args);
};

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));