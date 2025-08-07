import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useRobustBillPayment } from '@/hooks/useRobustBillPayment';
import { CreditCard, ArrowRight } from 'lucide-react';
import { UnifiedRecipientSearch } from '@/components/shared/UnifiedRecipientSearch';

interface ManualBillPaymentProps {
  selectedBillType: string;
  provider: string;
  accountNumber: string;
  amount: string;
  recipientPhone: string;
  selectedCountry: string;
  setSelectedBillType: (type: string) => void;
  setProvider: (provider: string) => void;
  setAccountNumber: (number: string) => void;
  setAmount: (amount: string) => void;
  setRecipientPhone: (phone: string) => void;
}

const ManualBillPayment = ({
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
}: ManualBillPaymentProps) => {
  const { profile } = useAuth();
  const { processBillPayment, isProcessing } = useRobustBillPayment();
  const [isFormValid, setIsFormValid] = useState(false);
  const [recipientPhoneInput, setRecipientPhoneInput] = useState('');
  const [foundRecipient, setFoundRecipient] = useState<any>(null);

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

  // Vérifier la validité du formulaire
  useEffect(() => {
    const isValid = selectedBillType && provider && accountNumber && amount && recipientPhone;
    setIsFormValid(!!isValid);
  }, [selectedBillType, provider, accountNumber, amount, recipientPhone]);

  const calculateTotal = () => {
    const baseAmount = parseFloat(amount) || 0;
    const fees = baseAmount * feeRate;
    return baseAmount + fees;
  };

  const handlePayment = async () => {
    if (!isFormValid) return;

    const paymentData = {
      amount: parseFloat(amount),
      billType: selectedBillType,
      provider: provider,
      accountNumber: accountNumber,
      recipientPhone: recipientPhone
    };

    await processBillPayment(paymentData);
  };

  return (
    <Card className="bg-white shadow-2xl rounded-2xl border-0 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white pb-4">
        <CardTitle className="text-center text-lg font-bold mb-2">
          Paiement de Facture Manuel
        </CardTitle>
        <p className="text-center text-sm text-blue-100">
          Payez vos factures en temps réel
        </p>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        {/* Type de facture */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">Type de facture *</Label>
          <Select value={selectedBillType} onValueChange={setSelectedBillType}>
            <SelectTrigger className="h-14 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl">
              <SelectValue placeholder="Sélectionnez un type de facture" />
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
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Fournisseur *</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger className="h-14 bg-green-50 border-2 border-green-200 rounded-xl">
                <SelectValue placeholder="Sélectionnez un fournisseur" />
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

        {/* Numéro de compteur */}
        {selectedBillType && (
          <div className="space-y-2">
            <Label htmlFor="account" className="text-sm font-semibold text-gray-700">
              Numéro de compteur *
            </Label>
            <Input
              id="account"
              type="text"
              placeholder="Entrez votre numéro de compteur"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="h-14 bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 rounded-xl"
            />
          </div>
        )}

        {/* Recherche du destinataire avec système unifié */}
        {selectedBillType && (
          <div className="space-y-2">
            <UnifiedRecipientSearch
              phoneInput={recipientPhoneInput}
              selectedCountry={selectedCountry}
              onPhoneChange={setRecipientPhoneInput}
              onCountryChange={() => {}} // Country already managed by parent
              onUserFound={(userData) => {
                setFoundRecipient(userData);
                setRecipientPhone(userData.fullPhoneNumber || '');
                // Mettre à jour les informations utilisateur trouvées
                if (userData.full_name) {
                  console.log('✅ Destinataire trouvé:', userData.full_name);
                }
              }}
              label="Numéro du destinataire"
              showCountrySelector={false} // Country already selected above
              required={true}
            />
          </div>
        )}

        {/* Montant */}
        {selectedBillType && (
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-semibold text-gray-700">
              Montant (FCFA) *
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-14 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-orange-200 rounded-xl font-bold text-lg"
            />
            {amount && (
              <div className="text-sm text-gray-700 bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Montant de base:</span>
                  <span className="font-bold text-blue-600">{parseFloat(amount || "0").toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Frais (1,5%):</span>
                  <span className="font-bold text-orange-600">{(parseFloat(amount || "0") * feeRate).toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between items-center font-bold text-lg text-purple-600 border-t border-gray-300 pt-2 mt-2">
                  <span>Total à payer:</span>
                  <span>{calculateTotal().toLocaleString()} FCFA</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bouton de paiement */}
        {isFormValid && (
          <Button
            onClick={handlePayment}
            disabled={isProcessing || !isFormValid}
            className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-lg font-semibold rounded-xl"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                Traitement en cours...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Payer {calculateTotal().toLocaleString()} FCFA
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        )}

        {/* Message d'information solde */}
        {profile?.balance && amount && (
          <div className="text-center text-sm text-gray-600 bg-blue-50 p-3 rounded-xl border border-blue-200">
            Votre solde: <span className="font-bold text-blue-600">{profile.balance.toLocaleString()} FCFA</span>
            {profile.balance < calculateTotal() && (
              <div className="text-red-600 font-medium mt-1">
                ⚠️ Solde insuffisant pour ce paiement
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ManualBillPayment;