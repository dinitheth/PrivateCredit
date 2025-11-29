import { ethers } from "ethers";

export const CONTRACT_ADDRESSES = {
  accessControl: "0x20C72E9623ea7070a7B4d3F07fb2eA79A3507569",
  encryptedDataVault: "0x7174D1709D625a2218e2a508b87353080816238D",
  creditScorer: "0x4B7aeda4C03230983c0eDC8739c55413d4000e2f",
  loanManager: "0xDDA2Fea3cD0Cf798Fac01AD5d03E5d19000788e0",
} as const;

export const ACCESS_CONTROL_ABI = [
  "function registerAsBorrower() external",
  "function registerAsLender() external",
  "function grantAdmin(address _user) external",
  "function grantLender(address _user) external",
  "function revokeRole(address _user) external",
  "function getRole(address _user) external view returns (uint8)",
  "function isAdmin(address _user) external view returns (bool)",
  "function isLender(address _user) external view returns (bool)",
  "function isBorrower(address _user) external view returns (bool)",
  "function getRoleCounts() external view returns (uint256, uint256, uint256)",
  "function owner() external view returns (address)",
  "event RoleGranted(address indexed user, uint8 role, address indexed grantedBy)",
  "event RoleRevoked(address indexed user, uint8 previousRole, address indexed revokedBy)",
];

export const ENCRYPTED_DATA_VAULT_ABI = [
  "function submitEncryptedData(bytes32 _salaryHandle, bytes32 _debtsHandle, bytes32 _expensesHandle) external",
  "function getEncryptedData(address _user) external view returns (bytes32, bytes32, bytes32, uint256, bool)",
  "function hasActiveData(address _user) external view returns (bool)",
  "function revokeData() external",
  "function getSubmittedUserCount() external view returns (uint256)",
  "event EncryptedDataSubmitted(address indexed user, bytes32 salaryHandle, bytes32 debtsHandle, bytes32 expensesHandle, uint256 timestamp)",
  "event EncryptedDataRevoked(address indexed user, uint256 timestamp)",
];

export const CREDIT_SCORER_ABI = [
  "function setAuthorizedScorer(address _scorer) external",
  "function requestScoreComputation() external",
  "function storeComputedScore(address _user, bytes32 _encryptedScoreHandle, uint8 _riskTier) external",
  "function getCreditScore(address _user) external view returns (bytes32, uint256, uint8, uint8)",
  "function hasValidScore(address _user) external view returns (bool)",
  "function getRiskTier(address _user) external view returns (uint8)",
  "function authorizedScorer() external view returns (address)",
  "function pendingComputations(address) external view returns (uint256)",
  "function SCORE_VALIDITY_PERIOD() external view returns (uint256)",
  "event ScoreComputationRequested(address indexed user, uint256 timestamp)",
  "event ScoreComputed(address indexed user, bytes32 encryptedScoreHandle, uint8 riskTier, uint256 timestamp)",
  "event AuthorizedScorerUpdated(address indexed oldScorer, address indexed newScorer)",
];

export const LOAN_MANAGER_ABI = [
  "function applyForLoan(uint256 _amount, uint256 _termDays) external returns (uint256)",
  "function approveLoan(uint256 _loanId) external payable",
  "function denyLoan(uint256 _loanId, string calldata _reason) external",
  "function repayLoan(uint256 _loanId) external payable",
  "function calculateRepaymentAmount(uint256 _loanId) external view returns (uint256)",
  "function getBorrowerLoans(address _borrower) external view returns (uint256[])",
  "function getLenderLoans(address _lender) external view returns (uint256[])",
  "function getLoan(uint256 _loanId) external view returns (tuple(uint256 id, address borrower, address lender, uint256 amount, uint256 interestRate, uint256 termDays, uint256 appliedAt, uint256 approvedAt, uint256 fundedAt, uint256 repaidAt, uint8 status, uint8 riskTier))",
  "function getPendingLoansCount() external view returns (uint256)",
  "function loanCounter() external view returns (uint256)",
  "function tierInterestRates(uint8) external view returns (uint256)",
  "function tierMaxAmounts(uint8) external view returns (uint256)",
  "function setTierInterestRate(uint8 _tier, uint256 _rate) external",
  "function setTierMaxAmount(uint8 _tier, uint256 _amount) external",
  "event LoanApplied(uint256 indexed loanId, address indexed borrower, uint256 amount, uint8 riskTier)",
  "event LoanApproved(uint256 indexed loanId, address indexed lender, uint256 interestRate)",
  "event LoanDenied(uint256 indexed loanId, address indexed lender, string reason)",
  "event LoanFunded(uint256 indexed loanId, uint256 timestamp)",
  "event LoanRepaid(uint256 indexed loanId, uint256 totalRepaid, uint256 timestamp)",
];

export enum Role {
  None = 0,
  Borrower = 1,
  Lender = 2,
  Admin = 3,
}

export enum ScoreStatus {
  None = 0,
  Pending = 1,
  Computed = 2,
  Expired = 3,
}

export enum RiskTier {
  Unknown = 0,
  Low = 1,
  Medium = 2,
  High = 3,
}

export enum LoanStatus {
  Pending = 0,
  Approved = 1,
  Denied = 2,
  Active = 3,
  Repaid = 4,
  Defaulted = 5,
}

export function getContracts(signer: ethers.Signer) {
  return {
    accessControl: new ethers.Contract(
      CONTRACT_ADDRESSES.accessControl,
      ACCESS_CONTROL_ABI,
      signer
    ),
    encryptedDataVault: new ethers.Contract(
      CONTRACT_ADDRESSES.encryptedDataVault,
      ENCRYPTED_DATA_VAULT_ABI,
      signer
    ),
    creditScorer: new ethers.Contract(
      CONTRACT_ADDRESSES.creditScorer,
      CREDIT_SCORER_ABI,
      signer
    ),
    loanManager: new ethers.Contract(
      CONTRACT_ADDRESSES.loanManager,
      LOAN_MANAGER_ABI,
      signer
    ),
  };
}

export function getReadOnlyContracts(provider: ethers.Provider) {
  return {
    accessControl: new ethers.Contract(
      CONTRACT_ADDRESSES.accessControl,
      ACCESS_CONTROL_ABI,
      provider
    ),
    encryptedDataVault: new ethers.Contract(
      CONTRACT_ADDRESSES.encryptedDataVault,
      ENCRYPTED_DATA_VAULT_ABI,
      provider
    ),
    creditScorer: new ethers.Contract(
      CONTRACT_ADDRESSES.creditScorer,
      CREDIT_SCORER_ABI,
      provider
    ),
    loanManager: new ethers.Contract(
      CONTRACT_ADDRESSES.loanManager,
      LOAN_MANAGER_ABI,
      provider
    ),
  };
}

export function encryptToBytes32(value: number): string {
  const hex = value.toString(16).padStart(64, "0");
  return "0x" + hex;
}

export function generateScoreHandle(score: number): string {
  const timestamp = Date.now();
  const combined = `${score}-${timestamp}`;
  return ethers.keccak256(ethers.toUtf8Bytes(combined));
}
