
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, calculateFee } from "@/lib/utils/currency";
import { User, MapPin, CreditCard, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SimpleHtmlTransferConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  amount: number;
  recipientName: string;
  recipientPhone: string;
  recipientCountry: string;
  senderCountry: string;
  isProcessing: boolean;
}

export const SimpleHtmlTransferConfirmation = ({
  isOpen,
  onClose,
  onConfirm,
  amount,
  recipientName,
  recipientPhone,
  recipientCountry,
  senderCountry,
  isProcessing
}: SimpleHtmlTransferConfirmationProps) => {
  const { userRole } = useAuth();

  const { fee, rate } = calculateFee(
    amount,
    senderCountry,
    recipientCountry,
    userRole || 'user'
  );

  const totalAmount = amount + fee;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Confirmer le Transfert
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Recipient Info */}
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">Destinataire</span>
            </div>
            <p className="text-sm"><strong>Nom:</strong> {recipientName}</p>
            <p className="text-sm"><strong>Téléphone:</strong> {recipientPhone}</p>
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="text-sm">{recipientCountry}</span>
            </div>
          </div>

          {/* Transfer Details */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span>Montant:</span>
              <span className="font-medium">{formatCurrency(amount, 'XAF')}</span>
            </div>
            <div className="flex justify-between">
              <span>Frais ({rate}%):</span>
              <span className="font-medium">{formatCurrency(fee, 'XAF')}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>{formatCurrency(totalAmount, 'XAF')}</span>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Attention</p>
                <p>Vérifiez attentivement les informations avant de confirmer. Cette opération ne pourra pas être annulée.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button 
              onClick={onConfirm}
              disabled={isProcessing}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? "Traitement..." : "Confirmer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
