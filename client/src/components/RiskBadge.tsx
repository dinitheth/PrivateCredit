import { Badge } from "@/components/ui/badge";

interface RiskBadgeProps {
  risk: "low" | "medium" | "high";
  className?: string;
}

export function RiskBadge({ risk, className }: RiskBadgeProps) {
  const variants = {
    low: "border-green-500/50 bg-green-500/10 text-green-500",
    medium: "border-yellow-500/50 bg-yellow-500/10 text-yellow-500",
    high: "border-destructive/50 bg-destructive/10 text-destructive",
  };

  return (
    <Badge
      variant="outline"
      className={`${variants[risk]} ${className}`}
      data-testid={`badge-risk-${risk}`}
    >
      {risk.toUpperCase()}
    </Badge>
  );
}
