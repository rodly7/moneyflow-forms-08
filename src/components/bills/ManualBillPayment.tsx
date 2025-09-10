import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRobustBillPayment } from '@/hooks/useRobustBillPayment';

interface ManualBillPaymentProps {
  selectedBillType: string;
  provider: string;
  accountNumber: string;
  amount: string;
  recipientPhone: string;
  selectedCountry: string;
  setSelectedBillType: (value: string) => void;
  setProvider: (value: string) => void;
  setAccountNumber: (value: string) => void;
  setAmount: (value: string) => void;
  setRecipientPhone: (value: string) => void;
}

const ManualBillPayment: React.FC<ManualBillPaymentProps> = ({
  selectedBillType,
  provider,
  accountNumber,
  amount,
  recipientPhone,
  selectedCountry,
  setSelectedBillType,
  setProvider,
  setAccountNumber,
  setAmount,
  setRecipientPhone
}) => {
  const { profile } = useAuth();
  const { processBillPayment, isProcessing } = useRobustBillPayment();

  const feeRate = 0.015; // 1.5% frais

  // Types de factures principaux
  const billTypes = [
    { value: 'rent', label: 'Loyer' },
    { value: 'electricity', label: 'Électricité' },
    { value: 'wifi', label: 'Wifi/Internet' },
    { value: 'water', label: 'Eau' }
  ];

  // Entreprises disponibles selon le pays et type de facture
  const getCompaniesForType = (type: string, country: string) => {
    const companies: any = {
      electricity: {
        'Sénégal': [{ value: 'SENELEC', label: 'SENELEC' }],
        'Congo Brazzaville': [{ value: 'SNE', label: 'SNE' }],
        'Gabon': [{ value: 'SEEG', label: 'SEEG' }]
      },
      water: {
        'Sénégal': [{ value: 'SDE', label: 'SDE' }],
        'Congo Brazzaville': [{ value: 'LCDE', label: 'LCDE' }],
        'Gabon': [{ value: 'SEEG', label: 'SEEG' }]
      },
      wifi: {
        'Sénégal': [
          { value: 'Orange', label: 'Orange' },
          { value: 'Free', label: 'Free' }
        ],
        'Congo Brazzaville': [
          { value: 'Canalbox', label: 'Canalbox' },
          { value: 'Congo Telecom', label: 'Congo Telecom' }
        ],
        'Gabon': [
          { value: 'Gabon Telecom', label: 'Gabon Telecom' },
          { value: 'Airtel', label: 'Airtel' }
        ]
      },
      rent: {
        'Sénégal': [{ value: 'Loyer', label: 'Loyer' }],
        'Congo Brazzaville': [{ value: 'Loyer', label: 'Loyer' }],
        'Gabon': [{ value: 'Loyer', label: 'Loyer' }]
      }
    };
    
    return companies[type]?.[country] || [];
  };

  const calculateTotal = () => {
    const baseAmount = parseFloat(amount) || 0;
    const fees = baseAmount * feeRate;
    return baseAmount + fees;
  };

  const handlePayBill = async () => {
    if (!selectedBillType || !provider || !accountNumber || !amount) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const paymentData = {
      amount: parseFloat(amount),
      billType: selectedBillType,
      provider: provider,
      accountNumber: accountNumber,
      recipientPhone: recipientPhone
    };

    try {
      const result = await processBillPayment(paymentData);
      if (result.success) {
        // Reset form
        setSelectedBillType('');
        setProvider('');
        setAccountNumber('');
        setAmount('');
        setRecipientPhone('');
      }
    } catch (error) {
      console.error('Erreur lors du paiement:', error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Paiement Manuel de Facture
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Type de facture */}
        <div>
          <Label htmlFor="billType">Type de facture</Label>
          <Select value={selectedBillType} onValueChange={setSelectedBillType}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir le type" />
            </SelectTrigger>
            <SelectContent>
              {billTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Fournisseur */}
        {selectedBillType && (
          <div>
            <Label htmlFor="provider">Fournisseur</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir le fournisseur" />
              </SelectTrigger>
              <SelectContent>
                {getCompaniesForType(selectedBillType, selectedCountry).map((company) => (
                  <SelectItem key={company.value} value={company.value}>
                    {company.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Numéro de compte/compteur */}
        <div>
          <Label htmlFor="accountNumber">Numéro de compte/compteur</Label>
          <Input
            id="accountNumber"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="Entrez le numéro"
          />
        </div>

        {/* Montant */}
        <div>
          <Label htmlFor="amount">Montant (FCFA)</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            min="0"
          />
        </div>

        {/* Numéro de téléphone (optionnel) */}
        <div>
          <Label htmlFor="recipientPhone">Numéro de téléphone (optionnel)</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="recipientPhone"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="Numéro du bénéficiaire"
              className="pl-10"
            />
          </div>
        </div>

        {/* Résumé des frais */}
        {amount && parseFloat(amount) > 0 && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between text-sm">
              <span>Montant:</span>
              <span>{parseFloat(amount).toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Frais (1.5%):</span>
              <span>{(parseFloat(amount) * feeRate).toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-2 mt-2">
              <span>Total:</span>
              <span>{calculateTotal().toLocaleString()} FCFA</span>
            </div>
          </div>
        )}

        {/* Vérification du solde */}
        {profile && amount && parseFloat(amount) > 0 && (
          <div className={`p-3 rounded-lg ${
            profile.balance >= calculateTotal()
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}>
            <p className="text-sm">
              Solde actuel: {profile.balance.toLocaleString()} FCFA
              {profile.balance < calculateTotal() && (
                <span className="block mt-1">
                  Solde insuffisant pour ce paiement.
                </span>
              )}
            </p>
          </div>
        )}

        {/* Bouton de paiement */}
        <Button 
          onClick={handlePayBill}
          disabled={
            isProcessing || 
            !selectedBillType || 
            !provider || 
            !accountNumber || 
            !amount ||
            parseFloat(amount) <= 0 ||
            (profile && profile.balance < calculateTotal())
          }
          className="w-full"
        >
          {isProcessing ? 'Traitement...' : `Payer ${calculateTotal().toLocaleString()} FCFA`}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ManualBillPayment;