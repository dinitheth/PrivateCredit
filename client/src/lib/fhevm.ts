import "./node-polyfills";

export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7";

export const ETH_SEPOLIA_NETWORK = {
  chainId: SEPOLIA_CHAIN_ID_HEX,
  chainName: "Ethereum Sepolia Testnet",
  nativeCurrency: {
    name: "Sepolia Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com"],
  blockExplorerUrls: ["https://sepolia.etherscan.io"],
};

type FhevmInstanceType = {
  createEncryptedInput: (contractAddress: string, userAddress: string) => RelayerEncryptedInput;
  generateKeypair: () => { publicKey: string; privateKey: string };
  publicDecrypt: (handles: (string | Uint8Array)[]) => Promise<Record<string, bigint | boolean | string>>;
  getPublicKey: () => { publicKeyId: string; publicKey: Uint8Array } | null;
};

type RelayerEncryptedInput = {
  addBool: (value: boolean | number | bigint) => RelayerEncryptedInput;
  add8: (value: number | bigint) => RelayerEncryptedInput;
  add16: (value: number | bigint) => RelayerEncryptedInput;
  add32: (value: number | bigint) => RelayerEncryptedInput;
  add64: (value: number | bigint) => RelayerEncryptedInput;
  add128: (value: number | bigint) => RelayerEncryptedInput;
  add256: (value: number | bigint) => RelayerEncryptedInput;
  addAddress: (value: string) => RelayerEncryptedInput;
  getBits: () => number[];
  encrypt: (options?: { auth?: unknown }) => Promise<{
    handles: Uint8Array[];
    inputProof: Uint8Array;
  }>;
};

let fhevmInstance: FhevmInstanceType | null = null;
let sdkInitialized = false;
let initializationPromise: Promise<void> | null = null;

async function loadSdk(): Promise<typeof import("@zama-fhe/relayer-sdk/web")> {
  return import("@zama-fhe/relayer-sdk/web");
}

export async function initFhevmSDK(): Promise<void> {
  if (sdkInitialized) return;
  
  if (initializationPromise) {
    return initializationPromise;
  }
  
  initializationPromise = (async () => {
    try {
      console.log("Loading Zama FHEVM SDK...");
      const sdk = await loadSdk();
      
      console.log("Initializing TFHE WASM...");
      await sdk.initSDK();
      
      sdkInitialized = true;
      console.log("Zama FHEVM SDK initialized successfully!");
    } catch (error) {
      console.error("Failed to initialize FHEVM SDK:", error);
      initializationPromise = null;
      throw new Error(`Failed to initialize FHEVM encryption library: ${error}`);
    }
  })();
  
  return initializationPromise;
}

export async function initFhevm(): Promise<FhevmInstanceType> {
  if (fhevmInstance) {
    return fhevmInstance;
  }

  await initFhevmSDK();

  try {
    console.log("Creating FHEVM instance with SepoliaConfig...");
    const sdk = await loadSdk();
    
    const config = {
      ...sdk.SepoliaConfig,
      network: window.ethereum || sdk.SepoliaConfig.network,
    };
    
    console.log("FHEVM Config:", {
      chainId: config.chainId,
      relayerUrl: config.relayerUrl,
      aclContractAddress: config.aclContractAddress,
    });
    
    fhevmInstance = await sdk.createInstance(config) as FhevmInstanceType;
    console.log("FHEVM instance created successfully!");
    
    const pubKey = fhevmInstance.getPublicKey();
    if (pubKey) {
      console.log("FHEVM Public Key ID:", pubKey.publicKeyId);
    }
    
    return fhevmInstance;
  } catch (error) {
    console.error("Failed to create FHEVM instance:", error);
    throw new Error(`Failed to initialize FHEVM: ${error}`);
  }
}

export async function getFhevmInstance(): Promise<FhevmInstanceType> {
  if (!fhevmInstance) {
    return await initFhevm();
  }
  return fhevmInstance;
}

export function resetFhevmInstance(): void {
  fhevmInstance = null;
}

export interface EncryptedFinancialData {
  encryptedSalary: {
    handle: string;
    inputProof: string;
  };
  encryptedDebts: {
    handle: string;
    inputProof: string;
  };
  encryptedExpenses: {
    handle: string;
    inputProof: string;
  };
}

export async function encryptFinancialData(
  contractAddress: string,
  userAddress: string,
  salary: number,
  debts: number,
  expenses: number
): Promise<EncryptedFinancialData> {
  console.log("Encrypting financial data with real FHEVM...");
  console.log("Contract:", contractAddress, "User:", userAddress);
  
  const instance = await getFhevmInstance();

  const salaryInput = instance.createEncryptedInput(contractAddress, userAddress);
  salaryInput.add64(BigInt(salary));
  console.log("Encrypting salary:", salary);
  const encryptedSalary = await salaryInput.encrypt();

  const debtsInput = instance.createEncryptedInput(contractAddress, userAddress);
  debtsInput.add64(BigInt(debts));
  console.log("Encrypting debts:", debts);
  const encryptedDebts = await debtsInput.encrypt();

  const expensesInput = instance.createEncryptedInput(contractAddress, userAddress);
  expensesInput.add64(BigInt(expenses));
  console.log("Encrypting expenses:", expenses);
  const encryptedExpenses = await expensesInput.encrypt();

  console.log("All data encrypted successfully!");

  return {
    encryptedSalary: {
      handle: uint8ArrayToHex(encryptedSalary.handles[0]),
      inputProof: uint8ArrayToHex(encryptedSalary.inputProof),
    },
    encryptedDebts: {
      handle: uint8ArrayToHex(encryptedDebts.handles[0]),
      inputProof: uint8ArrayToHex(encryptedDebts.inputProof),
    },
    encryptedExpenses: {
      handle: uint8ArrayToHex(encryptedExpenses.handles[0]),
      inputProof: uint8ArrayToHex(encryptedExpenses.inputProof),
    },
  };
}

export async function encryptSingleValue(
  contractAddress: string,
  userAddress: string,
  value: number | bigint
): Promise<{ handle: string; inputProof: string }> {
  console.log("Encrypting single value:", value);
  const instance = await getFhevmInstance();
  const input = instance.createEncryptedInput(contractAddress, userAddress);
  input.add64(BigInt(value));
  const encrypted = await input.encrypt();
  
  return {
    handle: uint8ArrayToHex(encrypted.handles[0]),
    inputProof: uint8ArrayToHex(encrypted.inputProof),
  };
}

export async function generateUserKeypair(): Promise<{ publicKey: string; privateKey: string }> {
  const instance = await getFhevmInstance();
  return instance.generateKeypair();
}

export async function requestPublicDecryption(handles: string[]): Promise<Record<string, bigint | boolean | string>> {
  const instance = await getFhevmInstance();
  const handleArrays = handles.map(hexToUint8Array);
  return await instance.publicDecrypt(handleArrays);
}

export function uint8ArrayToHex(arr: Uint8Array): string {
  return "0x" + Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
}

export function hexToUint8Array(hex: string): Uint8Array {
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
  }
  return bytes;
}

export function isFhevmSupported(): boolean {
  return typeof window !== "undefined" && !!window.ethereum;
}

export function getFhevmChainId(): number {
  return SEPOLIA_CHAIN_ID;
}

export async function switchToSepolia(): Promise<void> {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed.");
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
    });
  } catch (error: unknown) {
    const err = error as { code?: number };
    if (err.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [ETH_SEPOLIA_NETWORK],
      });
    } else {
      throw error;
    }
  }
}

export async function getSepoliaConfig() {
  const sdk = await loadSdk();
  return sdk.SepoliaConfig;
}
