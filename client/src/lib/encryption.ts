import { 
  encryptFinancialData as fhevmEncryptFinancialData,
  encryptSingleValue as fhevmEncryptSingleValue,
  generateUserKeypair as fhevmGenerateKeypair,
  initFhevm,
  isFhevmSupported,
  getFhevmChainId,
  type EncryptedFinancialData
} from "./fhevm";

let useFhevm = false;

export async function initializeEncryption(): Promise<boolean> {
  if (!isFhevmSupported()) {
    console.log("FHEVM not supported in this environment, using simulation");
    useFhevm = false;
    return false;
  }

  try {
    await initFhevm();
    useFhevm = true;
    console.log("Real FHEVM encryption initialized");
    return true;
  } catch (error) {
    console.warn("Failed to initialize FHEVM, falling back to simulation:", error);
    useFhevm = false;
    return false;
  }
}

export function isUsingRealFhevm(): boolean {
  return useFhevm;
}

export function getRequiredChainId(): number {
  return getFhevmChainId();
}

export async function encryptFinancialData(
  contractAddress: string,
  userAddress: string,
  salary: number,
  debts: number,
  expenses: number
): Promise<EncryptedFinancialData> {
  if (useFhevm) {
    return await fhevmEncryptFinancialData(contractAddress, userAddress, salary, debts, expenses);
  }
  
  return {
    encryptedSalary: {
      handle: simulateEncryption(salary),
      inputProof: "0x" + "00".repeat(32),
    },
    encryptedDebts: {
      handle: simulateEncryption(debts),
      inputProof: "0x" + "00".repeat(32),
    },
    encryptedExpenses: {
      handle: simulateEncryption(expenses),
      inputProof: "0x" + "00".repeat(32),
    },
  };
}

export async function encryptValue(
  contractAddress: string,
  userAddress: string,
  value: number | bigint
): Promise<{ handle: string; inputProof: string }> {
  if (useFhevm) {
    return await fhevmEncryptSingleValue(contractAddress, userAddress, value);
  }
  
  return {
    handle: simulateEncryption(Number(value)),
    inputProof: "0x" + "00".repeat(32),
  };
}

export async function generateKeypair(): Promise<{ publicKey: string; privateKey: string }> {
  if (useFhevm) {
    return await fhevmGenerateKeypair();
  }
  
  return {
    publicKey: `pk_${Math.random().toString(36).substring(7)}`,
    privateKey: `sk_${Math.random().toString(36).substring(7)}`,
  };
}

function simulateEncryption(data: number): string {
  const encoded = btoa(String(data));
  return `0x${Buffer.from(`enc_${encoded}_${Date.now()}`).toString('hex').padStart(64, '0')}`;
}

export function simulateDecryption(handle: string): number {
  try {
    const cleanHandle = handle.startsWith("0x") ? handle.slice(2) : handle;
    const decoded = Buffer.from(cleanHandle, 'hex').toString();
    const parts = decoded.split('_');
    if (parts.length >= 2) {
      return parseInt(atob(parts[1]));
    }
  } catch {
  }
  return 0;
}

export { type EncryptedFinancialData };
