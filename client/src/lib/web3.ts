import { BrowserProvider, formatEther, parseEther, type Eip1193Provider, type Signer } from "ethers";
import { getContracts, getReadOnlyContracts, Role, RiskTier, LoanStatus, encryptToBytes32, generateScoreHandle, CONTRACT_ADDRESSES } from "./contracts";

export const ETH_SEPOLIA_CHAIN_ID = 11155111;
export const ETH_SEPOLIA_CHAIN_ID_HEX = "0xaa36a7";

export const ETH_SEPOLIA_CONFIG = {
  chainId: ETH_SEPOLIA_CHAIN_ID_HEX,
  chainName: "Ethereum Sepolia Testnet",
  nativeCurrency: {
    name: "Sepolia Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://eth-sepolia.public.blastapi.io", "https://rpc.sepolia.org"],
  blockExplorerUrls: ["https://sepolia.etherscan.io"],
};

export const ZAMA_FHEVM_CONTRACTS = {
  ACL_CONTRACT: "0x339EcE85B9E11a3A3AA557582784a15d7F82AAf2",
  TFHE_EXECUTOR: "0x687408ab54661ba0b4aef3a44f4e13b04f80a62b",
  KMS_VERIFIER: "0x12072bb47e6a8e84a85fa0c295414dc7fb8797e9",
  INPUT_VERIFIER: "0xcA03F121Cb38430E51EBE9e81e6c2c6b199C0328",
  GATEWAY_CONTRACT: "0x339EcE85B9E11a3A3AA557582784a15d7F82AAf2",
  RELAYER_URL: "https://relayer.testnet.zama.cloud",
};

declare global {
  interface Window {
    ethereum?: Eip1193Provider & {
      isMetaMask?: boolean;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

export function hasMetaMask(): boolean {
  return typeof window !== "undefined" && !!window.ethereum?.isMetaMask;
}

export function getProvider(): BrowserProvider | null {
  if (!hasMetaMask() || !window.ethereum) return null;
  return new BrowserProvider(window.ethereum);
}

export async function connectMetaMask(): Promise<{ address: string; chainId: number }> {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed. Please install MetaMask to continue.");
  }

  try {
    const accounts = (await window.ethereum.request({
      method: "eth_requestAccounts",
    })) as string[];

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found. Please unlock MetaMask.");
    }

    const chainIdHex = (await window.ethereum.request({
      method: "eth_chainId",
    })) as string;

    const chainId = parseInt(chainIdHex, 16);

    return { address: accounts[0], chainId };
  } catch (error: unknown) {
    const err = error as { code?: number; message?: string };
    if (err.code === 4001) {
      throw new Error("Connection rejected. Please approve the connection in MetaMask.");
    }
    throw new Error(err.message || "Failed to connect to MetaMask.");
  }
}

export async function switchToEthSepolia(): Promise<void> {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed.");
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ETH_SEPOLIA_CHAIN_ID_HEX }],
    });
  } catch (error: unknown) {
    const err = error as { code?: number };
    if (err.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [ETH_SEPOLIA_CONFIG],
      });
    } else {
      throw error;
    }
  }
}

export async function getBalance(address: string): Promise<string> {
  const provider = getProvider();
  if (!provider) return "0";
  
  try {
    const balance = await provider.getBalance(address);
    return formatEther(balance);
  } catch {
    return "0";
  }
}

export async function signMessage(message: string): Promise<string> {
  const provider = getProvider();
  if (!provider) {
    throw new Error("No provider available");
  }

  const signer = await provider.getSigner();
  return await signer.signMessage(message);
}

export function formatAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getExplorerUrl(address: string): string {
  return `${ETH_SEPOLIA_CONFIG.blockExplorerUrls[0]}/address/${address}`;
}

export function getTxExplorerUrl(txHash: string): string {
  return `${ETH_SEPOLIA_CONFIG.blockExplorerUrls[0]}/tx/${txHash}`;
}

export async function getSigner(): Promise<Signer | null> {
  const provider = getProvider();
  if (!provider) return null;
  try {
    return await provider.getSigner();
  } catch {
    return null;
  }
}

async function ensureCorrectNetwork(): Promise<void> {
  if (!window.ethereum) {
    throw new Error("MetaMask is required for blockchain transactions");
  }
  
  const chainIdHex = (await window.ethereum.request({
    method: "eth_chainId",
  })) as string;
  
  const currentChainId = parseInt(chainIdHex, 16);
  
  if (currentChainId !== ETH_SEPOLIA_CHAIN_ID) {
    await switchToEthSepolia();
  }
}

export interface BlockchainRole {
  role: Role;
  isAdmin: boolean;
  isLender: boolean;
  isBorrower: boolean;
}

export async function getBlockchainRole(address: string): Promise<BlockchainRole> {
  const provider = getProvider();
  if (!provider) {
    return { role: Role.None, isAdmin: false, isLender: false, isBorrower: false };
  }
  
  try {
    const contracts = getReadOnlyContracts(provider);
    const [roleNum, isAdmin, isLender, isBorrower] = await Promise.all([
      contracts.accessControl.getRole(address),
      contracts.accessControl.isAdmin(address),
      contracts.accessControl.isLender(address),
      contracts.accessControl.isBorrower(address),
    ]);
    
    return {
      role: Number(roleNum) as Role,
      isAdmin,
      isLender,
      isBorrower,
    };
  } catch (error) {
    console.error("Error fetching blockchain role:", error);
    return { role: Role.None, isAdmin: false, isLender: false, isBorrower: false };
  }
}

export async function registerOnChain(roleType: "borrower" | "lender"): Promise<string> {
  await ensureCorrectNetwork();
  
  const signer = await getSigner();
  if (!signer) throw new Error("No signer available. Please connect MetaMask.");
  
  const contracts = getContracts(signer);
  
  try {
    let tx;
    if (roleType === "borrower") {
      tx = await contracts.accessControl.registerAsBorrower();
    } else {
      tx = await contracts.accessControl.registerAsLender();
    }
    
    await tx.wait();
    return tx.hash;
  } catch (error: unknown) {
    const err = error as { reason?: string; message?: string };
    throw new Error(err.reason || err.message || "Transaction failed");
  }
}

export async function submitEncryptedDataOnChain(
  salary: number,
  debts: number,
  expenses: number
): Promise<string> {
  await ensureCorrectNetwork();
  
  const signer = await getSigner();
  if (!signer) throw new Error("No signer available. Please connect MetaMask.");
  
  const contracts = getContracts(signer);
  
  const salaryHandle = encryptToBytes32(salary);
  const debtsHandle = encryptToBytes32(debts);
  const expensesHandle = encryptToBytes32(expenses);
  
  try {
    const tx = await contracts.encryptedDataVault.submitEncryptedData(
      salaryHandle,
      debtsHandle,
      expensesHandle
    );
    
    await tx.wait();
    return tx.hash;
  } catch (error: unknown) {
    const err = error as { reason?: string; message?: string };
    throw new Error(err.reason || err.message || "Failed to submit encrypted data");
  }
}

export async function requestScoreComputationOnChain(): Promise<string> {
  await ensureCorrectNetwork();
  
  const signer = await getSigner();
  if (!signer) throw new Error("No signer available. Please connect MetaMask.");
  
  const contracts = getContracts(signer);
  
  try {
    const tx = await contracts.creditScorer.requestScoreComputation();
    await tx.wait();
    return tx.hash;
  } catch (error: unknown) {
    const err = error as { reason?: string; message?: string };
    throw new Error(err.reason || err.message || "Failed to request score computation");
  }
}

export async function storeScoreOnChain(
  userAddress: string,
  score: number,
  riskTier: RiskTier
): Promise<string> {
  await ensureCorrectNetwork();
  
  const signer = await getSigner();
  if (!signer) throw new Error("No signer available. Please connect MetaMask.");
  
  const contracts = getContracts(signer);
  const scoreHandle = generateScoreHandle(score);
  
  try {
    const tx = await contracts.creditScorer.storeComputedScore(
      userAddress,
      scoreHandle,
      riskTier
    );
    
    await tx.wait();
    return tx.hash;
  } catch (error: unknown) {
    const err = error as { reason?: string; message?: string };
    throw new Error(err.reason || err.message || "Failed to store credit score");
  }
}

export interface OnChainCreditScore {
  encryptedScoreHandle: string;
  computedAt: bigint;
  status: number;
  riskTier: RiskTier;
}

export async function getCreditScoreOnChain(address: string): Promise<OnChainCreditScore | null> {
  const provider = getProvider();
  if (!provider) return null;
  
  try {
    const contracts = getReadOnlyContracts(provider);
    const [handle, computedAt, status, tier] = await contracts.creditScorer.getCreditScore(address);
    
    return {
      encryptedScoreHandle: handle,
      computedAt,
      status: Number(status),
      riskTier: Number(tier) as RiskTier,
    };
  } catch (error) {
    console.error("Error fetching credit score:", error);
    return null;
  }
}

export async function applyForLoanOnChain(
  amountInEth: string,
  termDays: number
): Promise<{ txHash: string; loanId: number }> {
  await ensureCorrectNetwork();
  
  const signer = await getSigner();
  if (!signer) throw new Error("No signer available. Please connect MetaMask.");
  
  const contracts = getContracts(signer);
  const amountWei = parseEther(amountInEth);
  
  try {
    const tx = await contracts.loanManager.applyForLoan(amountWei, termDays);
    const receipt = await tx.wait();
    
    const loanAppliedEvent = receipt.logs.find((log: { topics: string[] }) => 
      log.topics[0] === contracts.loanManager.interface.getEvent("LoanApplied")?.topicHash
    );
    
    let loanId = 0;
    if (loanAppliedEvent) {
      const parsed = contracts.loanManager.interface.parseLog({
        topics: loanAppliedEvent.topics as string[],
        data: loanAppliedEvent.data,
      });
      loanId = Number(parsed?.args[0] || 0);
    }
    
    return { txHash: tx.hash, loanId };
  } catch (error: unknown) {
    const err = error as { reason?: string; message?: string };
    throw new Error(err.reason || err.message || "Failed to apply for loan");
  }
}

export async function approveLoanOnChain(loanId: number, amountInEth: string): Promise<string> {
  await ensureCorrectNetwork();
  
  const signer = await getSigner();
  if (!signer) throw new Error("No signer available. Please connect MetaMask.");
  
  const contracts = getContracts(signer);
  const amountWei = parseEther(amountInEth);
  
  try {
    const tx = await contracts.loanManager.approveLoan(loanId, { value: amountWei });
    await tx.wait();
    return tx.hash;
  } catch (error: unknown) {
    const err = error as { reason?: string; message?: string };
    throw new Error(err.reason || err.message || "Failed to approve and fund loan");
  }
}

export async function denyLoanOnChain(loanId: number, reason: string): Promise<string> {
  await ensureCorrectNetwork();
  
  const signer = await getSigner();
  if (!signer) throw new Error("No signer available. Please connect MetaMask.");
  
  const contracts = getContracts(signer);
  
  try {
    const tx = await contracts.loanManager.denyLoan(loanId, reason);
    await tx.wait();
    return tx.hash;
  } catch (error: unknown) {
    const err = error as { reason?: string; message?: string };
    throw new Error(err.reason || err.message || "Failed to deny loan");
  }
}

export async function repayLoanOnChain(loanId: number): Promise<string> {
  await ensureCorrectNetwork();
  
  const signer = await getSigner();
  if (!signer) throw new Error("No signer available. Please connect MetaMask.");
  
  const contracts = getContracts(signer);
  
  try {
    const repaymentAmount = await contracts.loanManager.calculateRepaymentAmount(loanId);
    const tx = await contracts.loanManager.repayLoan(loanId, { value: repaymentAmount });
    await tx.wait();
    return tx.hash;
  } catch (error: unknown) {
    const err = error as { reason?: string; message?: string };
    throw new Error(err.reason || err.message || "Failed to repay loan");
  }
}

export interface OnChainLoan {
  id: number;
  borrower: string;
  lender: string;
  amount: bigint;
  interestRate: number;
  termDays: number;
  appliedAt: bigint;
  approvedAt: bigint;
  fundedAt: bigint;
  repaidAt: bigint;
  status: LoanStatus;
  riskTier: RiskTier;
}

export async function getLoanOnChain(loanId: number): Promise<OnChainLoan | null> {
  const provider = getProvider();
  if (!provider) return null;
  
  try {
    const contracts = getReadOnlyContracts(provider);
    const loan = await contracts.loanManager.getLoan(loanId);
    
    return {
      id: Number(loan.id),
      borrower: loan.borrower,
      lender: loan.lender,
      amount: loan.amount,
      interestRate: Number(loan.interestRate),
      termDays: Number(loan.termDays),
      appliedAt: loan.appliedAt,
      approvedAt: loan.approvedAt,
      fundedAt: loan.fundedAt,
      repaidAt: loan.repaidAt,
      status: Number(loan.status) as LoanStatus,
      riskTier: Number(loan.riskTier) as RiskTier,
    };
  } catch (error) {
    console.error("Error fetching loan:", error);
    return null;
  }
}

export async function getPendingLoansCountOnChain(): Promise<number> {
  const provider = getProvider();
  if (!provider) return 0;
  
  try {
    const contracts = getReadOnlyContracts(provider);
    const count = await contracts.loanManager.getPendingLoansCount();
    return Number(count);
  } catch (error) {
    console.error("Error fetching pending loans count:", error);
    return 0;
  }
}

export async function hasActiveDataOnChain(address: string): Promise<boolean> {
  const provider = getProvider();
  if (!provider) return false;
  
  try {
    const contracts = getReadOnlyContracts(provider);
    return await contracts.encryptedDataVault.hasActiveData(address);
  } catch (error) {
    console.error("Error checking active data:", error);
    return false;
  }
}

export async function hasValidScoreOnChain(address: string): Promise<boolean> {
  const provider = getProvider();
  if (!provider) return false;
  
  try {
    const contracts = getReadOnlyContracts(provider);
    return await contracts.creditScorer.hasValidScore(address);
  } catch (error) {
    console.error("Error checking valid score:", error);
    return false;
  }
}

export { CONTRACT_ADDRESSES, Role, RiskTier, LoanStatus };
