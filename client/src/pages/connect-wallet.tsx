import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Wallet, AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { formatAddress, BASE_SEPOLIA_CONFIG } from "@/lib/web3";

export default function ConnectWallet() {
  const [selectedRole, setSelectedRole] = useState<"borrower" | "lender" | "admin">("borrower");
  const { connectWallet, isConnecting, user, hasMetaMask, walletAddress } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      const targetPath = user.role === "lender" ? "/lender" : user.role === "admin" ? "/admin" : "/";
      setLocation(targetPath);
    }
  }, [user, setLocation]);

  const handleConnect = async () => {
    try {
      const result = await connectWallet.mutateAsync(selectedRole);
      
      if (!result?.user) {
        throw new Error("Server did not return user data");
      }
      
      const userRole = result.user.role;
      const targetPath = userRole === "lender" ? "/lender" : userRole === "admin" ? "/admin" : "/";
      
      toast({
        title: "Wallet Connected",
        description: `Connected as ${userRole}`,
      });
      
      window.location.href = targetPath;
    } catch (error) {
      console.error("Connection error:", error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const roleDescriptions = {
    borrower: "Submit encrypted financial data and apply for loans",
    lender: "Review loan requests and manage your lending portfolio",
    admin: "Monitor system health and manage user permissions",
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Shield className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Private Credit dApp
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Privacy-preserving credit scoring and automated lending powered by Zama FHEVM on Base L2
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <Badge variant="outline" className="border-primary/50 bg-primary/10 text-primary">
            Base Sepolia Testnet
          </Badge>
          <Badge variant="outline" className="border-secondary/50 bg-secondary/10 text-secondary">
            Zama FHEVM
          </Badge>
        </div>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Connect Your Wallet</CardTitle>
          <CardDescription>
            {hasMetaMask 
              ? "Connect with MetaMask to get started on Base Sepolia" 
              : "Install MetaMask or use demo mode"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!hasMetaMask && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">MetaMask Not Detected</p>
                <p className="text-xs text-muted-foreground mt-1">
                  For the full experience, install MetaMask. You can still use demo mode without it.
                </p>
                <a 
                  href="https://metamask.io/download/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1"
                >
                  Install MetaMask <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

          {hasMetaMask && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/10 border border-accent/20">
              <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">MetaMask Detected</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You'll be prompted to connect and switch to Base Sepolia network.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Select Your Role</label>
            <div className="grid grid-cols-3 gap-2">
              {(["borrower", "lender", "admin"] as const).map((role) => (
                <Button
                  key={role}
                  variant={selectedRole === role ? "default" : "outline"}
                  onClick={() => setSelectedRole(role)}
                  className="flex flex-col h-auto py-3"
                  data-testid={`button-role-${role}`}
                >
                  <span className="capitalize font-medium">{role}</span>
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {roleDescriptions[selectedRole]}
            </p>
          </div>

          <Button
            size="lg"
            className="w-full text-base gap-2"
            onClick={handleConnect}
            disabled={isConnecting}
            data-testid="button-connect-wallet"
          >
            <Wallet className="h-5 w-5" />
            {isConnecting 
              ? "Connecting..." 
              : hasMetaMask 
                ? "Connect MetaMask" 
                : "Use Demo Mode"
            }
          </Button>

          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              Network: {BASE_SEPOLIA_CONFIG.chainName}
            </p>
            {walletAddress && (
              <p className="text-xs text-muted-foreground">
                Connected: {formatAddress(walletAddress)}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              By connecting, you agree to our terms of service and privacy policy
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground mb-2">Need Base Sepolia ETH for testing?</p>
        <a 
          href="https://portal.cdp.coinbase.com/products/faucet" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
        >
          Get test ETH from faucet <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
