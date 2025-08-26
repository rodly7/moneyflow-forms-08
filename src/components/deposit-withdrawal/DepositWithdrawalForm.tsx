import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowUpRight, ArrowDownLeft, Phone, DollarSign, CreditCard } from 'lucide-react';
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

const DepositWithdrawalForm: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentNumbers, setPaymentNumbers] = useState<PaymentNumber[]>([]);
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdrawal'>('deposit');
  
  const [formData, setFormData] = useState({
    amount: '',
    provider: '',
    phone_number: '',
    withdrawal_phone: ''
  });

  useEffect(() => {
    fetchPaymentNumbers();
  }, []);

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

      setPaymentNumbers(typedData);
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

  const handleDeposit = async (e: React.FormEvent) => {
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
      // Create recharge record instead of operations
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
        phone_number: '',
        withdrawal_phone: ''
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

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.provider || !formData.withdrawal_phone) {
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

    if (!profile?.balance || profile.balance < amount) {
      toast({
        title: "Solde insuffisant",
        description: "Votre solde est insuffisant pour cette transaction",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Create withdrawal record
      const { data, error } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user!.id,
          amount: amount,
          withdrawal_phone: formData.withdrawal_phone,
          withdrawal_method: 'mobile_money',
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Retrait initié",
        description: `Votre demande de retrait de ${formatCurrency(amount)} a été créée`,
      });

      // Reset form
      setFormData({
        amount: '',
        provider: '',
        phone_number: '',
        withdrawal_phone: ''
      });

    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPaymentNumbers = paymentNumbers.filter(pn => 
    pn.service_type === activeTab || pn.service_type === 'both'
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Dépôt & Retrait</CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'deposit' | 'withdrawal')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="deposit" className="flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4" />
                Dépôt
              </TabsTrigger>
              <TabsTrigger value="withdrawal" className="flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4" />
                Retrait
              </TabsTrigger>
            </TabsList>

            <TabsContent value="deposit">
              <form onSubmit={handleDeposit} className="space-y-4">
                
                <div className="space-y-2">
                  <Label htmlFor="deposit-amount">Montant (XAF) *</Label>
                  <Input
                    id="deposit-amount"
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
                  <Label htmlFor="provider">Fournisseur *</Label>
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
                  <Label htmlFor="phone">Votre numéro de téléphone *</Label>
                  <Input
                    id="phone"
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
            </TabsContent>

            <TabsContent value="withdrawal">
              <form onSubmit={handleWithdrawal} className="space-y-4">
                
                <div className="space-y-2">
                  <Label htmlFor="withdrawal-amount">Montant (XAF) *</Label>
                  <Input
                    id="withdrawal-amount"
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
                  <Label htmlFor="provider">Fournisseur *</Label>
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
                  <Label htmlFor="withdrawal-phone">Numéro de retrait *</Label>
                  <Input
                    id="withdrawal-phone"
                    type="tel"
                    placeholder="+221 XX XXX XX XX"
                    value={formData.withdrawal_phone}
                    onChange={(e) => handleInputChange('withdrawal_phone', e.target.value)}
                    className="h-12"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-red-600 hover:bg-red-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="w-4 h-4 mr-2" />
                      Effectuer le retrait
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Payment Numbers Display */}
          {filteredPaymentNumbers.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Numéros de paiement disponibles:</h4>
              <div className="space-y-2">
                {filteredPaymentNumbers.map((pn) => (
                  <div key={pn.id} className="flex items-center justify-between text-sm">
                    <span>{pn.provider}</span>
                    <Badge variant="outline">{pn.phone_number}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DepositWithdrawalForm;
