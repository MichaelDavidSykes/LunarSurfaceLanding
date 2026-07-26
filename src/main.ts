import { provideZoneChangeDetection } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

// Suppress Google Maps API warnings globally when no API key is configured
const originalWarn = console.warn;
const originalError = console.error;

const googleMapsWarningMessages = [
  'NoApiKeys',
  'InvalidKey',
  'Geocoding Service',
  'Google Maps JavaScript API warning',
  'Google Maps JavaScript API has been loaded directly without loading=async',
  'You must use an API key to authenticate each request to Google Maps Platform APIs',
  'maps-no-account'
] as const;

const googleMapsErrorMessages = [
  'Geocoding Service',
  'maps-no-account',
  'Google Maps Platform APIs'
] as const;

const isSuppressedGoogleMapsMessage = (
  args: Parameters<typeof console.warn>,
  messages: readonly string[]
): boolean => {
  const [message] = args;
  return typeof message === 'string' && messages.some(fragment => message.includes(fragment));
};

console.warn = function(...args) {
  if (isSuppressedGoogleMapsMessage(args, googleMapsWarningMessages)) {
    return; // Suppress these specific warnings
  }
  originalWarn.apply(console, args);
};

console.error = function(...args) {
  if (isSuppressedGoogleMapsMessage(args, googleMapsErrorMessages)) {
    return; // Suppress these specific errors
  }
  originalError.apply(console, args);
};

platformBrowserDynamic().bootstrapModule(AppModule, {
  applicationProviders: [provideZoneChangeDetection()],
})
  .catch(err => console.error(err));
