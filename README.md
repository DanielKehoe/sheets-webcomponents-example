# sheets-webcomponents-example

A web application for managing podcast guest bookings and analyzing podcast information. Built with web components and Google APIs, deployed on Cloudflare.

## Features

- Google OAuth authentication
- Automated Google Sheets creation for lead tracking
- URL content analysis and processing
- Error tracking and display

## Technical Stack

- HTML-standard Web Components using Lit 3.0
- Tailwind CSS for styling
- Google Sheets API
- Cloudflare Workers for authentication and API access

## Prerequisites

1. Google Cloud Project with:
   - OAuth 2.0 Client ID
   - API Key
   - Enabled APIs:
     * Google Sheets API

2. Cloudflare Account with:
   - Workers enabled
   - Domain configured

## Setup

1. Run the Cloudflare `wrangler` utility from the worker folder:
```bash
   cd src/workers/sheets-example/sheets-example
```

It should pick up the TOML configuration file without errors.

2. Configure Cloudflare Worker Secrets:
   ```bash
   wrangler secret put GOOGLE_CLIENT_ID
   wrangler secret put GOOGLE_API_KEY
   ```

3. Deploy Worker:
   ```bash
   wrangler deploy
   ```

4. Test API access

Substitute your domain for `website`.

```bash
   curl https://website/api/config -H "Origin: https://website"
```


## Development

The application consists of four web components in `/assets/scripts/`:

1. `sheets-example`: Main component handling OAuth
2. `greater-errors`: Error display and management
3. `greater-create-sheet`: Google Sheet creation
4. `greater-fetch-analyze`: URL content analysis

A Cloudflare worker script manages API calls and OAuth authentication in `/src/workers/`:

1. `worker.js`

This file is referenced in `src/workers/sheets-example/sheets-example/wrangler.toml`.

## Documentation

There's a CHANGELOG as well as documentation in the `docs` directory.

```
.
├── CHANGELOG.md
├── README.md
├── docs
│   ├── deployment.md
│   ├── development-setup.md
│   ├── directory_structure.md
│   ├── engineering-decisions.md
│   └── functional_specifications.md
```

## Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)
- Mobile browsers supported

## Security

- All API calls routed through Cloudflare Worker
- OAuth tokens stored in memory only
- CORS restricted to domain
- HTTPS required
- Content Security Policy implemented

## License

Proprietary software. All rights reserved.
No license granted for use, modification, or distribution.
