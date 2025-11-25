# Architecture Documentation
# Private Credit Scoring & Lending dApp

## System Overview

This document describes the technical architecture of the Private Credit dApp, a privacy-preserving lending platform built on Base L2 using Zama's Fully Homomorphic Encryption Virtual Machine (FHEVM).

## Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                   │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                  │
│   │   MetaMask   │   │   Browser    │   │  Encryption  │                  │
│   │   Wallet     │   │     App      │   │   Library    │                  │
│   │              │   │   (React)    │   │   (TFHE)     │                  │
│   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘                  │
│          │                  │                  │                           │
│          └──────────────────┼──────────────────┘                           │
│                             │                                              │
└─────────────────────────────┼──────────────────────────────────────────────┘
                              │ HTTPS + WebSocket
                              ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                      │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                  │
│   │     Auth     │   │    REST      │   │   Storage    │                  │
│   │  Middleware  │   │     API      │   │   Service    │                  │
│   │              │   │  (Express)   │   │              │                  │
│   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘                  │
│          │                  │                  │                           │
│          └──────────────────┼──────────────────┘                           │
│                             │                                              │
└─────────────────────────────┼──────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                     │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│   ┌──────────────────────────────────────────────────────────────────┐    │
│   │                     PostgreSQL (Neon)                             │    │
│   │                                                                   │    │
│   │   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │    │
│   │   │  Users  │ │Encrypted│ │ Credit  │ │  Loans  │ │  Audit  │   │    │
│   │   │         │ │  Data   │ │ Scores  │ │         │ │  Logs   │   │    │
│   │   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │    │
│   │                                                                   │    │
│   └──────────────────────────────────────────────────────────────────┘    │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                           BLOCKCHAIN LAYER                                  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                  │
│   │   Base L2    │   │ Zama FHEVM   │   │ Coprocessor  │                  │
│   │  (Ethereum)  │   │   Contracts  │   │   Service    │                  │
│   │              │   │              │   │              │                  │
│   └──────────────┘   └──────────────┘   └──────────────┘                  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Client Layer

#### 1.1 React Application
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: TanStack Query (server state)
- **Routing**: Wouter
- **UI Components**: shadcn/ui + Tailwind CSS

#### 1.2 Wallet Integration
- **Primary**: MetaMask
- **Authentication**: eth_requestAccounts + signature verification
- **Session**: localStorage persistence with wallet address

#### 1.3 Encryption Library
- **MVP**: Simulated encryption (base64 encoding with markers)
- **Production**: TFHE-rs WASM for client-side FHE

### 2. API Layer

#### 2.1 Express Server
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Development**: tsx (TypeScript execution)
- **Production**: esbuild bundling

#### 2.2 Authentication Middleware
```typescript
// X-Wallet-Address header validation
const authenticateWallet = async (req, res, next) => {
  const walletAddress = req.headers['x-wallet-address'];
  req.user = await storage.getUserByWallet(walletAddress);
  next();
};
```

#### 2.3 API Endpoints

| Category | Endpoint | Method | Auth Required |
|----------|----------|--------|---------------|
| Auth | `/api/auth/connect` | POST | No |
| Users | `/api/users/me` | GET | Yes |
| Data | `/api/encrypted-data` | GET/POST | Yes |
| Score | `/api/credit-score` | GET | Yes |
| Score | `/api/credit-score/compute` | POST | Yes |
| Loans | `/api/loans` | GET/POST | Yes |
| Loans | `/api/loans/pending` | GET | Lender |
| Loans | `/api/loans/:id/approve` | POST | Lender |
| Admin | `/api/admin/users` | GET | Admin |
| Admin | `/api/admin/audit-logs` | GET | Admin |

### 3. Data Layer

#### 3.1 Database Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  wallet_address VARCHAR UNIQUE NOT NULL,
  role VARCHAR NOT NULL DEFAULT 'borrower',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Encrypted data entities
CREATE TABLE encrypted_data_entities (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  encrypted_salary TEXT,
  encrypted_debts TEXT,
  encrypted_expenses TEXT,
  salt TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Credit scores
CREATE TABLE credit_scores (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  encrypted_score TEXT,
  risk_tier VARCHAR,
  computation_status VARCHAR,
  computed_at TIMESTAMP
);

-- Loans
CREATE TABLE loans (
  id UUID PRIMARY KEY,
  borrower_id UUID REFERENCES users(id),
  lender_id UUID REFERENCES users(id),
  amount NUMERIC,
  interest_rate NUMERIC,
  term_months INTEGER,
  status VARCHAR,
  risk_tier VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID,
  action VARCHAR NOT NULL,
  entity_type VARCHAR,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 3.2 ORM
- **Library**: Drizzle ORM
- **Type Safety**: Full TypeScript integration via drizzle-zod
- **Migrations**: drizzle-kit with db:push

### 4. Blockchain Layer

#### 4.1 Base L2
- **Network**: Base (Coinbase L2)
- **Testnet**: Base Sepolia (Chain ID: 84532)
- **Mainnet**: Base (Chain ID: 8453)
- **Benefits**: Low gas costs, fast finality, Ethereum security

#### 4.2 Zama FHEVM (Production)
```solidity
// Example encrypted credit score contract
contract CreditScorer {
    mapping(address => euint32) private encryptedScores;
    
    function computeScore(
        euint32 salary,
        euint32 debts,
        euint32 expenses
    ) external returns (euint32) {
        // FHE computation on encrypted values
        euint32 dti = TFHE.div(debts, salary);
        euint32 score = TFHE.sub(850, TFHE.mul(dti, 100));
        encryptedScores[msg.sender] = score;
        return score;
    }
}
```

#### 4.3 Coprocessor
- Heavy FHE operations executed off-chain
- Results verified on-chain
- Reduces gas costs for complex computations

## Security Architecture

### 1. Data Flow Security

```
User Input → Client Encryption → Encrypted Transmission → 
Backend Storage → FHE Computation → Encrypted Result → 
Client Decryption → User View
```

### 2. Access Control Matrix

| Resource | Borrower | Lender | Admin |
|----------|----------|--------|-------|
| Own Data | R/W | - | R |
| Own Score | R | - | R |
| All Scores | - | R (tier only) | R |
| Loan Requests | R (own) | R/W | R |
| Users | - | - | R |
| Audit Logs | - | - | R |

### 3. Audit Logging
All sensitive operations logged with:
- User ID (actor)
- Action type
- Entity affected
- Timestamp
- Metadata (non-sensitive)

## Deployment Architecture

### Development
```
┌─────────────────────────────┐
│       Replit Instance       │
│  ┌───────┐    ┌───────┐    │
│  │Vite   │    │Express│    │
│  │(HMR)  │───▶│(API)  │    │
│  └───────┘    └───┬───┘    │
│                   │        │
│                   ▼        │
│              ┌────────┐    │
│              │ Neon   │    │
│              │  DB    │    │
│              └────────┘    │
└─────────────────────────────┘
```

### Production (Netlify + Backend)
```
┌────────────────┐    ┌────────────────┐
│    Netlify     │    │  Backend Host  │
│   (Frontend)   │───▶│   (API + DB)   │
│                │    │                │
│  - CDN         │    │  - Express     │
│  - Edge        │    │  - PostgreSQL  │
│  - SSL         │    │  - WebSocket   │
└────────────────┘    └────────────────┘
```

## Performance Considerations

### 1. Caching Strategy
- TanStack Query: Client-side cache with staleTime
- No server-side caching (data freshness priority)

### 2. Bundle Optimization
- Vite code splitting
- Tree shaking for unused code
- Lazy loading for routes

### 3. Database Optimization
- Indexed queries on wallet_address
- Connection pooling via Neon
- Efficient JOIN patterns

## Monitoring & Observability

### 1. Application Logs
- Express request logging
- Error tracking with stack traces
- Audit log for security events

### 2. Metrics (Future)
- Request latency
- Error rates
- User activity
- Coprocessor health

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend Framework | React | Ecosystem, team familiarity |
| State Management | TanStack Query | Server state focus, caching |
| Styling | Tailwind + shadcn | Rapid development, consistency |
| Backend Runtime | Node.js | JavaScript ecosystem, async I/O |
| Database | PostgreSQL | ACID compliance, reliability |
| ORM | Drizzle | Type safety, performance |
| L2 Network | Base | Low cost, Coinbase backing |
| FHE | Zama FHEVM | Production-ready, tooling |
