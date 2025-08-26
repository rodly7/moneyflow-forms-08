
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowDownLeft, Phone, DollarSign, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils/currency';

interface PaymentNumber {
  id: string;
  phone_number: string;
  provider: string;
  country: string;
  service_type: string;
  admin_name?: string;
  description?: string;
  is_active: boolean;
}

const DepositForm: React.FC = () => {
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
    fetchPaymentNumbers();
  }, []);

  const fetchPaymentNumbers = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_numbers')
        .select('*')
        .eq('is_active', true)
        .in('service_type', ['recharge', 'both']);

      if (error) throw error;
      setPaymentNumbers(data || []);
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
      // Create recharge record instead of deposit_requests
      const { data, error } = await supabase
        .from('recharges')
        .insert({
          user_id: user!.id,
          amount: amount,
          payment_method: 'mobile_money',
          payment_phone: formData.phone_number,
          payment_provider: formData.provider,
          country: profile?.country || 'Unknown',
          transaction_reference: `DEP_${Date.now()}`,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Dépôt initié",
        description: `Votre demande de dépôt de ${formatCurrency(amount)} a été créée`,
      });

      // Reset form
      setFormData({
        amount: '',
        provider: '',
        phone_number: ''
      });

    } catch (error: any) {
      console.error('Deposit error:', error);
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
    <div className="min-h-screen bg-gray-50 p-4">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ArrowDownLeft className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-xl font-bold">Effectuer un dépôt</CardTitle>
          <p className="text-gray-600 text-sm">Recharger votre compte SendFlow</p>
        </CardHeader>

        <CardContent>
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
              <Label htmlFor="provider" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Fournisseur de paiement *
              </Label>
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

            <Button
              type="submit"
              className="w-full h-12 bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Traitement...
                </>
              ) : (
                <>
                  <ArrowDownLeft className="w-4 h-4 mr-2" />
                  Effectuer le dépôt
                </>
              )}
            </Button>
          </form>

          {/* Payment Numbers Display */}
          {paymentNumbers.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Numéros de paiement disponibles:</h4>
              <div className="space-y-2">
                {paymentNumbers.map((pn) => (
                  <div key={pn.id} className="flex items-center justify-between text-sm">
                    <span>{pn.provider}</span>
                    <Badge variant="outline">{pn.phone_number}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Instructions:</strong> Composez le code USSD de votre fournisseur 
              et suivez les instructions pour effectuer le paiement vers le numéro indiqué.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DepositForm;
