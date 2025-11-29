import { DollarSign, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskBadge } from "@/components/RiskBadge";
import { StatCard } from "@/components/StatCard";
import { useQuery } from "@tanstack/react-query";

interface ActiveLoan {
  id: string;
  borrowerId: string;
  amount: number;
  riskTier: string;
  status: string;
  approvedAt?: string;
  termDays?: number;
}

interface LoansResponse {
  loans: ActiveLoan[];
}

interface PortfolioStats {
  totalPortfolio: number;
  activeLoans: number;
  avgReturn: number;
  defaultRate: number;
}

export default function LenderPortfolio() {
  const { data: loansData, isLoading } = useQuery<LoansResponse>({
    queryKey: ["/api/loans/funded"],
  });

  const { data: statsData, isLoading: loadingStats } = useQuery<{ stats: PortfolioStats }>({
    queryKey: ["/api/lender/stats"],
  });

  const loans = loansData?.loans || [];
  const stats = statsData?.stats;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Portfolio</h1>
        <p className="text-muted-foreground">View and manage your funded loans</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {loadingStats ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <StatCard
              title="Total Funded"
              value={stats?.totalPortfolio ? `$${stats.totalPortfolio.toLocaleString()}` : "$0"}
              icon={DollarSign}
              description="Total capital deployed"
              testId="stat-total-funded"
            />
            <StatCard
              title="Active Loans"
              value={stats?.activeLoans?.toString() || "0"}
              icon={Clock}
              description="Currently outstanding"
              testId="stat-active-count"
            />
            <StatCard
              title="Average Return"
              value={stats?.avgReturn ? `${stats.avgReturn}%` : "0%"}
              icon={TrendingUp}
              description="Annualized yield"
              testId="stat-avg-yield"
            />
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Loans</CardTitle>
          <CardDescription>
            Loans you have funded that are currently outstanding
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : loans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">No active loans in portfolio</p>
              <p className="text-xs text-muted-foreground mt-1">Fund loan requests to build your portfolio</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Loan ID</TableHead>
                    <TableHead className="whitespace-nowrap">Borrower</TableHead>
                    <TableHead className="whitespace-nowrap">Amount</TableHead>
                    <TableHead className="whitespace-nowrap">Risk</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap">Funded Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loans.map((loan) => (
                    <TableRow key={loan.id} data-testid={`row-loan-${loan.id}`}>
                      <TableCell className="font-mono text-sm">
                        #{loan.id.substring(0, 8)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {loan.borrowerId.substring(0, 10)}...
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${(loan.amount / 100).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <RiskBadge risk={loan.riskTier as "low" | "medium" | "high"} />
                      </TableCell>
                      <TableCell>
                        <Badge variant={loan.status === "active" ? "default" : "secondary"}>
                          {loan.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {loan.approvedAt ? new Date(loan.approvedAt).toLocaleDateString() : "-"}
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
