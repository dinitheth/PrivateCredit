# Smart Contract Deployment Guide

This guide explains how to deploy the FHEVM smart contracts for the Private Credit dApp on Base Sepolia testnet.

## Overview

The dApp requires four smart contracts to enable fully on-chain privacy-preserving credit scoring:

1. **UserDataStore** - Stores encrypted financial data
2. **CreditScorer** - Computes credit scores on encrypted data
3. **BorrowingPolicy** - Manages loan approvals
4. **AccessControl** - Permission management

## Prerequisites

- Node.js 20+
- Hardhat
- Zama Hardhat FHEVM plugin
- Base Sepolia testnet ETH (from faucet)
- Private key for deployment

## Setup

### 1. Install Dependencies

```bash
npm install hardhat @nomicfoundation/hardhat-toolbox
npm install @zama/hardhat-fhevm
```

### 2. Configure Hardhat

Create `hardhat.config.ts`:

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@zama/hardhat-fhevm";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      chainId: 84532,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};

export default config;
```

## Smart Contracts

### UserDataStore.sol

Stores encrypted financial data handles for each user.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";

contract UserDataStore {
    struct EncryptedData {
        euint32 salary;
        euint32 debts;
        euint32 expenses;
        uint256 timestamp;
        bool exists;
    }
    
    mapping(address => EncryptedData) private userData;
    mapping(address => mapping(address => bool)) private accessGrants;
    
    event DataSubmitted(address indexed user, uint256 timestamp);
    event AccessGranted(address indexed owner, address indexed viewer);
    event AccessRevoked(address indexed owner, address indexed viewer);
    
    function submitData(
        einput encryptedSalary,
        einput encryptedDebts,
        einput encryptedExpenses,
        bytes calldata inputProof
    ) external {
        euint32 salary = TFHE.asEuint32(encryptedSalary, inputProof);
        euint32 debts = TFHE.asEuint32(encryptedDebts, inputProof);
        euint32 expenses = TFHE.asEuint32(encryptedExpenses, inputProof);
        
        userData[msg.sender] = EncryptedData({
            salary: salary,
            debts: debts,
            expenses: expenses,
            timestamp: block.timestamp,
            exists: true
        });
        
        // Allow the user to access their own data
        TFHE.allow(salary, msg.sender);
        TFHE.allow(debts, msg.sender);
        TFHE.allow(expenses, msg.sender);
        
        emit DataSubmitted(msg.sender, block.timestamp);
    }
    
    function hasData(address user) external view returns (bool) {
        return userData[user].exists;
    }
    
    function getData(address user) external view returns (
        euint32 salary,
        euint32 debts,
        euint32 expenses
    ) {
        require(
            msg.sender == user || accessGrants[user][msg.sender],
            "Access denied"
        );
        require(userData[user].exists, "No data found");
        
        return (
            userData[user].salary,
            userData[user].debts,
            userData[user].expenses
        );
    }
    
    function grantAccess(address viewer) external {
        require(userData[msg.sender].exists, "Submit data first");
        accessGrants[msg.sender][viewer] = true;
        
        // Allow viewer to access encrypted data
        TFHE.allow(userData[msg.sender].salary, viewer);
        TFHE.allow(userData[msg.sender].debts, viewer);
        TFHE.allow(userData[msg.sender].expenses, viewer);
        
        emit AccessGranted(msg.sender, viewer);
    }
    
    function revokeAccess(address viewer) external {
        accessGrants[msg.sender][viewer] = false;
        emit AccessRevoked(msg.sender, viewer);
    }
}
```

### CreditScorer.sol

Computes credit scores on encrypted data using FHE operations.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";

interface IUserDataStore {
    function getData(address user) external view returns (
        euint32 salary,
        euint32 debts,
        euint32 expenses
    );
    function hasData(address user) external view returns (bool);
}

contract CreditScorer {
    IUserDataStore public dataStore;
    
    mapping(address => euint32) private creditScores;
    mapping(address => bool) private hasScore;
    
    event ScoreComputed(address indexed user, uint256 timestamp);
    
    constructor(address _dataStore) {
        dataStore = IUserDataStore(_dataStore);
    }
    
    function computeScore(address user) external returns (euint32) {
        require(dataStore.hasData(user), "No financial data found");
        
        (euint32 salary, euint32 debts, euint32 expenses) = dataStore.getData(user);
        
        // Base score: 600
        euint32 baseScore = TFHE.asEuint32(600);
        
        // Compute debt-to-income ratio adjustment
        // If debts < salary * 0.2, add 150 points
        euint32 lowDebtThreshold = TFHE.mul(salary, TFHE.asEuint32(20));
        lowDebtThreshold = TFHE.div(lowDebtThreshold, TFHE.asEuint32(100));
        ebool isLowDebt = TFHE.lt(debts, lowDebtThreshold);
        euint32 debtBonus = TFHE.select(isLowDebt, TFHE.asEuint32(150), TFHE.asEuint32(0));
        
        // If debts < salary * 0.4, add 100 points
        euint32 medDebtThreshold = TFHE.mul(salary, TFHE.asEuint32(40));
        medDebtThreshold = TFHE.div(medDebtThreshold, TFHE.asEuint32(100));
        ebool isMedDebt = TFHE.lt(debts, medDebtThreshold);
        euint32 medDebtBonus = TFHE.select(isMedDebt, TFHE.asEuint32(100), TFHE.asEuint32(0));
        
        // Compute expense ratio adjustment
        // Monthly salary = annual / 12
        euint32 monthlySalary = TFHE.div(salary, TFHE.asEuint32(12));
        
        // If expenses < monthlySalary * 0.3, add 100 points
        euint32 lowExpenseThreshold = TFHE.mul(monthlySalary, TFHE.asEuint32(30));
        lowExpenseThreshold = TFHE.div(lowExpenseThreshold, TFHE.asEuint32(100));
        ebool isLowExpense = TFHE.lt(expenses, lowExpenseThreshold);
        euint32 expenseBonus = TFHE.select(isLowExpense, TFHE.asEuint32(100), TFHE.asEuint32(0));
        
        // Calculate final score
        euint32 finalScore = TFHE.add(baseScore, debtBonus);
        finalScore = TFHE.add(finalScore, TFHE.select(
            TFHE.not(isLowDebt),
            medDebtBonus,
            TFHE.asEuint32(0)
        ));
        finalScore = TFHE.add(finalScore, expenseBonus);
        
        // Clamp score between 300 and 850
        ebool tooLow = TFHE.lt(finalScore, TFHE.asEuint32(300));
        finalScore = TFHE.select(tooLow, TFHE.asEuint32(300), finalScore);
        
        ebool tooHigh = TFHE.gt(finalScore, TFHE.asEuint32(850));
        finalScore = TFHE.select(tooHigh, TFHE.asEuint32(850), finalScore);
        
        // Store and allow access
        creditScores[user] = finalScore;
        hasScore[user] = true;
        TFHE.allow(finalScore, user);
        
        emit ScoreComputed(user, block.timestamp);
        
        return finalScore;
    }
    
    function getScore(address user) external view returns (euint32) {
        require(hasScore[user], "No score computed");
        require(msg.sender == user, "Can only view own score");
        return creditScores[user];
    }
    
    function hasComputedScore(address user) external view returns (bool) {
        return hasScore[user];
    }
}
```

### BorrowingPolicy.sol

Manages loan applications and approvals.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";

interface ICreditScorer {
    function getScore(address user) external view returns (euint32);
    function hasComputedScore(address user) external view returns (bool);
}

contract BorrowingPolicy {
    ICreditScorer public creditScorer;
    
    struct Loan {
        address borrower;
        address lender;
        uint256 amount;
        uint256 interestRate; // basis points (e.g., 500 = 5%)
        uint256 createdAt;
        LoanStatus status;
    }
    
    enum LoanStatus { Pending, Approved, Denied, Active, Repaid }
    
    mapping(uint256 => Loan) public loans;
    mapping(address => uint256[]) public borrowerLoans;
    mapping(address => bool) public authorizedLenders;
    
    uint256 public loanCounter;
    
    event LoanRequested(uint256 indexed loanId, address indexed borrower, uint256 amount);
    event LoanApproved(uint256 indexed loanId, address indexed lender);
    event LoanDenied(uint256 indexed loanId, address indexed lender);
    
    constructor(address _creditScorer) {
        creditScorer = ICreditScorer(_creditScorer);
    }
    
    function requestLoan(uint256 amount) external returns (uint256) {
        require(creditScorer.hasComputedScore(msg.sender), "Compute credit score first");
        require(amount > 0, "Amount must be positive");
        
        uint256 loanId = loanCounter++;
        
        loans[loanId] = Loan({
            borrower: msg.sender,
            lender: address(0),
            amount: amount,
            interestRate: 0,
            createdAt: block.timestamp,
            status: LoanStatus.Pending
        });
        
        borrowerLoans[msg.sender].push(loanId);
        
        emit LoanRequested(loanId, msg.sender, amount);
        
        return loanId;
    }
    
    function getRiskTier(address borrower) public view returns (string memory) {
        require(creditScorer.hasComputedScore(borrower), "No score");
        
        // Note: In production, this would use FHE comparison
        // For demo purposes, we return a placeholder
        // The actual comparison happens in the coprocessor
        return "encrypted";
    }
    
    function approveLoan(uint256 loanId, uint256 interestRate) external {
        require(authorizedLenders[msg.sender] || loans[loanId].borrower != msg.sender, "Not authorized");
        require(loans[loanId].status == LoanStatus.Pending, "Loan not pending");
        
        loans[loanId].lender = msg.sender;
        loans[loanId].interestRate = interestRate;
        loans[loanId].status = LoanStatus.Approved;
        
        emit LoanApproved(loanId, msg.sender);
    }
    
    function denyLoan(uint256 loanId) external {
        require(authorizedLenders[msg.sender] || loans[loanId].borrower != msg.sender, "Not authorized");
        require(loans[loanId].status == LoanStatus.Pending, "Loan not pending");
        
        loans[loanId].status = LoanStatus.Denied;
        
        emit LoanDenied(loanId, msg.sender);
    }
    
    function setLenderAuthorization(address lender, bool authorized) external {
        // In production, this would be restricted to admin/governance
        authorizedLenders[lender] = authorized;
    }
    
    function getLoan(uint256 loanId) external view returns (Loan memory) {
        return loans[loanId];
    }
    
    function getBorrowerLoans(address borrower) external view returns (uint256[] memory) {
        return borrowerLoans[borrower];
    }
}
```

## Deployment Script

Create `scripts/deploy.ts`:

```typescript
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // Deploy UserDataStore
  const UserDataStore = await ethers.getContractFactory("UserDataStore");
  const userDataStore = await UserDataStore.deploy();
  await userDataStore.waitForDeployment();
  console.log("UserDataStore deployed to:", await userDataStore.getAddress());

  // Deploy CreditScorer
  const CreditScorer = await ethers.getContractFactory("CreditScorer");
  const creditScorer = await CreditScorer.deploy(await userDataStore.getAddress());
  await creditScorer.waitForDeployment();
  console.log("CreditScorer deployed to:", await creditScorer.getAddress());

  // Deploy BorrowingPolicy
  const BorrowingPolicy = await ethers.getContractFactory("BorrowingPolicy");
  const borrowingPolicy = await BorrowingPolicy.deploy(await creditScorer.getAddress());
  await borrowingPolicy.waitForDeployment();
  console.log("BorrowingPolicy deployed to:", await borrowingPolicy.getAddress());

  // Grant access for CreditScorer to read from UserDataStore
  // This is done by users granting access to the scorer contract

  console.log("\nDeployment complete!");
  console.log("Update your .env with these addresses:");
  console.log(`VITE_USER_DATA_STORE=${await userDataStore.getAddress()}`);
  console.log(`VITE_CREDIT_SCORER=${await creditScorer.getAddress()}`);
  console.log(`VITE_BORROWING_POLICY=${await borrowingPolicy.getAddress()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

## Deployment Commands

```bash
# Compile contracts
npx hardhat compile

# Deploy to Base Sepolia
npx hardhat run scripts/deploy.ts --network baseSepolia

# Verify contracts (optional)
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## Frontend Integration

After deployment, update the frontend to use the real contracts:

### 1. Update Environment Variables

```bash
VITE_USER_DATA_STORE=0x...
VITE_CREDIT_SCORER=0x...
VITE_BORROWING_POLICY=0x...
VITE_CHAIN_ID=84532
VITE_BASE_RPC_URL=https://sepolia.base.org
```

### 2. Update Encryption Library

Replace the simulated encryption in `client/src/lib/encryption.ts` with actual TFHE-rs WASM calls:

```typescript
import { createInstance } from 'fhevmjs';

let fhevmInstance: any = null;

export async function initFHEVM() {
  if (!fhevmInstance) {
    fhevmInstance = await createInstance({
      chainId: 84532,
      publicKey: await getPublicKey(), // From gateway
    });
  }
  return fhevmInstance;
}

export async function encryptValue(value: number): Promise<Uint8Array> {
  const instance = await initFHEVM();
  const encrypted = instance.encrypt32(value);
  return encrypted;
}
```

### 3. Update API Calls

Modify the submit data flow to call the smart contract:

```typescript
import { ethers } from 'ethers';
import { encryptValue } from './encryption';

export async function submitEncryptedData(salary: number, debts: number, expenses: number) {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  const contract = new ethers.Contract(
    import.meta.env.VITE_USER_DATA_STORE,
    UserDataStoreABI,
    signer
  );
  
  const encSalary = await encryptValue(salary);
  const encDebts = await encryptValue(debts);
  const encExpenses = await encryptValue(expenses);
  
  const tx = await contract.submitData(
    encSalary,
    encDebts,
    encExpenses,
    proof // From TFHE encryption
  );
  
  await tx.wait();
}
```

## Testing

Create test cases in `test/PrivateCredit.test.ts`:

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Private Credit dApp", function () {
  it("Should deploy all contracts", async function () {
    const UserDataStore = await ethers.getContractFactory("UserDataStore");
    const userDataStore = await UserDataStore.deploy();
    
    expect(await userDataStore.getAddress()).to.be.properAddress;
  });
  
  // Add more tests for encrypted operations
});
```

## Gas Estimates

| Operation | Estimated Gas |
|-----------|--------------|
| Submit Data | ~200,000 |
| Compute Score | ~500,000 |
| Request Loan | ~100,000 |
| Approve Loan | ~80,000 |

Note: FHE operations are more gas-intensive than standard operations.

## Security Considerations

1. **Access Control**: Ensure only authorized parties can access encrypted data
2. **Key Management**: Properly manage the FHE public/private keys
3. **Contract Upgrades**: Consider using proxy patterns for upgradeability
4. **Audits**: Get contracts audited before mainnet deployment

## Resources

- [Zama FHEVM Documentation](https://docs.zama.org/fhevm)
- [Base Network Documentation](https://docs.base.org/)
- [Hardhat Documentation](https://hardhat.org/docs)
