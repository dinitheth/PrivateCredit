# Product Requirements Document (PRD)
# Private Credit Scoring & Lending dApp

**Version:** 1.0  
**Date:** November 2025  
**Author:** Development Team  
**Status:** MVP Complete

---

## 1. Executive Summary

### 1.1 Product Vision
Build a privacy-preserving credit scoring and automated lending platform that enables borrowers to obtain credit without exposing their sensitive financial information, while allowing lenders to make informed decisions based on encrypted risk assessments.

### 1.2 Problem Statement
Traditional credit scoring requires borrowers to share sensitive financial data (income, debts, expenses) with multiple parties, creating privacy risks and potential for data breaches. Borrowers have no control over who sees their data or how it's used.

### 1.3 Solution
Leverage Fully Homomorphic Encryption (FHE) via Zama's FHEVM to:
- Encrypt financial data client-side before any transmission
- Compute credit scores directly on encrypted data
- Enable lending decisions based on risk tiers without revealing underlying data
- Provide borrowers complete control and privacy over their financial information

---

## 2. Target Users

### 2.1 User Personas

#### Borrower (Primary User)
- **Profile**: Individual seeking credit/loans
- **Pain Points**: Privacy concerns, data breaches, unwanted data sharing
- **Goals**: Obtain credit while maintaining financial privacy
- **Technical Level**: Basic (wallet usage)

#### Lender (Primary User)
- **Profile**: Individual or institution providing loans
- **Pain Points**: Assessing creditworthiness without full data access
- **Goals**: Make informed lending decisions, minimize default risk
- **Technical Level**: Intermediate (DeFi familiarity)

#### Admin (Secondary User)
- **Profile**: Platform operator/maintainer
- **Pain Points**: System monitoring, compliance requirements
- **Goals**: Ensure system health, maintain audit trails
- **Technical Level**: Advanced

---

## 3. Feature Requirements

### 3.1 Core Features (MVP)

#### F1: Wallet Authentication
| Aspect | Description |
|--------|-------------|
| Priority | P0 (Critical) |
| Description | Users authenticate via MetaMask wallet connection |
| Acceptance Criteria | - MetaMask prompt on connection<br>- Demo mode available without MetaMask<br>- Role selection during connection<br>- Session persistence across refreshes |

#### F2: Encrypted Data Submission
| Aspect | Description |
|--------|-------------|
| Priority | P0 (Critical) |
| Description | Borrowers submit encrypted financial data |
| Acceptance Criteria | - Input fields for salary, debts, expenses<br>- Client-side encryption before submission<br>- Visual encryption indicator<br>- Success/error feedback |

#### F3: Credit Score Computation
| Aspect | Description |
|--------|-------------|
| Priority | P0 (Critical) |
| Description | Compute credit scores on encrypted data |
| Acceptance Criteria | - Score computation triggered after data submission<br>- Score range 300-850<br>- Risk tier classification (Low/Medium/High)<br>- Owner-only decryption |

#### F4: Loan Application
| Aspect | Description |
|--------|-------------|
| Priority | P0 (Critical) |
| Description | Borrowers apply for loans based on credit profile |
| Acceptance Criteria | - Loan amount input<br>- Term selection<br>- Interest rate display based on risk tier<br>- Application status tracking |

#### F5: Lender Dashboard
| Aspect | Description |
|--------|-------------|
| Priority | P0 (Critical) |
| Description | Lenders review and manage loan requests |
| Acceptance Criteria | - Pending requests table<br>- Risk tier visibility<br>- Approve/deny actions<br>- Portfolio overview |

#### F6: Admin Dashboard
| Aspect | Description |
|--------|-------------|
| Priority | P1 (High) |
| Description | System monitoring and management |
| Acceptance Criteria | - Coprocessor status display<br>- User list view<br>- Audit log access<br>- Basic statistics |

#### F7: Onboarding Guide
| Aspect | Description |
|--------|-------------|
| Priority | P1 (High) |
| Description | First-time user tutorial |
| Acceptance Criteria | - Automatic display for new users<br>- Role-specific content<br>- Skip option<br>- Accessible via help button |

### 3.2 Future Features (Post-MVP)

| Feature | Priority | Description |
|---------|----------|-------------|
| Full FHEVM Integration | P0 | Replace simulated encryption with actual Zama SDK |
| Smart Contract Deployment | P0 | Deploy contracts on Base L2 |
| Multi-sig Approvals | P1 | Require multiple lender approvals |
| Collateral Management | P1 | Support collateralized loans |
| Repayment Tracking | P1 | Automated repayment scheduling |
| Interest Rate Oracles | P2 | Dynamic rates based on market |
| Governance | P2 | Token-based voting on parameters |

---

## 4. Technical Requirements

### 4.1 Performance
| Metric | Target |
|--------|--------|
| Page Load Time | < 2 seconds |
| API Response Time | < 500ms |
| Credit Score Computation | < 10 seconds |
| Concurrent Users | 1000+ |

### 4.2 Security
- All sensitive data encrypted at rest and in transit
- No plaintext financial data stored on backend
- Role-based access control (RBAC)
- Comprehensive audit logging
- HTTPS only

### 4.3 Compatibility
- **Browsers**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Wallets**: MetaMask (primary), WalletConnect (future)
- **Networks**: Base Sepolia (testnet), Base Mainnet (production)

### 4.4 Deployment
- Frontend: Static hosting (Netlify, Vercel)
- Backend: Node.js server (Replit, Railway, Heroku)
- Database: PostgreSQL (Neon Serverless)
- Blockchain: Base L2

---

## 5. User Flows

### 5.1 Borrower Journey

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Connect   │───▶│   Submit    │───▶│    View     │
│   Wallet    │    │    Data     │    │   Score     │
└─────────────┘    └─────────────┘    └─────────────┘
                                             │
                                             ▼
                   ┌─────────────┐    ┌─────────────┐
                   │   Track     │◀───│   Apply     │
                   │   Status    │    │  for Loan   │
                   └─────────────┘    └─────────────┘
```

### 5.2 Lender Journey

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Connect   │───▶│   Review    │───▶│  Approve/   │
│   Wallet    │    │  Requests   │    │    Deny     │
└─────────────┘    └─────────────┘    └─────────────┘
                                             │
                                             ▼
                                      ┌─────────────┐
                                      │   Monitor   │
                                      │  Portfolio  │
                                      └─────────────┘
```

---

## 6. Success Metrics

### 6.1 MVP Success Criteria
| Metric | Target |
|--------|--------|
| User Registration | 100+ test users |
| Successful Encryptions | 95% success rate |
| Score Computations | < 10s average |
| Loan Applications | 50+ test applications |
| System Uptime | 99%+ |

### 6.2 Production KPIs
| Metric | Target |
|--------|--------|
| Monthly Active Users | 10,000+ |
| Total Value Locked | $1M+ |
| Default Rate | < 5% |
| User Satisfaction | 4.5/5 stars |

---

## 7. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| FHEVM Integration Complexity | High | Medium | Start with simulation, iterate |
| User Adoption | High | Medium | Clear onboarding, documentation |
| Gas Cost Volatility | Medium | High | L2 deployment, gas optimization |
| Regulatory Uncertainty | High | Low | Legal review, compliance framework |
| Smart Contract Bugs | Critical | Medium | Audits, bug bounties, testnets |

---

## 8. Timeline

### Phase 1: MVP (Complete)
- [x] Core authentication
- [x] Encrypted data submission
- [x] Credit score computation (simulated)
- [x] Loan application flow
- [x] Role-based dashboards
- [x] Onboarding guide

### Phase 2: Integration (4-6 weeks)
- [ ] Zama FHEVM SDK integration
- [ ] Smart contract development
- [ ] Base L2 testnet deployment
- [ ] Security audit

### Phase 3: Production (2-4 weeks)
- [ ] Mainnet deployment
- [ ] Performance optimization
- [ ] Additional wallet support
- [ ] Advanced features

---

## 9. Appendix

### 9.1 Glossary
| Term | Definition |
|------|------------|
| FHE | Fully Homomorphic Encryption - allows computation on encrypted data |
| FHEVM | FHE Virtual Machine - Zama's smart contract execution environment |
| Base L2 | Coinbase's Ethereum Layer 2 scaling solution |
| Risk Tier | Categorization (Low/Medium/High) based on credit score |
| Coprocessor | Off-chain component that executes FHE operations |

### 9.2 References
- [Zama FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Base L2 Documentation](https://docs.base.org/)
- [EIP-4337 Account Abstraction](https://eips.ethereum.org/EIPS/eip-4337)
