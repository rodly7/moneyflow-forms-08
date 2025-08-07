import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, QrCode, Send, User, Phone, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PaymentQRScanner from "@/components/payment/PaymentQRScanner";
import { useTransferOperations } from "@/hooks/useTransferOperations";

const QRPayment = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { processTransfer, isLoading } = useTransferOperations();
  
  const [isScanning, setIsScanning] = useState(false);
  const [scannedUser, setScannedUser] = useState<{
    userId: string;
    fullName: string;
    phone: string;
  } | null>(null);
  const [amount, setAmount] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
  }, [user, navigate]);

  const handleScanSuccess = (userData: { userId: string; fullName: string; phone: string }) => {
    // Vérifier qu'on ne se paie pas soi-même
    if (userData.userId === user?.id) {
      toast({
        title: "Erreur",
        description: "Vous ne pouvez pas vous envoyer de l'argent à vous-même",
        variant: "destructive"
      });
      return;
    }

    setScannedUser(userData);
    setIsScanning(false);
    toast({
      title: "Destinataire identifié",
      description: `Prêt à envoyer de l'argent à ${userData.fullName}`,
    });
  };

  const handlePayment = async () => {
    if (!scannedUser || !amount || !user) {
      toast({
        title: "Erreur",
        description: "Veuillez scanner un QR code et saisir un montant",
        variant: "destructive"
      });
      return;
    }

    const transferAmount = parseFloat(amount);
    if (transferAmount <= 0) {
      toast({
        title: "Erreur",
        description: "Le montant doit être supérieur à 0",
        variant: "destructive"
      });
      return;
    }

    // Vérifier que c'est un transfert national (pays identique)
    const senderCountry = profile?.country || 'Unknown';
    
    // Pour les paiements QR, forcer le destinataire au même pays (national uniquement)
    const recipientCountry = senderCountry;
    
    // Calculer les frais (1% pour transferts nationaux)
    const fees = transferAmount * 0.01;
    const totalWithFees = transferAmount + fees;
    
    // Vérifier le solde
    if (profile?.balance && profile.balance < totalWithFees) {
      toast({
        title: "Solde insuffisant",
        description: `Votre solde est insuffisant pour effectuer ce paiement (montant + frais: ${totalWithFees.toLocaleString()} FCFA)`,
        variant: "destructive"
      });
      return;
    }

    setIsProcessingPayment(true);

    try {
      const result = await processTransfer({
        amount: transferAmount,
        recipient: {
          email: scannedUser.phone, // Utilise le téléphone comme identifiant
          fullName: scannedUser.fullName,
          country: recipientCountry, // Force le même pays pour les paiements QR
          phone: scannedUser.phone
        }
      });

      if (result.success) {
        toast({
          title: "Paiement effectué",
          description: `${transferAmount.toLocaleString()} FCFA envoyé à ${scannedUser.fullName}`,
        });
        
        // Réinitialiser le formulaire
        setScannedUser(null);
        setAmount('');
        
        // Rediriger vers le tableau de bord après un délai
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        toast({
          title: "Erreur de paiement",
          description: "Une erreur est survenue lors du paiement",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur paiement QR:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue est survenue",
        variant: "destructive"
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const resetScannedUser = () => {
    setScannedUser(null);
    setAmount('');
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-between mb-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard')}
                className="text-blue-600 hover:text-blue-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div className="w-16"></div>
            </div>
            <CardTitle className="text-2xl font-bold text-blue-600 mb-2">
              Paiement QR Code
            </CardTitle>
            <p className="text-gray-600">
              Scannez le QR code pour envoyer de l'argent
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Bouton pour scanner */}
            {!scannedUser && (
              <Button
                onClick={() => {
                  console.log('📱 Ouverture du scanner QR...');
                  setIsScanning(true);
                }}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <QrCode className="w-5 h-5 mr-2" />
                Scanner le QR Code
              </Button>
            )}

            {/* Informations du destinataire scanné */}
            {scannedUser && (
              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Destinataire
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-green-600" />
                    <span className="font-medium">{scannedUser.fullName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-green-600" />
                    <span>{scannedUser.phone}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetScannedUser}
                  className="mt-3 text-green-700 border-green-300 hover:bg-green-100"
                >
                  Changer de destinataire
                </Button>
              </div>
            )}

            {/* Montant du paiement */}
            {scannedUser && (
              <div className="space-y-3">
                <Label htmlFor="amount" className="text-gray-700 font-medium">
                  Montant à envoyer (FCFA)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="text-lg text-center font-semibold"
                  min="1"
                />
                
                {/* Affichage des frais */}
                {amount && parseFloat(amount) > 0 && (
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Montant:</span>
                        <span className="font-medium">{parseFloat(amount).toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Frais (1%):</span>
                        <span className="font-medium">{(parseFloat(amount) * 0.01).toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between border-t pt-1">
                        <span className="font-semibold text-gray-800">Total à débiter:</span>
                        <span className="font-bold text-blue-600">{(parseFloat(amount) * 1.01).toLocaleString()} FCFA</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {profile?.balance && (
                  <p className="text-sm text-gray-600 text-center">
                    Solde disponible: {profile.balance.toLocaleString()} FCFA
                  </p>
                )}
              </div>
            )}

            {/* Bouton de paiement */}
            {scannedUser && amount && (
              <Button
                onClick={handlePayment}
                disabled={isProcessingPayment || isLoading}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white"
              >
                {isProcessingPayment || isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Traitement...
                  </div>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Envoyer {parseFloat(amount).toLocaleString()} FCFA
                  </>
                )}
              </Button>
            )}

            {/* Informations de sécurité */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <div className="flex items-start gap-2">
                <CreditCard className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-xs text-blue-600">
                  <p className="font-medium mb-1">🔒 Paiement sécurisé</p>
                  <p>Vérifiez toujours l'identité du destinataire avant de confirmer le paiement.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scanner QR */}
      <PaymentQRScanner
        isOpen={isScanning}
        onClose={() => setIsScanning(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
};

export default QRPayment;