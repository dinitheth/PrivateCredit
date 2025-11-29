import { Server, Shield, Activity, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CONTRACT_ADDRESSES, getExplorerUrl } from "@/lib/web3";
import { ExternalLink } from "lucide-react";

interface CoprocessorStatus {
  status: string;
  averageLatencyMs: number;
  totalComputations: number;
  lastKeyRotation?: string;
}

interface StatusResponse {
  status: CoprocessorStatus;
}

export default function AdminSystemStatus() {
  const { toast } = useToast();

  const { data: statusData, isLoading } = useQuery<StatusResponse>({
    queryKey: ["/api/admin/coprocessor-status"],
  });

  const rotateKeysMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/rotate-keys", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coprocessor-status"] });
      toast({
        title: "Keys Rotated",
        description: "Coprocessor keys have been successfully rotated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Key Rotation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const status = statusData?.status;
  const isActive = status?.status === "active";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">System Status</h1>
        <p className="text-muted-foreground">Monitor FHEVM coprocessor and smart contract health</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Coprocessor</span>
                  {isActive ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {isActive ? "Operational" : "Offline"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  FHEVM computation service
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Latency</span>
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {status?.averageLatencyMs || 0}ms
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Average response time
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Computations</span>
                  <Activity className="h-5 w-5 text-accent" />
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {status?.totalComputations?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total FHE operations
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Last Key Rotation</span>
                  <Shield className="h-5 w-5 text-secondary" />
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {status?.lastKeyRotation 
                    ? new Date(status.lastKeyRotation).toLocaleDateString() 
                    : "Never"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Encryption key status
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle>Deployed Contracts</CardTitle>
              <CardDescription>Smart contracts on Base Sepolia testnet</CardDescription>
            </div>
            <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
              Live on Base Sepolia
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {Object.entries(CONTRACT_ADDRESSES).map(([name, address]) => (
              <div key={name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                <div>
                  <p className="text-sm font-medium text-foreground capitalize">
                    {name.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {address.slice(0, 10)}...{address.slice(-8)}
                  </p>
                </div>
                <a
                  href={getExplorerUrl(address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                  data-testid={`link-contract-${name}`}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Network Status</CardTitle>
            <CardDescription>Base Sepolia blockchain connectivity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Network</span>
                <Badge variant="outline">Base Sepolia</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Chain ID</span>
                <span className="text-sm font-mono text-foreground">84532</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Block Explorer</span>
                <a 
                  href="https://sepolia.basescan.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  BaseScan
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Management</CardTitle>
            <CardDescription>FHEVM encryption key rotation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Current Status</span>
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                  Active
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Last Rotation</span>
                <span className="text-sm font-mono text-muted-foreground">
                  {status?.lastKeyRotation 
                    ? new Date(status.lastKeyRotation).toLocaleDateString() 
                    : "Never"}
                </span>
              </div>
            </div>
            <Button 
              className="w-full" 
              variant="outline" 
              onClick={() => rotateKeysMutation.mutate()}
              disabled={rotateKeysMutation.isPending}
              data-testid="button-rotate-keys"
            >
              <Shield className="h-4 w-4 mr-2" />
              {rotateKeysMutation.isPending ? "Rotating..." : "Rotate Keys Now"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
