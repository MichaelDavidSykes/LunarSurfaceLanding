# Google Maps API Setup for LunarSurface

## Overview
The World Map in the Geographical section requires a Google Maps API key to function properly. This document explains how to set up the API key.

## Prerequisites
- A Google Cloud Platform account
- A project with billing enabled

## Step-by-Step Setup

### 1. Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable billing for the project (required for API usage)

### 2. Enable Required APIs
1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for and enable the following APIs:
   - **Maps JavaScript API**
   - **Geocoding API** (if needed for additional functionality)

### 3. Create API Key
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key

### 4. Configure API Key Restrictions (Recommended)
1. Click on the created API key to edit it
2. Under "Application restrictions", select "HTTP referrers (web sites)"
3. Add your domain(s) to the allowed referrers:
   - For development: `http://localhost:4200/*`
   - For production: `https://yourdomain.com/*`
4. Under "API restrictions", select "Restrict key"
5. Select the APIs you enabled in step 2
6. Click "Save"

### 5. Update Environment Configuration
1. Open `src/environments/environment.ts`
2. Replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` with your actual API key
3. Open `src/environments/environment.prod.ts`
4. Replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` with your actual API key

### 6. Test the Implementation
1. Start your development server: `ng serve`
2. Navigate to the user home page
3. Check the browser console for any API key related warnings
4. Verify that the World Map displays correctly

## Troubleshooting

### Common Issues

1. **"You must use an API key to authenticate each request"**
   - Ensure the API key is properly configured in the environment files
   - Check that the API key is valid and not restricted incorrectly

2. **"Failed to find regions_div element after multiple attempts"**
   - This usually means the map data hasn't loaded yet
   - Check that your analytics API is returning location data
   - Verify that the Google Charts library is loading properly

3. **Map not displaying**
   - Check browser console for JavaScript errors
   - Verify that the required APIs are enabled in Google Cloud Console
   - Ensure billing is enabled for your Google Cloud project

### API Key Security Best Practices

1. **Never commit API keys to version control**
   - Use environment variables for production deployments
   - Consider using a secrets management service

2. **Set up proper restrictions**
   - Limit API key usage to specific domains
   - Restrict API key to only the required APIs
   - Set up usage quotas to prevent abuse

3. **Monitor usage**
   - Regularly check API usage in Google Cloud Console
   - Set up alerts for unusual usage patterns

## Cost Considerations

- Google Maps APIs have usage-based pricing
- The Geochart component typically has minimal usage
- Monitor your usage in the Google Cloud Console
- Consider setting up billing alerts

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your API key configuration
3. Check Google Cloud Console for API usage and errors
4. Review the [Google Maps JavaScript API documentation](https://developers.google.com/maps/documentation/javascript/overview) 