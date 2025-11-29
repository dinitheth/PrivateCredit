# Deployment Guide

Deploy the Private Credit Scoring & Lending dApp to production.

## Deployment Options

### Option 1: Netlify (Frontend Only)

Recommended for frontend deployment with backend running separately.

#### Prerequisites
- Netlify account
- GitHub repository

#### Steps

1. **Connect Repository**
   - Sign in to [Netlify](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Select your GitHub repository

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Environment variables are already in `netlify.toml`

3. **Add Environment Variables**
   In Netlify Dashboard → Site settings → Build & deploy → Environment:
   ```
   VITE_API_URL=https://your-api-domain.com
   VITE_BASE_RPC_URL=https://sepolia.base.org
   VITE_CHAIN_ID=84532
   ```

4. **Deploy**
   - Commits to main branch auto-deploy
   - Monitor deployment in Netlify dashboard

#### Custom Domain
- Netlify dashboard → Domain settings
- Add your custom domain
- Update DNS records as shown

### Option 2: Replit (Full Stack)

Deploy backend and frontend together on Replit.

#### Prerequisites
- Replit account
- PostgreSQL database (included)

#### Steps

1. **Create Database**
   - Replit automatically provides PostgreSQL
   - Sync schema: `npm run db:push`

2. **Set Environment Variables**
   - Replit GUI: Secrets tab
   - Add: `SESSION_SECRET`, `DATABASE_URL`

3. **Deploy**
   - Replit auto-deploys on push
   - App available at `https://<replit-name>.replit.dev`

### Option 3: Railway / Heroku / Render (Full Stack)

For full-stack deployment with dynamic backends.

#### Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up
```

#### Heroku

```bash
# Create app
heroku create your-app-name

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

#### Render

1. Connect GitHub repository
2. Create "Web Service"
3. Build command: `npm run build`
4. Start command: `npm start`
5. Add environment variables
6. Deploy

### Option 4: Base Sepolia (Smart Contracts)

Deploy smart contracts to Base Sepolia testnet.

#### Prerequisites
- Private key with testnet funds
- Base Sepolia RPC URL
- Hardhat setup (see `docs/SMART_CONTRACTS.md`)

#### Steps

1. **Get Testnet ETH**
   - [Base Sepolia Faucet](https://faucet.base.org)
   - [Alchemy Faucet](https://www.alchemy.com/faucets)

2. **Configure Hardhat**
   ```typescript
   // hardhat.config.ts
   networks: {
     baseSepolia: {
       url: "https://sepolia.base.org",
       chainId: 84532,
       accounts: [process.env.PRIVATE_KEY],
     }
   }
   ```

3. **Deploy Contracts**
   ```bash
   npx hardhat run scripts/deploy.ts --network baseSepolia
   ```

4. **Update Frontend**
   - Add contract addresses to `.env`
   - Update API routes to use contracts

## Database Setup

### Neon (Recommended)

1. Create account at [Neon](https://neon.tech)
2. Create PostgreSQL database
3. Copy connection string to `DATABASE_URL`
4. Run `npm run db:push`

### Local PostgreSQL

```bash
# Create database
createdb private_credit_dapp

# Set connection string
DATABASE_URL=postgresql://user:password@localhost:5432/private_credit_dapp

# Run migrations
npm run db:push
```

## Environment Variables

### Development (.env.local)
```
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secret-key
```

### Production
```
DATABASE_URL=postgresql://...
SESSION_SECRET=production-secret-key
VITE_API_URL=https://your-api-domain.com
VITE_BASE_RPC_URL=https://sepolia.base.org
VITE_CHAIN_ID=84532
```

## Security Checklist

- [ ] Environment variables properly set
- [ ] Database backups enabled
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Secrets not committed to git
- [ ] Security headers configured (already in `netlify.toml`)

## Monitoring & Logging

### Application Logs
```bash
# Replit
npm run dev  # See logs in console

# Production
# Check provider's logging dashboard
```

### Error Tracking
Add Sentry for error tracking:

```bash
npm install @sentry/node
```

```typescript
// server/index.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
});
```

### Performance Monitoring
- Monitor API response times
- Track database query performance
- Monitor encryption/decryption latency

## Scaling

### Load Balancing
- Use CDN for static assets (Netlify auto-handles this)
- Consider multi-instance backend deployment

### Database Optimization
- Enable connection pooling (Neon includes this)
- Index frequently queried columns
- Regular VACUUM and ANALYZE

### Caching
- Implement Redis for session caching
- Cache credit scores temporarily
- Cache user data after submission

## Rollback Procedure

### Frontend
- Netlify: Automatic rollback available in Deploy History
- Push previous commit to rollback

### Backend
- Backup database before deployment
- Keep previous version running
- Switch DNS/load balancer if needed

## Disaster Recovery

### Database Backup
```bash
# Neon automatic backups included

# Manual backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### Code Backup
- GitHub as primary backup
- Regular backups to secondary storage

## Deployment Checklist

- [ ] Tests passing: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Environment variables set
- [ ] Database migrated: `npm run db:push`
- [ ] Security headers configured
- [ ] CORS configured correctly
- [ ] Error tracking enabled
- [ ] Monitoring set up
- [ ] Backups enabled
- [ ] Team access configured

## Support

- [Netlify Docs](https://docs.netlify.com)
- [Railway Docs](https://docs.railway.app)
- [Replit Docs](https://docs.replit.com)
- [Base Docs](https://docs.base.org)
- [Zama FHEVM Docs](https://docs.zama.org/fhevm)

## FAQ

**Q: Can I deploy to mainnet?**
A: Yes, after Base contracts are audited. Currently, testnet deployment recommended.

**Q: How do I update after deployment?**
A: Commit to main branch → Auto-deploys on Netlify/Replit.

**Q: What's the production RPC URL?**
A: For Base mainnet: `https://mainnet.base.org`

**Q: How do I monitor the app?**
A: Check provider dashboard (Netlify/Railway/Replit) + Sentry errors.
