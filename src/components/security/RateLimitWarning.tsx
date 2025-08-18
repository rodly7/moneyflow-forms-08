
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RateLimitWarningProps {
  operation: string;
  remainingAttempts?: number;
  resetTime?: Date;
}

export const RateLimitWarning = ({ 
  operation, 
  remainingAttempts, 
  resetTime 
}: RateLimitWarningProps) => {
  const formatResetTime = (time: Date) => {
    const now = new Date();
    const diff = time.getTime() - now.getTime();
    const minutes = Math.ceil(diff / (1000 * 60));
    
    if (minutes <= 0) return "maintenant";
    if (minutes === 1) return "dans 1 minute";
    return `dans ${minutes} minutes`;
  };

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        Limite de tentatives pour {operation} bientôt atteinte.
        {remainingAttempts !== undefined && (
          <> {remainingAttempts} tentative(s) restante(s).</>
        )}
        {resetTime && (
          <> Limite réinitialisée {formatResetTime(resetTime)}.</>
        )}
      </AlertDescription>
    </Alert>
  );
};
