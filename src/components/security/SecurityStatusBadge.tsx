
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldCheck, AlertTriangle } from "lucide-react";

interface SecurityStatusBadgeProps {
  isSecure: boolean;
  operation: string;
}

export const SecurityStatusBadge = ({ isSecure, operation }: SecurityStatusBadgeProps) => {
  if (isSecure) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800">
        <ShieldCheck className="h-3 w-3" />
        {operation} Sécurisé
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className="flex items-center gap-1">
      <AlertTriangle className="h-3 w-3" />
      {operation} Non Sécurisé
    </Badge>
  );
};
