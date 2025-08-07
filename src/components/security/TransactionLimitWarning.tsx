
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface TransactionLimitWarningProps {
  amount: number;
  limit: number;
  operationType: string;
}

export const TransactionLimitWarning = ({ 
  amount, 
  limit, 
  operationType 
}: TransactionLimitWarningProps) => {
  const isNearLimit = amount > limit * 0.8;
  const isOverLimit = amount > limit;

  if (!isNearLimit) return null;

  return (
    <Alert variant={isOverLimit ? "destructive" : "default"} className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        {isOverLimit ? (
          `Le montant de ${amount.toLocaleString()} FCFA dépasse la limite autorisée de ${limit.toLocaleString()} FCFA pour les ${operationType}.`
        ) : (
          `Attention: Le montant de ${amount.toLocaleString()} FCFA approche la limite de ${limit.toLocaleString()} FCFA pour les ${operationType}.`
        )}
      </AlertDescription>
    </Alert>
  );
};
