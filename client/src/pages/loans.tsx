import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskBadge } from "@/components/RiskBadge";
import { Wallet } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface Loan {
  id: string;
  requestedAmount: number;
  riskTier: string;
  status: string;
  createdAt: string;
}

interface LoansResponse {
  loans: Loan[];
}

export default function Loans() {
  const [, setLocation] = useLocation();
  
  const { data: loansData, isLoading } = useQuery<LoansResponse>({
    queryKey: ["/api/loans"],
  });

  const loans = loansData?.loans || [];

  const handleApplyLoan = () => {
    setLocation("/submit-data");
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "border-yellow-500/50 bg-yellow-500/10 text-yellow-500",
      approved: "border-green-500/50 bg-green-500/10 text-green-500",
      denied: "border-destructive/50 bg-destructive/10 text-destructive",
    };
    return (
      <Badge variant="outline" className={variants[status as keyof typeof variants]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">My Loans</h1>
          <p className="text-muted-foreground">Track your loan applications and active loans</p>
        </div>
        <Button onClick={handleApplyLoan} data-testid="button-apply-loan">Apply for Loan</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Loan Applications</CardTitle>
          <CardDescription>View and manage your loan requests</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : loans.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Risk Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((loan: any) => (
                  <TableRow key={loan.id} data-testid={`row-loan-${loan.id}`}>
                    <TableCell className="font-mono text-sm" data-testid={`cell-loan-id-${loan.id}`}>
                      #{loan.id.substring(0, 8)}
                    </TableCell>
                    <TableCell className="font-semibold" data-testid={`cell-loan-amount-${loan.id}`}>
                      ${(loan.requestedAmount / 100).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <RiskBadge risk={loan.riskTier} />
                    </TableCell>
                    <TableCell>{getStatusBadge(loan.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(loan.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" data-testid={`button-view-loan-${loan.id}`}>
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Wallet className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">No loan applications yet</p>
              <p className="text-xs text-muted-foreground max-w-xs mb-6">
                Submit your encrypted financial data and get a credit score to apply for loans
              </p>
              <Button onClick={handleApplyLoan} data-testid="button-apply-first-loan">Apply for Your First Loan</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
