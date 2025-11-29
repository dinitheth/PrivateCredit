import { BrowserProvider, formatEther, parseEther, type Eip1193Provider } from "ethers";

export const BASE_SEPOLIA_CHAIN_ID = 84532;
export const BASE_SEPOLIA_CHAIN_ID_HEX = "0x14a34";

export const BASE_SEPOLIA_CONFIG = {
  chainId: BASE_SEPOLIA_CHAIN_ID_HEX,
  chainName: "Base Sepolia Testnet",
  nativeCurrency: {
    name: "Sepolia Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://sepolia.base.org"],
  blockExplorerUrls: ["https://sepolia.basescan.org"],
};

export const ZAMA_FHEVM_CONTRACTS = {
  FHEVM_EXECUTOR: "0x848B0066793BcC60346Da1F49049357399B8D595",
  ACL_CONTRACT: "0x687820221192C5B662b25367F70076A37bc79b6c",
  KMS_VERIFIER: "0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC",
  INPUT_VERIFIER: "0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4",
  DECRYPTION_ORACLE: "0xa02Cda4Ca3a71D7C46997716F4283aa851C28812",
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

export async function switchToBaseSepolia(): Promise<void> {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed.");
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BASE_SEPOLIA_CHAIN_ID_HEX }],
    });
  } catch (error: unknown) {
    const err = error as { code?: number };
    if (err.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [BASE_SEPOLIA_CONFIG],
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
  return `${BASE_SEPOLIA_CONFIG.blockExplorerUrls[0]}/address/${address}`;
}

export function getTxExplorerUrl(txHash: string): string {
  return `${BASE_SEPOLIA_CONFIG.blockExplorerUrls[0]}/tx/${txHash}`;
}
