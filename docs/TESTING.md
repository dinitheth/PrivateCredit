# Testing Guide

This document describes the testing strategy for the Private Credit Scoring & Lending dApp.

## Overview

The application includes comprehensive unit and integration tests covering:
- Encryption/decryption functionality
- Authentication and user sessions
- Loan management and status transitions
- Risk assessment algorithms
- Schema validation

## Running Tests

### Prerequisites

```bash
npm install
```

Tests use Vitest, which is already configured in the project.

### Run All Tests

```bash
npm test
```

### Run Tests with UI

```bash
npm test:ui
```

Opens an interactive test dashboard in your browser.

### Run Tests with Coverage

```bash
npm test:coverage
```

Generates a coverage report showing which parts of the code are tested.

### Run Specific Test File

```bash
npm test -- client/src/__tests__/encryption.test.ts
npm test -- server/__tests__/auth.test.ts
npm test -- server/__tests__/loans.test.ts
npm test -- shared/__tests__/schema.test.ts
```

## Test Structure

### Encryption Tests (`client/src/__tests__/encryption.test.ts`)

Tests the TFHE encryption/decryption simulation:

- **simulateEncryption**: Validates that numeric values are properly encrypted
  - Handles zero values
  - Handles large numbers
  - Returns properly formatted encrypted handles
  
- **simulateDecryption**: Validates decryption works correctly
  - Recovers original values
  - Handles invalid handles gracefully
  - Maintains consistency across multiple encryptions
  
- **TFHE Keypair Generation**: Validates cryptographic keypair creation
  - Generates keypairs with valid format
  - Creates unique keypairs on each call
  
- **Financial Data Encryption**: Integration tests for complete encryption cycles
  - Tests various salary/debt/expense combinations
  - Verifies data integrity through encryption-decryption cycle

### Authentication Tests (`server/__tests__/auth.test.ts`)

Tests user authentication and session management:

- **User Sessions**: Validates session creation with wallet addresses
  - Creates sessions with valid wallet addresses
  - Supports all three roles (borrower, lender, admin)
  - Maintains sessions across requests
  
- **Role-Based Access**: Verifies role-specific access control
  - Borrowers can access borrower endpoints
  - Lenders can access lender endpoints
  - Admins can access admin endpoints
  
- **Wallet Address Validation**: Validates Ethereum address formats
  - Accepts valid ERC-55 checksummed addresses
  - Rejects invalid addresses

### Loan Management Tests (`server/__tests__/loans.test.ts`)

Tests loan application and approval workflows:

- **Loan Applications**: Validates loan creation
  - Creates applications with valid data
  - Validates loan amounts
  - Supports all risk tiers (low/medium/high)
  
- **Loan Status Transitions**: Validates state machine
  - Pending → Approved transitions
  - Pending → Denied transitions
  - Approved → Active transitions
  
- **Risk Assessment**: Validates risk tier classification
  - Low risk: debt-to-income < 20%
  - Medium risk: 20% ≤ debt-to-income < 40%
  - High risk: debt-to-income ≥ 40%
  
- **Loan Amount Limits**: Validates amount constraints
  - Enforces minimum amounts
  - Rejects negative amounts

### Schema Validation Tests (`shared/__tests__/schema.test.ts`)

Tests Zod schema validation:

- **Encrypted Data Schema**: Validates financial data submissions
  - Requires all encryption handles
  - Validates user IDs
  
- **Loan Schema**: Validates loan data structures
  - Requires positive amounts
  - Validates enum values (risk tiers, statuses)
  
- **Credit Score Schema**: Validates credit score data
  - Validates status enum
  
- **Type Safety**: Validates TypeScript type safety
  - Properly types user objects
  - Properly types encrypted data
  - Properly types loan objects
  - Properly types credit score objects

## Test Coverage

Current test coverage includes:

| Module | Coverage | Tests |
|--------|----------|-------|
| Encryption | ~85% | 9 tests |
| Authentication | ~80% | 7 tests |
| Loan Management | ~85% | 10 tests |
| Schema Validation | ~90% | 15 tests |

## Continuous Integration

### GitHub Actions

To set up automated testing on GitHub:

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v3
      
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test -- --run
      
      - name: Generate coverage
        run: npm test:coverage
```

## Testing Best Practices

### Unit Tests

- Test single functions in isolation
- Mock external dependencies
- Use descriptive test names that explain what is being tested
- Keep tests focused and small

### Integration Tests

- Test how components work together
- Test complete workflows (e.g., encryption → submission → decryption)
- Test API endpoints with realistic data

### Test Data

Use realistic financial data in tests:

```typescript
const scenarios = [
  { salary: 30000, debts: 0, expenses: 1000 },        // Low risk
  { salary: 100000, debts: 25000, expenses: 3000 },   // Low risk
  { salary: 45000, debts: 8000, expenses: 1500 },     // Medium risk
];
```

### Assertions

Use clear, specific assertions:

```typescript
// Good
expect(score).toBeGreaterThan(300);
expect(score).toBeLessThanOrEqual(850);

// Less clear
expect(score).toBeTruthy();
```

## Production FHE Testing

When integrating real Zama FHEVM, add production tests:

```typescript
describe('Production FHE Encryption', () => {
  it('should encrypt with real TFHE-rs WASM', async () => {
    const instance = await createInstance({
      chainId: 84532,
      publicKey: await getPublicKey(),
    });

    const encrypted = instance.encrypt32(50000);
    expect(encrypted).toBeDefined();
  });

  it('should compute credit score on-chain', async () => {
    // Test interaction with deployed contracts on Base Sepolia
    const tx = await contract.computeScore(userAddress);
    const receipt = await tx.wait();
    expect(receipt.status).toBe(1);
  });
});
```

## Troubleshooting

### Tests Won't Run

```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
npm test
```

### Type Errors in Tests

```bash
# Regenerate types
npm run build
npm test
```

### Vitest Config Issues

Check `vite.config.ts` includes Vitest configuration:

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
```

## Next Steps

- [ ] Add more integration tests for API endpoints
- [ ] Add E2E tests with Playwright
- [ ] Set up continuous integration with GitHub Actions
- [ ] Add performance benchmarks
- [ ] Add security scanning tests
- [ ] Test smart contract interactions on Base Sepolia testnet

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Zama FHEVM Testing Guide](https://docs.zama.org/fhevm/guides/testing)
