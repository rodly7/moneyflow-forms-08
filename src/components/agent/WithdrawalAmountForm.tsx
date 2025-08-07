
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ClientData {
  id: string;
  full_name: string;
  phone: string;
  // Le solde n'est plus exposé aux agents
  country?: string;
}

interface WithdrawalAmountFormProps {
  amount: string;
  clientData: ClientData | null;
  onAmountChange: (value: string) => void;
}

export const WithdrawalAmountForm = ({ 
  amount, 
  clientData, 
  onAmountChange 
}: WithdrawalAmountFormProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="amount">Montant du retrait (XAF)</Label>
      <Input
        id="amount"
        type="number"
        placeholder="Entrez le montant"
        value={amount}
        onChange={(e) => onAmountChange(e.target.value)}
        required
        className="h-12 text-lg"
        disabled={!clientData}
      />
      <p className="text-xs text-gray-600">
        Le système vérifiera automatiquement le solde du client lors du traitement
      </p>
    </div>
  );
};
