import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle2, ExternalLink, Loader2, AlertCircle, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { applyForLoanOnChain, getTxExplorerUrl } from "@/lib/web3";
import { useLocation, Link } from "wouter";

const loanApplicationSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  termDays: z.string().min(1, "Term is required"),
});

type LoanApplication = z.infer<typeof loanApplicationSchema>;

interface CreditScoreResponse {
  creditScore?: {
    id: string;
    encryptedScoreHandle: string;
    status: string;
  };
}

export default function ApplyLoan() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const { toast } = useToast();
  const { hasMetaMask: hasWallet } = useAuth();
  const [, setLocation] = useLocation();

  const { data: creditScoreData, isLoading: loadingScore } = useQuery<CreditScoreResponse>({
    queryKey: ["/api/credit-score"],
  });

  const creditScore = creditScoreData?.creditScore;

  const form = useForm<LoanApplication>({
    resolver: zodResolver(loanApplicationSchema),
    defaultValues: {
      amount: "",
      termDays: "30",
    },
  });

  const applyLoanMutation = useMutation({
    mutationFn: async (data: LoanApplication) => {
      if (!hasWallet) {
        throw new Error("Please connect MetaMask to apply for a loan");
      }

      if (!creditScore) {
        throw new Error("You need a credit score first. Please submit your financial data.");
      }

      const amountInCents = parseInt(data.amount) * 100;
      const termDays = parseInt(data.termDays);
      const amountInEth = (parseInt(data.amount) / 10000).toFixed(6);

      const { txHash: hash, loanId } = await applyForLoanOnChain(amountInEth, termDays);
      setTxHash(hash);

      await apiRequest("POST", "/api/loans", {
        requestedAmount: amountInCents,
        termDays,
        txHash: hash,
        onChainLoanId: loanId,
      });

      return { txHash: hash, loanId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      setIsSubmitted(true);
      toast({
        title: "Loan Application Submitted",
        description: `TX: ${result.txHash.slice(0, 10)}...${result.txHash.slice(-8)}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Application Failed",
        description: error.message || "Failed to submit loan application.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: LoanApplication) => {
    applyLoanMutation.mutate(data);
  };

  const isPending = applyLoanMutation.isPending;

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-accent" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Loan Application Submitted
                </h2>
                <p className="text-muted-foreground max-w-md">
                  Your loan request has been submitted to the blockchain and is now pending review by lenders.
                </p>
              </div>

              {txHash && (
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 w-full max-w-md">
                  <p className="text-sm font-medium text-foreground mb-2">Transaction Confirmed</p>
                  <a
                    href={getTxExplorerUrl(txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1 justify-center"
                    data-testid="link-tx-explorer"
                  >
                    View on BaseScan <ExternalLink className="h-3 w-3" />
                  </a>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    TX: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  </p>
                </div>
              )}

              <div className="rounded-lg bg-muted/50 p-4 w-full max-w-md space-y-3">
                <h3 className="text-sm font-medium text-foreground">What happens next?</h3>
                <div className="text-left space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">1</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Lenders review your encrypted risk tier (not your raw data)
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">2</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      If approved, lender funds the loan on-chain
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">3</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Funds are transferred directly to your wallet
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setLocation("/loans")} data-testid="button-view-loans">
                  View My Loans
                </Button>
                <Button onClick={() => { setIsSubmitted(false); setTxHash(null); form.reset(); }} data-testid="button-apply-another">
                  Apply for Another
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!creditScore && !loadingScore) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-destructive" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Credit Score Required
                </h2>
                <p className="text-muted-foreground max-w-md">
                  You need to submit your encrypted financial data first to get a credit score before you can apply for a loan.
                </p>
              </div>
              <Link href="/submit-data">
                <Button data-testid="button-submit-data-first">
                  Submit Financial Data
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Apply for a Loan</h1>
        <p className="text-muted-foreground">
          Submit your loan request to the blockchain for lender review
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle>Loan Application</CardTitle>
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                Credit Score Ready
              </Badge>
            </div>
            <CardDescription>
              Your loan request will be submitted on-chain for lender review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="amount" className="flex items-center gap-2">
                  Loan Amount (USD)
                  <Wallet className="h-3 w-3 text-muted-foreground" />
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="e.g., 5000"
                  {...form.register("amount")}
                  data-testid="input-loan-amount"
                  className="h-12"
                />
                {form.formState.errors.amount && (
                  <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Enter the amount you wish to borrow in USD
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="termDays">Loan Term (Days)</Label>
                <Input
                  id="termDays"
                  type="number"
                  placeholder="e.g., 30"
                  {...form.register("termDays")}
                  data-testid="input-loan-term"
                  className="h-12"
                />
                {form.formState.errors.termDays && (
                  <p className="text-xs text-destructive">{form.formState.errors.termDays.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  How many days until repayment is due
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isPending || !hasWallet}
                data-testid="button-submit-loan"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting to Blockchain...
                  </>
                ) : !hasWallet ? (
                  "Connect MetaMask to Apply"
                ) : (
                  "Submit Loan Application On-Chain"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Loan Process</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Apply On-Chain</p>
                    <p className="text-xs text-muted-foreground">Request submitted to blockchain</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Lender Review</p>
                    <p className="text-xs text-muted-foreground">Lenders see only your risk tier</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Receive Funds</p>
                    <p className="text-xs text-muted-foreground">ETH sent to your wallet</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Privacy Protected</p>
                  <p className="text-xs text-muted-foreground">
                    Lenders only see your encrypted risk tier, never your actual financial data.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
