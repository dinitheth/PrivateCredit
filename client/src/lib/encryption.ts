import { 
  encryptFinancialData as fhevmEncryptFinancialData,
  encryptSingleValue as fhevmEncryptSingleValue,
  generateUserKeypair as fhevmGenerateKeypair,
  initFhevm,
  initFhevmSDK,
  isFhevmSupported,
  getFhevmChainId,
  resetFhevmInstance,
  type EncryptedFinancialData
} from "./fhevm";

let fhevmInitialized = false;
let initError: string | null = null;

export async function initializeEncryption(): Promise<boolean> {
  if (fhevmInitialized) {
    return true;
  }

  if (!isFhevmSupported()) {
    initError = "MetaMask is required for FHEVM encryption. Please install MetaMask and connect to Ethereum Sepolia.";
    console.error(initError);
    return false;
  }

  try {
    console.log("Initializing Zama FHEVM SDK...");
    await initFhevmSDK();
    console.log("Zama FHEVM SDK loaded successfully");
    
    await initFhevm();
    fhevmInitialized = true;
    initError = null;
    console.log("Real FHEVM encryption initialized and ready!");
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    initError = `Failed to initialize FHEVM: ${errorMessage}`;
    console.error(initError);
    fhevmInitialized = false;
    return false;
  }
}

export function isUsingRealFhevm(): boolean {
  return fhevmInitialized;
}

export function getInitError(): string | null {
  return initError;
}

export function getRequiredChainId(): number {
  return getFhevmChainId();
}

export function resetEncryption(): void {
  fhevmInitialized = false;
  initError = null;
  resetFhevmInstance();
}

export async function encryptFinancialData(
  contractAddress: string,
  userAddress: string,
  salary: number,
  debts: number,
  expenses: number
): Promise<EncryptedFinancialData> {
  if (!fhevmInitialized) {
    const initialized = await initializeEncryption();
    if (!initialized) {
      throw new Error(initError || "FHEVM not initialized. Please ensure MetaMask is connected to Ethereum Sepolia.");
    }
  }
  
  console.log("Encrypting financial data with Zama FHEVM...");
  return await fhevmEncryptFinancialData(contractAddress, userAddress, salary, debts, expenses);
}

export async function encryptValue(
  contractAddress: string,
  userAddress: string,
  value: number | bigint
): Promise<{ handle: string; inputProof: string }> {
  if (!fhevmInitialized) {
    const initialized = await initializeEncryption();
    if (!initialized) {
      throw new Error(initError || "FHEVM not initialized");
    }
  }
  
  return await fhevmEncryptSingleValue(contractAddress, userAddress, value);
}

export async function generateKeypair(): Promise<{ publicKey: string; privateKey: string }> {
  if (!fhevmInitialized) {
    const initialized = await initializeEncryption();
    if (!initialized) {
      throw new Error(initError || "FHEVM not initialized");
    }
  }
  
  return await fhevmGenerateKeypair();
}

export { type EncryptedFinancialData };
