
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
import { useIsMobile } from "@/hooks/useIsMobile";

const QRPayment = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { processTransfer, isLoading } = useTransferOperations();
  const isMobile = useIsMobile();
  
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
        title: "Données manquantes",
        description: "Veuillez scanner un QR code et saisir un montant",
        variant: "destructive"
      });
      return;
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      toast({
        title: "Montant invalide",
        description: "Veuillez saisir un montant valide supérieur à 0",
        variant: "destructive"
      });
      return;
    }

    // Montant minimum
    if (transferAmount < 100) {
      toast({
        title: "Montant trop faible",
        description: "Le montant minimum est de 100 FCFA",
        variant: "destructive"
      });
      return;
    }

    // Vérifier que c'est un transfert national (pays identique)
    const senderCountry = profile?.country || 'Cameroun';
    
    // Pour les paiements QR, forcer le destinataire au même pays (national uniquement)
    const recipientCountry = senderCountry;
    
    // Calculer les frais (1% pour transferts nationaux)
    const fees = Math.ceil(transferAmount * 0.01);
    const totalWithFees = transferAmount + fees;
    
    // Vérifier le solde
    if (!profile?.balance || profile.balance < totalWithFees) {
      toast({
        title: "Solde insuffisant",
        description: `Votre solde (${profile?.balance?.toLocaleString() || 0} FCFA) est insuffisant pour ce paiement (${totalWithFees.toLocaleString()} FCFA)`,
        variant: "destructive"
      });
      return;
    }

    setIsProcessingPayment(true);

    try {
      console.log('🔄 Début du paiement QR:', {
        destinataire: scannedUser.fullName,
        phone: scannedUser.phone,
        montant: transferAmount,
        frais: fees,
        total: totalWithFees,
        soldeActuel: profile.balance
      });

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
          title: "✅ Paiement réussi",
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
        console.error('❌ Échec du transfert via processTransfer');
        toast({
          title: "Erreur de paiement",
          description: "Le paiement n'a pas pu être traité. Veuillez réessayer.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('❌ Erreur critique lors du paiement QR:', error);
      
      // Messages d'erreur plus spécifiques
      let errorMessage = "Une erreur inattendue est survenue";
      
      if (error?.message) {
        if (error.message.includes('Insufficient funds') || error.message.includes('Solde insuffisant')) {
          errorMessage = "Solde insuffisant pour effectuer ce paiement";
        } else if (error.message.includes('User not found') || error.message.includes('Destinataire introuvable')) {
          errorMessage = "Le destinataire n'a pas pu être trouvé";
        } else if (error.message.includes('Network') || error.message.includes('network')) {
          errorMessage = "Problème de connexion réseau. Vérifiez votre connexion.";
        } else if (error.message.includes('Database') || error.message.includes('database')) {
          errorMessage = "Erreur de base de données. Veuillez réessayer.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Erreur de paiement",
        description: errorMessage,
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 px-2">
      <div className={`${isMobile ? 'max-w-full mx-1' : 'max-w-md mx-auto'}`}>
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className={`text-center ${isMobile ? 'pb-3 pt-4' : 'pb-4'}`}>
            <div className="flex items-center justify-between mb-3">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard')}
                className="text-blue-600 hover:text-blue-700"
                size={isMobile ? "sm" : "default"}
              >
                <ArrowLeft className={`${isMobile ? 'w-4 h-4 mr-1' : 'w-4 h-4 mr-2'}`} />
                {!isMobile && 'Retour'}
              </Button>
              <div className="w-16"></div>
            </div>
            <CardTitle className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-blue-600 mb-2`}>
              Paiement QR Code
            </CardTitle>
            <p className={`text-gray-600 ${isMobile ? 'text-sm' : ''}`}>
              Scannez le QR code pour envoyer de l'argent
            </p>
          </CardHeader>
          
          <CardContent className={`space-y-4 ${isMobile ? 'px-3 pb-4' : 'space-y-6'}`}>
            {/* Bouton pour scanner */}
            {!scannedUser && (
              <Button
                onClick={() => {
                  console.log('📱 Ouverture du scanner QR...');
                  setIsScanning(true);
                }}
                className={`w-full ${isMobile ? 'h-10 text-sm' : 'h-12'} bg-blue-600 hover:bg-blue-700 text-white`}
              >
                <QrCode className={`${isMobile ? 'w-4 h-4 mr-2' : 'w-5 h-5 mr-2'}`} />
                Scanner le QR Code
              </Button>
            )}

            {/* Informations du destinataire scanné */}
            {scannedUser && (
              <div className={`bg-green-50 ${isMobile ? 'p-3' : 'p-4'} rounded-xl border border-green-200`}>
                <h3 className={`font-semibold text-green-800 ${isMobile ? 'mb-2 text-sm' : 'mb-3'} flex items-center gap-2`}>
                  <User className="w-4 h-4" />
                  Destinataire
                </h3>
                <div className={`space-y-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  <div className="flex items-center gap-2">
                    <User className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-green-600`} />
                    <span className="font-medium">{scannedUser.fullName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-green-600`} />
                    <span>{scannedUser.phone}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetScannedUser}
                  className={`${isMobile ? 'mt-2 text-xs' : 'mt-3'} text-green-700 border-green-300 hover:bg-green-100`}
                >
                  Changer
                </Button>
              </div>
            )}

            {/* Montant du paiement */}
            {scannedUser && (
              <div className={`space-y-2 ${isMobile ? 'space-y-2' : 'space-y-3'}`}>
                <Label htmlFor="amount" className={`text-gray-700 font-medium ${isMobile ? 'text-sm' : ''}`}>
                  Montant à envoyer (FCFA)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="100"
                  className={`${isMobile ? 'text-base' : 'text-lg'} text-center font-semibold`}
                  min="100"
                  step="100"
                />
                
                {/* Affichage des frais */}
                {amount && parseFloat(amount) > 0 && (
                  <div className={`bg-yellow-50 ${isMobile ? 'p-2' : 'p-3'} rounded-lg border border-yellow-200`}>
                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} space-y-1`}>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Montant:</span>
                        <span className="font-medium">{parseFloat(amount).toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Frais (1%):</span>
                        <span className="font-medium">{Math.ceil(parseFloat(amount) * 0.01).toLocaleString()} FCFA</span>
                      </div>
                      <div className={`flex justify-between border-t pt-1 ${isMobile ? 'text-sm' : ''}`}>
                        <span className="font-semibold text-gray-800">Total:</span>
                        <span className="font-bold text-blue-600">{(parseFloat(amount) + Math.ceil(parseFloat(amount) * 0.01)).toLocaleString()} FCFA</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {profile?.balance && (
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 text-center`}>
                    Solde disponible: {profile.balance.toLocaleString()} FCFA
                  </p>
                )}
              </div>
            )}

            {/* Bouton de paiement */}
            {scannedUser && amount && parseFloat(amount) >= 100 && (
              <Button
                onClick={handlePayment}
                disabled={isProcessingPayment || isLoading}
                className={`w-full ${isMobile ? 'h-10 text-sm' : 'h-12'} bg-green-600 hover:bg-green-700 text-white`}
              >
                {isProcessingPayment || isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Traitement...
                  </div>
                ) : (
                  <>
                    <Send className={`${isMobile ? 'w-4 h-4 mr-2' : 'w-5 h-5 mr-2'}`} />
                    Envoyer {parseFloat(amount).toLocaleString()} FCFA
                  </>
                )}
              </Button>
            )}

            {/* Informations de sécurité */}
            <div className={`bg-blue-50 ${isMobile ? 'p-3' : 'p-4'} rounded-xl border border-blue-200`}>
              <div className="flex items-start gap-2">
                <CreditCard className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-blue-600 mt-0.5`} />
                <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-blue-600`}>
                  <p className="font-medium mb-1">🔒 Paiement sécurisé</p>
                  <p>Vérifiez l'identité du destinataire avant de confirmer.</p>
                  <p className="mt-1">Montant minimum: 100 FCFA</p>
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
