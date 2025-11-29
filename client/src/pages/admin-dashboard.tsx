import { Server, Shield, Users, Activity } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AuditLog {
  id: string;
  action: string;
  userId?: string;
  timestamp: string;
}

interface CoprocessorStatus {
  status: string;
  averageLatencyMs: number;
  totalComputations: number;
  lastKeyRotation?: string;
}

interface LogsResponse {
  logs: AuditLog[];
}

interface StatusResponse {
  status: CoprocessorStatus;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  
  const { data: logsData, isLoading: loadingLogs } = useQuery<LogsResponse>({
    queryKey: ["/api/admin/audit-logs"],
    enabled: true,
  });

  const { data: statusData, isLoading: loadingStatus } = useQuery<StatusResponse>({
    queryKey: ["/api/admin/coprocessor-status"],
    enabled: true,
  });

  const rotateKeysMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/rotate-keys", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coprocessor-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/audit-logs"] });
      toast({
        title: "Keys Rotated",
        description: "Coprocessor keys have been successfully rotated.",
      });
    },
  });

  const auditLogs = logsData?.logs || [];
  const coprocessorStatus = statusData?.status;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Admin Panel</h1>
        <p className="text-muted-foreground">System management and monitoring</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {loadingStatus ? (
          <Skeleton className="h-32" />
        ) : (
          <StatCard
            title="Coprocessor Status"
            value={coprocessorStatus?.status === "active" ? "Active" : "Inactive"}
            icon={Server}
            description={`${coprocessorStatus?.averageLatencyMs || 0}ms avg latency`}
            testId="stat-coprocessor-status"
          />
        )}
        <StatCard
          title="Total Users"
          value="1,247"
          icon={Users}
          description="+12% from last month"
          testId="stat-total-users"
        />
        {loadingStatus ? (
          <Skeleton className="h-32" />
        ) : (
          <StatCard
            title="FHE Computations"
            value={coprocessorStatus?.totalComputations?.toLocaleString() || "0"}
            icon={Activity}
            description="Total computations"
            testId="stat-fhe-computations"
          />
        )}
        {loadingStatus ? (
          <Skeleton className="h-32" />
        ) : (
          <StatCard
            title="Last Key Rotation"
            value={coprocessorStatus?.lastKeyRotation ? new Date(coprocessorStatus.lastKeyRotation).toLocaleDateString() : "Never"}
            icon={Shield}
            description="Key rotation status"
            testId="stat-key-rotation"
          />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Coprocessor Health</CardTitle>
                <CardDescription>Real-time status and metrics</CardDescription>
              </div>
              <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                Operational
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Uptime</span>
                <span className="text-sm font-semibold text-foreground">99.98%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg Latency</span>
                <span className="text-sm font-semibold text-foreground">92ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Queue Depth</span>
                <span className="text-sm font-semibold text-foreground">3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Error Rate</span>
                <span className="text-sm font-semibold text-foreground">0.02%</span>
              </div>
            </div>
            <Button variant="outline" className="w-full" data-testid="button-view-metrics">
              View Detailed Metrics
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Management</CardTitle>
            <CardDescription>Coprocessor key rotation status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Current Key Version</span>
                <Badge variant="outline">v2.4.1</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Last Rotation</span>
                <span className="text-sm font-mono text-muted-foreground">2024-01-03</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Next Rotation</span>
                <span className="text-sm font-mono text-muted-foreground">2024-02-02</span>
              </div>
            </div>
            <Button 
              className="w-full" 
              variant="outline" 
              data-testid="button-rotate-keys"
              onClick={() => rotateKeysMutation.mutate()}
              disabled={rotateKeysMutation.isPending}
            >
              <Shield className="h-4 w-4 mr-2" />
              {rotateKeysMutation.isPending ? "Rotating..." : "Rotate Keys Now"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>System events and user actions</CardDescription>
            </div>
            <Button variant="outline" data-testid="button-export-logs">
              Export Logs
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingLogs ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Action</TableHead>
                    <TableHead className="whitespace-nowrap">User/System</TableHead>
                    <TableHead className="whitespace-nowrap">Timestamp</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.userId ? `${log.userId.substring(0, 10)}...` : "System"}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" data-testid={`button-view-log-${log.id}`}>
                          View
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
