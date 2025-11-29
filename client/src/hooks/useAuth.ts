import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, setWalletAddress, getStoredWalletAddress } from "@/lib/queryClient";
import { useState, useEffect, useCallback } from "react";
import type { User } from "@shared/schema";

interface UserResponse {
  user: User;
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

export function useAuth() {
  const [walletAddress, setLocalWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasMetaMask, setHasMetaMask] = useState(false);

  // Check for MetaMask and restore session on mount
  useEffect(() => {
    const checkMetaMask = () => {
      setHasMetaMask(typeof window !== 'undefined' && !!window.ethereum?.isMetaMask);
    };
    
    checkMetaMask();
    
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
        // User disconnected from MetaMask
        disconnectWallet();
      } else if (accs[0] !== walletAddress) {
        // Account changed
        const newAddress = accs[0];
        setLocalWalletAddress(newAddress);
        setWalletAddress(newAddress);
        localStorage.setItem("walletAddress", newAddress);
        queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [walletAddress, disconnectWallet]);

  const { data: userData, isLoading, error } = useQuery<UserResponse>({
    queryKey: ["/api/users/me"],
    enabled: !!walletAddress,
    retry: false,
  });

  const connectWallet = useMutation({
    mutationFn: async (role: string = "borrower") => {
      setIsConnecting(true);
      
      let address: string;
      
      if (hasMetaMask && window.ethereum) {
        try {
          // Request account access from MetaMask
          const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
          }) as string[];
          
          if (!accounts || accounts.length === 0) {
            throw new Error("No accounts found. Please unlock MetaMask.");
          }
          
          address = accounts[0];
        } catch (err: unknown) {
          const error = err as Error;
          if (error.message?.includes('User rejected')) {
            throw new Error("Connection rejected. Please approve the connection in MetaMask.");
          }
          throw new Error("Failed to connect to MetaMask. Please try again.");
        }
      } else {
        // Fallback: Generate a demo address for testing without MetaMask
        address = `0x${Array.from({ length: 40 }, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('')}`;
      }

      // IMPORTANT: Set wallet address BEFORE making API calls
      // This ensures the X-Wallet-Address header is included
      setWalletAddress(address);
      localStorage.setItem("walletAddress", address);
      localStorage.setItem("walletRole", role);
      setLocalWalletAddress(address);

      // Register/authenticate with backend
      const response = await apiRequest("POST", "/api/auth/connect", { 
        walletAddress: address, 
        role 
      });
      
      const data = await response.json();
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
    connectWallet,
    disconnectWallet,
    error,
  };
}
