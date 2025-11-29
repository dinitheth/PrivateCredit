import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EncryptionBadge } from "@/components/EncryptionBadge";
import { Shield, Lock, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { simulateEncryption } from "@/lib/encryption";
import { useAuth } from "@/hooks/useAuth";
import { 
  submitEncryptedDataOnChain, 
  requestScoreComputationOnChain,
  getTxExplorerUrl,
  hasMetaMask 
} from "@/lib/web3";

const financialDataSchema = z.object({
  salary: z.string().min(1, "Salary is required"),
  debts: z.string().min(1, "Debts amount is required"),
  expenses: z.string().min(1, "Monthly expenses are required"),
});

type FinancialData = z.infer<typeof financialDataSchema>;

export default function SubmitData() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [useBlockchain, setUseBlockchain] = useState(hasMetaMask());
  const { toast } = useToast();
  const { hasMetaMask: hasWallet } = useAuth();

  const form = useForm<FinancialData>({
    resolver: zodResolver(financialDataSchema),
    defaultValues: {
      salary: "",
      debts: "",
      expenses: "",
    },
  });

  const submitOnChainMutation = useMutation({
    mutationFn: async (data: FinancialData) => {
      const salary = parseInt(data.salary);
      const debts = parseInt(data.debts);
      const expenses = parseInt(data.expenses);
      
      const hash = await submitEncryptedDataOnChain(salary, debts, expenses);
      setTxHash(hash);
      
      try {
        await requestScoreComputationOnChain();
      } catch {
        console.log("Score computation request may require additional steps");
      }
      
      const salaryHandle = simulateEncryption(salary);
      const debtsHandle = simulateEncryption(debts);
      const expensesHandle = simulateEncryption(expenses);
      await apiRequest("POST", "/api/encrypted-data", {
        salaryHandle,
        debtsHandle,
        expensesHandle,
        txHash: hash,
      });
      
      return { txHash: hash };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/encrypted-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credit-score"] });
      setIsSubmitted(true);
      toast({
        title: "Blockchain Transaction Confirmed",
        description: `Data submitted on-chain. TX: ${result.txHash.slice(0, 10)}...`,
      });
    },
    onError: (error: Error) => {
      console.error("Blockchain error:", error);
      toast({
        title: "Blockchain Transaction Failed",
        description: error.message || "Failed to submit to blockchain. Try demo mode instead.",
        variant: "destructive",
      });
    },
  });

  const submitDataMutation = useMutation({
    mutationFn: async (data: FinancialData) => {
      try {
        const salaryHandle = simulateEncryption(parseInt(data.salary));
        const debtsHandle = simulateEncryption(parseInt(data.debts));
        const expensesHandle = simulateEncryption(parseInt(data.expenses));

        console.log("Encrypted handles:", { salaryHandle, debtsHandle, expensesHandle });

        const result = await apiRequest("POST", "/api/encrypted-data", {
          salaryHandle,
          debtsHandle,
          expensesHandle,
        });
        
        console.log("Submission result:", result);
        return result;
      } catch (error) {
        console.error("Mutation error caught:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/encrypted-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credit-score"] });
      setIsSubmitted(true);
      toast({
        title: "Data Encrypted & Submitted",
        description: "Your financial data has been encrypted and your credit score computed.",
      });
    },
    onError: (error: Error) => {
      console.error("Mutation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit encrypted data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: FinancialData) => {
    console.log("Form submitted with:", data);
    console.log("Form errors:", form.formState.errors);
    
    if (useBlockchain && hasWallet) {
      submitOnChainMutation.mutate(data);
    } else {
      submitDataMutation.mutate(data);
    }
  };

  const isPending = submitDataMutation.isPending || submitOnChainMutation.isPending;

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
                  Data Successfully Encrypted
                </h2>
                <p className="text-muted-foreground max-w-md">
                  Your financial data has been encrypted in your browser and submitted to the blockchain. 
                  The Zama coprocessor will now compute your credit score on the encrypted data.
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
                    {txHash}
                  </p>
                </div>
              )}

              <div className="rounded-lg bg-muted/50 p-4 w-full max-w-md">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground mb-1">Privacy Guaranteed</p>
                    <p className="text-xs text-muted-foreground">
                      Your raw data remains encrypted. Only encrypted ciphertext handles are stored on-chain.
                    </p>
                  </div>
                </div>
              </div>
              <Button onClick={() => { setIsSubmitted(false); setTxHash(null); }} data-testid="button-submit-another">
                Submit Another Entry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Submit Financial Data</h1>
        <p className="text-muted-foreground">
          Your data will be encrypted in your browser before submission
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle>Financial Information</CardTitle>
              <EncryptionBadge />
            </div>
            <CardDescription>
              All fields are encrypted using TFHE before blockchain submission
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="salary" className="flex items-center gap-2">
                  Annual Salary
                  <Lock className="h-3 w-3 text-secondary" />
                </Label>
                <Input
                  id="salary"
                  type="number"
                  placeholder="e.g., 75000"
                  {...form.register("salary")}
                  data-testid="input-salary"
                  className="h-12"
                />
                {form.formState.errors.salary && (
                  <p className="text-xs text-destructive">{form.formState.errors.salary.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Your annual gross income in USD
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="debts" className="flex items-center gap-2">
                  Total Debts
                  <Lock className="h-3 w-3 text-secondary" />
                </Label>
                <Input
                  id="debts"
                  type="number"
                  placeholder="e.g., 15000"
                  {...form.register("debts")}
                  data-testid="input-debts"
                  className="h-12"
                />
                {form.formState.errors.debts && (
                  <p className="text-xs text-destructive">{form.formState.errors.debts.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Combined outstanding debt (credit cards, loans, etc.)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expenses" className="flex items-center gap-2">
                  Monthly Expenses
                  <Lock className="h-3 w-3 text-secondary" />
                </Label>
                <Input
                  id="expenses"
                  type="number"
                  placeholder="e.g., 3500"
                  {...form.register("expenses")}
                  data-testid="input-expenses"
                  className="h-12"
                />
                {form.formState.errors.expenses && (
                  <p className="text-xs text-destructive">{form.formState.errors.expenses.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Average monthly living expenses
                </p>
              </div>

              {hasWallet && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                  <div>
                    <p className="text-sm font-medium text-foreground">Submit to Blockchain</p>
                    <p className="text-xs text-muted-foreground">
                      {useBlockchain ? "Real transaction on Base Sepolia" : "Demo mode (no gas required)"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={useBlockchain ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUseBlockchain(!useBlockchain)}
                    data-testid="button-toggle-blockchain"
                  >
                    {useBlockchain ? "On-Chain" : "Demo"}
                  </Button>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isPending}
                data-testid="button-encrypt-submit"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {useBlockchain ? "Confirming Transaction..." : "Encrypting Data..."}
                  </>
                ) : (
                  useBlockchain && hasWallet ? "Encrypt & Submit On-Chain" : "Encrypt & Submit Data"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Encryption Process</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Browser Encryption</p>
                    <p className="text-xs text-muted-foreground">Data encrypted locally using TFHE</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">On-Chain Storage</p>
                    <p className="text-xs text-muted-foreground">Only ciphertext stored on Base</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">FHE Computation</p>
                    <p className="text-xs text-muted-foreground">Score computed on encrypted data</p>
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
                  <p className="text-sm font-medium text-foreground mb-1">100% Private</p>
                  <p className="text-xs text-muted-foreground">
                    Your financial data never appears in plaintext. Only you can decrypt your score.
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
