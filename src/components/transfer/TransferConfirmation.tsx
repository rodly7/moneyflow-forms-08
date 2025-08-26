import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, AlertTriangle, Wallet, Receipt } from "lucide-react";
import { formatCurrency, calculateFee } from "@/lib/utils/currency";

interface TransferConfirmationProps {
  amount: number;
  senderCountry: string;
  recipientCountry: string;
  onConfirm: () => void;
  onCancel: () => void;
  userType?: 'user' | 'agent' | 'admin' | 'sub_admin';
}

export const TransferConfirmation = ({
  amount,
  senderCountry,
  recipientCountry,
  onConfirm,
  onCancel,
  userType = 'user'
}: TransferConfirmationProps) => {
  const [isConfirmed, setIsConfirmed] = useState(false);

  const { fee, rate, agentCommission, moneyFlowCommission } = calculateFee(
    amount,
    senderCountry,
    recipientCountry,
    userType
  );

  const totalAmount = amount + fee;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirmation du transfert</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-700">Montant à envoyer:</span>
            <span>{formatCurrency(amount, "XAF")}</span>
          </div>

          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-yellow-600" />
            <span className="font-semibold text-yellow-700">Frais ({rate}%):</span>
            <span>{formatCurrency(fee, "XAF")}</span>
          </div>

          {userType === 'agent' && (
            <>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-purple-600 border-purple-600">
                  Commission Agent
                </Badge>
                <span>{formatCurrency(agentCommission, "XAF")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  Commission SendFlow
                </Badge>
                <span>{formatCurrency(moneyFlowCommission, "XAF")}</span>
              </div>
            </>
          )}

          <Separator />

          <div className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-700" />
            <span className="font-bold text-lg">Total à débiter:</span>
            <span className="text-lg">{formatCurrency(totalAmount, "XAF")}</span>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                setIsConfirmed(true);
                onConfirm();
              }}
              disabled={isConfirmed}
            >
              {isConfirmed ? "Transfert en cours..." : "Confirmer"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
