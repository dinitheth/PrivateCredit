import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Wallet, Lock, Eye, Server } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function ConnectWallet() {
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<"borrower" | "lender" | "admin">("borrower");
  const { connectWallet } = useAuth();
  const { toast } = useToast();

  const handleConnect = async (role: "borrower" | "lender" | "admin") => {
    try {
      await connectWallet.mutateAsync(role);
      toast({
        title: "Wallet Connected",
        description: `Connected as ${role}`,
      });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Private Credit dApp
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Privacy-preserving credit scoring and automated lending powered by Zama FHEVM on Base L2
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Badge variant="outline" className="border-primary/50 bg-primary/10 text-primary">
              Base Sepolia Testnet
            </Badge>
            <Badge variant="outline" className="border-accent/50 bg-accent/10 text-accent">
              Zama FHEVM
            </Badge>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="hover-elevate">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">End-to-End Encryption</CardTitle>
              <CardDescription>
                Your financial data is encrypted in your browser before being submitted on-chain. No one can see your raw data.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover-elevate">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <Server className="h-6 w-6 text-accent" />
              </div>
              <CardTitle className="text-xl">Confidential Computation</CardTitle>
              <CardDescription>
                Credit scores are computed on encrypted data using Fully Homomorphic Encryption (FHE) via Zama's coprocessor.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover-elevate">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                <Eye className="h-6 w-6 text-secondary" />
              </div>
              <CardTitle className="text-xl">Owner-Only Decryption</CardTitle>
              <CardDescription>
                Only you can decrypt your credit score using your private keys. Lenders only see encrypted risk tiers.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover-elevate">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Base L2 Security</CardTitle>
              <CardDescription>
                Built on Base for fast, low-cost transactions with Ethereum-level security and decentralization.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Connect Your Wallet</CardTitle>
            <CardDescription>
              Select your role and connect to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Select Role</label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={selectedRole === "borrower" ? "default" : "outline"}
                  onClick={() => setSelectedRole("borrower")}
                  className="text-xs"
                  data-testid="button-role-borrower"
                >
                  Borrower
                </Button>
                <Button
                  variant={selectedRole === "lender" ? "default" : "outline"}
                  onClick={() => setSelectedRole("lender")}
                  className="text-xs"
                  data-testid="button-role-lender"
                >
                  Lender
                </Button>
                <Button
                  variant={selectedRole === "admin" ? "default" : "outline"}
                  onClick={() => setSelectedRole("admin")}
                  className="text-xs"
                  data-testid="button-role-admin"
                >
                  Admin
                </Button>
              </div>
            </div>
            <Button
              size="lg"
              className="w-full text-base"
              onClick={() => handleConnect(selectedRole)}
              disabled={connectWallet.isPending}
              data-testid="button-connect-wallet"
            >
              {connectWallet.isPending ? "Connecting..." : "Connect Wallet"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              By connecting, you agree to our terms and privacy policy
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
