
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowDownLeft, Phone, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils/currency';

interface PaymentNumber {
  id: string;
  phone_number: string;
  provider: string;
  country: string;
  service_type: 'recharge' | 'withdrawal' | 'both';
  admin_name?: string;
  description?: string;
  is_active: boolean;
}

interface AccountRechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AccountRechargeModal: React.FC<AccountRechargeModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentNumbers, setPaymentNumbers] = useState<PaymentNumber[]>([]);
  
  const [formData, setFormData] = useState({
    amount: '',
    provider: '',
    phone_number: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchPaymentNumbers();
    }
  }, [isOpen]);

  const fetchPaymentNumbers = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_numbers')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      // Type casting to ensure proper typing
      const typedData: PaymentNumber[] = (data || []).map(item => ({
        ...item,
        service_type: item.service_type as 'recharge' | 'withdrawal' | 'both'
      }));

      setPaymentNumbers(typedData.filter(pn => 
        pn.service_type === 'recharge' || pn.service_type === 'both'
      ));
    } catch (error: any) {
      console.error('Error fetching payment numbers:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les numéros de paiement",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.provider || !formData.phone_number) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount <= 0) {
      toast({
        title: "Montant invalide",
        description: "Le montant doit être supérieur à 0",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Create recharge record instead of recharge_requests
      const { data, error } = await supabase
        .from('recharges')
        .insert({
          user_id: user!.id,
          amount: amount,
          payment_method: 'mobile_money',
          payment_phone: formData.phone_number,
          payment_provider: formData.provider,
          country: profile?.country || 'Unknown',
          transaction_reference: `RCH_${Date.now()}`,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Recharge initiée",
        description: `Votre demande de recharge de ${formatCurrency(amount)} a été créée`,
      });

      // Reset form and close modal
      setFormData({
        amount: '',
        provider: '',
        phone_number: ''
      });
      
      onClose();
      onSuccess?.();

    } catch (error: any) {
      console.error('Recharge error:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowDownLeft className="w-5 h-5 text-green-600" />
            Recharger le compte
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Montant (XAF) *
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="50000"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              className="h-12"
              min="1000"
              step="1000"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider">Fournisseur de paiement *</Label>
            <Select
              value={formData.provider}
              onValueChange={(value) => handleInputChange('provider', value)}
              required
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Choisir le fournisseur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="orange_money">Orange Money</SelectItem>
                <SelectItem value="free_money">Free Money</SelectItem>
                <SelectItem value="wave">Wave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Votre numéro de téléphone *
            </Label>
            <Input
              id="phone_number"
              type="tel"
              placeholder="+221 XX XXX XX XX"
              value={formData.phone_number}
              onChange={(e) => handleInputChange('phone_number', e.target.value)}
              className="h-12"
              required
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Traitement...
                </>
              ) : (
                'Recharger'
              )}
            </Button>
          </div>
        </form>

        {/* Payment Numbers Display */}
        {paymentNumbers.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Numéros de paiement:</h4>
            <div className="space-y-1">
              {paymentNumbers.map((pn) => (
                <div key={pn.id} className="flex items-center justify-between text-sm">
                  <span>{pn.provider}</span>
                  <Badge variant="outline" className="text-xs">{pn.phone_number}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AccountRechargeModal;
