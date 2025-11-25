import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";

// Simulated wallet address - in production this would come from MetaMask
const WALLET_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc9e7595f89ab";

export function useAuth() {
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  useEffect(() => {
    // Check localStorage for wallet connection status
    const connected = localStorage.getItem("walletConnected") === "true";
    setIsWalletConnected(connected);
  }, []);

  const { data: userData, isLoading } = useQuery({
    queryKey: ["/api/users/me"],
    enabled: isWalletConnected,
    retry: false,
  });

  const connectWallet = useMutation({
    mutationFn: async (role: string = "borrower") => {
      // In production: Request MetaMask signature here
      // For MVP: Just simulate connection
      return await apiRequest("POST", "/api/auth/connect", { 
        walletAddress: WALLET_ADDRESS, 
        role 
      });
    },
    onSuccess: () => {
      localStorage.setItem("walletConnected", "true");
      setIsWalletConnected(true);
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
    },
  });

  const disconnectWallet = () => {
    localStorage.removeItem("walletConnected");
    setIsWalletConnected(false);
    queryClient.clear();
  };

  return {
    user: userData?.user,
    isLoading: isWalletConnected && isLoading,
    walletAddress: WALLET_ADDRESS,
    isConnected: isWalletConnected,
    connectWallet,
    disconnectWallet,
  };
}
