
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
import { Wallet, CreditCard, Send, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { countries } from '@/data/countries';

type OperationType = 'recharge' | 'withdrawal';
type StepType = 'operation' | 'details' | 'confirmation';

const UserRechargeRequestModal = ({ children }: { children: React.ReactNode }) => {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<StepType>('operation');
  const [selectedOperation, setSelectedOperation] = useState<OperationType | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when modal closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setCurrentStep('operation');
      setSelectedOperation(null);
      setAmount('');
      setPaymentMethod('');
      setPaymentPhone('');
    }
  };

  // Get payment methods for user's country
  const getPaymentMethods = () => {
    const userCountry = countries.find(country => country.name === profile?.country);
    return userCountry?.paymentMethods || [];
  };

  const handleOperationSelect = (operation: OperationType) => {
    setSelectedOperation(operation);
    setCurrentStep('details');
  };

  const handleSubmitRequest = async () => {
    if (!user?.id || !selectedOperation || !amount || !paymentMethod || !paymentPhone) {
      toast.error('Veuillez remplir tous les champs requis');
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
          payment_phone: paymentPhone,
          status: 'pending'
        });

      if (error) throw error;

      toast.success(`Demande de ${selectedOperation} envoyée avec succès`);
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

          <div>
            <Label htmlFor="payment-phone">Numéro de téléphone pour le paiement *</Label>
            <Input
              id="payment-phone"
              type="tel"
              value={paymentPhone}
              onChange={(e) => setPaymentPhone(e.target.value)}
              placeholder="Ex: +237XXXXXXXXX"
            />
          </div>

          <Button 
            onClick={() => setCurrentStep('confirmation')}
            className="w-full"
            disabled={!amount || !paymentMethod || !paymentPhone}
          >
            Continuer
          </Button>
        </div>
      </div>
    );
  };

  const renderConfirmation = () => (
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
              <span className="font-medium font-mono">{paymentPhone}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Information importante</h4>
        <p className="text-sm text-blue-800">
          {selectedOperation === 'recharge' 
            ? 'Votre demande de recharge sera traitée par un administrateur. Vous serez notifié une fois la transaction validée.'
            : 'Assurez-vous d\'avoir suffisamment de solde sur votre compte pour effectuer ce retrait.'
          }
        </p>
      </div>

      <Button 
        onClick={handleSubmitRequest}
        className="w-full"
        disabled={isSubmitting}
      >
        <Send className="w-4 h-4 mr-2" />
        {isSubmitting ? 'Envoi en cours...' : 'Envoyer la demande'}
      </Button>
    </div>
  );

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
