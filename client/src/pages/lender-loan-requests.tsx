import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskBadge } from "@/components/RiskBadge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { approveLoanOnChain, denyLoanOnChain } from "@/lib/web3";

interface LoanRequest {
  id: string;
  borrowerId: string;
  requestedAmount: number;
  riskTier: string;
  status: string;
  termDays?: number;
}

interface LoansResponse {
  loans: LoanRequest[];
}

export default function LenderLoanRequests() {
  const { toast } = useToast();
  const { hasMetaMask: hasWallet } = useAuth();
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const { data: loansData, isLoading } = useQuery<LoansResponse>({
    queryKey: ["/api/loans/pending"],
  });

  const approveMutation = useMutation({
    mutationFn: async ({ loanId, amount }: { loanId: string; amount: number }) => {
      if (!hasWallet) {
        throw new Error("Please connect MetaMask to fund loans");
      }
      setProcessingId(loanId);
      const amountInEth = (amount / 100).toFixed(6);
      const txHash = await approveLoanOnChain(1, amountInEth);
      await apiRequest("PUT", `/api/loans/${loanId}/approve`, { txHash });
      return { txHash };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans/pending"] });
      toast({
        title: "Loan Funded",
        description: `TX: ${result.txHash.slice(0, 10)}...${result.txHash.slice(-8)}`,
      });
      setProcessingId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Transaction Failed",
        description: error.message,
        variant: "destructive",
      });
      setProcessingId(null);
    },
  });

  const denyMutation = useMutation({
    mutationFn: async (loanId: string) => {
      if (!hasWallet) {
        throw new Error("Please connect MetaMask to deny loans");
      }
      setProcessingId(loanId);
      const txHash = await denyLoanOnChain(1, "Loan denied by lender");
      await apiRequest("PUT", `/api/loans/${loanId}/deny`, { txHash });
      return { txHash };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans/pending"] });
      toast({
        title: "Loan Denied",
        description: "The loan request has been denied.",
      });
      setProcessingId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Transaction Failed",
        description: error.message,
        variant: "destructive",
      });
      setProcessingId(null);
    },
  });

  const loanRequests = loansData?.loans || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Loan Requests</h1>
        <p className="text-muted-foreground">Review and process pending loan applications</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
          <CardDescription>
            All loan requests awaiting your review. Risk tiers are computed from encrypted credit scores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : loanRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">No pending loan requests</p>
              <p className="text-xs text-muted-foreground mt-1">New requests will appear here when borrowers apply</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Request ID</TableHead>
                    <TableHead className="whitespace-nowrap">Borrower</TableHead>
                    <TableHead className="whitespace-nowrap">Amount</TableHead>
                    <TableHead className="whitespace-nowrap">Term</TableHead>
                    <TableHead className="whitespace-nowrap">Risk Tier</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loanRequests.map((request) => (
                    <TableRow key={request.id} data-testid={`row-request-${request.id}`}>
                      <TableCell className="font-mono text-sm">
                        #{request.id.substring(0, 8)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {request.borrowerId.substring(0, 10)}...
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${(request.requestedAmount / 100).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {request.termDays || 30} days
                      </TableCell>
                      <TableCell>
                        <RiskBadge risk={request.riskTier as "low" | "medium" | "high"} />
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => denyMutation.mutate(request.id)}
                          disabled={processingId === request.id || !hasWallet}
                          data-testid={`button-deny-${request.id}`}
                        >
                          Deny
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => approveMutation.mutate({ loanId: request.id, amount: request.requestedAmount })}
                          disabled={processingId === request.id || !hasWallet}
                          data-testid={`button-fund-${request.id}`}
                        >
                          {processingId === request.id ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Processing...
                            </>
                          ) : !hasWallet ? (
                            "Connect Wallet"
                          ) : (
                            "Fund On-Chain"
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
