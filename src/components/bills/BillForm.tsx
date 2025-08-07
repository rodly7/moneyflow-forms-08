
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
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
    recipient_name?: string;
  };
  setFormData: (data: any) => void;
  onSubmit: () => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

// Données des factures par pays
const BILL_TYPES_BY_COUNTRY = {
  "Cameroun": [
    { type: "Électricité", providers: ["ENEO", "AES SONEL"] },
    { type: "Eau", providers: ["CAMWATER", "CDE"] },
    { type: "Internet", providers: ["Orange", "MTN", "Nexttel", "Viettel"] },
    { type: "TV", providers: ["Canal+", "StarTimes", "Africabox"] },
    { type: "Loyer", providers: [] }
  ],
  "Congo Brazzaville": [
    { type: "Électricité", providers: ["SNE", "E2C"] },
    { type: "Eau", providers: ["LCDE", "SNDE"] },
    { type: "Internet", providers: ["Airtel", "MTN Congo", "Azur"] },
    { type: "TV", providers: ["Canal+", "StarTimes"] },
    { type: "Loyer", providers: [] }
  ],
  "Gabon": [
    { type: "Électricité", providers: ["SEEG"] },
    { type: "Eau", providers: ["SEEG"] },
    { type: "Internet", providers: ["Airtel", "Moov", "Libertis"] },
    { type: "TV", providers: ["Canal+", "StarTimes"] },
    { type: "Loyer", providers: [] }
  ],
  "Tchad": [
    { type: "Électricité", providers: ["SNE Tchad"] },
    { type: "Eau", providers: ["STE", "SEEN"] },
    { type: "Internet", providers: ["Airtel", "Tigo", "Salam"] },
    { type: "TV", providers: ["Canal+", "StarTimes"] },
    { type: "Loyer", providers: [] }
  ],
  "République Centrafricaine": [
    { type: "Électricité", providers: ["ENERCA"] },
    { type: "Eau", providers: ["SODECA"] },
    { type: "Internet", providers: ["Orange", "Telecel", "Moov"] },
    { type: "TV", providers: ["Canal+"] },
    { type: "Loyer", providers: [] }
  ]
};

const BillForm = ({ editingBill, formData, setFormData, onSubmit, onCancel, loading }: BillFormProps) => {
  const { profile } = useAuth();
  const [selectedBillType, setSelectedBillType] = useState('');
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [foundRecipient, setFoundRecipient] = useState<any>(null);

  const userCountry = profile?.country || "Cameroun";
  const billTypes = BILL_TYPES_BY_COUNTRY[userCountry as keyof typeof BILL_TYPES_BY_COUNTRY] || BILL_TYPES_BY_COUNTRY["Cameroun"];

  useEffect(() => {
    if (selectedBillType) {
      const billTypeData = billTypes.find(bill => bill.type === selectedBillType);
      if (billTypeData) {
        setAvailableProviders(billTypeData.providers);
        
        // Auto-remplir le nom de la facture si non défini
        if (!formData.bill_name || formData.bill_name === '') {
          setFormData({ ...formData, bill_name: selectedBillType });
        }
      }
    }
  }, [selectedBillType, billTypes]);

  const handleBillTypeChange = (value: string) => {
    setSelectedBillType(value);
    setFormData({ 
      ...formData, 
      bill_name: value,
      meter_number: '' // Reset meter number when changing bill type
    });
  };

  const handleProviderChange = (value: string) => {
    setFormData({ ...formData, meter_number: value });
  };

  const handleRecipientFound = (recipient: any) => {
    setFoundRecipient(recipient);
    setFormData({ 
      ...formData, 
      recipient_phone: recipient.fullPhoneNumber || '',
      payment_number: recipient.fullPhoneNumber || '', // Synchroniser avec payment_number
      recipient_country: recipient.country || profile?.country || 'Cameroun',
      recipient_name: recipient.full_name || ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation des champs requis
    if (!formData.bill_name.trim()) {
      return;
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      return;
    }
    
    if (!formData.due_date) {
      return;
    }

    try {
      await onSubmit();
    } catch (error) {
      console.error('Erreur lors de la soumission du formulaire:', error);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl border-0 bg-white">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold text-gray-800">
            {editingBill ? 'Modifier la facture' : 'Nouvelle facture automatique'}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 max-h-[70vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type de facture */}
          <div className="space-y-2">
            <Label htmlFor="billType">Type de facture *</Label>
            <Select value={selectedBillType} onValueChange={handleBillTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez le type de facture" />
              </SelectTrigger>
              <SelectContent>
                {billTypes.map((bill) => (
                  <SelectItem key={bill.type} value={bill.type}>
                    {bill.type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nom de la facture */}
          <div className="space-y-2">
            <Label htmlFor="bill_name">Nom de la facture *</Label>
            <Input
              id="bill_name"
              value={formData.bill_name}
              onChange={(e) => setFormData({ ...formData, bill_name: e.target.value })}
              placeholder="Ex: Électricité maison"
              required
              className="w-full"
            />
          </div>

          {/* Recherche du destinataire */}
          <UnifiedRecipientSearch
            phoneInput={formData.recipient_phone}
            selectedCountry={formData.recipient_country || profile?.country || 'Cameroun'}
            onPhoneChange={(phone) => setFormData({ ...formData, recipient_phone: phone })}
            onCountryChange={(country) => setFormData({ ...formData, recipient_country: country })}
            onUserFound={handleRecipientFound}
            label="Numéro du destinataire *"
            showCountrySelector={true}
            required={true}
          />

          {/* Fournisseur */}
          {availableProviders.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="provider">Fournisseur</Label>
              <Select value={formData.meter_number} onValueChange={handleProviderChange}>
                <SelectTrigger className="bg-gray-50">
                  <SelectValue placeholder="Sélectionnez le fournisseur" />
                </SelectTrigger>
                <SelectContent>
                  {availableProviders.map((provider) => (
                    <SelectItem key={provider} value={provider}>
                      {provider}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Montant */}
          <div className="space-y-2">
            <Label htmlFor="amount">Montant (FCFA) *</Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="Montant en FCFA"
              min="1"
              required
              className="w-full"
            />
          </div>

          {/* Date d'échéance */}
          <div className="space-y-2">
            <Label htmlFor="due_date">Date d'échéance *</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              required
              className="w-full"
            />
          </div>

          {/* Récurrence */}
          <div className="space-y-2">
            <Label htmlFor="recurrence">Récurrence</Label>
            <Select 
              value={formData.recurrence} 
              onValueChange={(value) => setFormData({ ...formData, recurrence: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensuel</SelectItem>
                <SelectItem value="weekly">Hebdomadaire</SelectItem>
                <SelectItem value="quarterly">Trimestriel</SelectItem>
                <SelectItem value="yearly">Annuel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priorité */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priorité</Label>
            <Select 
              value={formData.priority.toString()} 
              onValueChange={(value) => setFormData({ ...formData, priority: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Haute (1)</SelectItem>
                <SelectItem value="2">Moyenne (2)</SelectItem>
                <SelectItem value="3">Faible (3)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.bill_name.trim() || !formData.amount || !formData.due_date || !formData.recipient_phone}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90"
            >
              {loading ? 'En cours...' : editingBill ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default BillForm;
