import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { UnifiedRecipientSearch } from '@/components/shared/UnifiedRecipientSearch';

interface BillFormProps {
  editingBill: string | null;
  formData: {
    bill_name: string;
    amount: string;
    due_date: string;
    recurrence: string;
    priority: number;
    meter_number: string;
    payment_number: string;
    recipient_phone: string;
    recipient_country: string;
    recipient_name: string;
  };
  setFormData: (data: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
}

const BillForm = ({
  editingBill,
  formData,
  setFormData,
  onSubmit,
  onCancel,
  loading
}: BillFormProps) => {
  const [phoneInput, setPhoneInput] = useState(formData.recipient_phone || '');

  // Handle user found from unified search
  const handleUserFound = (userData: any) => {
    if (userData.full_name) {
      // User found - auto-fill recipient information
      setFormData({
        ...formData,
        recipient_phone: userData.fullPhoneNumber,
        recipient_country: userData.country || formData.recipient_country,
        recipient_name: userData.full_name,
        payment_number: userData.fullPhoneNumber
      });
    } else {
      // User not found - update phone but keep other fields for manual entry
      setFormData({
        ...formData,
        recipient_phone: userData.fullPhoneNumber,
        payment_number: userData.fullPhoneNumber
      });
    }
  };

  // Handle country change
  const handleCountryChange = (countryName: string) => {
    setFormData({
      ...formData,
      recipient_country: countryName,
      recipient_phone: '',
      payment_number: ''
    });
    setPhoneInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Card className="w-full bg-white shadow-xl border-0">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
        <CardTitle className="text-xl text-gray-800">
          {editingBill ? 'Modifier la facture' : 'Nouvelle facture automatique'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bill Name */}
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

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Montant (FCFA)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Ex: 25000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              className="h-12"
              min="1"
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due_date">Date d'échéance</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              required
              className="h-12"
            />
          </div>

          {/* Recurrence */}
          <div className="space-y-2">
            <Label htmlFor="recurrence">Récurrence</Label>
            <Select
              value={formData.recurrence}
              onValueChange={(value) => setFormData({ ...formData, recurrence: value })}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Choisir la récurrence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="once">Une seule fois</SelectItem>
                <SelectItem value="weekly">Hebdomadaire</SelectItem>
                <SelectItem value="monthly">Mensuel</SelectItem>
                <SelectItem value="quarterly">Trimestriel</SelectItem>
                <SelectItem value="yearly">Annuel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priorité</Label>
            <Select
              value={formData.priority.toString()}
              onValueChange={(value) => setFormData({ ...formData, priority: parseInt(value) })}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Choisir la priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Haute (1)</SelectItem>
                <SelectItem value="2">Moyenne (2)</SelectItem>
                <SelectItem value="3">Basse (3)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Meter Number */}
          <div className="space-y-2">
            <Label htmlFor="meter_number">Numéro de compteur/référence</Label>
            <Input
              id="meter_number"
              placeholder="Ex: 123456789"
              value={formData.meter_number}
              onChange={(e) => setFormData({ ...formData, meter_number: e.target.value })}
              className="h-12"
            />
          </div>

          {/* Unified Recipient Search */}
          <UnifiedRecipientSearch
            phoneInput={phoneInput}
            selectedCountry={formData.recipient_country}
            onPhoneChange={setPhoneInput}
            onCountryChange={handleCountryChange}
            onUserFound={handleUserFound}
            label="Numéro de téléphone du destinataire"
            showCountrySelector={true}
            placeholder="Numéro pour recevoir les notifications"
            required={true}
          />

          {/* Manual Name Entry if user not found */}
          {phoneInput.length >= 8 && !formData.recipient_name && (
            <div className="space-y-2 animate-fade-in">
              <Label htmlFor="recipient_name">Nom du Destinataire</Label>
              <Input
                id="recipient_name"
                placeholder="Entrez le nom complet"
                value={formData.recipient_name}
                onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                className="h-12"
              />
              <p className="text-xs text-amber-600">
                ⚠️ Destinataire non trouvé - Veuillez saisir le nom manuellement
              </p>
            </div>
          )}

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
              disabled={loading}
              className="h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 text-white"
            >
              {loading ? 'Traitement...' : editingBill ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default BillForm;
