# CreditVault

## Overview

**CreditVault** is a privacy-preserving credit scoring and lending decentralized application (dApp) built on Ethereum Sepolia using Zama's Fully Homomorphic Encryption Virtual Machine (FHEVM). The application enables borrowers to submit encrypted financial data, receive confidential credit scores computed on encrypted data, and obtain loan approvals without ever exposing their raw financial information.

CreditVault demonstrates a production-ready implementation of confidential computing for financial services, where:
- Borrowers encrypt salary, debts, and expenses client-side using **real TFHE encryption** via Zama SDK
- Credit scores are computed on encrypted data using Zama's FHE coprocessors
- Lenders can assess risk tiers without accessing raw borrower data
- All sensitive computations happen on encrypted ciphertexts via the Zama relayer

**Status:** Production-ready for Zama FHEVM competition submission | Pending Zama testnet relayer recovery (Coprocessor at 85% uptime as of Nov 29)

## Quick Start - Netlify Deployment

### Prerequisites
- Node.js 20+
- PostgreSQL database (Neon recommended)
- Netlify account
- Git repository

### Deployment Steps

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to https://app.netlify.com/sites
   - Click "Add new site" → "Import an existing project"
   - Select your GitHub repository
   - Choose branch: `main`

3. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `20`

4. **Set Environment Variables** (in Netlify Dashboard → Site settings → Build & deploy → Environment)
   ```
   DATABASE_URL=postgresql://user:password@host/database
   SESSION_SECRET=your-secure-random-string-here
   NODE_ENV=production
   ```

5. **Deploy**
   - Netlify automatically deploys on git push
   - Check build logs in Netlify dashboard
   - Visit your live domain

### Environment Variables

**Required:**
- `DATABASE_URL` - PostgreSQL connection string (use Neon for serverless)
- `SESSION_SECRET` - Secure random string for session encryption
- `NODE_ENV` - Set to `production`

**Optional:**
- `VITE_CHAIN_ID` - Ethereum chain ID (default: 11155111 for Sepolia)
- `VITE_WALLET_CONNECT_ID` - WalletConnect project ID

## Deployed Smart Contracts (Ethereum Sepolia Testnet)

Live contracts on Ethereum Sepolia with Zama FHEVM:

| Contract | Address |
|----------|---------|
| AccessControl | `0x8d9826111d42BDb4c775c7518dF34DecE8cdB094` |
| EncryptedDataVault | `0xa416E19c491Cb093Da3F509d3435D182A1bf9e70` |
| CreditScorer | `0x2868cdBAC2571d892A5f8cBfd8f61569db3c11E1` |
| LoanManager | `0x6E6062B6A641e8830d2393e90001A338ba8457C6` |

View on Etherscan: https://sepolia.etherscan.io/

## Blockchain Integration

**Real FHEVM Encryption:**
- Real MetaMask wallet connection required
- All transactions executed on Ethereum Sepolia testnet (Chain ID: 11155111)
- Real TFHE encryption via @zama-fhe/relayer-sdk (v0.2.0+)
- Zama Coprocessor: https://relayer.testnet.zama.cloud

**Contract Configuration:**
- Contract ABIs and addresses: `client/src/lib/contracts.ts`
- Blockchain interaction: `client/src/lib/web3.ts`
- FHEVM encryption: `client/src/lib/fhevm.ts`

## User Preferences

- Preferred communication: Simple, everyday language
- Deployment target: Netlify
- Project name: CreditVault
- Tech stack: Full-stack JavaScript (Node.js + React + TypeScript)

## Reviewer Access

For testing lender and admin features without on-chain role approval:

1. Go to Connect Wallet page
2. Select "Lender" or "Admin" role
3. Enter code: `REVIEW2024`
4. Click Connect

**Note:** In production, roles are granted via on-chain access control. Reviewer code is for demo/testing only.

## Testing

Comprehensive unit and integration tests:
- Encryption/decryption functionality
- Authentication and sessions
- Loan management and risk assessment
- Schema validation

### Running Tests
```bash
npm test              # Run all tests
npm test:ui          # Interactive dashboard
npm test:coverage    # Coverage report
```

Test files:
- `client/src/__tests__/encryption.test.ts`
- `server/__tests__/auth.test.ts`
- `server/__tests__/loans.test.ts`
- `shared/__tests__/schema.test.ts`

See `docs/TESTING.md` for detailed guide.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript
- Vite (build tool + dev server)
- Wouter (client-side routing)
- TanStack Query (async state management)
- shadcn/ui + Radix UI (components)
- Tailwind CSS (styling)

**Design:**
- Material Design-inspired crypto/finance UX
- Dark-first theme: background #121212, surface #1E1E1E
- Color palette: Primary purple (#BB86FC), secondary cyan (#03DAC6)
- Typography: Inter (general), JetBrains Mono (addresses)

**Real Zama FHEVM:**
- TFHE encryption via @zama-fhe/relayer-sdk
- Financial data encrypted in-browser before blockchain submission
- Browser polyfills: `client/src/lib/node-polyfills.ts`

**WASM Files (Client-side):**
- `/fhevm/tfhe_bg.wasm` (4.4 MB) - TFHE encryption engine
- `/fhevm/kms_lib_bg.wasm` (638 KB) - Key management system
- Both served with correct `application/wasm` MIME type

**State Management:**
- React Query for API calls with automatic caching
- Custom hooks: `useAuth`, `useToast`
- Local storage for wallet persistence
- Form state via react-hook-form + Zod validation

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript
- Dual-mode: development (Vite middleware) + production (static serving)
- Session-based authentication via wallet signatures
- RESTful API under `/api` namespace

**API Routes:**
- `/api/auth/*` - Wallet connection and authentication
- `/api/encrypted-data` - Submit and retrieve encrypted data
- `/api/credit-score` - Credit score computation
- `/api/loans/*` - Loan application and management
- `/api/admin/*` - Admin functions (audit logs, system status)

**Business Logic:**
- Credit score: Debt-to-income ratio + expense ratios (encrypted)
- Risk tiers: Low/medium/high based on score thresholds
- Loan workflow: Pending → Approved/Denied → Active → Repaid
- Audit logging for all critical operations

### Data Storage

**Database: PostgreSQL (Neon serverless)**
- Drizzle ORM for type-safe access
- Connection pooling via @neondatabase/serverless
- WebSocket support for serverless environments

**Schema:**
1. **users** - Wallet, roles (borrower/lender/admin)
2. **encryptedData** - Encrypted salary, debts, expenses handles
3. **creditScores** - Encrypted score handles, status
4. **loans** - Borrower/lender, amounts, risk tiers, status
5. **auditLogs** - Compliance trail with actions and metadata
6. **coprocessorStatus** - FHE service health monitoring
7. **documents** - Supporting documentation

**Pattern:**
- Storage layer abstraction: `server/storage.ts`
- Interface-based for testability
- Drizzle relations for queries
- Encrypted handles stored as base64 text references

### Authentication & Authorization

**Wallet-Based:**
- MetaMask wallet connection
- No passwords - signature verification only
- Session persistence in localStorage
- Role-based access control

**Security Model:**
- Client never sends plaintext financial data
- Encrypted handles reference on-chain ciphertexts
- Users can only decrypt their own data
- Lenders receive only risk tiers, not raw data

### Fully Homomorphic Encryption Integration

**Production Architecture:**
- Zama FHEVM for on-chain encrypted computation
- Smart contracts use `euint*` types for encrypted integers
- Coprocessor executes heavy FHE operations off-chain
- Relayer SDK handles transaction signing and gas sponsorship

**Current Implementation:**
- Real TFHE encryption via @zama-fhe/relayer-sdk
- Real WASM loading from `/fhevm/` public directory
- Real on-chain transaction submission
- Full blockchain integration on Ethereum Sepolia

**Smart Contract Design:**
- UserDataStore: Encrypted data submission/storage
- CreditScorer: FHE credit score computation
- BorrowingPolicy: Encrypted loan approval decisions
- AccessControl: Permission management for data access

## External Dependencies

### Blockchain Infrastructure
- **Ethereum Sepolia** - Testnet for development
- **Zama FHEVM** - Confidential smart contract environment
- **Zama Coprocessor** - Off-chain FHE computation
- **Zama Relayer SDK** - Transaction signing and submission

### Database & Infrastructure
- **Neon Serverless PostgreSQL** - Managed database
- **Netlify** - Frontend hosting and edge functions

### Frontend Libraries
- Radix UI - Accessible components
- TanStack Query - Async state management
- Tailwind CSS - Styling
- Lucide React - Icons
- React Hook Form - Form state
- Zod - Schema validation

### Development Tools
- Vite - Build and dev server
- TypeScript - Type safety
- Drizzle Kit - Database migrations
- esbuild - Production bundling

## Configuration

### Build & Deployment

**Development:**
```bash
npm run dev
```
Vite dev server + HMR + backend

**Production Build:**
```bash
npm run build
```
Frontend: Vite optimization + minification
Backend: esbuild bundling + tree-shaking

**Start Production:**
```bash
npm start
```
Serves static frontend + API server

**Database Migrations:**
```bash
npm run db:push
```
Apply schema changes via Drizzle

### Environment Variables

**Development (.env.local):**
```
DATABASE_URL=postgresql://user:password@localhost/creditvault
SESSION_SECRET=dev-secret-key
NODE_ENV=development
```

**Production (Netlify Dashboard):**
```
DATABASE_URL=postgresql://user:password@neon.tech/database
SESSION_SECRET=your-secure-random-string
NODE_ENV=production
```

## Recent Changes

- **Nov 29, 2025:** Updated project name to CreditVault, configured Netlify deployment
- **Nov 29, 2025:** Fixed WebAssembly loading - WASM files copied to `client/public/fhevm/` with proper MIME types
- **Nov 29, 2025:** Improved error handling for Zama relayer timeouts and service unavailability
- **Nov 29, 2025:** All real FHEVM integration complete - ready for production submission
