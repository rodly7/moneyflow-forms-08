
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface SimpleBillFormProps {
  editingBill: string | null;
  formData: {
    bill_name: string;
    amount: string;
    due_date: string;
    recurrence: string;
    is_automated: boolean;
    recipient_phone: string;
  };
  setFormData: (data: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
}

const SimpleBillForm = ({
  editingBill,
  formData,
  setFormData,
  onSubmit,
  onCancel,
  loading
}: SimpleBillFormProps) => {

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Card className="w-full bg-white shadow-xl border-0">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
        <CardTitle className="text-xl text-gray-800">
          {editingBill ? 'Modifier la facture' : 'Nouvelle facture'}
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

          {/* Recipient Phone */}
          <div className="space-y-2">
            <Label htmlFor="recipient_phone">Numéro de téléphone du destinataire</Label>
            <Input
              id="recipient_phone"
              placeholder="Ex: 237123456789"
              value={formData.recipient_phone}
              onChange={(e) => setFormData({ ...formData, recipient_phone: e.target.value })}
              required
              className="h-12"
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
            <Label htmlFor="recurrence">Fréquence de paiement</Label>
            <Select
              value={formData.recurrence}
              onValueChange={(value) => setFormData({ ...formData, recurrence: value })}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Choisir la fréquence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="once">Une seule fois</SelectItem>
                <SelectItem value="monthly">Mensuel</SelectItem>
                <SelectItem value="quarterly">Trimestriel</SelectItem>
                <SelectItem value="yearly">Annuel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Automated Payment */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_automated"
              checked={formData.is_automated}
              onCheckedChange={(checked) => setFormData({ ...formData, is_automated: checked })}
            />
            <Label htmlFor="is_automated">
              Paiement automatique à la date d'échéance
            </Label>
          </div>

          {formData.is_automated && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                💡 Le montant sera automatiquement débité de votre compte à la date d'échéance selon la fréquence choisie.
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

export default SimpleBillForm;
