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
    'electricity',
    'water',
    'internet',
    'phone',
    'rent',
    'insurance',
    'subscription',
    'other'
  ];

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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bill_name">Nom de la facture</Label>
              <Input
                id="bill_name"
                value={formData.bill_name}
                onChange={(e) => setFormData({...formData, bill_name: e.target.value})}
                placeholder="Ex: Facture d'électricité"
                required
              />
            </div>

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

            <div>
              <Label htmlFor="payment_number">Numéro de paiement</Label>
              <Input
                id="payment_number"
                value={formData.payment_number}
                onChange={(e) => setFormData({...formData, payment_number: e.target.value})}
                placeholder="Numéro de client ou de compte"
              />
            </div>

            <div>
              <Label htmlFor="meter_number">Numéro de compteur</Label>
              <Input
                id="meter_number"
                value={formData.meter_number}
                onChange={(e) => setFormData({...formData, meter_number: e.target.value})}
                placeholder="Numéro de compteur (si applicable)"
              />
            </div>

            <div>
              <Label htmlFor="recurrence">Récurrence</Label>
              <Select 
                value={formData.recurrence}
                onValueChange={(value) => setFormData({...formData, recurrence: value})}
              >
                <SelectTrigger>
                  <SelectValue />
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