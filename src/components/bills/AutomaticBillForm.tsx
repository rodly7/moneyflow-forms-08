import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';

interface AutomaticBillFormProps {
  editingBill?: any;
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
}

export const AutomaticBillForm: React.FC<AutomaticBillFormProps> = ({
  editingBill,
  formData,
  setFormData,
  onSubmit,
  onCancel,
  loading
}) => {
  const { profile } = useAuth();
  const [isValid, setIsValid] = useState(false);

  const billTypes = [
    { value: 'electricity', label: 'Électricité' },
    { value: 'water', label: 'Eau' },
    { value: 'internet', label: 'Internet' },
    { value: 'phone', label: 'Téléphone' },
    { value: 'rent', label: 'Loyer' },
    { value: 'insurance', label: 'Assurance' },
    { value: 'subscription', label: 'Abonnement' },
    { value: 'other', label: 'Autre' }
  ];

  const getProvidersForType = (type: string, country: string = 'Sénégal') => {
    const providers: any = {
      electricity: {
        'Sénégal': [{ value: 'SENELEC', label: 'SENELEC', number: '555-000-001' }],
        'Congo Brazzaville': [{ value: 'SNE', label: 'SNE', number: '555-000-002' }],
        'Gabon': [{ value: 'SEEG', label: 'SEEG', number: '555-000-003' }]
      },
      water: {
        'Sénégal': [{ value: 'SDE', label: 'SDE', number: '555-000-004' }],
        'Congo Brazzaville': [{ value: 'LCDE', label: 'LCDE', number: '555-000-005' }],
        'Gabon': [{ value: 'SEEG', label: 'SEEG', number: '555-000-006' }]
      },
      internet: {
        'Sénégal': [
          { value: 'Orange', label: 'Orange', number: '555-000-007' },
          { value: 'Free', label: 'Free', number: '555-000-008' }
        ],
        'Congo Brazzaville': [
          { value: 'Canalbox', label: 'Canalbox', number: '555-000-009' },
          { value: 'Congo Telecom', label: 'Congo Telecom', number: '555-000-010' }
        ],
        'Gabon': [
          { value: 'Gabon Telecom', label: 'Gabon Telecom', number: '555-000-011' },
          { value: 'Airtel', label: 'Airtel', number: '555-000-012' }
        ]
      },
      phone: {
        'Sénégal': [
          { value: 'Orange', label: 'Orange', number: '555-000-013' },
          { value: 'Free', label: 'Free', number: '555-000-014' }
        ],
        'Congo Brazzaville': [
          { value: 'MTN', label: 'MTN', number: '555-000-015' },
          { value: 'Airtel', label: 'Airtel', number: '555-000-016' }
        ],
        'Gabon': [
          { value: 'Gabon Telecom', label: 'Gabon Telecom', number: '555-000-017' },
          { value: 'Airtel', label: 'Airtel', number: '555-000-018' }
        ]
      },
      rent: {
        'Sénégal': [{ value: 'Loyer', label: 'Loyer', number: 'N/A' }],
        'Congo Brazzaville': [{ value: 'Loyer', label: 'Loyer', number: 'N/A' }],
        'Gabon': [{ value: 'Loyer', label: 'Loyer', number: 'N/A' }]
      },
      insurance: {
        'Sénégal': [
          { value: 'AXA', label: 'AXA', number: '555-000-019' },
          { value: 'NSIA', label: 'NSIA', number: '555-000-020' }
        ],
        'Congo Brazzaville': [
          { value: 'NSIA', label: 'NSIA', number: '555-000-021' }
        ],
        'Gabon': [
          { value: 'NSIA', label: 'NSIA', number: '555-000-022' }
        ]
      },
      subscription: {
        'Sénégal': [
          { value: 'Canal+', label: 'Canal+', number: '555-000-023' },
          { value: 'Netflix', label: 'Netflix', number: '555-000-024' }
        ],
        'Congo Brazzaville': [
          { value: 'Canal+', label: 'Canal+', number: '555-000-025' }
        ],
        'Gabon': [
          { value: 'Canal+', label: 'Canal+', number: '555-000-026' }
        ]
      },
      other: {
        'Sénégal': [{ value: 'Autre', label: 'Autre', number: 'N/A' }],
        'Congo Brazzaville': [{ value: 'Autre', label: 'Autre', number: 'N/A' }],
        'Gabon': [{ value: 'Autre', label: 'Autre', number: 'N/A' }]
      }
    };
    
    return providers[type]?.[country] || [];
  };

  const getProviderNumber = (type: string, provider: string, country: string = 'Sénégal') => {
    const providers = getProvidersForType(type, country);
    const found = providers.find((p: any) => p.value === provider);
    return found?.number || 'N/A';
  };

  useEffect(() => {
    const isFormValid = formData.bill_name.trim() && 
                       formData.amount > 0 && 
                       formData.due_date;
    setIsValid(isFormValid);
  }, [formData]);

  const calculateTotal = (amount: number) => {
    const fee = amount * 0.015; // 1.5% fee
    return amount + fee;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      onSubmit();
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>
          {editingBill ? 'Modifier la facture' : 'Nouvelle facture automatique'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Type de facture */}
            <div>
              <Label htmlFor="bill_type">Type de facture</Label>
              <Select 
                value={formData.bill_type || ''}
                onValueChange={(value) => setFormData({...formData, bill_type: value, bill_name: billTypes.find(t => t.value === value)?.label || ''})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type de facture" />
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
            {formData.bill_type && (
              <div>
                <Label htmlFor="provider">Fournisseur</Label>
                <Select 
                  value={formData.provider || ''}
                  onValueChange={(value) => setFormData({...formData, provider: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    {getProvidersForType(formData.bill_type, profile?.country || 'Sénégal').map((provider: any) => (
                      <SelectItem key={provider.value} value={provider.value}>
                        {provider.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Numéro du fournisseur */}
            {formData.provider && (
              <div>
                <Label htmlFor="provider_number">Numéro du fournisseur</Label>
                <Input
                  id="provider_number"
                  value={getProviderNumber(formData.bill_type, formData.provider, profile?.country || 'Sénégal')}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            )}

            {/* Numéro de compteur */}
            <div>
              <Label htmlFor="meter_number">Numéro de compteur</Label>
              <Input
                id="meter_number"
                value={formData.meter_number}
                onChange={(e) => setFormData({...formData, meter_number: e.target.value})}
                placeholder="Numéro de compteur (si applicable)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date d'échéance */}
              <div>
                <Label htmlFor="due_date">Date d'échéance</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  required
                />
              </div>

              {/* Montant */}
              <div>
                <Label htmlFor="amount">Montant (FCFA)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                  placeholder="0"
                  min="0"
                  required
                />
              </div>
            </div>

            {/* Récurrence */}
            <div>
              <Label htmlFor="recurrence">Récurrence</Label>
              <Select 
                value={formData.recurrence}
                onValueChange={(value) => setFormData({...formData, recurrence: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner la récurrence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Une fois</SelectItem>
                  <SelectItem value="monthly">Mensuel</SelectItem>
                  <SelectItem value="quarterly">Trimestriel</SelectItem>
                  <SelectItem value="yearly">Annuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_automated"
              checked={formData.is_automated}
              onCheckedChange={(checked) => setFormData({...formData, is_automated: checked})}
            />
            <Label htmlFor="is_automated">Paiement automatique mensuel</Label>
          </div>

          {formData.is_automated && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                Cette facture sera automatiquement payée chaque mois à la date d'échéance 
                si vous avez suffisamment de fonds.
              </p>
            </div>
          )}

          {formData.amount > 0 && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Montant:</span>
                <span>{formData.amount.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Frais (1.5%):</span>
                <span>{(formData.amount * 0.015).toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                <span>Total:</span>
                <span>{calculateTotal(formData.amount).toLocaleString()} FCFA</span>
              </div>
            </div>
          )}

          {profile && formData.amount > 0 && (
            <div className={`p-3 rounded-lg ${
              profile.balance >= calculateTotal(formData.amount)
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}>
              <p className="text-sm">
                Solde actuel: {profile.balance.toLocaleString()} FCFA
                {profile.balance < calculateTotal(formData.amount) && (
                  <span className="block mt-1">
                    Solde insuffisant pour ce paiement.
                  </span>
                )}
              </p>
            </div>
          )}

          <div className="flex space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={!isValid || loading}
              className="flex-1"
            >
              {loading ? 'Traitement...' : editingBill ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};