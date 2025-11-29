import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, setWalletAddress, getStoredWalletAddress } from "@/lib/queryClient";
import { useState, useEffect, useCallback } from "react";
import type { User } from "@shared/schema";
import { 
  connectMetaMask, 
  switchToEthSepolia, 
  hasMetaMask as checkHasMetaMask,
  ETH_SEPOLIA_CHAIN_ID 
} from "@/lib/web3";

interface UserResponse {
  user: User;
}

export function useAuth() {
  const [walletAddress, setLocalWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);

  // Check for MetaMask and restore session on mount
  useEffect(() => {
    setHasMetaMask(checkHasMetaMask());
    
    // Restore wallet from localStorage
    const stored = getStoredWalletAddress();
    if (stored) {
      setLocalWalletAddress(stored);
      setWalletAddress(stored);
    }
  }, []);

  // Disconnect wallet function - defined early so it can be used in effects
  const disconnectWallet = useCallback(() => {
    // Clear localStorage first
    localStorage.removeItem("walletAddress");
    localStorage.removeItem("walletRole");
    localStorage.removeItem("hasSeenOnboarding");
    
    // Reset the global wallet address for API calls
    setWalletAddress(null);
    
    // Remove specific query data to ensure user is null
    queryClient.removeQueries({ queryKey: ["/api/users/me"] });
    queryClient.clear();
    
    // Update local state last to trigger re-render
    setLocalWalletAddress(null);
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const accs = accounts as string[];
      if (accs.length === 0) {
        disconnectWallet();
      } else if (accs[0] !== walletAddress) {
        const newAddress = accs[0];
        setLocalWalletAddress(newAddress);
        setWalletAddress(newAddress);
        localStorage.setItem("walletAddress", newAddress);
        queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      }
    };

    const handleChainChanged = (newChainId: unknown) => {
      const chainIdHex = newChainId as string;
      const newChain = parseInt(chainIdHex, 16);
      setChainId(newChain);
      if (newChain !== ETH_SEPOLIA_CHAIN_ID && walletAddress) {
        console.warn("Switched away from Ethereum Sepolia");
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [walletAddress, disconnectWallet]);

  const { data: userData, isLoading, error } = useQuery<UserResponse>({
    queryKey: ["/api/users/me"],
    enabled: !!walletAddress,
    retry: false,
  });

  const connectWallet = useMutation({
    mutationFn: async ({ role = "borrower", reviewerCode }: { role?: string; reviewerCode?: string }) => {
      setIsConnecting(true);
      
      let address: string;
      let connectedChainId: number;
      
      if (hasMetaMask) {
        // Real MetaMask connection
        const result = await connectMetaMask();
        address = result.address;
        connectedChainId = result.chainId;
        
        // Switch to Ethereum Sepolia if not already on it
        if (connectedChainId !== ETH_SEPOLIA_CHAIN_ID) {
          await switchToEthSepolia();
          connectedChainId = ETH_SEPOLIA_CHAIN_ID;
        }
        
        setChainId(connectedChainId);
      } else {
        // Fallback: Generate a demo address for testing without MetaMask
        address = `0x${Array.from({ length: 40 }, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('')}`;
        connectedChainId = ETH_SEPOLIA_CHAIN_ID;
      }

      // IMPORTANT: Set wallet address BEFORE making API calls
      // This ensures the X-Wallet-Address header is included
      setWalletAddress(address);
      localStorage.setItem("walletAddress", address);
      localStorage.setItem("walletRole", role);
      setLocalWalletAddress(address);

      // Register/authenticate with backend
      const data = await apiRequest("POST", "/api/auth/connect", { 
        walletAddress: address, 
        role,
        reviewerCode 
      });
      
      return data;
    },
    onSuccess: async () => {
      // Invalidate and refetch user data to trigger redirect
      await queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      await queryClient.refetchQueries({ queryKey: ["/api/users/me"] });
    },
    onSettled: () => {
      setIsConnecting(false);
    },
  });

  // Only return user if we have a wallet address and user data
  const user = walletAddress && userData?.user ? userData.user : null;
  const isAuthenticated = !!walletAddress && !!user;

  return {
    user,
    isLoading: !!walletAddress && isLoading,
    isConnecting,
    walletAddress,
    isConnected: isAuthenticated,
    hasMetaMask,
    chainId,
    connectWallet,
    disconnectWallet,
    error,
  };
}
