import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/currency";
import { ArrowDownLeft, User, Phone, MapPin, DollarSign, Calendar, Clock } from "lucide-react";

interface DepositConfirmationProps {
  amount: number;
  senderName: string;
  senderPhone: string;
  senderLocation: string;
  transactionDate: string;
  transactionTime: string;
  onClose: () => void;
}

export const SimpleHtmlDepositConfirmation: React.FC<DepositConfirmationProps> = ({
  amount,
  senderName,
  senderPhone,
  senderLocation,
  transactionDate,
  transactionTime,
  onClose
}) => {
  return (
    <Card className="w-full max-w-md mx-auto bg-white shadow-md rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Confirmation de Dépôt</CardTitle>
        <Badge variant="secondary">Succès</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <ArrowDownLeft className="h-4 w-4 text-green-500" />
          <p className="text-sm text-gray-500">Dépôt effectué avec succès</p>
        </div>

        <div className="grid gap-2">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-500" />
            <p className="text-sm font-medium">Expéditeur: {senderName}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4 text-gray-500" />
            <p className="text-sm font-medium">Téléphone: {senderPhone}</p>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <p className="text-sm font-medium">Localisation: {senderLocation}</p>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <p className="text-sm font-medium">Montant: {formatCurrency(amount, 'XAF')}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <p className="text-sm font-medium">Date: {transactionDate}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <p className="text-sm font-medium">Heure: {transactionTime}</p>
          </div>
        </div>

        <Button className="w-full" onClick={onClose}>Fermer</Button>
      </CardContent>
    </Card>
  );
};
