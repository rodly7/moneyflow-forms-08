import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { QrCode, Store, CreditCard, CheckCircle } from 'lucide-react';
import { UniversalQRScanner } from '@/components/shared/UniversalQRScanner';
import { useToast } from '@/hooks/use-toast';
import { useMerchantPayment } from '@/hooks/useMerchantPayment';

interface MerchantPaymentScannerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MerchantPaymentData {
  type: string;
  merchantId: string;
  businessName: string;
  amount?: number;
  description: string;
  currency: string;
}

const MerchantPaymentScanner = ({ isOpen, onClose }: MerchantPaymentScannerProps) => {
  const [scannedData, setScannedData] = useState<MerchantPaymentData | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { processPayment, isProcessing } = useMerchantPayment();
  const { toast } = useToast();

  const handleScanSuccess = (data: any) => {
    try {
      const merchantData = typeof data === 'string' ? JSON.parse(data) : data;
      
      if (merchantData.type !== 'merchant_payment') {
        toast({
          title: "QR Code invalide",
          description: "Ce QR code n'est pas un code de paiement marchand",
          variant: "destructive"
        });
        return;
      }

      // Vérifier que toutes les données nécessaires sont présentes
      if (!merchantData.merchantId || !merchantData.businessName) {
        toast({
          title: "QR Code invalide",
          description: "Données marchandes manquantes",
          variant: "destructive"
        });
        return;
      }

      // Si le montant n'est pas défini, demander à l'utilisateur de le saisir
      if (!merchantData.amount || merchantData.amount === 0) {
        const amount = prompt("Entrez le montant à payer (XAF):");
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
          toast({
            title: "Montant invalide",
            description: "Veuillez entrer un montant valide",
            variant: "destructive"
          });
          return;
        }
        merchantData.amount = Number(amount);
      }

      setScannedData(merchantData);
      setShowConfirmation(true);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "QR code invalide ou corrompu",
        variant: "destructive"
      });
    }
  };

  const handleConfirmPayment = async () => {
    if (!scannedData) return;

    const result = await processPayment(scannedData);
    
    if (result.success) {
      setShowConfirmation(false);
      setScannedData(null);
      onClose();
    }
  };

  const handleCancel = () => {
    setScannedData(null);
    setShowConfirmation(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Payer un Commerçant
          </DialogTitle>
        </DialogHeader>

        {!showConfirmation ? (
          <div className="space-y-4">
            <div className="text-center">
              <Store className="w-12 h-12 mx-auto mb-4 text-primary" />
              <p className="text-sm text-muted-foreground">
                Scannez le QR code du commerçant pour payer sans frais
              </p>
            </div>

            <UniversalQRScanner
              isOpen={isOpen}
              onClose={onClose}
              onScanSuccess={handleScanSuccess}
              title="Scanner QR Marchand"
              variant="compact"
            />

            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <p className="text-sm text-green-700 text-center">
                ✓ Paiement sans frais • Instantané • Sécurisé
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Merchant Info */}
            <Card>
              <CardContent className="pt-4">
                <div className="text-center space-y-2">
                  <Store className="w-8 h-8 mx-auto text-primary" />
                  <h3 className="font-semibold text-lg">{scannedData?.businessName}</h3>
                  <p className="text-sm text-muted-foreground">ID: {scannedData?.merchantId}</p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Details */}
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Montant:</span>
                <span className="text-2xl font-bold text-primary">
                  {scannedData?.amount?.toLocaleString()} {scannedData?.currency}
                </span>
              </div>
              
              {scannedData?.description && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Description:</span>
                  <span className="font-medium">{scannedData.description}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Frais:</span>
                <span className="font-bold text-green-600">0 XAF</span>
              </div>

              <hr />

              <div className="flex justify-between items-center py-2">
                <span className="font-semibold">Total à payer:</span>
                <span className="text-2xl font-bold text-primary">
                  {scannedData?.amount?.toLocaleString()} {scannedData?.currency}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={isProcessing}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleConfirmPayment}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? (
                  "Traitement..."
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Payer
                  </>
                )}
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Paiement sécurisé • Sans frais • Instantané
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MerchantPaymentScanner;