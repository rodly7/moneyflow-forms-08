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
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

type OperationType = 'recharge' | 'withdrawal';
type StepType = 'operation' | 'details' | 'confirmation';

const UserRechargeRequestModal = ({ children }: { children: React.ReactNode }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<StepType>('operation');
  const [selectedOperation, setSelectedOperation] = useState<OperationType | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch payment numbers from database
  const { data: paymentNumbers, isLoading } = useQuery({
    queryKey: ['payment-numbers', profile?.country],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_numbers')
        .select('*')
        .eq('country', profile?.country)
        .eq('is_active', true);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.country
  });

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
    if (!paymentNumbers) return [];
    const serviceType = selectedOperation === 'recharge' ? 'deposit' : 'withdrawal';
    return paymentNumbers
      .filter(p => p.service_type === 'both' || p.service_type === serviceType)
      .map(p => p.provider);
  };

  // Get payment number for selected method
  const getPaymentNumber = () => {
    if (!paymentNumbers || !paymentMethod) return null;
    const serviceType = selectedOperation === 'recharge' ? 'deposit' : 'withdrawal';
    return paymentNumbers.find(p => 
      p.provider === paymentMethod && 
      (p.service_type === 'both' || p.service_type === serviceType)
    );
  };
  
  // Copy phone number to clipboard and auto-copy on load
  const copyPhoneNumber = async () => {
    const paymentNumber = getPaymentNumber();
    if (paymentNumber?.phone_number) {
      try {
        await navigator.clipboard.writeText(paymentNumber.phone_number);
        toast({
          title: "Numéro copié",
          description: "Numéro copié automatiquement dans le presse-papiers!"
        });
      } catch (error) {
        console.error('Erreur lors de la copie:', error);
        toast({
          title: "Numéro",
          description: paymentNumber.phone_number
        });
      }
    }
  };

  // Auto-copy number when payment method changes
  React.useEffect(() => {
    if (paymentMethod && currentStep === 'details' && selectedOperation === 'recharge') {
      setTimeout(() => {
        copyPhoneNumber();
      }, 500);
    }
  }, [paymentMethod, currentStep, selectedOperation]);


  // Redirect to operator app/USSD
  const redirectToOperator = () => {
    const paymentNumber = getPaymentNumber();
    if (!paymentNumber) return;

    // For now, just show a toast with instructions
    toast({
      title: "Instructions de paiement",
      description: `Utilisez le numéro ${paymentNumber.phone_number} pour ${paymentMethod}`
    });
  };

  const handleOperationSelect = (operation: OperationType) => {
    setSelectedOperation(operation);
    setCurrentStep('details');
  };

  const handleSubmitRequest = async () => {
    if (!amount || !paymentMethod || !selectedOperation) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('user_requests')
        .insert({
          user_id: user?.id,
          operation_type: selectedOperation,
          request_type: selectedOperation,
          amount: parseFloat(amount),
          payment_method: paymentMethod,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Demande envoyée",
        description: `Votre demande de ${selectedOperation} de ${amount} XAF a été envoyée avec succès.`
      });

      // For recharge, redirect to operator
      if (selectedOperation === 'recharge') {
        setTimeout(() => {
          redirectToOperator();
        }, 1000);
      }

      setIsOpen(false);
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de l'envoi de votre demande.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderOperationSelection = () => (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>Choisissez une opération</DialogTitle>
      </DialogHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleOperationSelect('recharge')}
        >
          <CardHeader className="text-center">
            <CreditCard className="w-12 h-12 mx-auto text-primary" />
            <CardTitle>Recharge</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Rechargez votre compte via Mobile Money
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleOperationSelect('withdrawal')}
        >
          <CardHeader className="text-center">
            <Wallet className="w-12 h-12 mx-auto text-primary" />
            <CardTitle>Retrait</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Retirez de l'argent vers Mobile Money
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderDetailsForm = () => {
    const paymentMethods = getPaymentMethods();
    const paymentNumber = getPaymentNumber();

    return (
      <div className="space-y-4">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep('operation')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <DialogTitle>
              {selectedOperation === 'recharge' ? 'Détails de la recharge' : 'Détails du retrait'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="amount">Montant (XAF)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ex: 1000"
              required
            />
          </div>

          <div>
            <Label htmlFor="payment_method">Mode de paiement</Label>
            <Select
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un mode" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {paymentNumber && selectedOperation === 'recharge' && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Numéro de paiement:</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{paymentNumber.phone_number}</Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={copyPhoneNumber}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-blue-700">
                    <p><strong>Instructions:</strong></p>
                    <p>1. Envoyez {amount} XAF au numéro {paymentNumber.phone_number}</p>
                    <p>2. Utilisez votre numéro ({profile?.phone}) comme référence</p>
                    <p>3. Votre compte sera crédité automatiquement</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {paymentNumber && selectedOperation === 'withdrawal' && (
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="pt-4">
                <div className="text-sm text-orange-700">
                  <p><strong>Information:</strong></p>
                  <p>Votre demande de retrait sera traitée et vous recevrez {amount} XAF sur votre {paymentMethod}.</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Button 
            onClick={() => setCurrentStep('confirmation')}
            className="w-full"
            disabled={!amount || !paymentMethod}
          >
            Continuer
          </Button>
        </div>
      </div>
    );
  };

  const renderConfirmation = () => (
    <div className="space-y-4">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStep('details')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <DialogTitle>Confirmation</DialogTitle>
        </div>
      </DialogHeader>

      <Card>
        <CardContent className="pt-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Opération:</span>
              <Badge variant={selectedOperation === 'recharge' ? 'default' : 'secondary'}>
                {selectedOperation === 'recharge' ? 'Recharge' : 'Retrait'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Montant:</span>
              <span className="font-medium">{amount} XAF</span>
            </div>
            <div className="flex justify-between">
              <span>Mode de paiement:</span>
              <span>{paymentMethod}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Button 
          onClick={handleSubmitRequest}
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Envoi en cours...' : 'Confirmer la demande'}
        </Button>
        
        {selectedOperation === 'recharge' && (
          <p className="text-xs text-muted-foreground text-center">
            Après confirmation, vous serez redirigé vers votre application de paiement
          </p>
        )}
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p>Chargement des modes de paiement...</p>
          </div>
        </div>
      );
    }

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
      <DialogContent className="sm:max-w-md">
        {renderCurrentStep()}
      </DialogContent>
    </Dialog>
  );
};

export default UserRechargeRequestModal;