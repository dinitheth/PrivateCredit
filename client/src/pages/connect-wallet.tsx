import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function ConnectWallet() {
  const [selectedRole, setSelectedRole] = useState<"borrower" | "lender" | "admin">("borrower");
  const { connectWallet, isConnecting } = useAuth();
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      await connectWallet.mutateAsync(selectedRole);
      toast({
        title: "Wallet Connected",
        description: `Successfully connected as ${selectedRole}`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to connect wallet";
      toast({
        title: "Connection Failed",
        description: errorMessage,
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
            Select your role and connect to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            By connecting, you agree to our terms of service and privacy policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
