import { useState } from "react";
import { DollarSign, TrendingUp, Users, AlertCircle, Loader2 } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskBadge } from "@/components/RiskBadge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { approveLoanOnChain, getTxExplorerUrl } from "@/lib/web3";

interface LoanRequest {
  id: string;
  borrowerId: string;
  requestedAmount: number;
  riskTier: string;
  status: string;
}

interface LoansResponse {
  loans: LoanRequest[];
}

interface PortfolioStats {
  totalPortfolio: number;
  activeLoans: number;
  avgReturn: number;
  defaultRate: number;
}

export default function LenderDashboard() {
  const { toast } = useToast();
  const { hasMetaMask: hasWallet } = useAuth();
  const [approvingLoanId, setApprovingLoanId] = useState<string | null>(null);
  
  const { data: loansData, isLoading } = useQuery<LoansResponse>({
    queryKey: ["/api/loans/pending"],
  });

  const { data: statsData, isLoading: loadingStats } = useQuery<{ stats: PortfolioStats }>({
    queryKey: ["/api/lender/stats"],
  });

  const approveLoanMutation = useMutation({
    mutationFn: async ({ loanId, amount, onChainLoanId }: { loanId: string; amount: number; onChainLoanId?: number }) => {
      if (!hasWallet) {
        throw new Error("Please connect MetaMask to fund loans");
      }
      setApprovingLoanId(loanId);
      const amountInEth = (amount / 100).toFixed(6);
      const chainLoanId = onChainLoanId || 1;
      const txHash = await approveLoanOnChain(chainLoanId, amountInEth);
      await apiRequest("PUT", `/api/loans/${loanId}/approve`, { txHash });
      return { txHash };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lender/stats"] });
      toast({
        title: "Loan Funded On-Chain",
        description: `TX: ${result.txHash.slice(0, 10)}...${result.txHash.slice(-8)}`,
      });
      setApprovingLoanId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Transaction Failed",
        description: error.message,
        variant: "destructive",
      });
      setApprovingLoanId(null);
    },
  });

  const handleApproveLoan = (loanId: string, amount: number) => {
    approveLoanMutation.mutate({ loanId, amount });
  };

  const stats = statsData?.stats;

  const loanRequests = loansData?.loans || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Lender Dashboard</h1>
        <p className="text-muted-foreground">Review loan requests and manage your portfolio</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {loadingStats ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <StatCard
              title="Total Portfolio"
              value={stats?.totalPortfolio ? `$${stats.totalPortfolio.toLocaleString()}` : "$0"}
              icon={DollarSign}
              description="Across all active loans"
              testId="stat-total-portfolio"
            />
            <StatCard
              title="Active Loans"
              value={stats?.activeLoans?.toString() || "0"}
              icon={Users}
              description="Currently funded"
              testId="stat-active-loans-lender"
            />
            <StatCard
              title="Avg. Return"
              value={stats?.avgReturn ? `${stats.avgReturn}%` : "0%"}
              icon={TrendingUp}
              description="Annual percentage yield"
              testId="stat-avg-return"
            />
            <StatCard
              title="Default Rate"
              value={stats?.defaultRate ? `${stats.defaultRate}%` : "0%"}
              icon={AlertCircle}
              description="Portfolio default rate"
              testId="stat-default-rate"
            />
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle>Loan Requests</CardTitle>
              <CardDescription>
                Review encrypted risk assessments and fund loans on-chain
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" data-testid="button-filter-requests">
                Filter by Risk
              </Button>
            </div>
          </div>
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
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Request ID</TableHead>
                <TableHead className="whitespace-nowrap">Borrower</TableHead>
                <TableHead className="whitespace-nowrap">Amount</TableHead>
                <TableHead className="whitespace-nowrap">Risk</TableHead>
                <TableHead className="whitespace-nowrap">Score</TableHead>
                <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loanRequests.map((request: any) => (
                <TableRow key={request.id} className="hover-elevate" data-testid={`row-request-${request.id}`}>
                  <TableCell className="font-mono text-sm">#{request.id.substring(0, 8)}</TableCell>
                  <TableCell className="font-mono text-sm">{request.borrowerId.substring(0, 10)}...</TableCell>
                  <TableCell className="font-semibold">${(request.requestedAmount / 100).toLocaleString()}</TableCell>
                  <TableCell>
                    <RiskBadge risk={request.riskTier} />
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground italic">Encrypted</span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" data-testid={`button-review-${request.id}`}>
                      Review
                    </Button>
                    <Button 
                      size="sm" 
                      data-testid={`button-approve-${request.id}`}
                      onClick={() => handleApproveLoan(request.id, request.requestedAmount)}
                      disabled={approveLoanMutation.isPending || approvingLoanId === request.id || !hasWallet}
                    >
                      {approvingLoanId === request.id ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Funding...
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
