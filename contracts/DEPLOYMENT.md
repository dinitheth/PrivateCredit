# Smart Contract Deployment Guide

## Overview

This guide walks you through deploying the Private Credit dApp smart contracts to Base Sepolia testnet.

## Contract Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Private Credit dApp                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌──────────────────────┐               │
│  │  AccessControl  │◄───│  EncryptedDataVault  │               │
│  │  (Roles: Admin, │    │  (Stores encrypted   │               │
│  │  Lender,        │    │   financial data     │               │
│  │  Borrower)      │    │   handles)           │               │
│  └────────▲────────┘    └──────────┬───────────┘               │
│           │                        │                            │
│           │                        ▼                            │
│           │             ┌──────────────────────┐               │
│           │             │    CreditScorer      │               │
│           │◄────────────│  (Computes scores    │               │
│           │             │   on encrypted data) │               │
│           │             └──────────┬───────────┘               │
│           │                        │                            │
│           │                        ▼                            │
│           │             ┌──────────────────────┐               │
│           └─────────────│    LoanManager       │               │
│                         │  (Loan lifecycle     │               │
│                         │   management)        │               │
│                         └──────────────────────┘               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **Node.js** (v18+)
2. **MetaMask** wallet with Base Sepolia ETH
3. **Private Key** from your MetaMask wallet

## Step-by-Step Deployment

### 1. Get Base Sepolia Test ETH

Visit the faucet: https://portal.cdp.coinbase.com/products/faucet

1. Sign in with Coinbase account
2. Select "Base Sepolia" network
3. Enter your wallet address
4. Request test ETH

### 2. Set Up Hardhat Project

```bash
# Navigate to contracts directory
cd contracts

# Initialize npm and install dependencies
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox dotenv

# Initialize hardhat (choose "Create an empty hardhat.config.js")
npx hardhat init
```

### 3. Configure Environment

Create `.env` file in contracts directory:

```env
# Your MetaMask private key (NEVER share or commit this!)
PRIVATE_KEY=your_private_key_here

# Optional: For contract verification on BaseScan
BASESCAN_API_KEY=your_basescan_api_key
```

**⚠️ IMPORTANT:** 
- Never share your private key
- Add `.env` to `.gitignore`
- Use a dedicated testnet wallet

### 4. Export Private Key from MetaMask

1. Open MetaMask
2. Click the three dots → Account Details
3. Click "Show Private Key"
4. Enter password
5. Copy the private key (starts with "0x" or without it)

### 5. Deploy Contracts

```bash
# Compile contracts
npx hardhat compile

# Deploy to Base Sepolia
npx hardhat run deploy.js --network baseSepolia
```

### 6. Verify Contracts (Optional but Recommended)

```bash
# Verify AccessControl
npx hardhat verify --network baseSepolia <ACCESS_CONTROL_ADDRESS>

# Verify EncryptedDataVault
npx hardhat verify --network baseSepolia <DATA_VAULT_ADDRESS>

# Verify CreditScorer
npx hardhat verify --network baseSepolia <CREDIT_SCORER_ADDRESS> "<DATA_VAULT_ADDRESS>"

# Verify LoanManager
npx hardhat verify --network baseSepolia <LOAN_MANAGER_ADDRESS> "<CREDIT_SCORER_ADDRESS>"
```

## Expected Output

After successful deployment:

```
🚀 Starting Private Credit dApp Contract Deployment...

Deploying contracts with account: 0xYourAddress
Account balance: 0.1 ETH

1️⃣ Deploying AccessControl...
   ✅ AccessControl deployed to: 0x...

2️⃣ Deploying EncryptedDataVault...
   ✅ EncryptedDataVault deployed to: 0x...

3️⃣ Deploying CreditScorer...
   ✅ CreditScorer deployed to: 0x...

4️⃣ Deploying LoanManager...
   ✅ LoanManager deployed to: 0x...

============================================================
🎉 DEPLOYMENT COMPLETE!
============================================================

Contract Addresses:
-------------------
AccessControl:       0x...
EncryptedDataVault:  0x...
CreditScorer:        0x...
LoanManager:         0x...
```

## Integration with Frontend

After deployment, add contract addresses to your frontend `.env`:

```env
VITE_ACCESS_CONTROL_ADDRESS=0x...
VITE_DATA_VAULT_ADDRESS=0x...
VITE_CREDIT_SCORER_ADDRESS=0x...
VITE_LOAN_MANAGER_ADDRESS=0x...
```

## Contract Functions Summary

### AccessControl.sol
- `registerAsBorrower()` - Self-register as borrower
- `registerAsLender()` - Self-register as lender
- `grantAdmin(address)` - Grant admin role (admin only)
- `getRole(address)` - Check user's role

### EncryptedDataVault.sol
- `submitEncryptedData(bytes32, bytes32, bytes32)` - Submit encrypted financial data
- `getEncryptedData(address)` - Get user's encrypted data
- `hasActiveData(address)` - Check if user has active data
- `revokeData()` - Revoke your own data

### CreditScorer.sol
- `requestScoreComputation()` - Request credit score calculation
- `getCreditScore(address)` - Get credit score details
- `hasValidScore(address)` - Check if score is valid

### LoanManager.sol
- `applyForLoan(uint256, uint256)` - Apply for a loan
- `approveLoan(uint256)` - Approve and fund a loan (lender)
- `denyLoan(uint256, string)` - Deny a loan application
- `repayLoan(uint256)` - Repay a loan

## Gas Estimates

Approximate gas costs on Base Sepolia:
- AccessControl deployment: ~800,000 gas
- EncryptedDataVault deployment: ~1,200,000 gas
- CreditScorer deployment: ~1,500,000 gas
- LoanManager deployment: ~2,000,000 gas

**Total deployment: ~5,500,000 gas (~0.00055 ETH at 0.1 gwei)**

## Troubleshooting

### "Insufficient funds"
Get more test ETH from the faucet.

### "Network mismatch"
Ensure MetaMask is on Base Sepolia (Chain ID: 84532).

### "Contract verification failed"
Wait 1-2 minutes after deployment before verifying.

## Security Notes

1. These contracts are for **testnet demonstration only**
2. Full FHE integration requires Zama FHEVM coprocessor setup
3. Production deployment needs thorough security audits
4. Never use testnet private keys on mainnet
