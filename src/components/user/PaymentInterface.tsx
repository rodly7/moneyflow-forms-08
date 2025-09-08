import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { ArrowLeft, Copy, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentInterfaceProps {
  amount: string;
  paymentMethod: string;
  paymentNumber: string;
  onBack: () => void;
  onComplete: () => void;
}

const PaymentInterface = ({ 
  amount, 
  paymentMethod, 
  paymentNumber, 
  onBack, 
  onComplete 
}: PaymentInterfaceProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [step, setStep] = useState<'instructions' | 'processing' | 'completed'>('instructions');
  const [countdown, setCountdown] = useState(30);

  // Auto-copy payment number
  useEffect(() => {
    copyPaymentNumber();
  }, []);

  // Countdown timer for processing step
  useEffect(() => {
    if (step === 'processing' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (step === 'processing' && countdown === 0) {
      setStep('completed');
    }
  }, [step, countdown]);

  const copyPaymentNumber = async () => {
    try {
      await navigator.clipboard.writeText(paymentNumber);
      toast({
        title: "Numéro copié",
        description: "Le numéro de paiement a été copié automatiquement"
      });
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
    }
  };

  const handleProceedToPayment = () => {
    setStep('processing');
    setCountdown(30);
  };

  const generateUSSDCode = () => {
    // Generate appropriate USSD code based on provider
    const ussdCodes: { [key: string]: string } = {
      'Orange Money': `*144*1*1*${amount}*${paymentNumber}#`,
      'Wave': `*145*1*${amount}*${paymentNumber}#`,
      'Mobile Money': `*126*1*${amount}*${paymentNumber}#`,
      'Airtel Money': `*121*1*${amount}*${paymentNumber}#`,
      'Moov Money': `*555*1*${amount}*${paymentNumber}#`
    };
    return ussdCodes[paymentMethod] || `*${amount}*${paymentNumber}#`;
  };

  const openUSSD = () => {
    const ussdCode = generateUSSDCode();
    const telUrl = `tel:${ussdCode}`;
    
    // Essayer d'ouvrir l'USSD automatiquement
    try {
      // Méthode 1: window.open pour mobile
      if (window.open(telUrl, '_self')) {
        // Si ça marche, démarrer le processus
        setTimeout(() => {
          handleProceedToPayment();
        }, 1500);
      } else {
        // Fallback: location.assign
        window.location.assign(telUrl);
        setTimeout(() => {
          handleProceedToPayment();
        }, 1500);
      }
    } catch (error) {
      // Si ça ne marche pas, au moins copier le code et informer l'utilisateur
      copyUSSDCode(ussdCode);
      setTimeout(() => {
        handleProceedToPayment();
      }, 1000);
    }
  };

  const copyUSSDCode = async (ussdCode: string) => {
    try {
      await navigator.clipboard.writeText(ussdCode);
      toast({
        title: "Code USSD copié",
        description: `Composez ${ussdCode} sur votre téléphone`
      });
    } catch (error) {
      toast({
        title: "Code USSD",
        description: `Composez: ${ussdCode}`,
        duration: 10000
      });
    }
  };

  if (step === 'completed') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Paiement en cours</h2>
          <p className="text-muted-foreground">
            Votre transaction est en cours de traitement. Vous recevrez une confirmation par SMS.
          </p>
        </div>
        
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Montant:</span>
                <span className="font-medium">{amount} XAF</span>
              </div>
              <div className="flex justify-between">
                <span>Mode de paiement:</span>
                <span>{paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Numéro de référence:</span>
                <span className="font-mono text-sm">{profile?.phone}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={onComplete} className="w-full">
          Terminer
        </Button>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Clock className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Transaction en cours</h2>
          <p className="text-muted-foreground">
            Veuillez suivre les instructions sur votre téléphone
          </p>
          <div className="mt-4">
            <div className="text-3xl font-bold text-primary">{countdown}s</div>
            <div className="text-sm text-muted-foreground">Vérification automatique...</div>
          </div>
        </div>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="space-y-3">
              <h3 className="font-medium text-blue-900">Instructions de paiement:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
                <li>Suivez les instructions sur l'écran de votre téléphone</li>
                <li>Entrez votre PIN {paymentMethod}</li>
                <li>Confirmez le paiement de {amount} XAF</li>
                <li>Attendez la confirmation par SMS</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Button onClick={() => setStep('completed')} variant="outline" className="w-full">
          J'ai terminé le paiement
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-xl font-bold">Interface de paiement</h2>
      </div>

        <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-lg' : 'text-xl'}`}>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            Paiement sécurisé
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'}`}>
            <div>
              <div className="text-sm text-muted-foreground">Montant</div>
              <div className={`font-bold text-primary ${isMobile ? 'text-xl' : 'text-2xl'}`}>{amount} XAF</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Mode de paiement</div>
              <Badge variant="secondary" className="text-sm">{paymentMethod}</Badge>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Numéro de paiement</div>
            <div className={`flex items-center gap-2 ${isMobile ? 'flex-col' : ''}`}>
              <code className={`bg-muted px-3 py-2 rounded-md font-mono ${isMobile ? 'text-base w-full text-center' : 'text-lg'}`}>
                {paymentNumber}
              </code>
              <Button size={isMobile ? "default" : "sm"} variant="ghost" onClick={copyPaymentNumber} className={isMobile ? "w-full" : ""}>
                <Copy className="w-4 h-4 mr-2" />
                {isMobile && "Copier"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Votre numéro (référence)</div>
            <code className={`bg-muted px-3 py-2 rounded-md font-mono block ${isMobile ? 'text-center' : ''}`}>
              {profile?.phone}
            </code>
          </div>
        </CardContent>
      </Card>

      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-4">
          <div className="space-y-3">
            <h3 className="font-medium text-orange-900">Instructions de paiement:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-orange-700">
              <li>Composez le code USSD de {paymentMethod}</li>
              <li>Sélectionnez "Transfert d'argent" ou "Envoyer de l'argent"</li>
              <li>Entrez le numéro: <strong>{paymentNumber}</strong></li>
              <li>Entrez le montant: <strong>{amount} XAF</strong></li>
              <li>Utilisez votre numéro <strong>{profile?.phone}</strong> comme référence</li>
              <li>Confirmez avec votre PIN</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Button onClick={openUSSD} className="w-full" size={isMobile ? "lg" : "default"}>
          <ExternalLink className="w-4 h-4 mr-2" />
          {isMobile ? "Payer maintenant" : `Ouvrir ${paymentMethod} (${generateUSSDCode()})`}
        </Button>
        
        <Button onClick={handleProceedToPayment} variant="outline" className="w-full" size={isMobile ? "lg" : "default"}>
          J'ai initié le paiement manuellement
        </Button>
      </div>

      <div className="text-xs text-muted-foreground text-center">
        Votre compte sera crédité automatiquement dès réception du paiement
      </div>
    </div>
  );
};

export default PaymentInterface;