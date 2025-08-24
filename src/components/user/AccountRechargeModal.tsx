import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  CreditCard, 
  Smartphone, 
  ArrowLeft,
  CheckCircle,
  X
} from 'lucide-react';

interface AccountRechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'operation' | 'payment_method' | 'request_details' | 'confirmation';
type Operation = 'recharge' | 'retrait';

const AccountRechargeModal: React.FC<AccountRechargeModalProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('operation');
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paymentMethods = [
    { 
      id: 'airtel_money', 
      name: 'Airtel Money', 
      icon: Smartphone, 
      number: '+242 05 123 4567',
      color: 'from-red-600 to-red-700' 
    },
    { 
      id: 'moov_money', 
      name: 'Moov Money', 
      icon: Smartphone, 
      number: '+242 06 123 4567',
      color: 'from-blue-600 to-blue-700' 
    },
    { 
      id: 'orange_money_congo', 
      name: 'Orange Money Congo', 
      icon: Smartphone, 
      number: '+242 05 789 0123',
      color: 'from-orange-600 to-orange-700' 
    },
    { 
      id: 'orange_money_senegal', 
      name: 'Orange Money Sénégal', 
      icon: Smartphone, 
      number: '+221 70 123 4567',
      color: 'from-orange-600 to-orange-700' 
    },
    { 
      id: 'wave', 
      name: 'Wave', 
      icon: CreditCard, 
      number: '+221 77 123 4567',
      color: 'from-purple-600 to-purple-700' 
    }
  ];

  const resetModal = () => {
    setCurrentStep('operation');
    setSelectedOperation(null);
    setSelectedPaymentMethod(null);
    setAmount('');
    setPaymentPhone('');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleOperationSelect = (operation: Operation) => {
    setSelectedOperation(operation);
    setCurrentStep('payment_method');
  };

  const handlePaymentMethodSelect = (method: string) => {
    setSelectedPaymentMethod(method);
    setCurrentStep('request_details');
  };

  const handleSubmitRequest = async () => {
    if (!selectedOperation || !selectedPaymentMethod || !amount || !paymentPhone || !user) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un montant valide",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Simuler l'envoi de la demande
      // En attendant la création de la table user_requests
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setCurrentStep('confirmation');
      
      toast({
        title: "Demande envoyée",
        description: `Votre demande de ${selectedOperation} de ${amountNumber} FCFA a été envoyée. Elle sera traitée par un administrateur.`,
      });

    } catch (error) {
      console.error('Erreur lors de l\'envoi de la demande:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'envoi de la demande",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderOperationSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Choisir une opération</h3>
        <p className="text-gray-600">Sélectionnez le type d'opération que vous souhaitez effectuer</p>
      </div>

      <div className="grid gap-4">
        <Card 
          className="cursor-pointer border-2 border-transparent hover:border-green-300 hover:shadow-lg transition-all duration-200"
          onClick={() => handleOperationSelect('recharge')}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-full">
              <ArrowDownCircle className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-800">Recharge de compte</h4>
              <p className="text-gray-600">Ajouter de l'argent à votre compte</p>
            </div>
            <Badge className="bg-green-100 text-green-800">
              Recharge
            </Badge>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer border-2 border-transparent hover:border-blue-300 hover:shadow-lg transition-all duration-200"
          onClick={() => handleOperationSelect('retrait')}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full">
              <ArrowUpCircle className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-800">Retrait d'argent</h4>
              <p className="text-gray-600">Retirer de l'argent de votre compte</p>
            </div>
            <Badge className="bg-blue-100 text-blue-800">
              Retrait
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderPaymentMethodSelection = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setCurrentStep('operation')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h3 className="text-xl font-semibold text-gray-800">Mode de paiement</h3>
          <p className="text-gray-600">
            Choisir le mode de paiement pour votre {selectedOperation}
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          return (
            <Card 
              key={method.id}
              className="cursor-pointer border-2 border-transparent hover:border-blue-300 hover:shadow-lg transition-all duration-200"
              onClick={() => handlePaymentMethodSelect(method.id)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`p-2 bg-gradient-to-br ${method.color} rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{method.name}</h4>
                  <p className="text-sm text-gray-600">{method.number}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderRequestDetails = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setCurrentStep('payment_method')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h3 className="text-xl font-semibold text-gray-800">Détails de la demande</h3>
          <p className="text-gray-600">
            Complétez les informations pour votre {selectedOperation}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
            Montant (FCFA)
          </Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Saisissez le montant"
            className="mt-2"
            min="1000"
            step="500"
          />
        </div>

        <div>
          <Label htmlFor="paymentPhone" className="text-sm font-medium text-gray-700">
            Votre numéro de téléphone
          </Label>
          <Input
            id="paymentPhone"
            type="tel"
            value={paymentPhone}
            onChange={(e) => setPaymentPhone(e.target.value)}
            placeholder="Ex: +242 XX XX XX XX"
            className="mt-2"
          />
        </div>

        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">Résumé de votre demande</h4>
          <div className="space-y-1 text-sm text-blue-700">
            <p>Opération: <span className="font-medium">{selectedOperation === 'recharge' ? 'Recharge' : 'Retrait'}</span></p>
            <p>Mode de paiement: <span className="font-medium">
              {paymentMethods.find(m => m.id === selectedPaymentMethod)?.name}
            </span></p>
            {amount && <p>Montant: <span className="font-medium">{parseFloat(amount).toLocaleString()} FCFA</span></p>}
          </div>
        </div>

        <Button
          onClick={handleSubmitRequest}
          disabled={isSubmitting || !amount || !paymentPhone}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Envoi en cours...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Envoyer la demande
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderConfirmation = () => (
    <div className="space-y-6 text-center">
      <div className="p-4 bg-green-100 rounded-full mx-auto w-fit">
        <CheckCircle className="w-12 h-12 text-green-600" />
      </div>
      
      <div>
        <h3 className="text-xl font-semibold text-green-800 mb-2">Demande envoyée avec succès</h3>
        <p className="text-green-700">
          Votre demande de {selectedOperation} de {parseFloat(amount || '0').toLocaleString()} FCFA a été envoyée.
        </p>
        <p className="text-sm text-green-600 mt-2">
          Elle sera traitée par un administrateur dans les plus brefs délais.
        </p>
      </div>

      <Button
        onClick={handleClose}
        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
      >
        Fermer
      </Button>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'operation':
        return renderOperationSelection();
      case 'payment_method':
        return renderPaymentMethodSelection();
      case 'request_details':
        return renderRequestDetails();
      case 'confirmation':
        return renderConfirmation();
      default:
        return renderOperationSelection();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold">
            {selectedOperation ? 
              (selectedOperation === 'recharge' ? 'Recharge de compte' : 'Retrait d\'argent') : 
              'Compte'
            }
          </DialogTitle>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>
        
        <div className="mt-4">
          {renderCurrentStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccountRechargeModal;
