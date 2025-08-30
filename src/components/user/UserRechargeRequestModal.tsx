import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Wallet, CreditCard, Send, ArrowLeft, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

type OperationType = 'recharge' | 'withdrawal';
type StepType = 'operation' | 'details' | 'confirmation';

// Configuration des numéros de paiement par pays
const PAYMENT_CONFIG = {
  'Congo Brazzaville': {
    'Mobile Money': { number: '066164686', ussd: '*105#', appUrl: null },
    'Airtel Money': { number: '055524407', ussd: '*128#', appUrl: null }
  },
  'Sénégal': {
    'Wave': { number: '+221780192989', ussd: null, appUrl: 'wave://send' },
    'Orange Money': { number: '774596609', ussd: '#144#', appUrl: null }
  }
};

const UserRechargeRequestModal = ({ children }: { children: React.ReactNode }) => {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<StepType>('operation');
  const [selectedOperation, setSelectedOperation] = useState<OperationType | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when modal closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setCurrentStep('operation');
      setSelectedOperation(null);
      setAmount('');
      setPaymentMethod('');
    }
  };

  // Get payment methods for user's country
  const getPaymentMethods = () => {
    const userCountry = profile?.country;
    if (!userCountry || !PAYMENT_CONFIG[userCountry as keyof typeof PAYMENT_CONFIG]) {
      return [];
    }
    return Object.keys(PAYMENT_CONFIG[userCountry as keyof typeof PAYMENT_CONFIG]);
  };

  // Get payment config based on country and method
  const getPaymentConfig = () => {
    const userCountry = profile?.country;
    if (!userCountry || !paymentMethod || !PAYMENT_CONFIG[userCountry as keyof typeof PAYMENT_CONFIG]) {
      return null;
    }
    const countryConfig = PAYMENT_CONFIG[userCountry as keyof typeof PAYMENT_CONFIG];
    return countryConfig[paymentMethod as keyof typeof countryConfig] || null;
  };


  // Redirect to operator app/USSD
  const redirectToOperator = () => {
    const config = getPaymentConfig();
    if (!config) return;

    if (config.appUrl) {
      // Ouvrir l'application (Wave)
      window.open(config.appUrl, '_blank');
      toast.success('Redirection vers l\'application...');
    } else if (config.ussd) {
      // Composer le code USSD
      window.location.href = `tel:${config.ussd}`;
      toast.success('Redirection vers le code USSD...');
    } else {
      // Fallback: composer le numéro
      window.location.href = `tel:${config.number}`;
      toast.success('Redirection vers l\'appel...');
    }
  };

  const handleOperationSelect = (operation: OperationType) => {
    setSelectedOperation(operation);
    setCurrentStep('details');
  };

  const handleSubmitRequest = async () => {
    if (!user?.id || !selectedOperation || !amount || !paymentMethod) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    const config = getPaymentConfig();
    if (!config?.number) {
      toast.error('Numéro de paiement non configuré pour ce mode de paiement');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('user_requests')
        .insert({
          user_id: user.id,
          operation_type: selectedOperation,
          amount: parseFloat(amount),
          payment_method: paymentMethod,
          payment_phone: config.number,
          status: 'pending'
        });

      if (error) throw error;

      toast.success(`Demande de ${selectedOperation === 'recharge' ? 'recharge' : 'retrait'} envoyée avec succès`);
      
      setIsOpen(false);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la demande:', error);
      toast.error('Erreur lors de l\'envoi de la demande');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderOperationSelection = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">
        Que souhaitez-vous faire ?
      </h3>
      <div className="grid grid-cols-1 gap-4">
        <Card 
          className="cursor-pointer transition-colors hover:bg-accent"
          onClick={() => handleOperationSelect('recharge')}
        >
          <CardContent className="p-6 text-center">
            <Wallet className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <h4 className="font-semibold">Recharger mon compte</h4>
            <p className="text-sm text-muted-foreground">Ajouter de l'argent à votre compte</p>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer transition-colors hover:bg-accent"
          onClick={() => handleOperationSelect('withdrawal')}
        >
          <CardContent className="p-6 text-center">
            <CreditCard className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <h4 className="font-semibold">Retirer de l'argent</h4>
            <p className="text-sm text-muted-foreground">Retirer de l'argent de votre compte</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderDetailsForm = () => {
    const paymentMethods = getPaymentMethods();
    const config = getPaymentConfig();
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setCurrentStep('operation')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h3 className="text-lg font-semibold">
            Détails de la {selectedOperation === 'recharge' ? 'recharge' : 'retrait'}
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="amount">Montant (FCFA) *</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Entrez le montant"
              min="1000"
              step="1000"
            />
          </div>

          <div>
            <Label htmlFor="payment-method">Mode de paiement *</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Choisissez un mode de paiement" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method, index) => (
                  <SelectItem key={index} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {config && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800 font-medium">
                  💡 <strong>Instructions de {selectedOperation === 'recharge' ? 'recharge' : 'retrait'}:</strong>
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Votre numéro ({paymentMethod}) va être rechargé de {amount ? `${Number(amount).toLocaleString()} FCFA` : '0 FCFA'} dans 2-5 minutes
                </p>
              </div>
            </div>
          )}

          <Button 
            onClick={handleSubmitRequest}
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={!amount || !paymentMethod || isSubmitting}
          >
            {isSubmitting ? 'Traitement en cours...' : 'Demande de retrait'}
          </Button>
        </div>
      </div>
    );
  };

  const renderConfirmation = () => {
    const config = getPaymentConfig();
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setCurrentStep('details')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h3 className="text-lg font-semibold">Confirmation</h3>
        </div>

        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-3">Récapitulatif de la demande</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Opération:</span>
                <Badge className={selectedOperation === 'recharge' ? 'bg-green-600' : 'bg-blue-600'}>
                  {selectedOperation === 'recharge' ? 'Recharge' : 'Retrait'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Montant:</span>
                <span className="font-medium">{parseFloat(amount).toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span>Mode de paiement:</span>
                <span className="font-medium">{paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Numéro:</span>
                <span className="font-medium font-mono">{config?.number}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
          <h4 className="font-semibold text-orange-900 mb-2">⚠️ Avant de confirmer</h4>
          <div className="text-sm text-orange-800 space-y-1">
            <p>✅ J'ai fait le dépôt de <strong>{parseFloat(amount).toLocaleString()} FCFA</strong></p>
            <p>✅ Le numéro utilisé est: <strong>{config?.number}</strong></p>
            <p>✅ Ma demande sera traitée par un administrateur</p>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 mb-2">🚀 Après confirmation</h4>
          <p className="text-sm text-green-800">
            Vous serez automatiquement redirigé vers votre opérateur ({paymentMethod}) 
            pour composer le code USSD ou ouvrir l'application et finaliser le paiement.
          </p>
        </div>

        <Button 
          onClick={handleSubmitRequest}
          className="w-full bg-green-600 hover:bg-green-700"
          disabled={isSubmitting}
        >
          <Send className="w-4 h-4 mr-2" />
          {isSubmitting ? 'Envoi en cours...' : 'Confirmer et rediriger'}
        </Button>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'operation':
        return renderOperationSelection();
      case 'details':
        return renderDetailsForm();
      case 'confirmation':
        return renderConfirmation();
      default:
        return renderOperationSelection();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            💰 Recharger / Retirer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {renderCurrentStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserRechargeRequestModal;
