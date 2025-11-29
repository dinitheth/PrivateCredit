import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Shield, Wallet, AlertTriangle, CheckCircle2, ExternalLink, Lock, Loader2, KeyRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { formatAddress, BASE_SEPOLIA_CONFIG, getBlockchainRole, registerOnChain } from "@/lib/web3";
import { Role } from "@/lib/contracts";

export default function ConnectWallet() {
  const [selectedRole, setSelectedRole] = useState<"borrower" | "lender" | "admin">("borrower");
  const [onChainRole, setOnChainRole] = useState<Role | null>(null);
  const [checkingRole, setCheckingRole] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [reviewerCode, setReviewerCode] = useState("");
  const [showReviewerInput, setShowReviewerInput] = useState(false);
  const { connectWallet, isConnecting, user, hasMetaMask, walletAddress } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    async function checkOnChainRole() {
      if (walletAddress && hasMetaMask) {
        setCheckingRole(true);
        try {
          const roleData = await getBlockchainRole(walletAddress);
          setOnChainRole(roleData.role);
          if (roleData.role !== Role.None) {
            const roleStr = roleData.isAdmin ? "admin" : roleData.isLender ? "lender" : "borrower";
            setSelectedRole(roleStr as "borrower" | "lender" | "admin");
          }
        } catch {
          setOnChainRole(Role.None);
        }
        setCheckingRole(false);
      }
    }
    checkOnChainRole();
  }, [walletAddress, hasMetaMask]);

  useEffect(() => {
    if (user) {
      const targetPath = user.role === "lender" ? "/lender" : user.role === "admin" ? "/admin" : "/";
      setLocation(targetPath);
    }
  }, [user, setLocation]);

  const hasOnChainRole = onChainRole !== null && onChainRole !== Role.None;
  const canSelectRole = !hasOnChainRole;

  const handleConnect = async () => {
    try {
      let roleToUse = selectedRole;
      const isReviewerAccess = (selectedRole === "lender" || selectedRole === "admin") && 
                               !hasOnChainRole && 
                               reviewerCode.trim().length > 0;
      
      if (hasOnChainRole) {
        const onChainRoleStr = onChainRole === Role.Admin ? "admin" : 
                               onChainRole === Role.Lender ? "lender" : "borrower";
        roleToUse = onChainRoleStr as "borrower" | "lender" | "admin";
      } else if (selectedRole === "borrower" && hasMetaMask) {
        setRegistering(true);
        try {
          await registerOnChain("borrower");
          toast({
            title: "Registered On-Chain",
            description: "You've been registered as a borrower on the blockchain.",
          });
        } catch (regError) {
          console.log("On-chain registration skipped or failed:", regError);
        }
        setRegistering(false);
      } else if ((selectedRole === "lender" || selectedRole === "admin") && !hasOnChainRole && !isReviewerAccess) {
        toast({
          title: "Access Code Required",
          description: "Please enter a reviewer access code or select Borrower role.",
          variant: "destructive",
        });
        return;
      }
      
      const result = await connectWallet.mutateAsync({ 
        role: roleToUse, 
        reviewerCode: isReviewerAccess ? reviewerCode.trim() : undefined 
      });
      
      if (!result?.user) {
        throw new Error("Server did not return user data");
      }
      
      const userRole = result.user.role;
      const targetPath = userRole === "lender" ? "/lender" : userRole === "admin" ? "/admin" : "/";
      
      toast({
        title: "Wallet Connected",
        description: `Connected as ${userRole}${isReviewerAccess ? " (Reviewer Mode)" : ""}`,
      });
      
      window.location.href = targetPath;
    } catch (error) {
      setRegistering(false);
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
            <label className="text-sm font-medium text-foreground">
              {checkingRole ? "Checking on-chain role..." : hasOnChainRole ? "Your On-Chain Role" : "Select Your Role"}
            </label>
            
            {hasOnChainRole && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20 mb-3">
                <Lock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Role Locked On-Chain</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your role is registered on the blockchain and cannot be changed. This prevents conflicts of interest.
                  </p>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-2">
              {(["borrower", "lender", "admin"] as const).map((role) => {
                const isLocked = hasOnChainRole && selectedRole !== role;
                const isAdminOrLender = role === "admin" || role === "lender";
                const requiresCode = !hasOnChainRole && isAdminOrLender;
                
                return (
                  <Button
                    key={role}
                    variant={selectedRole === role ? "default" : "outline"}
                    onClick={() => {
                      if (canSelectRole) {
                        setSelectedRole(role);
                        setShowReviewerInput(isAdminOrLender);
                      }
                    }}
                    className={`flex flex-col h-auto py-3 ${isLocked ? "opacity-40" : ""}`}
                    disabled={isLocked || checkingRole}
                    data-testid={`button-role-${role}`}
                  >
                    <span className="capitalize font-medium">{role}</span>
                    {requiresCode && (
                      <span className="text-xs text-muted-foreground">Code required</span>
                    )}
                  </Button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {checkingRole ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Checking blockchain...
                </span>
              ) : hasOnChainRole ? (
                roleDescriptions[selectedRole]
              ) : (
                <>
                  {roleDescriptions[selectedRole]}
                  {selectedRole === "borrower" && (
                    <span className="block mt-1 text-primary">
                      You can register as a borrower directly.
                    </span>
                  )}
                </>
              )}
            </p>
            
            {showReviewerInput && !hasOnChainRole && (selectedRole === "lender" || selectedRole === "admin") && (
              <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border space-y-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Reviewer Access</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the reviewer access code to test {selectedRole} features without on-chain approval.
                </p>
                <Input
                  type="password"
                  placeholder="Enter access code"
                  value={reviewerCode}
                  onChange={(e) => setReviewerCode(e.target.value)}
                  className="h-9"
                  data-testid="input-reviewer-code"
                />
              </div>
            )}
          </div>

          <Button
            size="lg"
            className="w-full text-base gap-2"
            onClick={handleConnect}
            disabled={isConnecting || registering || checkingRole}
            data-testid="button-connect-wallet"
          >
            {registering ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Registering On-Chain...
              </>
            ) : isConnecting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="h-5 w-5" />
                {hasMetaMask 
                  ? hasOnChainRole 
                    ? "Continue with Existing Role" 
                    : "Connect & Register"
                  : "Use Demo Mode"
                }
              </>
            )}
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
