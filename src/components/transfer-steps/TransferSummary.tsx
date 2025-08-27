import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { MapPin, User, CreditCard, Banknote } from "lucide-react";
import { calculateFee } from "@/lib/utils/currency";
import { useAuth } from "@/contexts/AuthContext";

interface TransferSummaryProps {
  recipientFullName: string;
  recipientPhone: string;
  recipientCountry: string;
  transferAmount: number;
  transferCurrency: string;
}

const TransferSummary: React.FC<TransferSummaryProps> = ({
  recipientFullName,
  recipientPhone,
  recipientCountry,
  transferAmount,
  transferCurrency,
}) => {
  const { profile, userRole } = useAuth();

  if (!profile) {
    return <p>Loading...</p>;
  }

  const senderCountry = profile.country || "Cameroun";
  const { fee, rate } = calculateFee(
    transferAmount,
    senderCountry,
    recipientCountry,
    userRole || 'user'
  );

  const totalAmount = transferAmount + fee;

  return (
    <Card className="bg-white shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Résumé du Transfert</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Recipient Information */}
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-blue-500" />
            <h4 className="text-sm font-medium">Informations Bénéficiaire</h4>
          </div>
          <div className="ml-7 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-700">Nom complet:</span>
              <span className="font-medium">{recipientFullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Téléphone:</span>
              <span className="font-medium">{recipientPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Pays:</span>
              <span className="font-medium">{recipientCountry}</span>
            </div>
          </div>

          <Separator className="my-2" />

          {/* Transfer Details */}
          <div className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-green-500" />
            <h4 className="text-sm font-medium">Détails du Transfert</h4>
          </div>
          <div className="ml-7 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-700">Montant:</span>
              <span className="font-medium">{transferAmount} {transferCurrency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Frais:</span>
              <span className="font-medium">{fee} XAF</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Taux:</span>
              <span className="font-medium">{rate}%</span>
            </div>
          </div>

          <Separator className="my-2" />

          {/* Total Amount */}
          <div className="flex items-center space-x-2">
            <Banknote className="h-5 w-5 text-purple-500" />
            <h4 className="text-sm font-medium">Total</h4>
          </div>
          <div className="ml-7 flex justify-between">
            <span className="text-gray-700">Montant Total:</span>
            <span className="font-bold">{totalAmount} XAF</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransferSummary;
