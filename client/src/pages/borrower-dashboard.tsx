import { Shield, TrendingUp, Wallet, FileText } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EncryptionBadge } from "@/components/EncryptionBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface CreditScoreResponse {
  creditScore?: {
    id: string;
    encryptedScoreHandle: string;
    status: string;
  };
}

interface Loan {
  id: string;
  status: string;
}

interface LoansResponse {
  loans: Loan[];
}

interface EncryptedDataResponse {
  data: unknown[];
}

export default function BorrowerDashboard() {
  const { data: creditScoreData, isLoading: loadingScore } = useQuery<CreditScoreResponse>({
    queryKey: ["/api/credit-score"],
  });

  const { data: loansData, isLoading: loadingLoans } = useQuery<LoansResponse>({
    queryKey: ["/api/loans"],
  });

  const { data: encryptedDataResponse, isLoading: loadingData } = useQuery<EncryptedDataResponse>({
    queryKey: ["/api/encrypted-data"],
  });

  const creditScore = creditScoreData?.creditScore;
  const loans = loansData?.loans || [];
  const dataSubmissions = encryptedDataResponse?.data || [];
  const activeLoans = loans.filter((l: any) => l.status === "approved" || l.status === "active");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Borrower Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your encrypted financial data and loan applications
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {loadingScore ? (
          <Skeleton className="h-32" />
        ) : (
          <StatCard
            title="Credit Score"
            value={creditScore ? "Encrypted" : "Not Available"}
            icon={Shield}
            description={creditScore ? "Click to decrypt your score" : "Submit data first"}
            testId="stat-credit-score"
          />
        )}
        {loadingLoans ? (
          <Skeleton className="h-32" />
        ) : (
          <StatCard
            title="Active Loans"
            value={activeLoans.length}
            icon={Wallet}
            description={activeLoans.length > 0 ? `${activeLoans.length} active` : "No active loans"}
            testId="stat-active-loans"
          />
        )}
        <StatCard
          title="Available Credit"
          value="$0"
          icon={TrendingUp}
          description={creditScore ? "Ready to apply" : "Submit data to get credit"}
          testId="stat-available-credit"
        />
        {loadingData ? (
          <Skeleton className="h-32" />
        ) : (
          <StatCard
            title="Data Submissions"
            value={dataSubmissions.length}
            icon={FileText}
            description={dataSubmissions.length > 0 ? `${dataSubmissions.length} submissions` : "No submissions yet"}
            testId="stat-data-submissions"
          />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Submit Financial Data</CardTitle>
              <EncryptionBadge />
            </div>
            <CardDescription>
              Encrypt your financial information to get a confidential credit score
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-accent" />
                <span className="font-medium text-foreground">End-to-End Encrypted</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Your salary, debts, and expenses are encrypted in your browser using TFHE before submission
              </p>
            </div>
            <Link href="/submit-data">
              <Button className="w-full" data-testid="button-submit-data">
                Submit Encrypted Data
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest transactions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">No recent activity</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Submit your financial data to start building your credit profile
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
          <CardDescription>
            Understanding the private credit scoring process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <h3 className="font-semibold text-foreground">Submit Data</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Encrypt your financial information locally in your browser using TFHE encryption
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <h3 className="font-semibold text-foreground">FHE Computation</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Zama coprocessor computes your credit score on encrypted data without ever seeing the raw values
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <h3 className="font-semibold text-foreground">Decrypt & Apply</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Decrypt your score privately, and apply for loans with lenders who only see encrypted risk tiers
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
