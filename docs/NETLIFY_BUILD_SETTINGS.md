# CreditVault - Netlify Build Settings & Environment Variables

Complete guide to configure CreditVault on Netlify with all required build settings and environment variables.

---

## 📋 Build Settings

### Basic Configuration

| Setting | Value |
|---------|-------|
| **Branch to deploy** | `main` |
| **Base directory** | `.` (root - leave blank) |
| **Build command** | `npm run build` |
| **Publish directory** | `dist` |
| **Node version** | `20` |

---

## 🔨 Step-by-Step: Netlify Dashboard Configuration

### 1. **Branch to Deploy**
- **What it is:** Which branch on GitHub should Netlify automatically deploy
- **For CreditVault:** `main`
- **How to set it:**
  - Netlify Dashboard → Site settings → Build & deploy → Branches
  - Set production branch to `main`

### 2. **Base Directory**
- **What it is:** The folder where Netlify installs dependencies and runs your build
- **For CreditVault:** Leave blank (root directory `.`)
- **Why:** Your `package.json` is in the project root, not in a subfolder
- **How to set it:**
  - Leave the "Base directory" field empty
  - OR type `.` (a single dot means current directory)

### 3. **Build Command**
- **What it is:** The command Netlify runs to build your project
- **For CreditVault:** `npm run build`
- **What it does:**
  - Compiles TypeScript
  - Bundles frontend with Vite
  - Bundles backend with esbuild
  - Creates optimized production build in `dist/` folder
- **How to set it:**
  - Netlify Dashboard → Site settings → Build & deploy → Build settings
  - Paste: `npm run build`

### 4. **Publish Directory**
- **What it is:** The folder Netlify serves as your website after build completes
- **For CreditVault:** `dist`
- **What's in it:** 
  - Compiled frontend HTML/CSS/JS
  - Backend server code
  - WASM files for FHEVM
- **How to set it:**
  - Netlify Dashboard → Site settings → Build & deploy → Build settings
  - Paste: `dist`

### 5. **Node Version**
- **What it is:** Which version of Node.js Netlify uses during build
- **For CreditVault:** `20`
- **Why:** Your project requires Node 20+ for compatibility
- **How to set it:**
  - Netlify Dashboard → Site settings → Build & deploy → Build environment variables
  - Add: `NODE_VERSION` = `20`

---

## 🔐 Environment Variables (Required & Optional)

Environment variables are configuration values that Netlify injects into your app at runtime. Some are essential; others are optional.

### Required Environment Variables

These MUST be set in Netlify, or your app will fail.

#### 1. **DATABASE_URL**
- **What it is:** Connection string to your PostgreSQL database
- **Why:** CreditVault stores users, loans, encrypted data, and audit logs in PostgreSQL
- **Format:** `postgresql://username:password@host:port/database`
- **Example:** `postgresql://user:pass123@db.neon.tech:5432/creditvault`
- **How to get it:**
  1. Go to [Neon Console](https://console.neon.tech) (recommended for serverless PostgreSQL)
  2. Create a project or use existing one
  3. Click "Connection String" on your database
  4. Copy the full URL (looks like: `postgresql://neon_user:password@ep-xxx.us-east-1.neon.tech/neon_database`)
- **Where to paste in Netlify:**
  - Site settings → Build & deploy → Environment variables
  - Add new variable: `DATABASE_URL` = `postgresql://...`
  - Make sure it's set for both "Build" and "Runtime"

#### 2. **SESSION_SECRET**
- **What it is:** Secret key for encrypting user sessions
- **Why:** CreditVault uses session-based authentication. This key encrypts session cookies so users stay logged in securely
- **Format:** Random string, 32+ characters
- **How to generate it:**
  ```bash
  # On Mac/Linux:
  openssl rand -hex 32
  
  # On Windows (PowerShell):
  [System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32) | ForEach-Object { '{0:x2}' -f $_ } | Join-String
  
  # Or use online: https://www.random.org/cgi-bin/randbytes?nbytes=32&format=h
  ```
- **Example output:** `a7f3e9c2b8d1f4a6e9c2b8d1f4a6e9c2b8d1f4a6e9c2b8d1f4a6e9c2b8d1f4`
- **Where to paste in Netlify:**
  - Site settings → Build & deploy → Environment variables
  - Add new variable: `SESSION_SECRET` = `<your-random-string>`
  - Make sure it's set for both "Build" and "Runtime"

#### 3. **NODE_ENV**
- **What it is:** Deployment environment indicator
- **For CreditVault:** `production`
- **Why:** Tells your app to use production optimizations and security settings
- **Where to paste in Netlify:**
  - Site settings → Build & deploy → Environment variables
  - Add new variable: `NODE_ENV` = `production`
  - Make sure it's set for both "Build" and "Runtime"

---

### Optional Environment Variables

These are optional but recommended for full functionality.

#### 4. **VITE_CHAIN_ID**
- **What it is:** Ethereum network chain ID
- **For CreditVault:** `11155111` (Sepolia testnet)
- **Default:** Already set in code, but can override here
- **What it controls:** Which blockchain network MetaMask connects to
- **Where to paste in Netlify:**
  - Site settings → Build & deploy → Environment variables
  - Add: `VITE_CHAIN_ID` = `11155111`
  - This is a "Build" variable (affects frontend)

#### 5. **VITE_WALLET_CONNECT_ID** (Optional)
- **What it is:** WalletConnect v2 project ID for alternative wallet connections
- **Default:** Not required - app works without it
- **When needed:** If you want to support wallets beyond MetaMask
- **How to get it:**
  1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
  2. Sign up / log in
  3. Create a new project
  4. Copy your Project ID
- **Where to paste in Netlify:**
  - Site settings → Build & deploy → Environment variables
  - Add: `VITE_WALLET_CONNECT_ID` = `<your-project-id>`
  - This is a "Build" variable (affects frontend)

---

## 📝 Complete Setup Checklist

### Step 1: GitHub Repository
- [ ] Code pushed to GitHub
- [ ] Main branch is `main`
- [ ] netlify.toml exists in root

### Step 2: Netlify Dashboard
- [ ] Site connected to GitHub repository
- [ ] Netlify has permission to access repository

### Step 3: Build Settings (Site settings → Build & deploy → Build settings)
- [ ] Build command: `npm run build`
- [ ] Publish directory: `dist`
- [ ] Base directory: (empty or `.`)
- [ ] Branch: `main`

### Step 4: Build Environment (Site settings → Build & deploy → Build environment variables)
- [ ] `NODE_VERSION` = `20`

### Step 5: Environment Variables (Site settings → Build & deploy → Environment)
Set these in the "Build" and "Runtime" sections:
- [ ] `DATABASE_URL` = `postgresql://...` (from Neon)
- [ ] `SESSION_SECRET` = `<random-32-char-string>`
- [ ] `NODE_ENV` = `production`

### Step 6: Optional Variables
- [ ] `VITE_CHAIN_ID` = `11155111` (for Sepolia)
- [ ] `VITE_WALLET_CONNECT_ID` = (if using WalletConnect)

### Step 7: Deploy
- [ ] Push a new commit to main: `git push origin main`
- [ ] Netlify automatically starts build
- [ ] Wait for build to complete (usually 3-5 minutes)
- [ ] Check build logs if there are errors

---

## 🔍 Build Process Explained

When you push to GitHub, here's what Netlify does:

```
1. Detects push to 'main' branch
   ↓
2. Checks out code from GitHub
   ↓
3. Sets up Node 20 environment
   ↓
4. Runs: npm install (installs all dependencies)
   ↓
5. Injects environment variables (DATABASE_URL, SESSION_SECRET, etc.)
   ↓
6. Runs: npm run build
   - Compiles TypeScript
   - Bundles frontend (Vite) → dist/public/
   - Bundles backend (esbuild) → dist/server/
   - Copies WASM files → dist/public/fhevm/
   ↓
7. Copies dist/ to Netlify servers
   ↓
8. Starts Node server in dist/server/index.js
   ↓
9. Website is LIVE! 🎉
```

---

## 🐛 Troubleshooting Build Failures

### Build fails with "DATABASE_URL not found"
**Problem:** Environment variable not set
**Solution:**
1. Go to Site settings → Build & deploy → Environment
2. Add `DATABASE_URL` = your PostgreSQL connection string
3. Make sure it's in both "Build" and "Runtime" sections
4. Redeploy: push a new commit to main

### Build fails with "npm ERR! code 1"
**Problem:** npm build command failed
**Solutions:**
1. Check Netlify build logs for specific error
2. Run locally: `npm run build` to see error details
3. Fix the issue, commit, and push again

### Site deploys but shows blank page
**Problem:** Frontend not loading correctly
**Solutions:**
1. Check browser console for errors (F12)
2. Check if WASM files loaded (Application tab → Cache storage)
3. Verify DATABASE_URL and SESSION_SECRET are set
4. Check Netlify function logs

### MetaMask can't connect or shows "Network error"
**Problem:** Blockchain connection issue
**Solutions:**
1. Check VITE_CHAIN_ID is set to `11155111`
2. Verify Relayer URL is correct: `https://relayer.testnet.zama.cloud`
3. Check browser console for specific error
4. Ensure Sepolia testnet is added to MetaMask

### "Cross-Origin-Opener-Policy" header errors
**Problem:** FHEVM WASM threading headers missing
**Solution:**
1. Verify netlify.toml has COOP/COEP headers configured
2. Headers should be in netlify.toml already
3. If not, contact support - headers must be set server-side

---

## 📊 Example Configuration

### netlify.toml (Already in your project)
```toml
[build]
  command = "npm run build"
  publish = "dist"
  
  [build.environment]
    NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    Cross-Origin-Opener-Policy = "same-origin"
    Cross-Origin-Embedder-Policy = "require-corp"
```

### Environment Variables in Netlify Dashboard
```
DATABASE_URL = postgresql://user:pass@db.neon.tech:5432/creditvault
SESSION_SECRET = a7f3e9c2b8d1f4a6e9c2b8d1f4a6e9c2b8d1f4a6e9c2b8d1f4a6e9c2b8d1f4
NODE_ENV = production
VITE_CHAIN_ID = 11155111
NODE_VERSION = 20 (set in Build environment)
```

---

## ✅ Your Setup is Ready

All build settings are already configured in `netlify.toml`. You just need to:

1. **Set Environment Variables** in Netlify Dashboard
2. **Push to GitHub**
3. **Netlify automatically deploys**

Your app will be live in 3-5 minutes! 🚀

---

## 📖 Related Documentation

- [Netlify Build Settings Docs](https://docs.netlify.com/configure-builds/file-based-configuration/)
- [Environment Variables Guide](https://docs.netlify.com/build-release-manage/environment/)
- [Neon PostgreSQL Setup](https://neon.tech/docs/)
- [CreditVault Deployment Guide](./DEPLOYMENT.md)
