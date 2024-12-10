# Deployment Guide

This document outlines the process for deploying the application to Cloudflare. It covers the deployment steps, environment configuration, and verification procedures to ensure a successful production deployment.

## Prerequisites

- Cloudflare account with Workers enabled
- Configured domai in Cloudflare
- Wrangler CLI installed and authenticated
- Valid Google Cloud Platform credentials

## Environment Configuration

1. Configure Cloudflare Worker Secrets:
   ```bash
   wrangler secret put GOOGLE_CLIENT_ID
   wrangler secret put GOOGLE_API_KEY
   ```

2. Update Google Cloud Platform settings:
   - Add production domain to authorized JavaScript origins
   - Configure OAuth consent screen for production
   - Update API key restrictions for production domain

## Deployment Steps

1. Navigate to the worker directory:
   ```bash
   cd ~/workspace/greater-agency/src/workers/sheets-example/sheets-example
   ```

2. Validate configuration:
   ```bash
   wrangler publish --dry-run
   ```

3. Deploy to Cloudflare:
   ```bash
   wrangler deploy
   ```

4. Verify static assets:
   ```bash
   wrangler pages deploy ../../.. --project-name sheets-example
   ```

## Verification

1. Test the deployment:
   - Visit the website
   - Verify Google Sign-in works
   - Create a test sheet
   - Analyze a test URL

2. Check Cloudflare logs:
   - Monitor Workers logs for errors
   - Verify CORS is working correctly
   - Check rate limiting behavior

## Rollback Procedure

If issues are detected:

1. Revert to previous version:
   ```bash
   wrangler rollback
   ```

2. Verify the rollback:
   - Check application functionality
   - Monitor error logs
   - Confirm Google API access

## Monitoring

- Monitor Cloudflare Workers analytics
- Check Google Cloud Platform quotas
- Review error logs regularly
- Set up alerts for critical errors

## Troubleshooting

Common deployment issues and their solutions will be documented here as they are encountered.
