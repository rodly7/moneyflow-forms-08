
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, CreditCard } from 'lucide-react';
import { UnifiedRecipientSearch } from '@/components/shared/UnifiedRecipientSearch';

interface AutomaticBillFormProps {
  editingBill: string | null;
  formData: {
    bill_name: string;
    selectedBillType: string;
    provider: string;
    accountNumber: string;
    amount: string;
    recipientPhone: string;
    due_date: string;
    is_automated: boolean;
  };
  setFormData: (data: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
}

const AutomaticBillForm = ({
  editingBill,
  formData,
  setFormData,
  onSubmit,
  onCancel,
  loading
}: AutomaticBillFormProps) => {
  const { profile } = useAuth();
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
    const isValid = formData.selectedBillType && formData.provider && formData.accountNumber && 
                   formData.amount && formData.recipientPhone && formData.due_date;
    setIsFormValid(!!isValid);
  }, [formData]);

  const calculateTotal = () => {
    const baseAmount = parseFloat(formData.amount) || 0;
    const fees = baseAmount * feeRate;
    return baseAmount + fees;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      onSubmit();
    }
  };

  return (
    <Card className="w-full bg-white shadow-xl border-0">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
        <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          {editingBill ? 'Modifier la facture automatique' : 'Nouvelle facture automatique'}
        </CardTitle>
        <p className="text-sm text-gray-600">
          Configurez vos paiements récurrents avec débit automatique mensuel
        </p>
      </CardHeader>
      
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nom de la facture */}
          <div className="space-y-2">
            <Label htmlFor="bill_name">Nom de la facture</Label>
            <Input
              id="bill_name"
              placeholder="Ex: Électricité ENEO"
              value={formData.bill_name}
              onChange={(e) => setFormData({ ...formData, bill_name: e.target.value })}
              required
              className="h-12"
            />
          </div>

          {/* Type de facture */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Type de facture *</Label>
            <Select 
              value={formData.selectedBillType} 
              onValueChange={(value) => setFormData({ ...formData, selectedBillType: value })}
            >
              <SelectTrigger className="h-12 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl">
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
          {formData.selectedBillType && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Fournisseur *</Label>
              <Select 
                value={formData.provider} 
                onValueChange={(value) => setFormData({ ...formData, provider: value })}
              >
                <SelectTrigger className="h-12 bg-green-50 border-2 border-green-200 rounded-xl">
                  <SelectValue placeholder="Sélectionnez un fournisseur" />
                </SelectTrigger>
                <SelectContent>
                  {getCompaniesForType(formData.selectedBillType, profile?.country || '').map((company) => (
                    <SelectItem key={company.value} value={company.value}>
                      {company.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Numéro de compteur */}
          {formData.selectedBillType && (
            <div className="space-y-2">
              <Label htmlFor="account" className="text-sm font-semibold text-gray-700">
                Numéro de compteur *
              </Label>
              <Input
                id="account"
                type="text"
                placeholder="Entrez votre numéro de compteur"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                className="h-12 bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 rounded-xl"
              />
            </div>
          )}

          {/* Montant */}
          <div className="space-y-2">
            <Label htmlFor="amount">Montant (FCFA)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Ex: 25000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              className="h-12 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-orange-200 rounded-xl font-bold text-lg"
              min="1"
            />
            {formData.amount && (
              <div className="text-sm text-gray-700 bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Montant de base:</span>
                  <span className="font-bold text-blue-600">{parseFloat(formData.amount || "0").toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Frais (1,5%):</span>
                  <span className="font-bold text-orange-600">{(parseFloat(formData.amount || "0") * feeRate).toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between items-center font-bold text-lg text-purple-600 border-t border-gray-300 pt-2 mt-2">
                  <span>Total mensuel:</span>
                  <span>{calculateTotal().toLocaleString()} FCFA</span>
                </div>
              </div>
            )}
          </div>

          {/* Recherche du destinataire */}
          <div className="space-y-2">
            <UnifiedRecipientSearch
              phoneInput={recipientPhoneInput}
              selectedCountry={profile?.country || ''}
              onPhoneChange={setRecipientPhoneInput}
              onCountryChange={() => {}}
              onUserFound={(userData) => {
                setFoundRecipient(userData);
                setFormData({ ...formData, recipientPhone: userData.fullPhoneNumber || '' });
              }}
              label="Numéro du destinataire"
              showCountrySelector={false}
              required={true}
            />
          </div>

          {/* Date d'échéance */}
          <div className="space-y-2">
            <Label htmlFor="due_date">Date d'échéance (premier prélèvement)</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              required
              className="h-12"
            />
          </div>

          {/* Paiement automatique */}
          <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Switch
              id="is_automated"
              checked={formData.is_automated}
              onCheckedChange={(checked) => setFormData({ ...formData, is_automated: checked })}
            />
            <div className="flex-1">
              <Label htmlFor="is_automated" className="font-medium">
                Activer le prélèvement automatique mensuel
              </Label>
              <p className="text-sm text-blue-700 mt-1">
                💡 Le montant sera automatiquement débité de votre compte chaque mois à partir de la date d'échéance.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="h-12"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || !isFormValid}
              className="h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Traitement...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  {editingBill ? 'Modifier' : 'Créer la facture automatique'}
                </>
              )}
            </Button>
          </div>

          {/* Message d'information solde */}
          {profile?.balance && formData.amount && (
            <div className="text-center text-sm text-gray-600 bg-blue-50 p-3 rounded-xl border border-blue-200">
              Votre solde: <span className="font-bold text-blue-600">{profile.balance.toLocaleString()} FCFA</span>
              {profile.balance < calculateTotal() && (
                <div className="text-red-600 font-medium mt-1">
                  ⚠️ Solde insuffisant pour ce paiement
                </div>
              )}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default AutomaticBillForm;
