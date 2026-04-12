# Environment Configuration Guide

This guide explains how to switch between different environments (Development, Qu, Production) in the LunarSurface application.

## Environment Files

The application uses Angular's built-in environment configuration system:

- `src/environments/environment.ts` - Development environment (default)
- `src/environments/environment.local.ts` - Local environment (localhost)
- `src/environments/environment.prod.ts` - Production environment

## Quick Start Commands

### Development Environment
```bash
npm run start:dev
# or
ng serve --configuration=development
```



### Local Environment
```bash
npm run start:local
# or
ng serve --configuration=local
```

### Production Environment
```bash
npm run start:prod
# or
ng serve --configuration=production
```

## Build Commands

### Development Build
```bash
npm run build:dev
```



### Local Build
```bash
npm run build:local
```

### Production Build
```bash
npm run build:prod
```

## Environment Configuration

Each environment file contains:

```typescript
export const environment = {
  production: boolean,
  environment: string, // 'development', 'local', or 'production'
  apiUrl: string,      // Base API URL
  apiVersion: string,  // API version
  enableDebugLogging: boolean,
  enableAnalytics: boolean,
  features: {
    enableExperimentalFeatures: boolean,
    enableDebugMode: boolean
  }
};
```

## Using Environment Variables in Components

### Import Environment
```typescript
import { environment } from '../environments/environment';
```

### Use Environment Variables
```typescript
console.log('Current environment:', environment.environment);
console.log('API URL:', environment.apiUrl);
```

### Using the API Service
```typescript
import { ApiService } from '../shared/services/api.service';

constructor(private apiService: ApiService) {}

// The service automatically uses the correct environment
this.apiService.get('/alerts/client/alerts').subscribe(...);
```

## Best Practices

1. **Never hardcode URLs** - Always use environment variables
2. **Use the ApiService** - For consistent API calls across environments
3. **Test all environments** - Before deploying, test in each environment
4. **Environment-specific features** - Use feature flags for environment-specific functionality
5. **Logging** - Use `enableDebugLogging` for environment-appropriate logging

## Environment-Specific Settings

### Local
- Debug logging enabled
- Analytics disabled
- Experimental features enabled
- Source maps enabled
- API URL: `http://localhost:8000`

### Development
- Debug logging enabled
- Analytics disabled
- Experimental features enabled
- Source maps enabled



### Production
- Debug logging disabled
- Analytics enabled
- Experimental features disabled
- Optimized builds

## Troubleshooting

### Environment not switching
- Clear Angular cache: `ng cache clean`
- Restart the development server
- Check that the configuration name matches exactly

### API calls failing
- Verify the API URL in the environment file
- Check network connectivity
- Ensure the API endpoint exists in the target environment

### Build errors
- Check that all environment files exist
- Verify TypeScript compilation
- Check for missing dependencies 