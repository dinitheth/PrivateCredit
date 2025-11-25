import { Lock, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EncryptionBadgeProps {
  variant?: "default" | "success";
  className?: string;
}

export function EncryptionBadge({ variant = "default", className }: EncryptionBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`flex items-center gap-1.5 text-xs ${variant === "success" ? "border-accent/50 bg-accent/10 text-accent" : "border-secondary/50 bg-secondary/10 text-secondary"} ${className}`}
      data-testid="badge-encryption"
    >
      {variant === "success" ? (
        <ShieldCheck className="h-3 w-3" />
      ) : (
        <Lock className="h-3 w-3" />
      )}
      <span>Encrypted in browser</span>
    </Badge>
  );
}
