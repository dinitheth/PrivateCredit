import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: string;
    positive: boolean;
  };
  testId?: string;
}

export function StatCard({ title, value, icon: Icon, description, trend, testId }: StatCardProps) {
  return (
    <Card data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground" data-testid={`${testId}-value`}>{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1" data-testid={`${testId}-description`}>
            {description}
          </p>
        )}
        {trend && (
          <p className={`text-xs mt-1 ${trend.positive ? "text-green-500" : "text-destructive"}`}>
            {trend.value}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
