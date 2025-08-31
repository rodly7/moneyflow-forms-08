
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, User, DollarSign, Minus } from "lucide-react";
import { useAgentWithdrawalEnhanced } from "@/hooks/useAgentWithdrawalEnhanced";
import { formatCurrency } from "@/lib/utils/currency";
import QRScanner from "@/components/agent/QRScanner";

export const AgentAutomaticWithdrawalForm = () => {
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [qrVerified, setQrVerified] = useState(false);
  
  const {
    amount,
    setAmount,
    phoneNumber,
    setPhoneNumber,
    clientData,
    isSearchingClient,
    isProcessing,
    searchClientByPhone,
    handleSubmit
  } = useAgentWithdrawalEnhanced();

  const handleQRScanSuccess = async (userData: { userId: string; fullName: string; phone: string }) => {
    console.log("📱 QR Code scanné:", userData);
    
    // Définir le numéro de téléphone à partir du QR
    setPhoneNumber(userData.phone);
    
    // Rechercher automatiquement le client
    await searchClientByPhone(userData.phone);
    
    // Marquer comme vérifié par QR
    setQrVerified(true);
    setIsQRScannerOpen(false);
  };

  const commission = amount ? Number(amount) * 0.005 : 0;

  return (
    <div className="space-y-6">
      {/* Section Retrait Client Automatique */}
      <Card className="bg-gradient-to-br from-orange-50 to-red-100 border-orange-200 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-3 text-orange-800">
            <Minus className="w-6 h-6 text-orange-600" />
            Retrait Client Automatique
          </CardTitle>
          <p className="text-orange-700 text-sm">
            Le retrait sera effectué immédiatement et vous recevrez votre commission
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Scanner QR uniquement - pas de saisie manuelle */}
            <div className="space-y-3">
              <Label className="text-orange-800 font-medium text-base">
                Numéro du client
              </Label>
              
              {/* Affichage du numéro scanné (lecture seule) */}
              {phoneNumber ? (
                <div className="flex items-center gap-3 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                  <User className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium text-green-800">
                      Numéro scanné: {phoneNumber}
                    </p>
                    {clientData && (
                      <p className="text-sm text-green-600">
                        Client: {clientData.full_name}
                      </p>
                    )}
                  </div>
                  {qrVerified && (
                    <div className="text-green-600 text-sm font-medium">
                      ✅ Vérifié
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg">
                  <QrCode className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                  <p className="text-blue-800 font-medium mb-2">
                    Scanner le QR code du client
                  </p>
                  <p className="text-blue-600 text-sm mb-4">
                    Demandez au client de présenter son QR code
                  </p>
                  <Button
                    type="button"
                    onClick={() => setIsQRScannerOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Ouvrir le Scanner
                  </Button>
                </div>
              )}
              
              {/* Bouton pour rescanner */}
              {phoneNumber && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setPhoneNumber("");
                    setQrVerified(false);
                    setIsQRScannerOpen(true);
                  }}
                  className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Scanner un autre client
                </Button>
              )}
            </div>

            {/* Montant du retrait */}
            <div className="space-y-3">
              <Label htmlFor="amount" className="text-orange-800 font-medium text-base">
                Montant du retrait (XAF)
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="Entrez le montant"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="h-14 text-lg border-orange-300 focus:border-orange-500"
                disabled={!clientData}
              />
              
              {/* Affichage de la commission */}
              {amount && clientData && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-700">
                    <DollarSign className="w-5 h-5" />
                    <span className="font-medium text-lg">
                      Votre commission: {formatCurrency(commission, 'XAF')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Bouton de soumission */}
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 h-14 text-lg font-semibold shadow-lg"
              disabled={isProcessing || !clientData || !amount || !qrVerified}
            >
              {isProcessing ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  <span>Traitement en cours...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Minus className="w-5 h-5" />
                  <span>Effectuer le retrait</span>
                </div>
              )}
            </Button>

            {/* Message informatif */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                🔒 <strong>Sécurité renforcée:</strong> Seul le scanner QR est autorisé pour identifier les clients et garantir la sécurité des transactions.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* QR Scanner Modal */}
      <QRScanner 
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanSuccess={handleQRScanSuccess}
      />
    </div>
  );
};
