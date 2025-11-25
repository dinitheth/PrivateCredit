import { DollarSign, TrendingUp, Users, AlertCircle } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskBadge } from "@/components/RiskBadge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function LenderDashboard() {
  const { toast } = useToast();
  const { data: loansData, isLoading } = useQuery({
    queryKey: ["/api/loans/pending"],
  });

  const approveLoanMutation = useMutation({
    mutationFn: async (loanId: string) => {
      return await apiRequest("PUT", `/api/loans/${loanId}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans/pending"] });
      toast({
        title: "Loan Approved",
        description: "The loan has been successfully approved.",
      });
    },
  });

  const loanRequests = loansData?.loans || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Lender Dashboard</h1>
        <p className="text-muted-foreground">Review loan requests and manage your portfolio</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Portfolio"
          value="$250,000"
          icon={DollarSign}
          description="Across all active loans"
          testId="stat-total-portfolio"
        />
        <StatCard
          title="Active Loans"
          value="12"
          icon={Users}
          description="Currently funded"
          testId="stat-active-loans-lender"
        />
        <StatCard
          title="Avg. Return"
          value="8.5%"
          icon={TrendingUp}
          description="Annual percentage yield"
          testId="stat-avg-return"
        />
        <StatCard
          title="Default Rate"
          value="0.8%"
          icon={AlertCircle}
          description="Below industry average"
          testId="stat-default-rate"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Loan Requests</CardTitle>
              <CardDescription>
                Review encrypted risk assessments and approve loans
              </CardDescription>
            </div>
            <Button variant="outline" data-testid="button-filter-requests">
              Filter by Risk
            </Button>
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
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>Borrower</TableHead>
                <TableHead>Requested Amount</TableHead>
                <TableHead>Risk Tier</TableHead>
                <TableHead>Credit Score</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                      onClick={() => approveLoanMutation.mutate(request.id)}
                      disabled={approveLoanMutation.isPending}
                    >
                      Approve
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
            <CardDescription>Breakdown of your loan portfolio by risk tier</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-sm text-foreground">Low Risk</span>
                </div>
                <span className="text-sm font-semibold text-foreground">65%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm text-foreground">Medium Risk</span>
                </div>
                <span className="text-sm font-semibold text-foreground">28%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-destructive"></div>
                  <span className="text-sm text-foreground">High Risk</span>
                </div>
                <span className="text-sm font-semibold text-foreground">7%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest transactions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 pb-3 border-b border-border">
                <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Loan Approved</p>
                  <p className="text-xs text-muted-foreground">$5,000 to 0x1bc9...45ef</p>
                </div>
                <span className="text-xs text-muted-foreground">2h ago</span>
              </div>
              <div className="flex items-start gap-3 pb-3 border-b border-border">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Payment Received</p>
                  <p className="text-xs text-muted-foreground">$420 from 0x742d...89ab</p>
                </div>
                <span className="text-xs text-muted-foreground">1d ago</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">New Loan Request</p>
                  <p className="text-xs text-muted-foreground">$25,000 from 0x8a3f...12cd</p>
                </div>
                <span className="text-xs text-muted-foreground">3d ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
