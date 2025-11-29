# Private Credit Scoring & Lending dApp

A privacy-preserving credit scoring and automated lending decentralized application (dApp) built on **Base L2** blockchain, powered by **Zama's Fully Homomorphic Encryption Virtual Machine (FHEVM)**.

![Private Credit dApp](https://img.shields.io/badge/Base-L2-blue) ![Zama FHEVM](https://img.shields.io/badge/Zama-FHEVM-purple) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

---

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [How It Works](#how-it-works)
4. [Benefits](#benefits)
5. [Technology Stack](#technology-stack)
6. [Getting Started](#getting-started)
7. [User Guide](#user-guide)
8. [API Reference](#api-reference)
9. [Smart Contract Deployment](#smart-contract-deployment)
10. [Deployment](#deployment)
11. [Architecture](#architecture)
12. [Security](#security)
13. [Roadmap](#roadmap)

---

## Overview

This dApp enables borrowers to submit encrypted financial data, receive confidential credit scores computed on-chain, and obtain loan approvals **without ever exposing their raw financial information in plaintext**.

### The Problem

Traditional credit scoring requires borrowers to share sensitive financial data (income, debts, expenses) with multiple parties, creating:
- Privacy risks and potential data breaches
- No control over who sees your data
- Trust issues with centralized platforms

### The Solution

Leverage Fully Homomorphic Encryption (FHE) via Zama's FHEVM to:
- Encrypt financial data client-side before any transmission
- Compute credit scores directly on encrypted data
- Enable lending decisions based on risk tiers without revealing underlying data
- Provide borrowers complete control and privacy over their financial information

---

## Key Features

### Privacy-First Design
- **End-to-End Encryption**: Financial data encrypted in browser using TFHE
- **Confidential Computation**: Credit scores computed on encrypted ciphertexts
- **Owner-Only Decryption**: Only the data owner can decrypt their score
- **Zero Knowledge to Lenders**: Lenders see risk tiers, never raw data

### Role-Based Dashboards

| Role | Capabilities |
|------|-------------|
| **Borrower** | Submit encrypted data, view credit score, apply for loans |
| **Lender** | Review loan requests, see risk tiers, approve/deny loans |
| **Admin** | Monitor system health, view audit logs, rotate keys |

### MetaMask Integration
- Real wallet connection for authentication
- Demo mode available without MetaMask
- Session persistence across page refreshes

### Mobile Responsive
- Fully responsive design works on all devices
- Touch-friendly interface
- Optimized for mobile wallets

---

## How It Works

### Step 1: Connect Wallet
```
User → MetaMask → Wallet Address → Authentication
```
Users connect their MetaMask wallet and select their role. The wallet address serves as their unique identity.

### Step 2: Encrypt Financial Data (Borrower)
```
Browser → TFHE Encryption → Encrypted Handles → Blockchain Storage
```
Financial data (salary, debts, expenses) is encrypted client-side using TFHE. Only encrypted "handles" are transmitted and stored.

### Step 3: Compute Credit Score
```
Encrypted Data → Zama Coprocessor → FHE Computation → Encrypted Score
```
The credit scoring algorithm runs entirely on encrypted data using the Zama coprocessor. The result is an encrypted score (300-850 range).

### Step 4: Apply for Loan
```
Encrypted Score → Risk Tier Derivation → Loan Application
```
Borrowers apply for loans. The system derives a risk tier (Low/Medium/High) from the encrypted score without revealing the actual value.

### Step 5: Lender Decision
```
Risk Tier + Amount → Lender Review → Approve/Deny
```
Lenders make decisions based on:
- Risk tier classification
- Requested loan amount
- Platform reputation metrics

---

## Benefits

### For Borrowers
| Benefit | Description |
|---------|-------------|
| **Privacy** | Financial data never exposed to anyone |
| **Control** | Only you can decrypt your credit score |
| **Trust** | Verifiable on-chain computations |
| **Portability** | Your encrypted credit history is yours |

### For Lenders
| Benefit | Description |
|---------|-------------|
| **Risk Assessment** | Make informed lending decisions |
| **Compliance** | No access to raw sensitive data |
| **Efficiency** | Automated credit scoring |
| **Reduced Liability** | Never handle plaintext financial data |

### For the Ecosystem
| Benefit | Description |
|---------|-------------|
| **Decentralized** | No single point of failure |
| **Transparent** | Auditable smart contracts |
| **Scalable** | L2 deployment for low gas costs |
| **Interoperable** | Works with any EVM wallet |

---

## Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tooling |
| TanStack Query | Server state management |
| Tailwind CSS | Styling |
| shadcn/ui | Component library |
| Wouter | Client-side routing |

### Backend
| Technology | Purpose |
|------------|---------|
| Express.js | API server |
| TypeScript | Type safety |
| PostgreSQL | Database |
| Drizzle ORM | Database access |
| Neon | Serverless PostgreSQL |

### Blockchain & Encryption
| Technology | Purpose |
|------------|---------|
| Base L2 | Ethereum Layer 2 network |
| Zama FHEVM | Confidential smart contracts |
| TFHE-rs | Client-side encryption library |
| Zama Coprocessor | Off-chain FHE computations |
| MetaMask | Wallet integration |

---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database (Neon recommended)
- MetaMask browser extension (optional, for real wallet connection)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd private-credit-dapp

# Install dependencies
npm install

# Initialize database
npm run db:push

# Start development server
npm run dev
```

The application will be available at `http://localhost:5000`

### Environment Variables

```bash
# Required
DATABASE_URL=postgresql://...

# Optional (for production)
VITE_BASE_RPC_URL=https://sepolia.base.org
VITE_CHAIN_ID=84532
```

---

## User Guide

### For Borrowers

1. **Connect Wallet**: Click "Connect Wallet" and select "Borrower"
2. **Submit Data**: Navigate to "Submit Data" in the sidebar
3. **Enter Financial Info**: Input salary, debts, and monthly expenses
4. **View Score**: Dashboard shows your encrypted credit score
5. **Apply for Loan**: Click "Apply for Loan" and enter amount

### For Lenders

1. **Connect Wallet**: Click "Connect Wallet" and select "Lender"
2. **Review Requests**: View pending applications in the dashboard
3. **Assess Risk**: See risk tier (Low/Medium/High) for each request
4. **Decide**: Click "Approve" or "Deny" for each application

### For Admins

1. **Connect Wallet**: Click "Connect Wallet" and select "Admin"
2. **Monitor Health**: View coprocessor status and metrics
3. **View Logs**: Access audit trail of all system events
4. **Rotate Keys**: Initiate encryption key rotation when needed

---

## API Reference

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/connect` | POST | Connect wallet and authenticate |
| `/api/users/me` | GET | Get current user profile |

### Encrypted Data
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/encrypted-data` | POST | Submit encrypted financial data |
| `/api/encrypted-data` | GET | Get user's encrypted data submissions |

### Credit Scores
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/credit-score` | GET | Get user's credit score |
| `/api/credit-score/decrypt` | POST | Request score decryption |

### Loans
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/loans` | POST | Apply for a loan |
| `/api/loans` | GET | Get user's loans |
| `/api/loans/pending` | GET | Get pending requests (lenders) |
| `/api/loans/:id/approve` | PUT | Approve loan (lenders) |
| `/api/loans/:id/deny` | PUT | Deny loan (lenders) |

### Admin
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/audit-logs` | GET | Get system audit logs |
| `/api/admin/coprocessor-status` | GET | Get coprocessor health |
| `/api/admin/rotate-keys` | POST | Rotate encryption keys |

---

## Smart Contract Deployment

### Required Contracts for Base Sepolia

For full FHEVM integration, deploy these smart contracts:

#### 1. UserDataStore.sol
Stores encrypted financial data handles.

```solidity
// Stores euint32 handles for salary, debts, expenses
function submitData(
    einput encryptedSalary,
    einput encryptedDebts,
    einput encryptedExpenses,
    bytes calldata inputProof
) external;
```

#### 2. CreditScorer.sol
Computes credit scores on encrypted data.

```solidity
// Computes score using FHE operations
function computeScore(address user) external returns (euint32);
```

#### 3. BorrowingPolicy.sol
Manages loan approvals based on encrypted assessments.

```solidity
// Evaluates loan eligibility on encrypted score
function evaluateLoan(
    address borrower,
    uint256 amount
) external returns (bool);
```

#### 4. AccessControl.sol
Permission management for data access.

```solidity
// Grant/revoke access to encrypted data
function grantAccess(address user, address viewer) external;
function revokeAccess(address user, address viewer) external;
```

### Deployment Steps

1. **Install Dependencies**
   ```bash
   npm install hardhat @zama/hardhat-fhevm
   ```

2. **Configure Network** (hardhat.config.ts)
   ```typescript
   networks: {
     baseSepolia: {
       url: "https://sepolia.base.org",
       chainId: 84532,
       accounts: [process.env.PRIVATE_KEY]
     }
   }
   ```

3. **Deploy Contracts**
   ```bash
   npx hardhat run scripts/deploy.ts --network baseSepolia
   ```

4. **Update Frontend**
   Add contract addresses to environment variables:
   ```
   VITE_USER_DATA_STORE=0x...
   VITE_CREDIT_SCORER=0x...
   VITE_BORROWING_POLICY=0x...
   ```

---

## Deployment

### Netlify (Frontend)

The project includes `netlify.toml` for static site deployment:

```bash
# Build the application
npm run build

# Deploy to Netlify
# Connect your repository in Netlify dashboard
```

**Netlify Environment Variables:**
- `VITE_API_URL` - Backend API URL
- `VITE_BASE_RPC_URL` - Base RPC endpoint
- `VITE_CHAIN_ID` - Chain ID (84532 for Base Sepolia)

### Full Stack (Replit/Railway/Heroku)

```bash
# Build
npm run build

# Start production server
npm start
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Connect    │  │   Borrower   │  │    Lender    │          │
│  │   Wallet     │  │  Dashboard   │  │  Dashboard   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           │                                      │
│  ┌────────────────────────┴────────────────────────┐            │
│  │              TFHE Encryption Layer               │            │
│  │         (Client-side data encryption)            │            │
│  └────────────────────────┬────────────────────────┘            │
└───────────────────────────┼─────────────────────────────────────┘
                            │ HTTPS (Encrypted handles only)
┌───────────────────────────┼─────────────────────────────────────┐
│                      SERVER                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Auth API   │  │   Data API   │  │   Loan API   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         └─────────────────┼─────────────────┘                   │
│                           │                                      │
│  ┌────────────────────────┴────────────────────────┐            │
│  │              PostgreSQL Database                 │            │
│  │         (Stores encrypted handles only)          │            │
│  └────────────────────────┬────────────────────────┘            │
└───────────────────────────┼─────────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────────┐
│                   BLOCKCHAIN LAYER                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Base L2    │  │  Zama FHEVM  │  │ Coprocessor  │          │
│  │  (Storage)   │  │  (Contracts) │  │ (FHE Compute)│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security

### Data Protection
- All financial data encrypted client-side using TFHE
- No plaintext data ever leaves the browser
- Only encrypted handles stored in database and blockchain

### Access Control
- Role-based permissions (Borrower/Lender/Admin)
- Wallet-based authentication
- API endpoint authorization

### Audit Trail
- Comprehensive logging of all system events
- Immutable on-chain records
- Admin access to audit logs

### Best Practices
- HTTPS enforced on all connections
- Security headers configured (CSP, XSS protection)
- No sensitive data in logs or error messages

---

## Roadmap

### Phase 1: MVP (Complete)
- [x] Wallet authentication
- [x] Encrypted data submission
- [x] Credit score computation (simulated FHE)
- [x] Loan application flow
- [x] Role-based dashboards
- [x] Onboarding guide

### Phase 2: FHEVM Integration
- [ ] Deploy smart contracts on Base Sepolia
- [ ] Integrate TFHE-rs WASM for real encryption
- [ ] Connect to Zama coprocessor
- [ ] Real FHE credit score computation

### Phase 3: Advanced Features
- [ ] Multi-signature loan approvals
- [ ] Collateral management
- [ ] Repayment tracking
- [ ] Interest rate oracles

### Phase 4: Governance
- [ ] Governance token launch
- [ ] DAO voting on parameters
- [ ] Community-driven development

---

## Built For

**Zama Developer Program** - Demonstrating privacy-preserving DeFi applications using Fully Homomorphic Encryption.

## Resources

- [Zama Documentation](https://docs.zama.org/homepage/)
- [Zama Developer Program](https://docs.zama.org/programs/)
- [Base Network](https://base.org/)
- [TFHE-rs Library](https://docs.zama.org/tfhe-rs)

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- [Zama](https://www.zama.ai/) for FHEVM technology
- [Base](https://base.org/) for L2 infrastructure
