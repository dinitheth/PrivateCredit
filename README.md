# Private Credit dApp

A privacy-preserving credit scoring and automated lending decentralized application (dApp) built on Base L2, powered by Zama's Fully Homomorphic Encryption Virtual Machine (FHEVM).

![Private Credit dApp](https://img.shields.io/badge/Base-L2-blue) ![Zama FHEVM](https://img.shields.io/badge/Zama-FHEVM-purple) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## Overview

This application enables borrowers to submit encrypted financial data, receive confidential credit scores computed on-chain, and obtain loan approvals without ever exposing their raw financial information in plaintext.

### Key Features

- **End-to-End Encryption**: Financial data encrypted client-side before blockchain submission
- **Confidential Computation**: Credit scores computed on encrypted data using FHE
- **Privacy-Preserving Risk Assessment**: Lenders see risk tiers, never raw borrower data
- **Role-Based Access**: Separate dashboards for Borrowers, Lenders, and Admins
- **MetaMask Integration**: Real wallet connection for authentication

## Technology Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- TanStack Query for server state
- Tailwind CSS + shadcn/ui components
- Wouter for routing

### Backend
- Express.js with TypeScript
- PostgreSQL (Neon Serverless)
- Drizzle ORM

### Blockchain
- Base L2 (Ethereum Layer 2)
- Zama FHEVM for confidential smart contracts
- MetaMask wallet integration

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- MetaMask browser extension (for wallet connection)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd private-credit-dapp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Required
DATABASE_URL=postgresql://...

# Optional (for production FHEVM integration)
VITE_BASE_RPC_URL=https://mainnet.base.org
VITE_CHAIN_ID=8453
```

4. Initialize the database:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Usage Guide

### For Borrowers

1. **Connect Wallet**: Click "Connect with MetaMask" and select "Borrower" role
2. **Submit Financial Data**: Navigate to "Submit Data" and enter your salary, debts, and expenses
3. **View Credit Score**: Your encrypted credit score will be computed and displayed on the dashboard
4. **Apply for Loans**: Browse available loans and submit applications

### For Lenders

1. **Connect Wallet**: Click "Connect with MetaMask" and select "Lender" role
2. **Review Requests**: View pending loan applications with encrypted risk tiers
3. **Approve/Deny**: Make lending decisions based on risk assessment
4. **Monitor Portfolio**: Track active loans and repayment status

### For Admins

1. **Connect Wallet**: Click "Connect with MetaMask" and select "Admin" role
2. **Monitor System**: View coprocessor status and system health
3. **Manage Users**: Review registered users and their roles
4. **Audit Logs**: Access complete system activity history

## Deployment

### Netlify (Frontend Only)

1. Connect your repository to Netlify
2. Build settings are configured in `netlify.toml`
3. Set environment variables in Netlify dashboard:
   - `VITE_API_URL`: Your backend API URL
   - `VITE_BASE_RPC_URL`: Base L2 RPC URL
   - `VITE_CHAIN_ID`: Chain ID

### Full Stack (Replit)

The application is configured to run on Replit with both frontend and backend on the same server.

```bash
npm run dev    # Development
npm run build  # Production build
npm start      # Production server
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Connect   │  │  Borrower   │  │   Lender    │         │
│  │   Wallet    │  │  Dashboard  │  │  Dashboard  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                │                │                  │
│         └────────────────┼────────────────┘                  │
│                          │                                   │
│                    ┌─────┴─────┐                            │
│                    │  useAuth  │  (MetaMask Integration)    │
│                    └───────────┘                            │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────┴──────────────────────────────────┐
│                        Backend                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Auth API  │  │  Data API   │  │  Loan API   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                          │                                   │
│                    ┌─────┴─────┐                            │
│                    │  Storage  │  (PostgreSQL)              │
│                    └───────────┘                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                   Blockchain Layer                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Base L2   │  │ Zama FHEVM  │  │ Coprocessor │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/connect` | POST | Connect wallet and authenticate |
| `/api/users/me` | GET | Get current user |
| `/api/encrypted-data` | POST | Submit encrypted financial data |
| `/api/credit-score` | GET | Get credit score |
| `/api/credit-score/compute` | POST | Trigger score computation |
| `/api/loans` | GET/POST | Get/create loans |
| `/api/loans/pending` | GET | Get pending loan requests (lender) |
| `/api/loans/:id/approve` | POST | Approve loan (lender) |
| `/api/loans/:id/deny` | POST | Deny loan (lender) |
| `/api/admin/users` | GET | Get all users (admin) |
| `/api/admin/audit-logs` | GET | Get audit logs (admin) |

## Security Considerations

- All financial data is encrypted client-side before transmission
- Credit scores are computed on encrypted ciphertexts
- Private keys never leave the user's browser
- Role-based access control on all endpoints
- Comprehensive audit logging

## Future Enhancements

- [ ] Full Zama FHEVM smart contract integration
- [ ] Multi-signature loan approvals
- [ ] Collateral management
- [ ] Interest rate oracles
- [ ] Governance token integration

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- [Zama](https://www.zama.ai/) for FHEVM technology
- [Base](https://base.org/) for L2 infrastructure
- Built for the Zama Developer Program
