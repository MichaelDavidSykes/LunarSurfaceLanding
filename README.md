# LunarChain Landing

Separate marketing and documentation frontend for LunarChain.

This repo was split out from the main `LunarSurface` frontend so the public landing page can be deployed independently from the authenticated product application.

## Scope

- Public landing page
- Public API documentation pages
- Shared marketing UI components used by the landing page

## Not In Scope

- Authenticated product routes
- User dashboard, reports, explorer, targets, and client workflows
- Product login implementation

The landing site links login traffic back to the main application URL configured in `src/environments/environment*.ts`.

## Local Development

```bash
npm install
npm run start
```

## Production Build

```bash
npm run build:prod
```

## Firebase Hosting

This repo deploys to the dedicated Firebase Hosting site:

- `lunarchain-landing`
- URL: `https://lunarchain-landing.web.app`

Deploy with:

```bash
npm run deploy:prod
```

## Next Cleanup

- Remove copied product-only files that are no longer needed
- Point login CTA to `app.lunarchain.net` after the product split is complete
- Add custom domain mapping for the dedicated landing site
