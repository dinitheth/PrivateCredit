# Private Credit Scoring & Lending dApp

## Overview

This is a privacy-preserving credit scoring and automated lending decentralized application (dApp) built on Base L2, powered by Zama's Fully Homomorphic Encryption Virtual Machine (FHEVM). The application enables borrowers to submit encrypted financial data, receive confidential credit scores computed on-chain, and obtain loan approvals without ever exposing their raw financial information in plaintext.

The system demonstrates a production-ready implementation of confidential computing for financial services, where:
- Borrowers encrypt salary, debts, and expenses client-side before submission
- Credit scores are computed on encrypted data using FHE coprocessors
- Lenders can assess risk tiers without accessing raw borrower data
- All sensitive computations happen on encrypted ciphertexts

## Deployed Contracts (Base Sepolia Testnet)

The smart contracts are deployed and live on Base Sepolia:

| Contract | Address |
|----------|---------|
| AccessControl | `0x20C72E9623ea7070a7B4d3F07fb2eA79A3507569` |
| EncryptedDataVault | `0x7174D1709D625a2218e2a508b87353080816238D` |
| CreditScorer | `0x4B7aeda4C03230983c0eDC8739c55413d4000e2f` |
| LoanManager | `0xDDA2Fea3cD0Cf798Fac01AD5d03E5d19000788e0` |

View on BaseScan: https://sepolia.basescan.org/

### Blockchain Integration

The frontend operates in on-chain mode only - all transactions are real blockchain operations:
- Real MetaMask wallet connection required
- All transactions executed on Base Sepolia testnet
- No demo or simulated modes

Contract configuration is in `client/src/lib/contracts.ts` with ABIs and addresses.
Blockchain interaction functions are in `client/src/lib/web3.ts`.

## User Preferences

Preferred communication style: Simple, everyday language.

## Reviewer Access

For application reviewers who need to test lender and admin features without on-chain role approval:

1. Go to the Connect Wallet page
2. Select "Lender" or "Admin" role
3. Enter the reviewer access code: `REVIEW2024`
4. Click Connect

This grants temporary access to the selected role for testing purposes. The access code is validated server-side and all reviewer access is logged for audit purposes.

**Note:** In production, lender and admin roles should be granted via on-chain access control. The reviewer code is intended for demo/testing purposes only.

## Testing

The project includes comprehensive unit and integration tests covering:
- Encryption/decryption functionality
- Authentication and user sessions  
- Loan management and risk assessment
- Schema validation

### Running Tests
```bash
npm test              # Run all tests
npm test:ui          # Interactive test dashboard
npm test:coverage    # Coverage report
```

Test files are located in:
- `client/src/__tests__/encryption.test.ts`
- `server/__tests__/auth.test.ts`
- `server/__tests__/loans.test.ts`
- `shared/__tests__/schema.test.ts`

See `docs/TESTING.md` for detailed testing guide.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript for type safety
- Vite as the build tool and dev server
- Wouter for client-side routing
- TanStack Query (React Query) for server state management
- shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for styling with custom dark theme configuration

**Design System:**
- Material Design-inspired approach adapted for crypto/finance UX
- Dark-first theme (background: #121212, surface: #1E1E1E)
- Custom color palette: Primary purple (#BB86FC), secondary cyan (#03DAC6)
- Inter font family for general text, JetBrains Mono for addresses/hashes
- Consistent spacing system using Tailwind units (2, 4, 6, 8, 12, 16, 24)

**Client-Side Encryption:**
- TFHE-rs WASM library (simulated in MVP) for browser-based encryption
- Financial data encrypted before transmission to prevent plaintext exposure
- Client-side key management for decryption of user's own scores
- Encryption simulation helpers in `client/src/lib/encryption.ts`

**State Management Pattern:**
- React Query for all API interactions with automatic caching
- Custom hooks for auth (`useAuth`), toast notifications (`useToast`)
- Local storage for wallet connection persistence
- Form state managed via react-hook-form with Zod validation

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript for API layer
- Dual-mode server: development (Vite middleware) and production (static serving)
- Session-based authentication using wallet signatures
- RESTful API design under `/api` namespace

**API Structure:**
- `/api/auth/*` - Wallet connection and authentication
- `/api/encrypted-data` - Submit and retrieve encrypted financial data
- `/api/credit-score` - Credit score computation and retrieval
- `/api/loans/*` - Loan application and management
- `/api/admin/*` - Administrative functions (key rotation, audit logs, coprocessor status)

**Business Logic:**
- Credit score algorithm: Debt-to-income and expense ratios computed on encrypted data
- Risk tier classification: Low/medium/high based on score thresholds
- Loan approval workflow: Pending → Approved/Denied → Active → Repaid
- Audit logging for all critical operations

### Data Storage

**Database: PostgreSQL (via Neon serverless)**
- Drizzle ORM for type-safe database access
- Connection pooling with @neondatabase/serverless
- WebSocket support for serverless environments

**Schema Design:**

1. **users** - Wallet addresses, roles (borrower/lender/admin), creation timestamps
2. **encryptedData** - Encrypted handles for salary, debts, expenses per user
3. **creditScores** - Encrypted score handles, computation status, timestamps
4. **loans** - Borrower/lender relationships, amounts, risk tiers, approval status
5. **auditLogs** - Compliance trail with action, entity, metadata
6. **coprocessorStatus** - FHE service health monitoring
7. **documents** - Supporting documentation storage

**Data Access Pattern:**
- Storage layer abstraction in `server/storage.ts`
- Interface-based design for testability and future database migrations
- Relationship queries using Drizzle relations
- Encrypted handles stored as text (base64-encoded ciphertext references)

### Authentication & Authorization

**Wallet-Based Authentication:**
- MetaMask integration for wallet connection (simulated in MVP)
- No passwords - authentication via wallet signature verification
- Session persistence in localStorage
- Role-based access control (borrower, lender, admin)

**Security Model:**
- Client never sends plaintext financial data
- Encrypted handles reference on-chain ciphertexts
- User can only decrypt their own data with their private key
- Lenders receive risk tiers, not raw data

### Fully Homomorphic Encryption Integration

**Architecture (Production Intent):**
- Zama FHEVM for on-chain encrypted computations
- Smart contracts use `euint*` types for encrypted integers
- Coprocessor executes heavy FHE operations off-chain
- Relayer SDK handles transaction signing and gas sponsorship

**MVP Simulation:**
- Simulated encryption/decryption in `server/routes.ts` and `client/src/lib/encryption.ts`
- Base64-encoded handles mimic encrypted ciphertext references
- Credit score algorithm executed on "decrypted" values server-side
- Production would replace with actual TFHE-rs WASM and coprocessor calls

**Smart Contract Design (Future):**
- UserDataStore: Encrypted data submission and storage
- CreditScorer: FHE computation of credit scores
- BorrowingPolicy: Encrypted loan approval decisions
- AccessControl: Permission management for data access

## External Dependencies

### Third-Party Services

**Blockchain Infrastructure:**
- Base L2 (Ethereum Layer 2) - Target deployment network
- Base Sepolia - Testnet for development and testing
- Zama FHEVM - Confidential smart contract execution environment
- Zama Coprocessor - Off-chain FHE computation service
- Zama Relayer SDK - Transaction submission and gas sponsorship

**Database & Infrastructure:**
- Neon Serverless PostgreSQL - Managed database with WebSocket support
- Replit platform integrations (dev banner, cartographer, runtime error overlay)

**Frontend Libraries:**
- Radix UI - Accessible, unstyled component primitives
- TanStack Query - Async state management
- Tailwind CSS - Utility-first styling
- Lucide React - Icon library
- React Hook Form - Form state management
- Zod - Schema validation

**Development Tools:**
- Vite - Build tool and dev server
- TypeScript - Type safety across stack
- Drizzle Kit - Database migrations
- esbuild - Production bundling

### API Integrations

**MetaMask Wallet (Production):**
- Web3 provider injection
- Signature requests for authentication
- Transaction signing for on-chain operations
- Network switching (Base mainnet/testnet)

**TFHE-rs WASM (Production):**
- Client-side encryption of financial data
- Keypair generation
- Decryption of encrypted scores with user's private key

**Zama Relayer SDK (Production):**
- Abstract gas payments from end users
- Batch transaction submission
- Monitoring transaction status

### Configuration Management

**Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string (required)
- `NODE_ENV` - Development/production mode
- Future: API keys for coprocessor, relayer endpoints, Base RPC URLs

**Build & Deployment:**
- Development: `npm run dev` - Vite dev server with HMR
- Build: `npm run build` - Vite frontend + esbuild backend bundle
- Production: `npm start` - Serves static frontend + API server
- Database: `npm run db:push` - Apply schema changes via Drizzle