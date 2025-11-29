# CreditVault - Netlify Deployment Guide

## Overview

CreditVault is a full-stack decentralized application (dApp) for privacy-preserving credit scoring and lending. This guide covers deploying to Netlify with Zama FHEVM integration.

## Prerequisites

- Node.js 20+ installed locally
- PostgreSQL database (we recommend [Neon](https://neon.tech) for serverless)
- Netlify account (free tier supported)
- GitHub repository with CreditVault code

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Netlify CDN                           │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React + Vite)    │    Serverless Functions      │
│  - SPA routing              │    - Express API              │
│  - FHEVM WASM loading       │    - Database operations      │
│  - MetaMask integration     │    - Session management       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Neon PostgreSQL│
                    │  (Serverless)   │
                    └─────────────────┘
                              │
                              ▼
              ┌──────────────────────────────┐
              │  Ethereum Sepolia + Zama     │
              │  Smart Contracts & FHEVM     │
              └──────────────────────────────┘
```

## Step-by-Step Deployment

### 1. Prepare Your Repository

```bash
# Ensure everything is committed
git add .
git commit -m "Deploy CreditVault to Netlify"
git push origin main
```

### 2. Set Up PostgreSQL Database

**Option A: Use Neon (Recommended for Netlify)**

1. Go to https://console.neon.tech
2. Create a new project
3. Copy the connection string (looks like: `postgresql://user:password@host/database`)
4. Keep this handy for the next step

**Option B: Use Existing PostgreSQL**

Ensure your PostgreSQL server is accessible from the internet.

### 3. Connect Repository to Netlify

1. Go to https://app.netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** and authenticate
4. Select your CreditVault repository
5. Leave build settings as default for now (will be overridden by netlify.toml)
6. Click **"Deploy site"**

### 4. Configure Environment Variables

1. In Netlify Dashboard, go to **Site settings** → **Build & deploy** → **Environment**
2. Click **"Edit variables"**
3. Add these environment variables:

```
DATABASE_URL = postgresql://user:password@host/database
SESSION_SECRET = <generate secure random string>
NODE_ENV = production
```

**To generate SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Deploy

Once you push to GitHub, Netlify automatically:
1. Pulls your code
2. Runs `npm run build`
3. Deploys to their CDN
4. Serves on your domain (e.g., `creditvault-app.netlify.app`)

View deployment logs in Netlify Dashboard → **Deploys** tab.

## Configuration Details

### Build Settings

**Located in:** `netlify.toml`

```toml
[build]
  command = "npm run build"
  publish = "dist"
  
  [build.environment]
    NODE_VERSION = "20"
```

- **command:** Builds frontend (Vite) + backend (esbuild)
- **publish:** Output directory with static files
- **NODE_VERSION:** Must be 20+ for full ES2020+ support

### FHEVM WASM Configuration

The app loads TFHE WASM files from:
- `/fhevm/tfhe_bg.wasm` (4.4 MB) - Encryption engine
- `/fhevm/kms_lib_bg.wasm` (638 KB) - Key management

**Headers in netlify.toml ensure:**
```toml
[[headers]]
  for = "/fhevm/*.wasm"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
    Content-Type = "application/wasm"
```

- Correct MIME type (`application/wasm`)
- Long-term caching for performance
- Cross-Origin headers for browser threading

### Security Headers

The app sets these headers for FHEVM compatibility:

```toml
Cross-Origin-Opener-Policy = "same-origin"
Cross-Origin-Embedder-Policy = "require-corp"
```

Required for browser-side WASM threading support.

## Verification

### 1. Check Deployment Status

```bash
# View your site
https://your-app-name.netlify.app

# Check logs in Netlify Dashboard
Deploys → Click latest → View deploy log
```

### 2. Test FHEVM Initialization

Open browser DevTools (F12):
1. Go to **Console** tab
2. Look for: `"Zama FHEVM SDK initialized successfully!"`
3. Look for WASM URLs: `/fhevm/tfhe_bg.wasm` and `/fhevm/kms_lib_bg.wasm`

### 3. Test Database Connection

1. Click "Connect Wallet" in the app
2. Enter test credentials
3. If you see user data load, database is connected ✓

### 4. Test Blockchain Integration

1. Install MetaMask browser extension
2. Switch to Ethereum Sepolia testnet
3. Get testnet ETH from https://sepolia-faucet.pk910.de
4. Try submitting encrypted data on the app
5. Transaction should appear on Etherscan: https://sepolia.etherscan.io

## Troubleshooting

### Build Fails: "Command not found: npm"

**Cause:** Node.js not installed in build environment
**Solution:** 
```toml
[build.environment]
  NODE_VERSION = "20"
```

Ensure this is in your `netlify.toml`.

### WASM Loading Error: "Incorrect response MIME type"

**Cause:** WASM files served with wrong content type
**Solution:** Verify headers in `netlify.toml`:
```toml
[[headers]]
  for = "/fhevm/*.wasm"
  [headers.values]
    Content-Type = "application/wasm"
```

### Database Connection Timeout

**Cause:** DATABASE_URL not set or invalid
**Solution:**
1. Go to Netlify Dashboard → Site settings → Build & deploy → Environment
2. Verify `DATABASE_URL` is set correctly
3. Test connection locally:
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

### MetaMask Connection Fails

**Cause:** Browser doesn't have MetaMask or wrong network
**Solution:**
1. Install MetaMask: https://metamask.io
2. Switch to Ethereum Sepolia testnet
3. Get test ETH: https://sepolia-faucet.pk910.de
4. Refresh app and try again

### Zama Relayer Unavailable

**Cause:** Zama testnet service is down (check https://status.zama.ai/)
**Solution:**
- This is not your fault - it's a Zama service issue
- Check status page for updates
- Try again in a few moments
- Contact Zama support if issue persists

## Performance Optimization

### Caching Strategy

```toml
# Assets (long-term cache)
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# WASM (long-term cache)
[[headers]]
  for = "/fhevm/*.wasm"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# HTML (short-term cache)
[[headers]]
  for = "/"
  [headers.values]
    Cache-Control = "public, max-age=300"
```

### WASM Loading Performance

WASM files are large (~5 MB combined). To optimize:

1. **Use Netlify CDN** - Automatically cached globally
2. **Enable gzip compression** - Netlify does this automatically
3. **Load WASM asynchronously** - App does this in `initFhevmSDK()`

## Monitoring & Maintenance

### Monitor Build Status

Netlify sends email notifications for:
- Build failures
- Deploy previews
- Production deployments

Check Netlify Dashboard regularly.

### Monitor Database

For Neon:
1. Go to https://console.neon.tech
2. Check:
   - Active connections
   - Query logs
   - Resource usage

### Monitor Blockchain Transactions

View your app's transactions on Etherscan:
https://sepolia.etherscan.io/

Search for your contract addresses or transaction hashes.

## Custom Domain (Optional)

1. Netlify Dashboard → Site settings → Domain management
2. Click **"Add custom domain"**
3. Enter your domain (e.g., `creditvault.com`)
4. Update DNS records at your domain registrar
5. Netlify provides automatic HTTPS via Let's Encrypt

## Rollback & Recovery

If something breaks:

1. **View deployment history:** Netlify Dashboard → Deploys
2. **Rollback to previous:** Click a past deploy → Click **"Publish deploy"**
3. **Check logs:** Click deploy → **View deploy log**
4. **Revert code:** `git revert <commit-hash>` then push to main

## Next Steps

- Set up monitoring and alerting
- Configure custom domain
- Set up automated backups for PostgreSQL
- Create documentation for your team
- Plan for production launch on Base mainnet (currently on Sepolia testnet)

## Support

- Netlify docs: https://docs.netlify.com
- Neon docs: https://neon.tech/docs
- Zama docs: https://docs.zama.ai
- CreditVault repo: Add your GitHub URL here

---

**Last updated:** Nov 29, 2025
